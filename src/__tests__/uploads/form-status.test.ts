import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabaseFrom = vi.fn();

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

import { GET } from '../../app/api/form-status/route';

function makeRequest(form?: string) {
  const url = new URL('http://localhost:3000/api/form-status');
  if (form) url.searchParams.set('form', form);
  return { nextUrl: url } as any;
}

describe('/api/form-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when form parameter is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('form parameter');
  });

  it('returns isFrozen: true for a frozen form', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { is_frozen: true }, error: null }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(true);
  });

  it('returns isFrozen: false for an unfrozen form', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { is_frozen: false }, error: null }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: false for nonexistent form name', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const res = await GET(makeRequest('nonexistent_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: false on database error', async () => {
    mockSupabaseFrom.mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });
});
