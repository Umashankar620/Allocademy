// Configuration constants for the application

/**
 * Preference submission deadline (ISO 8601 string or null for no deadline)
 * Format: "YYYY-MM-DDTHH:mm:ss.sssZ" (UTC)
 * Example: "2026-02-28T23:59:59.000Z"
 * If not set, defaults to null (no deadline)
 */
export const PREFERENCE_DEADLINE = process.env.PREFERENCE_DEADLINE ?? null;

/**
 * Check if preferences can still be submitted
 * Returns true if deadline has not passed or no deadline is set
 */
export function canSubmitPreferences(): boolean {
  if (!PREFERENCE_DEADLINE) return true;
  const now = new Date();
  const deadline = new Date(PREFERENCE_DEADLINE);
  return now <= deadline;
}

/** In-memory flag: whether allotment results are published (visible to students) */
let allotmentPublished = false;
export function isAllotmentPublished(): boolean {
  return allotmentPublished;
}
export function setAllotmentPublished(value: boolean): void {
  allotmentPublished = value;
}

/**
 * Get time remaining until deadline (if any)
 * Returns null if no deadline or deadline has passed
 */
export function getTimeUntilDeadline(): { ms: number; formatted: string } | null {
  if (!PREFERENCE_DEADLINE) return null;
  const now = new Date();
  const deadline = new Date(PREFERENCE_DEADLINE);
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return null;

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0 || days > 0) formatted += `${hours}h `;
  formatted += `${minutes}m`;

  return { ms, formatted };
}
