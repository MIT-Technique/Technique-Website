import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/auth/session', () => ({
  clearSession: vi.fn(),
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

import { clearSession } from '../../lib/auth/session';
import { GET, POST } from '../../app/api/auth/logout/route';

const mockClearSession = vi.mocked(clearSession);

describe('/api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns JSON { success: true }, not a redirect', async () => {
    mockClearSession.mockResolvedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('GET calls clearSession', async () => {
    mockClearSession.mockResolvedValue(undefined);
    await GET();
    expect(mockClearSession).toHaveBeenCalledOnce();
  });

  it('GET does not return a redirect (302)', async () => {
    mockClearSession.mockResolvedValue(undefined);
    const response = await GET();
    expect(response.status).not.toBe(302);
    expect(response.headers.get('location')).toBeNull();
  });

  it('GET returns { success: true } even when clearSession throws', async () => {
    mockClearSession.mockRejectedValue(new Error('session error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('POST delegates to GET and calls clearSession', async () => {
    mockClearSession.mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockClearSession).toHaveBeenCalledOnce();
  });
});
