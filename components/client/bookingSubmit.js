// Pure helpers for the booking request submit and VoucherModal (task 13.8, Req 14.6, 14.7,
// 14.9, 14.11, 14.12, 14.14, 27.8). No React; DOM-free except postBooking, which takes `fetch`
// as a parameter so node --test can drive it. Relative imports: also loaded by node --test.
import { API_LIMITS } from "../../lib/data.js";
import { sendWeb3Alert } from "./web3Notify.js";

export const BOOKING_ENDPOINT = "/api/booking";

/** The nine fields sent to POST /api/booking, in order. Never a price, total, advance or balance (Req 14.7). */
export const BOOKING_PAYLOAD_KEYS = [
  "packageId",
  "tierId",
  "adults",
  "children",
  "travelDate",
  "leadName",
  "email",
  "phone",
  "agreeTerms",
];

export const BOOKING_SUBMIT_MESSAGES = {
  rateLimited: "Too many requests. Please try again in a few minutes, or confirm on WhatsApp.", // design error table
  failed: "We couldn't send your booking request right now. Please try again or confirm on WhatsApp.", // Req 14.12
};

const BOOKING_REF_RE = /^BK-[A-HJ-NP-Z2-9]{6}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isAmount = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/**
 * Map a Booking_API response to the UI outcome.
 *   201 with a well-formed bookingRef and breakdown       → voucher (server values are authoritative, Req 14.14)
 *   400 with a non-empty `errors` object of strings        → errors (Req 14.11)
 *   429                                                    → rateLimited
 *   anything else (incl. a malformed 201 or 400)           → failed (Req 14.12)
 * @param {number} status
 * @param {unknown} body parsed JSON, or null when the body was not JSON
 * @returns {{type: "voucher", bookingRef: string, breakdown: {total: number, advanceRate: number,
 *   advance: number, balance: number, balanceDueDate: string | null, rule: string}}
 *   | {type: "errors", errors: Record<string, string>}
 *   | {type: "rateLimited"} | {type: "failed"}}
 */
export function bookingOutcome(status, body) {
  const b = body !== null && typeof body === "object" ? body : {};
  if (status === 201) {
    const k = b.breakdown !== null && typeof b.breakdown === "object" ? b.breakdown : null;
    const dueOk = k && (k.balanceDueDate === null || (typeof k.balanceDueDate === "string" && ISO_DATE_RE.test(k.balanceDueDate)));
    if (
      typeof b.bookingRef === "string" &&
      BOOKING_REF_RE.test(b.bookingRef) &&
      k &&
      isAmount(k.total) &&
      isAmount(k.advance) &&
      isAmount(k.balance) &&
      dueOk
    ) {
      return {
        type: "voucher",
        bookingRef: b.bookingRef,
        breakdown: {
          total: k.total,
          advanceRate: typeof k.advanceRate === "number" ? k.advanceRate : 1,
          advance: k.advance,
          balance: k.balance,
          balanceDueDate: k.balanceDueDate,
          rule: typeof k.rule === "string" ? k.rule : "",
        },
      };
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
 * POST the booking request (Req 14.7): one request, JSON body with only the nine payload
 * fields, aborted after `timeoutMs`. Never throws; network errors and timeouts → failed.
 * @param {object} data buildBookingPayload(pkg, form)
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [opts]
 */
export async function postBooking(data, { fetchImpl = globalThis.fetch, timeoutMs = API_LIMITS.clientTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const source = data !== null && typeof data === "object" ? data : {};
    const payload = Object.fromEntries(BOOKING_PAYLOAD_KEYS.map((key) => [key, source[key]]));
    const res = await fetchImpl(BOOKING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
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
    const outcome = bookingOutcome(res.status, body);
    if (outcome.type === "voucher") {
      sendWeb3Alert(`New booking ${outcome.bookingRef} - ${payload.leadName ?? ""}`, {
        "Booking ref": outcome.bookingRef,
        Name: payload.leadName,
        Phone: payload.phone,
        Email: payload.email,
        Package: payload.packageId,
        Tier: payload.tierId,
        "Travel date": payload.travelDate,
        Adults: payload.adults,
        Children: payload.children,
        "Total (INR)": outcome.breakdown.total,
        "Advance (INR)": outcome.breakdown.advance,
        "Balance (INR)": outcome.breakdown.balance,
      });
    }
    return outcome;
  } catch {
    return { type: "failed" };
  } finally {
    clearTimeout(timer);
  }
}
