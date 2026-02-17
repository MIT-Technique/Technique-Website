import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('/api/form-status - scheduled close/reopen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isFrozen: true for scheduled close in the past (no reopen)', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-02-10T00:00:00Z',
              reopens_at: null,
              unfrozen_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(true);
  });

  it('returns isFrozen: false when scheduled close has passed and reopen has passed', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-01-01T00:00:00Z',
              reopens_at: '2026-02-01T00:00:00Z',
              unfrozen_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: true when closed and reopen is in the future', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-02-10T00:00:00Z',
              reopens_at: '2026-03-01T00:00:00Z',
              unfrozen_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(true);
  });

  it('returns isFrozen: false when admin overrode scheduled close', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-02-10T00:00:00Z',
              reopens_at: null,
              unfrozen_at: '2026-02-12T00:00:00Z', // after closes_at
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: true when manual freeze overrides admin schedule override', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: true, // manual freeze
              closes_at: '2026-02-10T00:00:00Z',
              reopens_at: null,
              unfrozen_at: '2026-02-12T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(true);
  });

  it('returns isFrozen: false when closes_at is in the future', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-06-01T00:00:00Z',
              reopens_at: null,
              unfrozen_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: false when unfrozen_at equals closes_at (boundary)', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: '2026-02-10T00:00:00Z',
              reopens_at: null,
              unfrozen_at: '2026-02-10T00:00:00Z', // exactly equal
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('candids_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });

  it('returns isFrozen: false when all schedule fields are null', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              is_frozen: false,
              closes_at: null,
              reopens_at: null,
              unfrozen_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET(makeRequest('student_work_form'));
    const data = await res.json();
    expect(data.isFrozen).toBe(false);
  });
});
