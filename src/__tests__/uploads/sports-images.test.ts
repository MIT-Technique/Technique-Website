import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockListBuckets = vi.fn();
const mockCreateBucket = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

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

import { POST, DELETE } from '../../app/api/sports/images/route';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

function makeUploadRequest(file: File | null, slot: string, team?: string) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  formData.append('slot', slot);
  if (team) formData.append('team', team);
  return new Request('http://localhost:3000/api/sports/images', {
    method: 'POST',
    body: formData,
  }) as any;
}

function makeDeleteRequest(slot: string, team?: string) {
  const params = new URLSearchParams({ slot });
  if (team) params.set('team', team);
  return new Request(`http://localhost:3000/api/sports/images?${params}`, {
    method: 'DELETE',
  }) as any;
}

function setupSportsFound(sportsData = { id: 's1', name: 'Track and Field' }) {
  mockSupabaseFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: sportsData, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  });
}

function setupStorage() {
  mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
  mockStorageFrom.mockReturnValue({
    upload: () => Promise.resolve({ error: null }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
    remove: () => Promise.resolve({ error: null }),
  });
}

describe('/api/sports/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
    mockCreateBucket.mockResolvedValue({ error: null });
  });

  // ---- POST ----
  describe('POST', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-sports role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(403);
    });

    it('returns 400 when no file provided', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const formData = new FormData();
      formData.append('slot', '1');
      const req = new Request('http://localhost:3000/api/sports/images', {
        method: 'POST',
        body: formData,
      }) as any;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('No file');
    });

    it('returns 400 for invalid slot "0"', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '0'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid slot');
    });

    it('returns 400 for invalid slot "4"', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '4'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid team value', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1', 'coed'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid team');
    });

    it('returns 400 for BMP file type', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('test.bmp', 'image/bmp', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid file type');
    });

    it('returns 400 for SVG file type', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('test.svg', 'image/svg+xml', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for file exceeding 25MB', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const file = makeFile('big.jpg', 'image/jpeg', 26 * 1024 * 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('too large');
    });

    it('accepts file at exactly 25MB', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      setupStorage();

      const file = makeFile('exact.jpg', 'image/jpeg', 25 * 1024 * 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('returns 404 when sports team not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(404);
    });

    it('uploads to correct path without team (no gender teams)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound({ id: 's1', name: 'Track and Field' });

      let uploadedPath = '';
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '2'));
      expect(uploadedPath).toContain('sports/Track_and_Field/Candid_2.');
    });

    it('uploads to correct path with mens team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound({ id: 's1', name: 'Basketball' });

      let uploadedPath = '';
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('photo.png', 'image/png', 1024);
      await POST(makeUploadRequest(file, '1', 'mens'));
      expect(uploadedPath).toContain('sports/Basketball/mens/Candid.');
    });

    it('uploads to correct path with womens team slot 3', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound({ id: 's1', name: 'Soccer' });

      let uploadedPath = '';
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('photo.webp', 'image/webp', 1024);
      await POST(makeUploadRequest(file, '3', 'womens'));
      expect(uploadedPath).toContain('sports/Soccer/womens/Candid_3.');
    });

    it('updates correct DB column for mens team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      let updatedFields: Record<string, unknown> = {};
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 's1', name: 'Tennis' }, error: null }),
          }),
        }),
        update: (fields: Record<string, unknown>) => {
          updatedFields = fields;
          return { eq: () => Promise.resolve({ error: null }) };
        },
      });
      setupStorage();

      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '2', 'mens'));
      expect(updatedFields).toHaveProperty('mens_candid_image_2');
    });

    it('updates correct DB column without team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      let updatedFields: Record<string, unknown> = {};
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 's1', name: 'Tennis' }, error: null }),
          }),
        }),
        update: (fields: Record<string, unknown>) => {
          updatedFields = fields;
          return { eq: () => Promise.resolve({ error: null }) };
        },
      });
      setupStorage();

      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '1'));
      expect(updatedFields).toHaveProperty('candid_image_1');
    });

    it('returns 500 when storage upload fails', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: { message: 'Storage full' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(500);
    });

    it('returns 500 when DB update fails', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 's1', name: 'Tennis' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'DB error' } }),
        }),
      });
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(500);
    });

    it('creates bucket when it does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      mockListBuckets.mockResolvedValue({ data: [] }); // no buckets
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
      expect(mockCreateBucket).toHaveBeenCalledWith('sports-images', expect.objectContaining({ public: true }));
    });

    it('sanitizes team name with special characters', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound({ id: 's1', name: 'Men\'s Water Polo & Swim' });

      let uploadedPath = '';
      mockListBuckets.mockResolvedValue({ data: [{ name: 'sports-images' }] });
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '1'));
      // Special chars stripped, spaces replaced with underscores
      // Special chars stripped: apostrophe and ampersand removed, spaces become underscores
      expect(uploadedPath).not.toContain("'");
      expect(uploadedPath).not.toContain('&');
      expect(uploadedPath).toContain('sports/');
    });

    it('returns cache-busted URL', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      setupStorage();

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      const data = await res.json();
      expect(data.url).toContain('?t=');
    });

    it('returns team in response', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      setupStorage();

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '2', 'womens'));
      const data = await res.json();
      expect(data.team).toBe('womens');
      expect(data.slot).toBe('2');
    });

    it('returns null team when no team specified', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      setupSportsFound();
      setupStorage();

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      const data = await res.json();
      expect(data.team).toBeNull();
    });
  });

  // ---- DELETE ----
  describe('DELETE', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-sports role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(403);
    });

    it('returns 400 for missing slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const req = new Request('http://localhost:3000/api/sports/images', {
        method: 'DELETE',
      }) as any;
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid slot "0"', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const res = await DELETE(makeDeleteRequest('0'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid team value', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const res = await DELETE(makeDeleteRequest('1', 'coed'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid team');
    });

    it('returns 404 when sports team not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(404);
    });

    it('successfully deletes a non-team image', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      let removedPaths: string[] = [];
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 's1',
                candid_image_1: 'https://storage.test/sports-images/sports/Track/Candid.jpg?t=123',
                candid_image_2: null,
                candid_image_3: null,
                mens_candid_image_1: null, mens_candid_image_2: null, mens_candid_image_3: null,
                womens_candid_image_1: null, womens_candid_image_2: null, womens_candid_image_3: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        remove: (paths: string[]) => {
          removedPaths = paths;
          return Promise.resolve({ error: null });
        },
      });

      const res = await DELETE(makeDeleteRequest('1'));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.team).toBeNull();
      expect(removedPaths).toEqual(['sports/Track/Candid.jpg']);
    });

    it('successfully deletes a mens team image', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      let removedPaths: string[] = [];
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 's1',
                candid_image_1: null, candid_image_2: null, candid_image_3: null,
                mens_candid_image_1: 'https://storage.test/sports-images/sports/Basketball/mens/Candid.jpg?t=456',
                mens_candid_image_2: null, mens_candid_image_3: null,
                womens_candid_image_1: null, womens_candid_image_2: null, womens_candid_image_3: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        remove: (paths: string[]) => {
          removedPaths = paths;
          return Promise.resolve({ error: null });
        },
      });

      const res = await DELETE(makeDeleteRequest('1', 'mens'));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.team).toBe('mens');
      expect(removedPaths).toEqual(['sports/Basketball/mens/Candid.jpg']);
    });

    it('handles delete when slot has no image (no storage call)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      const removeMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 's1',
                candid_image_1: null, candid_image_2: null, candid_image_3: null,
                mens_candid_image_1: null, mens_candid_image_2: null, mens_candid_image_3: null,
                womens_candid_image_1: null, womens_candid_image_2: null, womens_candid_image_3: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({ remove: removeMock });

      const res = await DELETE(makeDeleteRequest('2'));
      expect(res.status).toBe(200);
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('returns 500 when DB update fails on delete', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 's1',
                candid_image_1: null, candid_image_2: null, candid_image_3: null,
                mens_candid_image_1: null, mens_candid_image_2: null, mens_candid_image_3: null,
                womens_candid_image_1: null, womens_candid_image_2: null, womens_candid_image_3: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'DB error' } }),
        }),
      });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(500);
    });
  });
});
