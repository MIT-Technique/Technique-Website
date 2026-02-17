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

import { GET, POST, DELETE } from '../../app/api/sports/manual-members/route';

function makeGetRequest(team?: string) {
  const url = new URL('http://localhost:3000/api/sports/manual-members');
  if (team) url.searchParams.set('team', team);
  return { nextUrl: url } as any;
}

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/sports/manual-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function makeDeleteRequest(memberId: string) {
  const url = new URL('http://localhost:3000/api/sports/manual-members');
  url.searchParams.set('id', memberId);
  return { nextUrl: url } as any;
}

describe('/api/sports/manual-members', () => {
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

    it('returns 401 for non-sports role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'club' });
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it('returns 404 when sports team not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
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

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(404);
    });

    it('returns all members without team filter', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({
                  data: [
                    { id: 'm1', name: 'Alice', team: 'womens', role: null },
                    { id: 'm2', name: 'Bob', team: 'mens', role: 'Captain' },
                    { id: 'm3', name: 'Charlie', team: null, role: null },
                  ],
                  error: null,
                }),
                eq: () => ({
                  order: () => Promise.resolve({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await GET(makeGetRequest());
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.members).toHaveLength(3);
    });

    it('filters by mens team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });

      // The chain is: .select().eq('sports_id').order('name') then optionally .eq('team')
      // Need a chainable mock that supports any order of .eq/.order calls
      const memberResult = Promise.resolve({
        data: [{ id: 'm2', name: 'Bob', team: 'mens', role: 'Captain' }],
        error: null,
      });
      const chainable: any = { then: memberResult.then.bind(memberResult), catch: memberResult.catch.bind(memberResult) };
      chainable.eq = () => chainable;
      chainable.order = () => chainable;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                order: () => chainable,
              }),
            }),
          };
        }
        return {};
      });

      const res = await GET(makeGetRequest('mens'));
      expect(res.status).toBe(200);
    });

    it('ignores invalid team filter value', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({
                  data: [{ id: 'm1', name: 'Alice', team: null }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // "coed" isn't a valid team filter, should be ignored (returns all)
      const res = await GET(makeGetRequest('coed'));
      expect(res.status).toBe(200);
    });
  });

  // ---- POST (single add) ----
  describe('POST - single add', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(401);
    });

    it('returns 401 for non-sports role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'admin' });
      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid team value', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
          }),
        }),
      }));

      const res = await POST(makePostRequest({ name: 'Alice', team: 'jv' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("'mens' or 'womens'");
    });

    it('returns 404 when sports team not found', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
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

      const res = await POST(makePostRequest({ name: 'Alice' }));
      expect(res.status).toBe(404);
    });

    it('returns 400 when name is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({}));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Name is required');
    });

    it('returns 400 when name is whitespace-only', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ name: '   ' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when name exceeds 200 characters', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ name: 'X'.repeat(201) }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('200 characters');
    });

    it('returns 400 for duplicate member on same team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { id: 'existing' }, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ name: 'Alice', team: 'womens' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('already exists');
    });

    it('successfully adds member with team and role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', name: 'Alice', team: 'womens', role: 'Captain', sports_id: 's1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ name: 'Alice', team: 'womens', role: 'Captain' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.member.name).toBe('Alice');
      expect(data.member.team).toBe('womens');
      expect(data.member.role).toBe('Captain');
    });

    it('adds member with null team when team not provided', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', name: 'Alice', team: null, role: null, sports_id: 's1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ name: 'Alice' }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.member.team).toBeNull();
    });
  });

  // ---- POST (bulk import) ----
  describe('POST - bulk import', () => {
    it('returns 400 when bulk text has only empty lines', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: '\n  \n' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when all bulk names are duplicates', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({
                  data: [{ name: 'Alice' }, { name: 'Bob' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: 'Alice\nBob', team: 'mens' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.duplicates).toEqual(expect.arrayContaining(['Alice', 'Bob']));
    });

    it('bulk import assigns team to all members', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      let insertedRows: any[] = [];
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            insert: (rows: any[]) => {
              insertedRows = rows;
              return {
                select: () => Promise.resolve({
                  data: rows.map((r: any, i: number) => ({ id: `m${i}`, ...r })),
                  error: null,
                }),
              };
            },
          };
        }
        return {};
      });

      const res = await POST(makePostRequest({ bulkText: 'Alice\nBob', team: 'womens' }));
      expect(res.status).toBe(200);
      expect(insertedRows.every((r) => r.team === 'womens')).toBe(true);
    });
  });

  // ---- DELETE ----
  describe('DELETE', () => {
    it('returns 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(401);
    });

    it('returns 401 for non-sports role', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'living_group' });
      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(401);
    });

    it('returns 400 when member ID is missing', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      const url = new URL('http://localhost:3000/api/sports/manual-members');
      const res = await DELETE({ nextUrl: url } as any);
      expect(res.status).toBe(400);
    });

    it('returns 404 when member does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
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

      const res = await DELETE(makeDeleteRequest('m-nonexistent'));
      expect(res.status).toBe(404);
    });

    it('returns 404 when member belongs to different sports team', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', sports_id: 's-other' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await DELETE(makeDeleteRequest('m1'));
      expect(res.status).toBe(404);
    });

    it('successfully deletes a member', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', sports_id: 's1' },
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
      mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'sports' });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'sports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'sports_manual_members') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'm1', sports_id: 's1' },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: () => Promise.resolve({ error: { message: 'DB error' } }),
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
