// lib/server/time.js
// Pure helper: the calendar date of an instant in a given IANA time zone.
// Imports nothing from Next.js, React or Supabase.

/**
 * Returns the calendar date of `date` in `timeZone` as "YYYY-MM-DD".
 * Uses Intl.DateTimeFormat("en-CA", ...) and assembles the parts explicitly,
 * so the result stays fixed-width ISO even if a runtime's en-CA pattern differs.
 * @param {Date} date
 * @param {string} timeZone IANA zone, e.g. "Asia/Kolkata"
 * @returns {string}
 */
export function todayISOInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
