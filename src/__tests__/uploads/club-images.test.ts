import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockSupabaseFrom,
    storage: { from: mockStorageFrom },
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

import { POST, DELETE } from '../../app/api/clubs/images/route';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

function makeUploadRequest(file: File | null, slot: string) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  formData.append('slot', slot);
  return new Request('http://localhost:3000/api/clubs/images', {
    method: 'POST',
    body: formData,
  }) as any;
}

function makeDeleteRequest(slot: string) {
  return new Request(`http://localhost:3000/api/clubs/images?slot=${slot}`, {
    method: 'DELETE',
  }) as any;
}

describe('/api/clubs/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- POST ----
  describe('POST', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-club role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(403);
    });

    it('returns 400 when no file provided', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const formData = new FormData();
      formData.append('slot', '1');
      const req = new Request('http://localhost:3000/api/clubs/images', {
        method: 'POST',
        body: formData,
      }) as any;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('No file');
    });

    it('returns 400 for invalid slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '4'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid slot');
    });

    it('returns 400 for invalid file type (BMP)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.bmp', 'image/bmp', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid file type');
    });

    it('returns 400 for file exceeding 25MB', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('big.jpg', 'image/jpeg', 26 * 1024 * 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('too large');
    });

    it('accepts JPEG files', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Chess Club' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/clubs/Chess_Club/Candid.jpg' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toContain('?t='); // cache-busting
    });

    it('accepts PNG files', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Chess Club' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/clubs/Chess_Club/Candid.png' } }),
      });

      const file = makeFile('test.png', 'image/png', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('accepts WebP files', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Chess Club' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/clubs/Chess_Club/Candid.webp' } }),
      });

      const file = makeFile('test.webp', 'image/webp', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('accepts GIF files', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Chess Club' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/clubs/Chess_Club/Candid.gif' } }),
      });

      const file = makeFile('test.gif', 'image/gif', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('creates club record for incomplete signup', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'newclub@mit.edu' });
      // Club not found, then created
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'c-new', name: 'newclub' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/clubs/newclub/Candid.jpg' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('uses correct file path for slot 2', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Chess Club' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      let uploadedPath = '';
      mockStorageFrom.mockReturnValue({
        upload: (path: string) => {
          uploadedPath = path;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '2'));
      expect(uploadedPath).toContain('Candid_2');
    });
  });

  // ---- DELETE ----
  describe('DELETE', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-club role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const res = await DELETE(makeDeleteRequest('5'));
      expect(res.status).toBe(400);
    });

    it('successfully deletes an image and clears DB field', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c1',
                candid_image_1: 'https://storage.test/club-images/clubs/Chess_Club/Candid.jpg?t=123',
                candid_image_2: null,
                candid_image_3: null,
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
        remove: () => Promise.resolve({ error: null }),
      });

      const res = await DELETE(makeDeleteRequest('1'));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
