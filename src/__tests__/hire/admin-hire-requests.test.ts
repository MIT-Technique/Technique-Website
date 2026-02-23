import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetCurrentUser = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockSupabaseFrom }),
}));

import { GET } from '../../app/api/admin/inquiries/hire-requests/route';

function mockSupabaseRequests(data: any[], error: any = null) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'hire_requests') {
      return {
        select: () => ({
          order: () => Promise.resolve({ data, error }),
        }),
      };
    }
    return {};
  });
}

describe('/api/admin/inquiries/hire-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin/non-staph user', async () => {
    mockGetCurrentUser.mockResolvedValue({ role: 'club' });

    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns correct withLinks count', async () => {
    mockGetCurrentUser.mockResolvedValue({ role: 'admin' });
    mockSupabaseRequests([
      { status: 'completed', dropbox_link: 'https://dropbox.com/a', event_date: '2026-01-10', link_submitted_at: '2026-01-15T12:00:00Z' },
      { status: 'completed', dropbox_link: 'https://dropbox.com/b', event_date: '2026-02-01', link_submitted_at: '2026-02-05T12:00:00Z' },
      { status: 'claimed', dropbox_link: null, event_date: '2026-03-01', link_submitted_at: null },
      { status: 'pending', dropbox_link: null, event_date: '2026-04-01', link_submitted_at: null },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.stats.withLinks).toBe(2);
  });

  it('computes avgTurnaround from link_submitted_at minus event_date', async () => {
    mockGetCurrentUser.mockResolvedValue({ role: 'staph' });
    // The code computes: new Date(event_date + "T00:00:00") vs new Date(link_submitted_at)
    // Using no Z suffix so both parse as local time for clean arithmetic
    // Request 1: event 2026-01-10, submitted 2026-01-15 = 5 days
    // Request 2: event 2026-02-01, submitted 2026-02-04 = 3 days
    // Average = 4 days
    mockSupabaseRequests([
      { status: 'completed', dropbox_link: 'https://dropbox.com/a', event_date: '2026-01-10', link_submitted_at: '2026-01-15T00:00:00' },
      { status: 'completed', dropbox_link: 'https://dropbox.com/b', event_date: '2026-02-01', link_submitted_at: '2026-02-04T00:00:00' },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(data.stats.avgTurnaround).toBe(4);
  });

  it('returns avgTurnaround as null when no links submitted', async () => {
    mockGetCurrentUser.mockResolvedValue({ role: 'admin' });
    mockSupabaseRequests([
      { status: 'pending', dropbox_link: null, event_date: '2026-03-01', link_submitted_at: null },
      { status: 'claimed', dropbox_link: null, event_date: '2026-04-01', link_submitted_at: null },
    ]);

    const res = await GET();
    const data = await res.json();
    expect(data.stats.avgTurnaround).toBeNull();
  });
});
