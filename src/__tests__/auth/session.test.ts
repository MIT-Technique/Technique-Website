import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
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

import { GET } from '../../app/api/auth/session/route';

describe('/api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { isLoggedIn: false } when no session', async () => {
    mockGetSession.mockResolvedValue({ isLoggedIn: false, userInfo: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isLoggedIn).toBe(false);
    expect(data.user).toBeNull();
  });

  it('returns { isLoggedIn: false } when session has no email', async () => {
    mockGetSession.mockResolvedValue({ isLoggedIn: true, userInfo: {} });

    const response = await GET();
    const data = await response.json();

    expect(data.isLoggedIn).toBe(false);
  });

  it('returns user data for a logged-in club user', async () => {
    mockGetSession.mockResolvedValue({
      isLoggedIn: true,
      userInfo: { email: 'club@test.com', sub: 'club@test.com', name: 'Test Club', email_verified: true },
    });

    const mockUser = { id: 'u1', email: 'club@test.com', role: 'club' };
    const mockClub = { id: 'c1', name: 'Test Club' };
    const mockForms = [{ form_name: 'club', is_frozen: false }];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockUser, error: null }) }) }) };
      }
      if (table === 'clubs') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockClub, error: null }) }) }) };
      }
      if (table === 'form_settings') {
        return { select: () => Promise.resolve({ data: mockForms, error: null }) };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });

    const response = await GET();
    const data = await response.json();

    expect(data.isLoggedIn).toBe(true);
    expect(data.user).toEqual(mockUser);
    expect(data.club).toEqual(mockClub);
    expect(data.livingGroup).toBeNull();
    expect(data.sports).toBeNull();
    expect(data.frozenForms).toEqual(mockForms);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSession.mockRejectedValue(new Error('boom'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to get session');
  });
});
