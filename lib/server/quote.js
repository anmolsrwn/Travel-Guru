// lib/server/quote.js
// Handler_Core for POST /api/quote (design 7.21). Pure: every dependency (clock, random source,
// database adapter, rate limiter, logger) is injected. Imports nothing from Next.js, React or Supabase.

import { API_LIMITS, BUSINESS } from "../data.js";
import { computeCallbackDeadline, generateTicketId, validateQuoteForm } from "../logic.js";
import { clientIp, isSameOrigin, parseJsonBody } from "./request.js";
import { todayISOInZone } from "./time.js";

/** Quote_Form_Data string fields (whitelist) with their defaults when missing. */
const STRING_FIELDS = {
  departureCity: () => BUSINESS.originCity.name,
  destinations: () => "",
  departureDate: () => "",
  duration: () => "",
  tripType: () => "",
  childAges: () => "",
  hotelCategory: () => "",
  mealPlan: () => "",
  budget: () => "",
  fullName: () => "",
  phone: () => "",
  email: () => "",
  callbackSlot: () => "",
  notes: () => "",
};

/** Read a header from a Web `Headers` instance or a plain object (case-insensitive). */
function header(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  if (typeof headers !== "object") return null;
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key] == null ? null : String(headers[key]);
  }
  return null;
}

const reply = (status, body, headers = {}) => ({ status, headers, body });
const fail = (status, error, extraHeaders) => reply(status, { ok: false, error }, extraHeaders);

/**
 * Whitelist of Quote_Form_Data keys with defaults applied (missing → default).
 * Values are copied as-is so the validator can reject wrong types; every other key is dropped.
 */
export function pickQuoteFields(body) {
  const src = body !== null && typeof body === "object" ? body : {};
  const data = {};
  for (const [key, def] of Object.entries(STRING_FIELDS)) data[key] = src[key] === undefined ? def() : src[key];
  data.services = src.services === undefined ? [] : src.services;
  data.adults = src.adults === undefined ? 2 : src.adults;
  data.children = src.children === undefined ? 0 : src.children;
  return data;
}

/** Server type checks on top of validateQuoteForm: every whitelisted string field must be a string. */
function serverTypeErrors(data) {
  const errors = {};
  for (const key of Object.keys(STRING_FIELDS)) {
    if (typeof data[key] !== "string") errors[key] = "Invalid value";
  }
  if (!Array.isArray(data.services) || !data.services.every((s) => typeof s === "string")) {
    errors.services = "Select at least one service";
  }
  return errors;
}

/** Map validated Quote_Form_Data onto the `leads` columns (status/id/created_at come from the DB). */
export function toLeadRow(data, ticketId, deadline) {
  return {
    ticket_id: ticketId,
    services: [...data.services],
    departure_city: data.departureCity.trim(),
    destinations: data.destinations.trim(),
    departure_date: data.departureDate,
    duration: data.duration,
    trip_type: data.tripType,
    adults: data.adults,
    children: data.children,
    child_ages: data.childAges,
    hotel_category: data.hotelCategory,
    meal_plan: data.mealPlan,
    budget: data.budget,
    full_name: data.fullName.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    callback_slot: data.callbackSlot,
    callback_deadline: deadline.toISOString(),
    notes: data.notes,
  };
}

/**
 * @param {{
 *   rawBody: string,
 *   headers: Headers | Record<string, string>,
 *   now: Date,
 *   random: (maxExclusive: number) => number,
 *   db: { insertLead(row: object): Promise<{ ok: true } | { ok: false, code: "unique_violation" | "error" }> } | null,
 *   limiter: { check(key: string, nowMs: number): { allowed: boolean, retryAfterMs: number } },
 *   log?: (event: string, meta?: object) => void
 * }} deps
 * @returns {Promise<{ status: number, headers: Record<string, string>, body: object }>}
 */
export async function handleQuote({ rawBody, headers, now, random, db, limiter, log = () => {} }) {
  if (!isSameOrigin(header(headers, "origin"), header(headers, "host"))) return fail(403, "forbidden");

  // Counted before validation so invalid and honeypot requests also consume the allowance (39.6).
  const rl = limiter.check("quote:" + clientIp(headers), now.getTime());
  if (!rl.allowed) {
    return fail(429, "rate_limited", { "Retry-After": String(Math.max(1, Math.ceil(rl.retryAfterMs / 1000))) });
  }

  const parsed = parseJsonBody(rawBody, {
    maxBytes: API_LIMITS.maxBodyBytes,
    contentType: header(headers, "content-type"),
    contentLength: header(headers, "content-length"),
  });
  if (!parsed.ok) return fail(parsed.status, parsed.error);
  const body = parsed.value;

  const today = todayISOInZone(now, BUSINESS.timeZone);
  const year = Number.parseInt(today.slice(0, 4), 10);
  const data = pickQuoteFields(body);
  const deadline = computeCallbackDeadline(now, data.callbackSlot, BUSINESS.callbackHours);
  const callbackDeadline = deadline.toISOString();

  // Honeypot: look successful, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return reply(201, { ok: true, ticketId: generateTicketId(year, random(10000)), callbackDeadline });
  }

  const v = validateQuoteForm(data, today, { mode: "submit" });
  const errors = { ...serverTypeErrors(data), ...v.errors }; // validator messages win for shared keys
  if (Object.keys(errors).length > 0) return reply(400, { ok: false, error: "validation", errors });

  if (db === null || db === undefined) return fail(503, "unavailable");

  for (let attempt = 1; attempt <= API_LIMITS.maxIdAttempts; attempt++) {
    const ticketId = generateTicketId(year, random(10000));
    let res;
    try {
      res = await db.insertLead(toLeadRow(data, ticketId, deadline));
    } catch {
      res = { ok: false, code: "error" };
    }
    if (res && res.ok === true) return reply(201, { ok: true, ticketId, callbackDeadline });
    const code = res && res.code === "unique_violation" ? "unique_violation" : "error";
    log("quote.insert_failed", { code, attempt });
    if (code !== "unique_violation") return fail(500, "server_error");
  }
  log("quote.id_attempts_exhausted", { attempts: API_LIMITS.maxIdAttempts });
  return fail(500, "server_error");
}
