/**
 * Computes whether a form is effectively closed based on:
 * 1. Manual close override (is_frozen)
 * 2. Scheduled close/reopen times (closes_at / reopens_at)
 * 3. Admin explicit open override (unfrozen_at after closes_at means admin overrode the schedule)
 */
export function isFormEffectivelyClosed(setting: {
  is_frozen?: boolean;
  closes_at?: string | null;
  reopens_at?: string | null;
  unfrozen_at?: string | null;
} | null): boolean {
  if (!setting) return false;

  // Manual close always wins
  if (setting.is_frozen) return true;

  const now = new Date();

  // Check scheduled close
  if (setting.closes_at && new Date(setting.closes_at) <= now) {
    // If there's a reopen time and it's passed, form is open again
    if (setting.reopens_at && new Date(setting.reopens_at) <= now) return false;

    // If admin explicitly opened (unfrozen) after the schedule closed, honor the override
    if (setting.unfrozen_at && new Date(setting.unfrozen_at) >= new Date(setting.closes_at)) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Checks if a schedule exists but is being overridden by an admin's manual open action.
 * Used in the admin settings UI to gray out the schedule section.
 */
export function isScheduleOverridden(setting: {
  is_frozen?: boolean;
  closes_at?: string | null;
  reopens_at?: string | null;
  unfrozen_at?: string | null;
} | null): boolean {
  if (!setting) return false;
  if (setting.is_frozen) return false; // manual close is active, schedule isn't relevant

  const now = new Date();

  // Schedule would close the form, but admin overrode it
  if (setting.closes_at && new Date(setting.closes_at) <= now) {
    if (setting.reopens_at && new Date(setting.reopens_at) <= now) return false; // schedule expired
    if (setting.unfrozen_at && new Date(setting.unfrozen_at) >= new Date(setting.closes_at)) {
      return true;
    }
  }

  return false;
}
