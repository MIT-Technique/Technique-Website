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

import { POST } from '../../app/api/auth/admin-login/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('/api/auth/admin-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ email: 'admin@mit.edu' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Password is required');
  });

  it('returns 401 for invalid credentials', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    const res = await POST(makeRequest({ email: 'admin@mit.edu', password: 'wrong' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Invalid credentials');
  });

  it('defaults to tnq-exec@mit.edu when no email provided', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-1', email: 'tnq-exec@mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'u1', email: 'tnq-exec@mit.edu', role: 'admin', name: 'Admin' },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return {};
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass123' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toBe('/en/dashboard');
    expect(mockSupabaseAuthSignIn).toHaveBeenCalledWith({
      email: 'tnq-exec@mit.edu',
      password: 'pass123',
    });
  });

  it('auto-creates admin user for tnq-exec@mit.edu on first login', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-1', email: 'tnq-exec@mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    // User not found in DB
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: { id: 'new-u1', email: 'tnq-exec@mit.edu', role: 'admin', name: 'Technique Admin' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ password: 'pass123' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toBe('/en/dashboard');
  });

  it('returns 404 for non-admin email not in users table', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-2', email: 'random@mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ email: 'random@mit.edu', password: 'pass123' }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('User account not found');
  });

  it('returns 403 for non-admin/non-staph role', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-3', email: 'club@mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'u3', email: 'club@mit.edu', role: 'club' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ email: 'club@mit.edu', password: 'pass123' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('This login is for admin, staph, and photographers only');
  });

  it('successful staph login redirects to /en/dashboard', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-4', email: 'staph@mit.edu' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'u4', email: 'staph@mit.edu', role: 'staph', name: 'Staph User', supabase_auth_id: 'auth-4' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    mockGetSession.mockResolvedValue({ isLoggedIn: false, save: mockSessionSave });
    mockSessionSave.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ email: 'staph@mit.edu', password: 'pass123' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toBe('/en/dashboard');
  });

  it('saves session with correct user info', async () => {
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-5', email: 'admin@mit.edu' }, session: { access_token: 'my-token' } },
      error: null,
    });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'u5', email: 'admin@mit.edu', role: 'admin', name: 'Admin User', supabase_auth_id: 'auth-5' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    const session = { isLoggedIn: false, save: mockSessionSave } as any;
    mockGetSession.mockResolvedValue(session);
    mockSessionSave.mockResolvedValue(undefined);

    await POST(makeRequest({ email: 'admin@mit.edu', password: 'pass123' }));

    expect(session.isLoggedIn).toBe(true);
    expect(session.access_token).toBe('my-token');
    expect(session.userId).toBe('u5');
    expect(session.userInfo.email).toBe('admin@mit.edu');
    expect(mockSessionSave).toHaveBeenCalledOnce();
  });
});
