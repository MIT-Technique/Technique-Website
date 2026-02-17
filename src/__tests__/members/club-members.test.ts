import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockSupabaseFrom }),
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

import { GET, POST, PUT, DELETE } from '../../app/api/clubs/manual-members/route';

function makeGetRequest(clubId?: string) {
  const url = new URL('http://localhost:3000/api/clubs/manual-members');
  if (clubId) url.searchParams.set('clubId', clubId);
  return { nextUrl: url } as any;
}

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/clubs/manual-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function makePutRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/clubs/manual-members', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function makeDeleteRequest(memberId: string, clubId?: string) {
  const url = new URL('http://localhost:3000/api/clubs/manual-members');
  url.searchParams.set('id', memberId);
  if (clubId) url.searchParams.set('clubId', clubId);
  return { nextUrl: url, url: url.toString() } as any;
}

// Helper to set up mockSupabaseFrom with table-based routing
function setupSupabase(config: {
  clubs?: { data: any; error?: any };
  club_memberships?: { data: any; error?: any };
  club_manual_members_select?: { data: any; error?: any };
  club_manual_members_insert?: { data: any; error?: any };
  club_manual_members_update?: { data: any; error?: any };
  club_manual_members_delete?: { error?: any };
  club_manual_members_order?: { data: any; error?: any };
  club_manual_members_maybeSingle?: { data: any; error?: any };
  club_manual_members_single?: { data: any; error?: any };
}) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'clubs') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve(config.clubs || { data: null, error: null }),
            }),
            single: () => Promise.resolve(config.clubs || { data: null, error: null }),
          }),
        }),
      };
    }
    if (table === 'club_memberships') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve(config.club_memberships || { data: null, error: null }),
              }),
            }),
          }),
        }),
      };
    }
    if (table === 'club_manual_members') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve(config.club_manual_members_maybeSingle || { data: null, error: null }),
            }),
            order: () => Promise.resolve(config.club_manual_members_order || { data: [], error: null }),
            single: () => Promise.resolve(config.club_manual_members_single || { data: null, error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve(config.club_manual_members_insert || { data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve(config.club_manual_members_update || { data: null, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve(config.club_manual_members_delete || { error: null }),
        }),
      };
    }
    return {};
  });
}

