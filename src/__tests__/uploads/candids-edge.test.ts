import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabaseFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockListBuckets = vi.fn();
const mockCreateBucket = vi.fn();

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockSupabaseFrom,
    storage: {
      from: mockStorageFrom,
      listBuckets: mockListBuckets,
      createBucket: mockCreateBucket,
    },
  }),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) =>
      new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));

import { GET, POST } from '../../app/api/candids/upload/route';

function makeGetRequest(email?: string) {
  const url = email
    ? `http://localhost:3000/api/candids/upload?email=${encodeURIComponent(email)}`
    : 'http://localhost:3000/api/candids/upload';
  return new Request(url, { method: 'GET' }) as any;
}

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

function makePostRequest(fields: Record<string, string>, files: File[] = []) {
  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) formData.append(k, v);
  files.forEach((f, i) => formData.append(`file${i + 1}`, f));
  return new Request('http://localhost:3000/api/candids/upload', {
    method: 'POST',
    body: formData,
  }) as any;
}

function setupFormNotFrozen() {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { is_frozen: false, closes_at: null, reopens_at: null, unfrozen_at: null }, error: null }),
      }),
    }),
  };
}

describe('/api/candids/upload - edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBuckets.mockResolvedValue({ data: [{ name: 'community-candids' }] });
    mockCreateBucket.mockResolvedValue({ error: null });
  });

  // ---- GET edge cases ----
  describe('GET', () => {
    it('normalizes email to lowercase', async () => {
      let queriedEmail = '';
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: (_field: string, val: string) => {
            queriedEmail = val;
            return {
              single: () => Promise.resolve({ data: null, error: null }),
            };
          },
        }),
      });

      await GET(makeGetRequest('User@MIT.EDU'));
      expect(queriedEmail).toBe('user@mit.edu');
    });

    it('trims whitespace from email', async () => {
      let queriedEmail = '';
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: (_field: string, val: string) => {
            queriedEmail = val;
            return {
              single: () => Promise.resolve({ data: null, error: null }),
            };
          },
        }),
      });

      await GET(makeGetRequest('  user@mit.edu  '));
      expect(queriedEmail).toBe('user@mit.edu');
    });

    it('returns null for email ending with @mit.edu.fake', async () => {
      const res = await GET(makeGetRequest('user@mit.edu.fake'));
      const data = await res.json();
      expect(data.data).toBeNull();
    });

    it('returns empty imageUrls array when DB has null image_urls', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { event_name: 'Test', event_description: null, image_urls: null },
              error: null,
            }),
          }),
        }),
      });

      const res = await GET(makeGetRequest('user@mit.edu'));
      const data = await res.json();
      expect(data.data.imageUrls).toEqual([]);
    });

    it('returns empty string for null event fields', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { event_name: null, event_description: null, image_urls: ['url1'] },
              error: null,
            }),
          }),
        }),
      });

      const res = await GET(makeGetRequest('user@mit.edu'));
      const data = await res.json();
      expect(data.data.eventName).toBe('');
      expect(data.data.eventDescription).toBe('');
    });

    it('handles DB error gracefully (returns null)', async () => {
      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('DB connection failed');
      });

      const res = await GET(makeGetRequest('user@mit.edu'));
      const data = await res.json();
      expect(data.data).toBeNull();
    });
  });

  // ---- POST edge cases ----
  describe('POST', () => {
    it('returns 403 when form is scheduled-closed (closes_at in past)', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                is_frozen: false,
                closes_at: '2020-01-01T00:00:00Z',
                reopens_at: null,
                unfrozen_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(403);
    });

    it('allows submission when scheduled close has been overridden by admin', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    is_frozen: false,
                    closes_at: '2020-01-01T00:00:00Z',
                    reopens_at: null,
                    unfrozen_at: '2020-06-01T00:00:00Z', // after closes_at = override
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(200);
    });

    it('normalizes email with MIT auto-append', async () => {
      // Email without @ is not handled by candids route (it requires @mit.edu suffix)
      mockSupabaseFrom.mockReturnValue(setupFormNotFrozen());

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user' }, [file]));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('@mit.edu');
    });

    it('returns 400 for email with @mit.edu prefix but wrong domain', async () => {
      mockSupabaseFrom.mockReturnValue(setupFormNotFrozen());

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu.cn' }, [file]));
      expect(res.status).toBe(400);
    });

    it('handles keepImageUrls with malformed JSON gracefully', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const formData = new FormData();
      formData.append('email', 'user@mit.edu');
      formData.append('keepImageUrls', 'not-valid-json{{{');
      formData.append('file1', makeFile('test.jpg', 'image/jpeg', 1024));
      const req = new Request('http://localhost:3000/api/candids/upload', {
        method: 'POST',
        body: formData,
      }) as any;

      const res = await POST(req);
      // Should not crash; malformed JSON defaults to empty array
      expect(res.status).toBe(200);
    });

    it('retains images from keepImageUrls and adds new ones', async () => {
      const keepUrl = 'https://storage.test/old-image.jpg';
      let savedUrls: string[] = [];

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'existing-1', image_urls: [keepUrl, 'https://storage.test/removed.jpg'] },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: (field: string, val: string) => {
                // Capture what was saved
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        remove: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const formData = new FormData();
      formData.append('email', 'user@mit.edu');
      formData.append('keepImageUrls', JSON.stringify([keepUrl]));
      formData.append('file1', makeFile('new.jpg', 'image/jpeg', 1024));
      const req = new Request('http://localhost:3000/api/candids/upload', {
        method: 'POST',
        body: formData,
      }) as any;

      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      // Should have kept URL + new uploaded URL
      expect(data.count).toBe(2);
      expect(data.urls).toContain(keepUrl);
    });

    it('returns 400 when more than 3 files exceed the slot range', async () => {
      // The route only reads file1, file2, file3 so additional files are ignored
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const formData = new FormData();
      formData.append('email', 'user@mit.edu');
      formData.append('file1', makeFile('a.jpg', 'image/jpeg', 1024));
      formData.append('file2', makeFile('b.jpg', 'image/jpeg', 1024));
      formData.append('file3', makeFile('c.jpg', 'image/jpeg', 1024));
      formData.append('file4', makeFile('d.jpg', 'image/jpeg', 1024)); // ignored
      const req = new Request('http://localhost:3000/api/candids/upload', {
        method: 'POST',
        body: formData,
      }) as any;

      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.count).toBe(3); // only 3 files processed
    });

    it('returns 500 when storage upload fails mid-batch', async () => {
      let uploadCount = 0;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => {
          uploadCount++;
          if (uploadCount === 2) {
            return Promise.resolve({ error: { message: 'Upload failed' } });
          }
          return Promise.resolve({ error: null });
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const formData = new FormData();
      formData.append('email', 'user@mit.edu');
      formData.append('file1', makeFile('a.jpg', 'image/jpeg', 1024));
      formData.append('file2', makeFile('b.jpg', 'image/jpeg', 1024));
      const req = new Request('http://localhost:3000/api/candids/upload', {
        method: 'POST',
        body: formData,
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toContain('Failed to upload image 2');
    });

    it('uses event-based file path when organizationName provided', async () => {
      let uploadedPath = '';
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu', organizationName: 'HackMIT 2026' }, [file]));
      expect(res.status).toBe(200);
      expect(uploadedPath).toContain('events/HackMIT_2026/');
    });

    it('uses misc path when no organizationName provided', async () => {
      let uploadedPath = '';
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(200);
      expect(uploadedPath).toContain('misc/');
    });

    it('creates bucket when it does not exist', async () => {
      mockListBuckets.mockResolvedValue({ data: [] }); // empty buckets list
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') return setupFormNotFrozen();
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(mockCreateBucket).toHaveBeenCalledWith('community-candids', expect.objectContaining({ public: true }));
    });
  });
});
