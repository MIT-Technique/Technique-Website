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

describe('/api/clubs/images - edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - edge cases', () => {
    it('returns 400 for SVG file type', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('logo.svg', 'image/svg+xml', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for TIFF file type', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('photo.tiff', 'image/tiff', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(400);
    });

    it('accepts file at exactly 25MB boundary', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('big.jpg', 'image/jpeg', 25 * 1024 * 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(200);
    });

    it('returns 400 for slot "0"', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '0'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '-1'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-numeric slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, 'abc'));
      expect(res.status).toBe(400);
    });

    it('sanitizes club name with special characters in file path', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { id: 'c1', name: 'Chess & Go Club (MIT)' },
              error: null,
            }),
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

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      await POST(makeUploadRequest(file, '1'));
      expect(uploadedPath).not.toContain('&');
      expect(uploadedPath).not.toContain('(');
      expect(uploadedPath).not.toContain(')');
      expect(uploadedPath).toContain('Chess');
    });

    it('uses slot 1 path without suffix', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test' }, error: null }),
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

      const file = makeFile('photo.png', 'image/png', 1024);
      await POST(makeUploadRequest(file, '1'));
      // Slot 1 uses no suffix: "Candid.ext" not "Candid_1.ext"
      expect(uploadedPath).toMatch(/Candid\.\w+$/);
      expect(uploadedPath).not.toContain('Candid_1');
    });

    it('uses slot 3 path with _3 suffix', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test' }, error: null }),
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

      const file = makeFile('photo.gif', 'image/gif', 1024);
      await POST(makeUploadRequest(file, '3'));
      expect(uploadedPath).toContain('Candid_3.');
    });

    it('returns 500 when storage upload fails', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test' }, error: null }),
          }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: { message: 'Bucket full' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(500);
      expect((await res.json()).error).toContain('Failed to upload');
    });

    it('returns 500 when DB update fails after successful upload', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'club@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      });
      mockStorageFrom.mockReturnValue({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.test/file' } }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(500);
    });

    it('returns 500 when club creation fails (incomplete signup fallback)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'new@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }), // no club found
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      });

      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(500);
    });

    it('returns 403 for admin role (not club)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(403);
    });

    it('returns 403 for staph role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'staph' });
      const file = makeFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(makeUploadRequest(file, '1'));
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE - edge cases', () => {
    it('returns 400 for missing slot (no query param)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const req = new Request('http://localhost:3000/api/clubs/images', {
        method: 'DELETE',
      }) as any;
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('handles deletion when slot has no existing image (null URL)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      const removeMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c1',
                candid_image_1: null,
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
      mockStorageFrom.mockReturnValue({ remove: removeMock });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(200);
      // remove should not be called since image URL is null
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('strips query params from image URL before extracting storage path', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      let removedPaths: string[] = [];
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c1',
                candid_image_1: 'https://abc.supabase.co/storage/v1/object/public/club-images/clubs/Test/Candid.jpg?t=1234567890&other=param',
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
        remove: (paths: string[]) => {
          removedPaths = paths;
          return Promise.resolve({ error: null });
        },
      });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(200);
      expect(removedPaths).toEqual(['clubs/Test/Candid.jpg']);
    });

    it('returns 500 when DB update fails on delete', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c1',
                candid_image_1: null,
                candid_image_2: null,
                candid_image_3: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(500);
    });

    it('creates club record on delete if not found (fallback)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', email: 'new@mit.edu' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }), // no club
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { id: 'c-new', candid_image_1: null, candid_image_2: null, candid_image_3: null },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      const res = await DELETE(makeDeleteRequest('1'));
      expect(res.status).toBe(200);
    });

    it('correctly deletes slot 2 image (not slot 1)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      let removedPaths: string[] = [];
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c1',
                candid_image_1: 'https://storage.test/club-images/clubs/Test/Candid.jpg',
                candid_image_2: 'https://storage.test/club-images/clubs/Test/Candid_2.jpg?t=999',
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
        remove: (paths: string[]) => {
          removedPaths = paths;
          return Promise.resolve({ error: null });
        },
      });

      const res = await DELETE(makeDeleteRequest('2'));
      expect(res.status).toBe(200);
      expect(removedPaths).toEqual(['clubs/Test/Candid_2.jpg']);
    });
  });
});
