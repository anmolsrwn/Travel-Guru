// Pure helpers for the quote submit and TicketModal (task 13.10, Req 17.6–17.13,
// 19.1–19.5, 27.8). No React; DOM-free except postQuote, which takes `fetch` as a
// parameter so node --test can drive it. Relative imports: also loaded by node --test.
import { API_LIMITS, BUSINESS, CALLBACK_SLOTS } from "../../lib/data.js";
import { composeQuoteWhatsAppMessage, isValidTicketId } from "../../lib/logic.js";

export const QUOTE_ENDPOINT = "/api/quote";

export const QUOTE_SUBMIT_MESSAGES = {
  rateLimited: "Too many requests. Please try again in a few minutes, or continue on WhatsApp.", // Req 19.4
  failed: "We couldn't send your request right now. Please try again or continue on WhatsApp.", // Req 19.5
};

/**
 * Map a Quote_API response to the UI outcome.
 *   201 with a well-formed ticketId and a parseable callbackDeadline → ticket
 *   400 with a non-empty `errors` object of strings                  → errors (Req 19.3)
 *   429                                                               → rateLimited (Req 19.4)
 *   anything else (incl. a malformed 201 or 400)                      → failed (Req 19.5)
 * @param {number} status
 * @param {unknown} body parsed JSON, or null when the body was not JSON
 * @returns {{type: "ticket", ticketId: string, callbackDeadline: string}
 *   | {type: "errors", errors: Record<string, string>}
 *   | {type: "rateLimited"} | {type: "failed"}}
 */
export function quoteOutcome(status, body) {
  const b = body !== null && typeof body === "object" ? body : {};
  if (status === 201) {
    const deadline = typeof b.callbackDeadline === "string" ? new Date(b.callbackDeadline) : null;
    if (isValidTicketId(b.ticketId) && deadline && !Number.isNaN(deadline.getTime())) {
      return { type: "ticket", ticketId: b.ticketId, callbackDeadline: b.callbackDeadline };
    }
    return { type: "failed" };
  }
  if (status === 400 && b.errors !== null && typeof b.errors === "object" && !Array.isArray(b.errors)) {
    const errors = Object.fromEntries(
      Object.entries(b.errors).filter(([, v]) => typeof v === "string" && v !== ""),
    );
    if (Object.keys(errors).length > 0) return { type: "errors", errors };
    return { type: "failed" };
  }
  if (status === 429) return { type: "rateLimited" };
  return { type: "failed" };
}

/**
 * POST the quote (Req 19.1): one request, JSON body with every field and `website`,
 * aborted after `timeoutMs`. Never throws; network errors and timeouts → failed.
 * @param {object} data quotePayload(form)
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [opts]
 */
export async function postQuote(data, { fetchImpl = globalThis.fetch, timeoutMs = API_LIMITS.clientTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(QUOTE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return quoteOutcome(res.status, body);
  } catch {
    return { type: "failed" };
  } finally {
    clearTimeout(timer);
  }
}

/** CALLBACK_SLOTS label for an id, or "" when unknown / empty. */
export function callbackSlotLabel(id) {
  return CALLBACK_SLOTS.find((slot) => slot.id === id)?.label ?? "";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-03-14" → "14 Mar 2026" with no time-zone shift; other input returned trimmed. */
export function formatTripDate(iso) {
  const s = String(iso ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return s;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/**
 * Callback_Deadline in the visitor's local time zone with day, month, year, hour and
 * minute (Req 17.6), e.g. "13 Feb 2026, 6:42 pm". `timeZone` is for tests only.
 * @param {string} iso
 * @param {{locale?: string, timeZone?: string}} [opts]
 */
export function formatDeadline(iso, { locale = "en-IN", timeZone } = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(d);
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "2 adults" plus ", 1 child (ages: 6)" when children > 0 (Req 17.6). */
export function travellersText(adults, children, childAges) {
  const parts = [plural(adults, "adult", "adults")];
  if (children > 0) {
    const ages = String(childAges ?? "").trim();
    parts.push(`${plural(children, "child", "children")}${ages ? ` (ages: ${ages})` : ""}`);
  }
  return parts.join(", ");
}

/**
 * Ticket_Modal summary rows (Req 17.6), in wireframe order. Rows whose trimmed value
 * is empty are omitted. The call-back slot row shows the slot label.
 * @param {object} data the submitted quotePayload
 * @returns {{label: string, value: string}[]}
 */
export function ticketSummaryRows(data) {
  const d = data ?? {};
  const t = (v) => String(v ?? "").trim();
  const services = Array.isArray(d.services) ? d.services.join(", ") : "";
  const from = t(d.departureCity);
  const to = t(d.destinations);
  const route = from && to ? `${from} → ${to}` : from || to;
  const rows = [
    ["Services", services],
    ["Route", route],
    ["Departs", formatTripDate(d.departureDate)],
    ["Duration", t(d.duration)],
    ["Travellers", travellersText(d.adults, d.children, d.childAges)],
    ["Hotel category", t(d.hotelCategory)],
    ["Meal plan", t(d.mealPlan)],
    ["Trip type", t(d.tripType)],
    ["Budget", t(d.budget)],
    ["Name", t(d.fullName)],
    ["Phone", t(d.phone)],
    ["Email", t(d.email)],
    ["Call-back slot", callbackSlotLabel(d.callbackSlot)],
  ];
  return rows.filter(([, value]) => value !== "").map(([label, value]) => ({ label, value }));
}

/**
 * Ticket_Modal WhatsApp message (Req 17.10): the Ticket_ID line, a blank line, then
 * the composeQuoteWhatsAppMessage output.
 */
export function ticketWhatsAppMessage(ticketId, data, business = BUSINESS) {
  return `*Ticket ID:* ${ticketId}\n\n${composeQuoteWhatsAppMessage(data, business)}`;
}
