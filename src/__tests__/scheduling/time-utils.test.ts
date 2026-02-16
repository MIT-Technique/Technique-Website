import { describe, it, expect } from 'vitest';
import {
  isValidTimeSlot,
  roundToSlot,
  generateTimeSlots,
  formatTimeDisplay,
  timeToMinutes,
  isValidTimeRange,
  isSlotWithinRange,
} from '../../lib/utils/time';

describe('isValidTimeSlot', () => {
  it('accepts XX:00', () => {
    expect(isValidTimeSlot('10:00')).toBe(true);
    expect(isValidTimeSlot('00:00')).toBe(true);
    expect(isValidTimeSlot('23:00')).toBe(true);
  });

  it('accepts XX:15', () => {
    expect(isValidTimeSlot('10:15')).toBe(true);
  });

  it('accepts XX:30', () => {
    expect(isValidTimeSlot('14:30')).toBe(true);
  });

  it('accepts XX:45', () => {
    expect(isValidTimeSlot('09:45')).toBe(true);
  });

  it('rejects non-15-minute boundaries', () => {
    expect(isValidTimeSlot('10:07')).toBe(false);
    expect(isValidTimeSlot('10:01')).toBe(false);
    expect(isValidTimeSlot('10:10')).toBe(false);
    expect(isValidTimeSlot('10:20')).toBe(false);
    expect(isValidTimeSlot('10:35')).toBe(false);
    expect(isValidTimeSlot('10:50')).toBe(false);
    expect(isValidTimeSlot('10:59')).toBe(false);
  });

  it('rejects malformed time strings', () => {
    expect(isValidTimeSlot('10')).toBe(false);
    expect(isValidTimeSlot('')).toBe(false);
    expect(isValidTimeSlot('abc')).toBe(false);
  });
});

describe('roundToSlot', () => {
  it('rounds down to :00 for minutes < 8', () => {
    expect(roundToSlot('10:00')).toBe('10:00');
    expect(roundToSlot('10:03')).toBe('10:00');
    expect(roundToSlot('10:07')).toBe('10:00');
  });

  it('rounds to :15 for minutes 8-22', () => {
    expect(roundToSlot('10:08')).toBe('10:15');
    expect(roundToSlot('10:15')).toBe('10:15');
    expect(roundToSlot('10:22')).toBe('10:15');
  });

  it('rounds to :30 for minutes 23-37', () => {
    expect(roundToSlot('10:23')).toBe('10:30');
    expect(roundToSlot('10:30')).toBe('10:30');
    expect(roundToSlot('10:37')).toBe('10:30');
  });

  it('rounds to :45 for minutes 38-52', () => {
    expect(roundToSlot('10:38')).toBe('10:45');
    expect(roundToSlot('10:45')).toBe('10:45');
    expect(roundToSlot('10:52')).toBe('10:45');
  });

  it('rounds up to next hour for minutes >= 53', () => {
    expect(roundToSlot('10:53')).toBe('11:00');
    expect(roundToSlot('10:59')).toBe('11:00');
  });

  it('handles hour overflow (23:53+ wraps to 00:00)', () => {
    expect(roundToSlot('23:53')).toBe('00:00');
  });

  it('returns input for malformed strings', () => {
    expect(roundToSlot('10')).toBe('10');
  });
});

describe('timeToMinutes', () => {
  it('converts HH:mm to total minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('01:00')).toBe(60);
    expect(timeToMinutes('10:30')).toBe(630);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('returns 0 for invalid input', () => {
    expect(timeToMinutes('')).toBe(0);
    expect(timeToMinutes('abc')).toBe(0);
    expect(timeToMinutes(null as any)).toBe(0);
    expect(timeToMinutes(undefined as any)).toBe(0);
  });
});

describe('isValidTimeRange', () => {
  it('returns true when start < end', () => {
    expect(isValidTimeRange('10:00', '11:00')).toBe(true);
    expect(isValidTimeRange('09:00', '09:15')).toBe(true);
  });

  it('returns false when start >= end', () => {
    expect(isValidTimeRange('11:00', '10:00')).toBe(false);
    expect(isValidTimeRange('10:00', '10:00')).toBe(false);
  });

  it('returns false for malformed input', () => {
    expect(isValidTimeRange('10', '11:00')).toBe(false);
    expect(isValidTimeRange('10:00', '11')).toBe(false);
  });
});

describe('isSlotWithinRange', () => {
  it('returns true when slot is within range', () => {
    expect(isSlotWithinRange('10:00', '10:30', '09:00', '12:00')).toBe(true);
    expect(isSlotWithinRange('09:00', '12:00', '09:00', '12:00')).toBe(true); // exact match
  });

  it('returns false when slot starts before range', () => {
    expect(isSlotWithinRange('08:45', '09:15', '09:00', '12:00')).toBe(false);
  });

  it('returns false when slot ends after range', () => {
    expect(isSlotWithinRange('11:45', '12:15', '09:00', '12:00')).toBe(false);
  });

  it('returns false when slot is completely outside range', () => {
    expect(isSlotWithinRange('13:00', '14:00', '09:00', '12:00')).toBe(false);
  });
});

describe('generateTimeSlots', () => {
  it('generates 15-minute slots between start and end', () => {
    const slots = generateTimeSlots('10:00', '11:00');
    expect(slots.length).toBe(4);
    expect(slots[0]).toEqual({ start: '10:00', end: '10:15' });
    expect(slots[1]).toEqual({ start: '10:15', end: '10:30' });
    expect(slots[2]).toEqual({ start: '10:30', end: '10:45' });
    expect(slots[3]).toEqual({ start: '10:45', end: '11:00' });
  });

  it('returns empty array for malformed input', () => {
    expect(generateTimeSlots('10', '11:00')).toEqual([]);
    expect(generateTimeSlots('10:00', '11')).toEqual([]);
  });

  it('returns empty when start equals end', () => {
    expect(generateTimeSlots('10:00', '10:00')).toEqual([]);
  });
});

describe('formatTimeDisplay', () => {
  it('converts 24h to 12h format', () => {
    expect(formatTimeDisplay('14:30')).toBe('2:30 PM');
    expect(formatTimeDisplay('09:00')).toBe('9:00 AM');
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
    expect(formatTimeDisplay('23:45')).toBe('11:45 PM');
  });

  it('returns input for malformed strings', () => {
    expect(formatTimeDisplay('10')).toBe('10');
  });
});