describe('/api/clubs/manual-members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- GET ----
  describe('GET', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-club, non-leader user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
      setupSupabase({});
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(403);
    });

    it('returns members for a club account', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_order: {
          data: [
            { id: 'm1', name: 'Alice', role: 'President', club_id: 'c1' },
            { id: 'm2', name: 'Bob', role: null, club_id: 'c1' },
          ],
          error: null,
        },
      });

      const res = await GET(makeGetRequest());
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.members).toHaveLength(2);
      expect(data.members[0].name).toBe('Alice');
    });

    it('returns empty array when club has no members', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_order: { data: [], error: null },
      });

      const res = await GET(makeGetRequest());
      const data = await res.json();
      expect(data.members).toEqual([]);
    });

    it('returns 403 when club not found for club account', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: null } });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(403);
    });
  });

  // ---- POST (single add) ----
  describe('POST - single add', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: { id: 'c1' } } });

      const res = await POST(makePostRequest({}));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Name is required');
    });

    it('returns 400 when name is empty string', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: { id: 'c1' } } });

      const res = await POST(makePostRequest({ name: '' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Name is required');
    });

    it('returns 400 when name is whitespace-only', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: { id: 'c1' } } });

      const res = await POST(makePostRequest({ name: '   ' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Name is required');
    });

    it('returns 400 when name exceeds 200 characters', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: { id: 'c1' } } });

      const longName = 'A'.repeat(201);
      const res = await POST(makePostRequest({ name: longName }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('200 characters');
    });

    it('accepts name at exactly 200 characters', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const exactName = 'A'.repeat(200);
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: null, error: null },
        club_manual_members_insert: { data: { id: 'm1', name: exactName, club_id: 'c1' }, error: null },
      });

      const res = await POST(makePostRequest({ name: exactName }));
      expect(res.status).toBe(200);
    });

    it('returns 400 for duplicate name', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: { id: 'm-existing' }, error: null },
      });

      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('already exists');
    });

    it('successfully adds a member with a role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: null, error: null },
        club_manual_members_insert: {
          data: { id: 'm1', name: 'Alice', role: 'President', club_id: 'c1' },
          error: null,
        },
      });

      const res = await POST(makePostRequest({ name: 'Alice', role: 'President' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.member.name).toBe('Alice');
      expect(data.member.role).toBe('President');
    });

    it('trims whitespace from name', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: null, error: null },
        club_manual_members_insert: {
          data: { id: 'm1', name: 'Alice', club_id: 'c1' },
          error: null,
        },
      });

      const res = await POST(makePostRequest({ name: '  Alice  ' }));
      expect(res.status).toBe(200);
    });

    it('handles numeric name input (coerces to string)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: null, error: null },
        club_manual_members_insert: {
          data: { id: 'm1', name: '12345', club_id: 'c1' },
          error: null,
        },
      });

      const res = await POST(makePostRequest({ name: 12345 }));
      expect(res.status).toBe(200);
    });

    it('returns 500 when DB insert fails', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_maybeSingle: { data: null, error: null },
        club_manual_members_insert: { data: null, error: { message: 'constraint violation' } },
      });

      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(500);
    });
  });

  // ---- POST (bulk import) ----
  describe('POST - bulk import', () => {
    it('returns 400 when bulk text has only empty lines', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: '\n\n   \n' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when all parsed names are duplicates', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      // Need to handle both table routes for bulk
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [{ name: 'Alice' }, { name: 'Bob' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: 'Alice\nBob' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.duplicates).toContain('Alice');
      expect(data.duplicates).toContain('Bob');
    });

    it('case-insensitive duplicate detection in bulk', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [{ name: 'alice' }], // lowercase in DB
                error: null,
              }),
            }),
            insert: () => ({
              select: () => Promise.resolve({
                data: [{ id: 'm1', name: 'Charlie', club_id: 'c1' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: 'Alice\nCharlie' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.duplicates).toContain('Alice');
      expect(data.count).toBe(1);
    });

    it('successfully bulk imports new members', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: () => ({
              select: () => Promise.resolve({
                data: [
                  { id: 'm1', name: 'Alice', club_id: 'c1' },
                  { id: 'm2', name: 'Bob', club_id: 'c1' },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: 'Alice\nBob' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.duplicates).toEqual([]);
    });

    it('returns parse errors alongside successful imports', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: () => ({
              select: () => Promise.resolve({
                data: [{ id: 'm1', name: 'Valid Name', club_id: 'c1' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // parseBulkNames handles various formats; empty lines are errors
      const res = await POST(makePostRequest({ bulkText: 'Valid Name\n' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.members).toBeDefined();
    });
  });

  // ---- PUT (update role) ----
  describe('PUT', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await PUT(makePutRequest({ id: 'm1', role: 'VP' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when member ID is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({ clubs: { data: { id: 'c1' } } });

      const res = await PUT(makePutRequest({ role: 'VP' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Member ID');
    });

    it('returns 404 when member not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_single: { data: null, error: { message: 'not found' } },
      });

      const res = await PUT(makePutRequest({ id: 'm-nonexistent', role: 'VP' }));
      expect(res.status).toBe(404);
    });

    it('returns 403 when member belongs to different club', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c-other' }, // different club
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await PUT(makePutRequest({ id: 'm1', role: 'VP' }));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toContain('does not belong');
    });

    it('successfully updates role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c1' },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'm1', name: 'Alice', role: 'VP', club_id: 'c1' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await PUT(makePutRequest({ id: 'm1', role: 'VP' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.member.role).toBe('VP');
    });

    it('clears role when null is passed', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c1' },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'm1', name: 'Alice', role: null, club_id: 'c1' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await PUT(makePutRequest({ id: 'm1', role: null }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.member.role).toBeNull();
    });
  });

  // ---- DELETE ----
  describe('DELETE', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(401);
    });

    it('returns 400 when member ID is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const url = new URL('http://localhost:3000/api/clubs/manual-members');
      const res = await DELETE({ nextUrl: url, url: url.toString() } as any);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Member ID');
    });

    it('returns 404 when member not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      setupSupabase({
        clubs: { data: { id: 'c1' } },
        club_manual_members_single: { data: null, error: { message: 'not found' } },
      });

      const res = await DELETE(makeDeleteRequest('m-gone'));
      expect(res.status).toBe(404);
    });

    it('returns 403 when member belongs to different club', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c-other' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(403);
    });

    it('successfully deletes a member', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c1' },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        }
        return {};
      });

      const res = await DELETE(makeDeleteRequest('m1'));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 500 when DB delete fails', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'clubs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'club_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', club_id: 'c1' },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: () => Promise.resolve({ error: { message: 'FK violation' } }),
            }),
          };
        }
        return {};
      });

      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(500);
    });
  });
});
