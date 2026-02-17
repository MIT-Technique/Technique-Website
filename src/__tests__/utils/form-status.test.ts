import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isFormEffectivelyClosed, isScheduleOverridden } from '../../lib/utils/formStatus';

describe('isFormEffectivelyClosed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze time to 2026-02-15T12:00:00Z
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Null / missing input ---
  it('returns false for null setting', () => {
    expect(isFormEffectivelyClosed(null)).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isFormEffectivelyClosed({})).toBe(false);
  });

  it('returns false when is_frozen is undefined', () => {
    expect(isFormEffectivelyClosed({ closes_at: null, reopens_at: null })).toBe(false);
  });

  // --- Manual freeze (is_frozen) ---
  it('returns true when is_frozen is true (no schedule)', () => {
    expect(isFormEffectivelyClosed({ is_frozen: true })).toBe(true);
  });

  it('returns true when is_frozen is true even with future closes_at', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: true,
      closes_at: '2026-03-01T00:00:00Z',
    })).toBe(true);
  });

  it('returns true when is_frozen is true even with past reopens_at', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: true,
      closes_at: '2026-01-01T00:00:00Z',
      reopens_at: '2026-02-01T00:00:00Z',
    })).toBe(true);
  });

  it('returns false when is_frozen is false and no schedule', () => {
    expect(isFormEffectivelyClosed({ is_frozen: false })).toBe(false);
  });

  // --- Scheduled close (closes_at) ---
  it('returns true when closes_at is in the past (no reopen)', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
    })).toBe(true);
  });

  it('returns false when closes_at is in the future', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-03-01T00:00:00Z',
    })).toBe(false);
  });

  it('returns true when closes_at equals now', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-15T12:00:00Z',
    })).toBe(true);
  });

  // --- Scheduled reopen (reopens_at) ---
  it('returns false when both closes_at and reopens_at are in the past', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-01-01T00:00:00Z',
      reopens_at: '2026-02-01T00:00:00Z',
    })).toBe(false);
  });

  it('returns true when closes_at is past but reopens_at is in the future', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      reopens_at: '2026-03-01T00:00:00Z',
    })).toBe(true);
  });

  it('returns true when reopens_at equals now (not yet passed)', () => {
    // reopens_at <= now means it has passed; exactly equal means it IS past
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      reopens_at: '2026-02-15T12:00:00Z',
    })).toBe(false);
  });

  // --- Admin override (unfrozen_at) ---
  it('returns false when admin unfroze after scheduled close (override)', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z', // after closes_at
    })).toBe(false);
  });

  it('returns true when unfrozen_at is before closes_at (no override)', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-09T00:00:00Z', // before closes_at
    })).toBe(true);
  });

  it('returns false when unfrozen_at equals closes_at (boundary)', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-10T00:00:00Z',
    })).toBe(false);
  });

  it('is_frozen overrides admin unfrozen_at', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: true,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z',
    })).toBe(true);
  });

  // --- Combined scenario: close, admin override, then future reopen ---
  it('respects admin override even when future reopens_at exists', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      reopens_at: '2026-03-01T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z',
    })).toBe(false);
  });

  // --- Null field variants ---
  it('handles null closes_at', () => {
    expect(isFormEffectivelyClosed({ is_frozen: false, closes_at: null })).toBe(false);
  });

  it('handles null reopens_at with past closes_at', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      reopens_at: null,
    })).toBe(true);
  });

  it('handles null unfrozen_at with past closes_at', () => {
    expect(isFormEffectivelyClosed({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: null,
    })).toBe(true);
  });
});

describe('isScheduleOverridden', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for null setting', () => {
    expect(isScheduleOverridden(null)).toBe(false);
  });

  it('returns false when is_frozen is true (manual close is active)', () => {
    expect(isScheduleOverridden({
      is_frozen: true,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z',
    })).toBe(false);
  });

  it('returns true when schedule would close but admin overrode it', () => {
    expect(isScheduleOverridden({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z',
    })).toBe(true);
  });

  it('returns false when schedule expired (both close and reopen passed)', () => {
    expect(isScheduleOverridden({
      is_frozen: false,
      closes_at: '2026-01-01T00:00:00Z',
      reopens_at: '2026-02-01T00:00:00Z',
      unfrozen_at: '2026-01-15T00:00:00Z',
    })).toBe(false);
  });

  it('returns false when no schedule exists', () => {
    expect(isScheduleOverridden({ is_frozen: false })).toBe(false);
  });

  it('returns false when closes_at is in the future', () => {
    expect(isScheduleOverridden({
      is_frozen: false,
      closes_at: '2026-03-01T00:00:00Z',
      unfrozen_at: '2026-02-12T00:00:00Z',
    })).toBe(false);
  });

  it('returns false when unfrozen_at is before closes_at (no override)', () => {
    expect(isScheduleOverridden({
      is_frozen: false,
      closes_at: '2026-02-10T00:00:00Z',
      unfrozen_at: '2026-02-09T00:00:00Z',
    })).toBe(false);
  });
});
