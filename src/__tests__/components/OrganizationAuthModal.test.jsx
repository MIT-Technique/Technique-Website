import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Track window.location.href assignments
const locationHrefSpy = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  delete window.location;
  window.location = { ...originalLocation, href: '' };
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...originalLocation,
      get href() { return ''; },
      set href(url) { locationHrefSpy(url); },
    },
  });
});

afterEach(() => {
  window.location = originalLocation;
  vi.clearAllMocks();
});

import OrganizationAuthModal from '../../components/OrganizationAuthModal/OrganizationAuthModal';

describe('OrganizationAuthModal', () => {
  beforeEach(() => {
    // Mock organizations list fetch
    mockFetch.mockImplementation((url) => {
      if (url === '/api/organizations/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            organizations: [
              { id: '1', name: 'Test Club', type: 'club' },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('redirects immediately on successful sign-in (no setTimeout)', async () => {
    // Mock successful sign-in
    mockFetch.mockImplementation((url) => {
      if (url === '/api/organizations/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            organizations: [{ id: '1', name: 'Test Club', type: 'club' }],
          }),
        });
      }
      if (url === '/api/auth/org-signin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            redirectUrl: '/club',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<OrganizationAuthModal open={true} onClose={() => {}} />);

    // Fill in the form
    const orgInput = screen.getByLabelText('Name');
    fireEvent.change(orgInput, { target: { value: 'Test Club' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    // Redirect should happen immediately (not after 1000ms)
    await waitFor(() => {
      expect(locationHrefSpy).toHaveBeenCalledWith('/club');
    }, { timeout: 500 }); // Fails if redirect takes >500ms (old behavior was 1000ms)
  });

  it('falls back to / when redirectUrl is missing', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/organizations/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            organizations: [{ id: '1', name: 'Test Club', type: 'club' }],
          }),
        });
      }
      if (url === '/api/auth/org-signin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            // No redirectUrl!
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<OrganizationAuthModal open={true} onClose={() => {}} />);

    const orgInput = screen.getByLabelText('Name');
    fireEvent.change(orgInput, { target: { value: 'Test Club' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(locationHrefSpy).toHaveBeenCalledWith('/');
    }, { timeout: 500 });
  });

  it('sign-in payload does not include unused locale field', async () => {
    let capturedPayload = null;
    mockFetch.mockImplementation((url, opts) => {
      if (url === '/api/organizations/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            organizations: [{ id: '1', name: 'Test Club', type: 'club' }],
          }),
        });
      }
      if (url === '/api/auth/org-signin') {
        capturedPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, redirectUrl: '/club' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<OrganizationAuthModal open={true} onClose={() => {}} />);

    const orgInput = screen.getByLabelText('Name');
    fireEvent.change(orgInput, { target: { value: 'Test Club' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(capturedPayload).toBeTruthy();
      expect(capturedPayload.locale).toBeUndefined();
    });
  });

  it('shows error on invalid credentials', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/organizations/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            organizations: [{ id: '1', name: 'Test Club', type: 'club' }],
          }),
        });
      }
      if (url === '/api/auth/org-signin') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<OrganizationAuthModal open={true} onClose={() => {}} />);

    const orgInput = screen.getByLabelText('Name');
    fireEvent.change(orgInput, { target: { value: 'Test Club' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(locationHrefSpy).not.toHaveBeenCalled();
  });
});
