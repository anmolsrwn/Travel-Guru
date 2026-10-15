// Pure helpers for the admin Excel export: column catalogue and filter parsing.
// No Next.js, React or Supabase imports, so it can be unit-tested directly.
import { BOOKING_STATUSES, LEAD_STATUSES, QUOTE_SERVICE_OPTIONS } from "./data.js";

/** key = database column (or derived key), label = Excel header. */
export const LEAD_EXPORT_COLUMNS = [
  { key: "ticket_id", label: "Ticket" },
  { key: "created_at", label: "Created (IST)" },
  { key: "full_name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "services", label: "Services" },
  { key: "destinations", label: "Destinations" },
  { key: "departure_city", label: "Departure city" },
  { key: "departure_date", label: "Departure date" },
  { key: "adults", label: "Adults" },
  { key: "children", label: "Children" },
  { key: "child_ages", label: "Child ages" },
  { key: "hotel_category", label: "Hotel category" },
  { key: "meal_plan", label: "Meal plan" },
  { key: "budget", label: "Budget" },
  { key: "callback_slot", label: "Callback slot" },
  { key: "callback_deadline", label: "Callback deadline (IST)" },
  { key: "notes", label: "Notes" },
  { key: "forex_details", label: "Forex details" },
  { key: "status", label: "Status" },
];

export const BOOKING_EXPORT_COLUMNS = [
  { key: "booking_ref", label: "Reference" },
  { key: "created_at", label: "Created (IST)" },
  { key: "package_title", label: "Package" },
  { key: "tier_id", label: "Tier" },
  { key: "adults", label: "Adults" },
  { key: "children", label: "Children" },
  { key: "travel_date", label: "Travel date" },
  { key: "lead_name", label: "Lead name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "land_total_inr", label: "Land total (INR)" },
  { key: "advance_inr", label: "Advance (INR)" },
  { key: "balance_inr", label: "Balance (INR)" },
  { key: "balance_due_date", label: "Balance due" },
  { key: "rule", label: "Rule" },
  { key: "status", label: "Status" },
];

/** Every service the leads table accepts (the quote form list plus Travel Insurance and Forex). */
// "Packages" is no longer a form option but older leads still carry it.
export const LEAD_SERVICES = [...new Set([...QUOTE_SERVICE_OPTIONS, "Packages", "Travel Insurance", "Forex"])];

export const EXPORT_TYPES = {
  leads: {
    table: "leads",
    sheet: "Quotations",
    columns: LEAD_EXPORT_COLUMNS,
    statuses: LEAD_STATUSES,
    // Database columns to select (every export column is a real column).
    selectExtra: "",
  },
  bookings: {
    table: "bookings",
    sheet: "Bookings",
    columns: BOOKING_EXPORT_COLUMNS,
    statuses: BOOKING_STATUSES,
    // package_title comes from the packages embed.
    selectExtra: "packages(title)",
  },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" → same string when it is a real calendar date, else "". */
export function cleanDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return "";
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value) ? value : "";
}

/** Start of the given IST calendar day as an ISO instant. */
export function istDayStart(date) {
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

/** Start of the day after the given IST calendar day (exclusive upper bound). */
export function istNextDayStart(date) {
  const d = new Date(`${date}T00:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

const first = (v) => (Array.isArray(v) ? v[0] : v);
const list = (v) => (Array.isArray(v) ? v : typeof v === "string" ? [v] : []);

/**
 * Validates query parameters against the allow-lists. Unknown values are dropped, never trusted.
 * @param {"leads"|"bookings"} type
 * @param {URLSearchParams} params
 */
export function parseExportParams(type, params) {
  const spec = EXPORT_TYPES[type];
  const get = (k) => first(params.getAll(k)) ?? "";

  let from = cleanDate(get("from"));
  let to = cleanDate(get("to"));
  if (from && to && from > to) [from, to] = [to, from];

  const status = spec.statuses.includes(get("status")) ? get("status") : "";
  const service = type === "leads" && LEAD_SERVICES.includes(get("service")) ? get("service") : "";

  const wanted = new Set(list(params.getAll("col")));
  const columns = spec.columns.filter((c) => wanted.has(c.key));

  return { from, to, status, service, columns: columns.length ? columns : spec.columns };
}
