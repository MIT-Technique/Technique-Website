import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseAdminFrom = vi.fn();
const mockSupabaseAdminAuth = { admin: { updateUserById: vi.fn() } };
const mockSupabaseAuthSignIn = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockSupabaseAdminFrom,
    auth: mockSupabaseAdminAuth,
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSupabaseAuthSignIn },
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

import { POST } from '../../app/api/auth/change-password/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('/api/auth/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'New1pass!' }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when oldPassword is missing', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ newPassword: 'New1pass!' }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('MISSING_PASSWORDS');
  });

  it('returns 400 when newPassword is missing', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old' }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('MISSING_PASSWORDS');
  });

  it('returns 400 when password is too short', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'Ab1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('INVALID_PASSWORD');
    expect(data.errors).toContain('Password must be at least 8 characters');
  });

  it('returns 400 when password has no uppercase', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'abcdefg1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors).toContain('Password must contain an uppercase letter');
  });

  it('returns 400 when password has no lowercase', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'ABCDEFG1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors).toContain('Password must contain a lowercase letter');
  });

  it('returns 400 when password has no number', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'Abcdefgh!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors).toContain('Password must contain a number');
  });

  it('returns 400 when password has no symbol', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'Abcdefg1' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors).toContain('Password must contain a symbol');
  });

  it('returns 400 with multiple errors for a completely weak password', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });

    const res = await POST(makeRequest({ oldPassword: 'old', newPassword: 'abc' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors.length).toBeGreaterThan(1);
  });

  it('returns 401 when old password is incorrect', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    const res = await POST(makeRequest({ oldPassword: 'wrong', newPassword: 'NewPass1!' }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('INVALID_OLD_PASSWORD');
  });

  it('successfully changes password for club user', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    mockSupabaseAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({ oldPassword: 'OldPass1!', newPassword: 'NewPass1!' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockSupabaseAdminAuth.admin.updateUserById).toHaveBeenCalledWith('auth-1', { password: 'NewPass1!' });
  });

  it('resolves LG email for living_group password change', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'baker@lg.technique.mit.edu', role: 'living_group' });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'living_groups') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { user_id: 'u2' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: 'baker-sys@lg.technique.mit.edu' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-2' } },
      error: null,
    });
    mockSupabaseAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({
      oldPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      orgType: 'living_group',
      livingGroupId: 'lg-1',
    }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 404 when living group not found', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'test@mit.edu', role: 'living_group' });
    mockSupabaseAdminFrom.mockImplementation((table: string) => {
      if (table === 'living_groups') {
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

    const res = await POST(makeRequest({
      oldPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      orgType: 'living_group',
      livingGroupId: 'nonexistent',
    }));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe('LG_NOT_FOUND');
  });

  it('returns 500 when password update fails', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'club@test.com', role: 'club' });
    mockSupabaseAuthSignIn.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    mockSupabaseAdminAuth.admin.updateUserById.mockResolvedValue({
      error: { message: 'Update failed' },
    });

    const res = await POST(makeRequest({ oldPassword: 'OldPass1!', newPassword: 'NewPass1!' }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe('UPDATE_FAILED');
  });
});
