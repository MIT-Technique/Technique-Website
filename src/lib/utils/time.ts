/**
 * Time utility functions for 30-minute boundary validation
 */

/**
 * Validate that a time string is on a 30-minute boundary (XX:00 or XX:30)
 * @param time - Time string in HH:mm format
 * @returns true if on 30-minute boundary
 */
export function isValidTimeSlot(time: string): boolean {
  const parts = time.split(':');
  if (parts.length < 2) return false;
  const minutes = parseInt(parts[1], 10);
  return minutes === 0 || minutes === 30;
}

/**
 * Round a time to the nearest 30-minute boundary
 * @param time - Time string in HH:mm format
 * @returns Rounded time string in HH:mm format
 */
export function roundToSlot(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) return time;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  let roundedMinutes: number;
  if (minutes < 15) {
    roundedMinutes = 0;
  } else if (minutes < 45) {
    roundedMinutes = 30;
  } else {
    roundedMinutes = 0;
    hours = hours + 1;
  }

  // Handle hour overflow
  if (hours >= 24) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

/**
 * Generate 30-minute time slots between start and end times
 * @param start - Start time in HH:mm format
 * @param end - End time in HH:mm format
 * @returns Array of slot strings like ["14:00-14:30", "14:30-15:00"]
 */
export function generateTimeSlots(start: string, end: string): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];

  const startParts = start.split(':');
  const endParts = end.split(':');

  if (startParts.length < 2 || endParts.length < 2) return slots;

  let h = parseInt(startParts[0], 10);
  let m = parseInt(startParts[1], 10);
  const endH = parseInt(endParts[0], 10);
  const endM = parseInt(endParts[1], 10);

  // Round start to nearest 30-minute boundary if needed
  if (m !== 0 && m !== 30) {
    if (m < 30) {
      m = 30;
    } else {
      m = 0;
      h++;
    }
  }

  while (h < endH || (h === endH && m < endM)) {
    const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // Advance by 30 minutes
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }

    const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // Only add if we haven't passed the end time
    if (h < endH || (h === endH && m <= endM)) {
      slots.push({ start: slotStart, end: slotEnd });
    } else if (h === endH && m > endM) {
      // Handle case where end time is not on a 30-min boundary
      // Still include the partial slot
      slots.push({ start: slotStart, end: slotEnd });
      break;
    }
  }

  return slots;
}

/**
 * Format a time string for display (e.g., "14:30" -> "2:30 PM")
 * @param time - Time string in HH:mm format
 * @returns Formatted time string
 */
export function formatTimeDisplay(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) return time;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Convert time string to minutes since midnight for comparison
 * @param time - Time string in HH:mm format
 * @returns Total minutes since midnight
 */
export function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') return 0;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}

/**
 * Validate that start time is before end time
 * @param start - Start time in HH:mm format
 * @param end - End time in HH:mm format
 * @returns true if start is before end
 */
export function isValidTimeRange(start: string, end: string): boolean {
  const startParts = start.split(':');
  const endParts = end.split(':');

  if (startParts.length < 2 || endParts.length < 2) return false;

  const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
  const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

  return startMinutes < endMinutes;
}

/**
 * Validate that a time slot falls within a photoshoot time range
 * @param slotStart - Slot start time (HH:mm)
 * @param slotEnd - Slot end time (HH:mm)
 * @param photoshootStart - Photoshoot start time (HH:mm)
 * @param photoshootEnd - Photoshoot end time (HH:mm)
 * @returns true if slot is within photoshoot range, false otherwise
 */
export function isSlotWithinRange(
  slotStart: string,
  slotEnd: string,
  photoshootStart: string,
  photoshootEnd: string
): boolean {
  const slotStartMins = timeToMinutes(slotStart);
  const slotEndMins = timeToMinutes(slotEnd);
  const photoshootStartMins = timeToMinutes(photoshootStart);
  const photoshootEndMins = timeToMinutes(photoshootEnd);

  return slotStartMins >= photoshootStartMins && slotEndMins <= photoshootEndMins;
}
