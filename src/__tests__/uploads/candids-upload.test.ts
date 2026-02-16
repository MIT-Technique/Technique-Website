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

function makeGetRequest(email: string) {
  return new Request(`http://localhost:3000/api/candids/upload?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  }) as any;
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

describe('/api/candids/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBuckets.mockResolvedValue({ data: [{ name: 'community-candids' }] });
    mockCreateBucket.mockResolvedValue({ error: null });
  });

  // ---- GET ----
  describe('GET', () => {
    it('returns null for non-MIT email', async () => {
      const res = await GET(makeGetRequest('user@gmail.com'));
      const data = await res.json();
      expect(data.data).toBeNull();
    });

    it('returns null for missing email', async () => {
      const req = new Request('http://localhost:3000/api/candids/upload', { method: 'GET' }) as any;
      const res = await GET(req);
      const data = await res.json();
      expect(data.data).toBeNull();
    });

    it('returns existing submission for valid MIT email', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { event_name: 'Hack Night', event_description: 'Fun event', image_urls: ['url1'] },
              error: null,
            }),
          }),
        }),
      });

      const res = await GET(makeGetRequest('user@mit.edu'));
      const data = await res.json();
      expect(data.data.eventName).toBe('Hack Night');
      expect(data.data.imageUrls).toEqual(['url1']);
    });

    it('returns null when no submission exists', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      });

      const res = await GET(makeGetRequest('new@mit.edu'));
      const data = await res.json();
      expect(data.data).toBeNull();
    });
  });

  // ---- POST ----
  describe('POST', () => {
    it('returns 403 when form is frozen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: true }, error: null }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toContain('closed');
    });

    it('returns 400 when email is missing', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({}, [file]));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('MIT email');
    });

    it('returns 400 for non-MIT email', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@gmail.com' }, [file]));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('@mit.edu');
    });

    it('returns 400 when no files and no keepImageUrls', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
          }),
        }),
      });

      const res = await POST(makePostRequest({ email: 'user@mit.edu' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('At least one image');
    });

    it('returns 400 for invalid file type', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
          }),
        }),
      });

      const file = makeFile('test.bmp', 'image/bmp', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid file type');
    });

    it('returns 400 for file too large', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
          }),
        }),
      });

      const file = makeFile('big.jpg', 'image/jpeg', 26 * 1024 * 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('too large');
    });

    it('successfully uploads images for new submission', async () => {
      let insertCalled = false;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
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
            insert: () => {
              insertCalled = true;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu', organizationName: 'HackMIT' }, [file]));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
      expect(insertCalled).toBe(true);
    });

    it('upserts when re-submitting with same email', async () => {
      let updateCalled = false;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'form_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
              }),
            }),
          };
        }
        if (table === 'community_candids') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'existing-1', image_urls: ['old-url'] },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => {
                updateCalled = true;
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

      const file = makeFile('new.jpg', 'image/jpeg', 1024);
      const res = await POST(makePostRequest({ email: 'user@mit.edu' }, [file]));
      expect(res.status).toBe(200);
      expect(updateCalled).toBe(true);
    });
  });
});
