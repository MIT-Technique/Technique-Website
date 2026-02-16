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

import { POST } from '../../app/api/living-groups/book/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/living-groups/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('/api/living-groups/book', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLog.mockResolvedValue(undefined);
  });

  it('returns 401 for unauthenticated user', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-living_group role', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when timeId is missing', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const res = await POST(makeRequest({ proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when proposed_locations is empty', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('At least one');
  });

  it('returns 400 when proposed_locations is not an array', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: 'Lobby' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when more than 5 locations', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const res = await POST(makeRequest({
      timeId: 't1',
      proposed_locations: ['A', 'B', 'C', 'D', 'E', 'F'],
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Maximum 5');
  });

  it('returns 400 when a location exceeds 200 chars', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const longLocation = 'x'.repeat(201);
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: [longLocation] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('200 characters');
  });

  it('returns 400 when all locations are whitespace-only', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['  ', '\t'] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('non-empty');
  });

  it('returns 404 when living group not found', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when living group is disabled', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'lg1', status: 'disabled', name: 'Baker' }, error: null }),
        }),
      }),
    });

    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('disabled');
  });

  it('returns 409 when slot is already taken (race condition)', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    let callCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'living_groups') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'lg1', status: 'active', name: 'Baker' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'photoshoot_times') {
        return {
          update: () => ({
            eq: () => ({
              is: () => ({
                is: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: null, error: { message: 'No rows' } }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby'] }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('no longer available');
  });

  it('successfully books a slot and logs it', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
    const bookedTime = {
      id: 't1', date: '2026-03-01', start_time: '10:00', end_time: '11:00',
      living_group_id: 'lg1', booking_status: 'pending_location',
    };
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'living_groups') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'lg1', status: 'active', name: 'Baker' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'photoshoot_times') {
        return {
          update: () => ({
            eq: () => ({
              is: () => ({
                is: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: bookedTime, error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ timeId: 't1', proposed_locations: ['Lobby', 'Courtyard'] }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bookedTime).toEqual(bookedTime);
    expect(mockCreateLog).toHaveBeenCalledWith(
      'u1', 'time_booked', 'photoshoot_time', 't1',
      expect.objectContaining({ living_group_name: 'Baker' })
    );
  });
});
