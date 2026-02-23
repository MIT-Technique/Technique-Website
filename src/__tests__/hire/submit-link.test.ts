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

import { POST } from '../../app/api/hire/submit-link/route';

function makeRequest(body: any) {
  return new Request('http://localhost:3000/api/hire/submit-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

const VALID_REQUEST = {
  id: 'req-1',
  status: 'claimed',
  claimed_by: 'photographer@mit.edu',
  requester_name: 'John Doe',
  requester_email: 'john@mit.edu',
  event_name: 'Test Event',
  event_type: 'conference',
  event_date: '2026-03-15',
  start_time: '14:00',
  end_time: '16:00',
  location: 'Room 10-250',
  description: 'A test event',
  hourly_rate: 85,
  duration_hours: 2,
  total_cost: 170,
  confirmation_code: 'ABC12345',
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

describe('/api/hire/submit-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({});
  });

  it('returns 403 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({});
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 when requestId is missing', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request ID and Dropbox link are required');
  });

  it('returns 400 when dropboxLink is missing', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ requestId: 'req-1' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request ID and Dropbox link are required');
  });

  it('returns 400 for non-http URL', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'ftp://files.example.com/photos' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid URL');
  });

  it('returns 400 for malformed URL string', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'not-a-url' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid URL format');
  });

  it('returns 404 when request not found', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(null, { code: 'PGRST116' });

    const res = await POST(makeRequest({ requestId: 'req-999', dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Request not found');
  });

  it('returns 400 when request status is pending', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect({ ...VALID_REQUEST, status: 'pending' });

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request must be in claimed status');
  });

  it('returns 400 when request status is completed', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect({ ...VALID_REQUEST, status: 'completed' });

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Request must be in claimed status');
  });

  it('returns 403 when photographer does not own the request', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'other@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(VALID_REQUEST);

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/link' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('You can only submit links for requests you claimed');
  });

  it('happy path: updates DB and returns success', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);

    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'hire_requests') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: VALID_REQUEST, error: null }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/photos' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.dropbox_link).toBe('https://dropbox.com/photos');
    expect(updateArg.status).toBe('completed');
    expect(updateArg.link_submitted_at).toBeDefined();
    expect(updateArg.completed_at).toBeDefined();
  });

  it('happy path: sends delivery email with correct recipients', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(VALID_REQUEST);

    await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/photos' }));

    expect(mockSendMail).toHaveBeenCalledOnce();
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe('john@mit.edu');
    expect(mailArgs.cc).toContain('photographer@mit.edu');
    expect(mailArgs.cc).toContain('technique@mit.edu');
    expect(mailArgs.subject).toContain('Photos Delivered');
    expect(mailArgs.subject).toContain('Test Event');
  });

  it('admin can submit link for any claimed request', async () => {
    mockGetSession.mockResolvedValue({});
    mockGetCurrentUser.mockResolvedValue({ role: 'admin', email: 'admin@mit.edu' });
    mockSupabaseSelect(VALID_REQUEST);

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/photos' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('email failure does not fail the request', async () => {
    mockGetSession.mockResolvedValue({ photographerEmail: 'photographer@mit.edu' });
    mockGetCurrentUser.mockResolvedValue(null);
    mockSupabaseSelect(VALID_REQUEST);
    mockSendMail.mockRejectedValue(new Error('SMTP failure'));

    const res = await POST(makeRequest({ requestId: 'req-1', dropboxLink: 'https://dropbox.com/photos' }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
