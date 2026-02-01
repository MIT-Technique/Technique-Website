import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockSessionSave = vi.fn();
const mockSupabaseAdminFrom = vi.fn();
const mockSupabaseAuthSignIn = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockSupabaseAdminFrom }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSupabaseAuthSignIn },
  }),
}));

import { POST } from '../../app/api/auth/org-signin/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/auth/org-signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function setupClubMocks(overrides: { userOverrides?: any } = {}) {
  const userData = {
    id: 'u1', email: 'club@test.com', role: 'club', is_active: true,
    ...overrides.userOverrides,
  };

  mockSupabaseAdminFrom.mockImplementation((table: string) => {
    if (table === 'clubs') {
      return {
        select: () => ({
          ilike: () => ({
            single: () => Promise.resolve({ data: { id: 'c1', name: 'Test Club', user_id: 'u1' }, error: null }),
          }),
        }),
      };
    }
    if (table === 'users') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: userData, error: null }),
          }),
        }),
      };
    }
    return {};
  });
}

describe('/api/auth/org-signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ orgType: 'club', name: 'Test Club' }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('MISSING_PASSWORD');
  });

  it('returns 400 for invalid org type', async () => {
    const res = await POST(makeRequest({ password: 'pass', orgType: 'invalid' }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('INVALID_ORG_TYPE');
  });

  it('returns relative redirect URL /en/club for club login', async () => {
    setupClubMocks();
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'club@test.com', email_confirmed_at: '2024-01-01' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass', orgType: 'club', name: 'Test Club' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toBe('/en/club');
  });

  it('returns locale-aware redirect URL when locale is provided', async () => {
    setupClubMocks();
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'club@test.com', email_confirmed_at: '2024-01-01' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass', orgType: 'club', name: 'Test Club', locale: 'es' }));
    const data = await res.json();

    expect(data.redirectUrl).toBe('/es/club');
  });

  it('defaults to /en/ when no locale provided', async () => {
    setupClubMocks();
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'club@test.com', email_confirmed_at: '2024-01-01' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass', orgType: 'club', name: 'Test Club' }));
    const data = await res.json();

    expect(data.redirectUrl).toBe('/en/club');
    // Verify it's a relative URL, not absolute
    expect(data.redirectUrl).not.toContain('http');
  });

  it('returns 401 for invalid credentials', async () => {
    setupClubMocks();
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    const res = await POST(makeRequest({ password: 'wrong', orgType: 'club', name: 'Test Club' }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 403 for inactive account', async () => {
    setupClubMocks({ userOverrides: { is_active: false } });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'club@test.com', email_confirmed_at: '2024-01-01' }, session: { access_token: 'tok' } },
      error: null,
    });

    const res = await POST(makeRequest({ password: 'pass', orgType: 'club', name: 'Test Club' }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('ACCOUNT_DISABLED');
  });

  it('returns /en/sports for sports login', async () => {
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'sports') {
        return {
          select: () => ({
            ilike: () => ({
              single: () => Promise.resolve({ data: { id: 's1', name: 'Test Team', user_id: 'u2' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'u2', email: 'sports@test.com', role: 'sports', is_active: true }, error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'sports@test.com' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass', orgType: 'sports', name: 'Test Team' }));
    expect((await res.json()).redirectUrl).toBe('/en/sports');
  });

  it('returns /en/living-group for living group login', async () => {
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'living_groups') {
        return {
          select: () => ({
            ilike: () => ({
              single: () => Promise.resolve({
                data: { id: 'lg1', name: 'Baker House', user_id: 'u3', users: { email: 'baker@lg.technique.mit.edu' } },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'u3', email: 'baker@lg.technique.mit.edu', role: 'living_group', is_active: true },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { email: 'baker@lg.technique.mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass', orgType: 'living_group', name: 'Baker House' }));
    expect((await res.json()).redirectUrl).toBe('/en/living-group');
  });
});
