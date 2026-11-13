/**
 * Stay dates are calendar days, not instants. A night is stored as UTC midnight of its date,
 * and "today" is today in India, so a stay never shifts by a day whatever the server's timezone.
 */
const DAY = 86_400_000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-14" → 2026-11-14T00:00:00Z, or null if invalid */
export function parseDay(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY);

/** Each night of a stay: check-in date up to the day before check-out */
export function nightsOf(checkIn: Date, checkOut: Date) {
  const out: Date[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Today's date in India, as UTC midnight */
export function todayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}

/** First day of the month containing `d` */
export const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** "Sat 14 Nov 2026" */
export const formatDay = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
