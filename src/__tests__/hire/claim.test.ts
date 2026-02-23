import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockGetCurrentUser, mockSupabaseFrom, mockSendMail } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockSupabaseFrom: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock('../../lib/auth/session', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockSupabaseFrom }),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mockSendMail }) },
}));

import { POST } from '../../app/api/hire/claim/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/hire/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

const PENDING_REQUEST = {
  id: 'req-1',
  status: 'pending',
  requester_name: 'Jane Smith',
  requester_email: 'jane@mit.edu',
  event_name: 'Spring Gala',
  event_type: 'social',
  event_date: '2026-04-10',
  start_time: '18:00',
  end_time: '21:00',
  location: 'Kresge Auditorium',
  description: 'Annual spring gala',
  hourly_rate: 85,
  duration_hours: 3,
  total_cost: 255,
  confirmation_code: 'XYZ98765',
};

function mockSupabaseSelect(data: any, error: any = null) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'hire_requests') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data, error }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    }
    return {};
  });
}

describe('/api/hire/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({});
  });

  it('returns 403 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({});
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 when requestId is missing', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request ID is required');
  });

  it('returns 404 when request not found', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(null, { code: 'PGRST116' });

    const res = await POST(makeRequest({ requestId: 'req-999' }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Request not found');
  });

  it('returns 400 when request is not pending', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect({ ...PENDING_REQUEST, status: 'claimed' });

    const res = await POST(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request is no longer available');
  });

  it('happy path: sets status to claimed and returns success', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'hire_requests') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: PENDING_REQUEST, error: null }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe('claimed');
    expect(updateArg.claimed_by).toBe('photo@mit.edu');
    expect(updateArg.claimed_at).toBeDefined();
  });

  it('claim email includes "50 edited photos per hour" text', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(PENDING_REQUEST);

    await POST(makeRequest({ requestId: 'req-1' }));

    expect(mockSendMail).toHaveBeenCalledOnce();
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.html).toContain('50 edited photos per hour');
    expect(mailArgs.to).toBe('jane@mit.edu');
    expect(mailArgs.subject).toContain('Spring Gala');
  });

  it('email failure does not fail the claim', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photo@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(PENDING_REQUEST);
    mockSendMail.mockRejectedValue(new Error('SMTP down'));

    const res = await POST(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
