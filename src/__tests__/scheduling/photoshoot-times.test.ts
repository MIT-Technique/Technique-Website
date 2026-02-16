import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockCreateLog = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockSupabaseFrom }),
}));

vi.mock('../../lib/admin-logs', () => ({
  createLog: (...args: any[]) => mockCreateLog(...args),
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

import { GET, POST, PUT, DELETE } from '../../app/api/admin/photoshoot-times/route';

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/photoshoot-times');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { nextUrl: url } as any;
}

function makePostRequest(body: any) {
  return new Request('http://localhost:3000/api/admin/photoshoot-times', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function makePutRequest(body: any) {
  return new Request('http://localhost:3000/api/admin/photoshoot-times', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function makeDeleteRequest(body: any) {
  return new Request('http://localhost:3000/api/admin/photoshoot-times', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('/api/admin/photoshoot-times', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLog.mockResolvedValue(undefined);
  });

  // ---- GET ----
  describe('GET', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it('returns 401 for non-admin/non-staph user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club', is_staph: false });
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it('returns times for admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const mockTimes = [{ id: 't1', date: '2026-03-01', start_time: '10:00', end_time: '11:00' }];
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          is: () => ({
            order: () => ({
              order: () => Promise.resolve({ data: mockTimes, error: null }),
            }),
          }),
        }),
      });

      const res = await GET(makeGetRequest());
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.times).toEqual(mockTimes);
    });

    it('returns times for staph user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'staph', is_staph: true });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          is: () => ({
            order: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(200);
    });
  });

  // ---- POST ----
  describe('POST', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await POST(makePostRequest({ date: '2026-03-01', startTime: '10:00', endTime: '11:00' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when date is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await POST(makePostRequest({ startTime: '10:00', endTime: '11:00' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when startTime is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await POST(makePostRequest({ date: '2026-03-01', endTime: '11:00' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for past date', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await POST(makePostRequest({ date: '2020-01-01', startTime: '10:00', endTime: '11:00' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('past dates');
    });

    it('returns 400 for invalid 15-minute boundaries', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await POST(makePostRequest({ date: '2026-12-01', startTime: '10:07', endTime: '11:00' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('15-minute boundaries');
    });

    it('returns 409 for overlapping time slots', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            is: () => Promise.resolve({
              data: [{ id: 'existing', start_time: '10:00', end_time: '11:00' }],
              error: null,
            }),
          }),
        }),
      });

      const res = await POST(makePostRequest({ date: '2026-12-01', startTime: '10:30', endTime: '11:30' }));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toContain('overlaps');
    });

    it('successfully creates a non-overlapping time slot', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const newTime = { id: 't-new', date: '2026-12-01', start_time: '14:00', end_time: '15:00' };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'photoshoot_times') {
          return {
            select: () => ({
              eq: () => ({
                is: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: newTime, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ date: '2026-12-01', startTime: '14:00', endTime: '15:00' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.time).toEqual(newTime);
      expect(mockCreateLog).toHaveBeenCalledWith(
        'u1', 'admin_time_created', 'photoshoot_time', 't-new',
        expect.objectContaining({ date: '2026-12-01' })
      );
    });
  });

  // ---- PUT ----
  describe('PUT', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await PUT(makePutRequest({ timeId: 't1' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when timeId is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await PUT(makePutRequest({}));
      expect(res.status).toBe(400);
    });

    it('handles approve_cancellation action', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const updatedTime = { id: 't1', living_group_id: null, cancellation_approved: true };
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { date: '2026-03-01', start_time: '10:00', end_time: '11:00', living_group: { name: 'Baker' } }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedTime, error: null }),
            }),
          }),
        }),
      });

      const res = await PUT(makePutRequest({ timeId: 't1', action: 'approve_cancellation' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.time).toEqual(updatedTime);
      expect(mockCreateLog).toHaveBeenCalledWith(
        'u1', 'cancellation_approved', 'photoshoot_time', 't1',
        expect.objectContaining({ living_group_name: 'Baker' })
      );
    });

    it('handles deny_cancellation action', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const updatedTime = { id: 't1', cancellation_requested: false };
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { date: '2026-03-01', start_time: '10:00', end_time: '11:00', living_group: { name: 'Baker' } }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedTime, error: null }),
            }),
          }),
        }),
      });

      const res = await PUT(makePutRequest({ timeId: 't1', action: 'deny_cancellation' }));
      expect(res.status).toBe(200);
      expect(mockCreateLog).toHaveBeenCalledWith(
        'u1', 'cancellation_denied', 'photoshoot_time', 't1',
        expect.any(Object)
      );
    });

    it('returns 400 for assign_photographer with inactive photographer', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'photoshoot_times') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { date: '2026-03-01' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'photographer_permissions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await PUT(makePutRequest({ timeId: 't1', action: 'assign_photographer', photographerId: 'p1' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('not active');
    });
  });

  // ---- DELETE ----
  describe('DELETE', () => {
    it('returns 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'staph' });
      const res = await DELETE(makeDeleteRequest({ timeId: 't1' }));
      expect(res.status).toBe(403);
    });

    it('returns 400 when timeId is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await DELETE(makeDeleteRequest({}));
      expect(res.status).toBe(400);
    });

    it('soft-deletes a time slot and logs it', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const deletedTime = { id: 't1', cancelled_at: '2026-03-01T10:00:00Z' };
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { date: '2026-03-01', start_time: '10:00', end_time: '11:00' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: deletedTime, error: null }),
            }),
          }),
        }),
      });

      const res = await DELETE(makeDeleteRequest({ timeId: 't1' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCreateLog).toHaveBeenCalledWith(
        'u1', 'admin_time_deleted', 'photoshoot_time', 't1',
        expect.any(Object)
      );
    });
  });
});
