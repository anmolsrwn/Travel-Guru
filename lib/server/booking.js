// lib/server/booking.js
// handleBooking Handler_Core (design 7.22). Pure: dependencies (db, clock, random, limiter)
// are injected; nothing is imported from Next.js, React or Supabase.
//
// The server recomputes every amount from the database Package. Price-like keys and card
// fields in the body are never read, stored, logged or echoed.

import { validateCheckout, computeBookingBreakdown, generateBookingRef } from "../logic.js";
import { BUSINESS, API_LIMITS } from "../data.js";
import { parseJsonBody, clientIp, isSameOrigin } from "./request.js";
import { todayISOInZone } from "./time.js";

const REF_SPACE = 2 ** 32; // generateBookingRef accepts n ∈ [0, 2^32)

/** Read a header from a Web `Headers` instance or a plain object (case-insensitive). */
function header(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key] == null ? null : String(headers[key]);
  }
  return null;
}

const reply = (status, body, headers = {}) => ({ status, headers, body });
const fail = (status, error, extra = {}) => reply(status, { ok: false, error, ...extra });

/** Whitelist of the nine booking fields; every other key is ignored. */
export function pickBookingFields(body) {
  const src = body !== null && typeof body === "object" ? body : {};
  return {
    packageId: src.packageId,
    tierId: src.tierId,
    adults: src.adults,
    children: src.children,
    travelDate: src.travelDate,
    leadName: src.leadName,
    email: src.email,
    phone: src.phone,
    agreeTerms: src.agreeTerms,
  };
}

/** Normalise an insert result; a thrown adapter error counts as a generic error. */
async function safeInsert(db, row) {
  try {
    const res = await db.insertBooking(row);
    return res && res.ok === true ? { ok: true } : { ok: false, code: res?.code ?? "error" };
  } catch {
    return { ok: false, code: "error" };
  }
}

/**
 * @param {{ rawBody: string, headers: object, now: Date, random: (maxExclusive: number) => number,
 *   db: { getPublishedPackage(id: string): Promise<object|null>, insertBooking(row: object): Promise<{ok: boolean, code?: string}> } | null,
 *   limiter: { check(key: string, nowMs: number): { allowed: boolean, retryAfterMs: number } },
 *   log?: (event: string, meta?: object) => void }} deps
 * @returns {Promise<{ status: number, headers: Record<string, string>, body: object }>}
 */
export async function handleBooking({ rawBody, headers, now, random, db, limiter, log = () => {}, notify = null }) {
  if (!isSameOrigin(header(headers, "origin"), header(headers, "host"))) return fail(403, "forbidden");

  // Counted before validation (Req 39.6).
  const rl = limiter.check("booking:" + clientIp(headers), now.getTime());
  if (!rl.allowed) {
    return reply(
      429,
      { ok: false, error: "rate_limited" },
      { "Retry-After": String(Math.max(1, Math.ceil(rl.retryAfterMs / 1000))) },
    );
  }

  const parsed = parseJsonBody(rawBody, {
    maxBytes: API_LIMITS.maxBodyBytes,
    contentType: header(headers, "content-type"),
    contentLength: header(headers, "content-length"),
  });
  if (!parsed.ok) return fail(parsed.status, parsed.error);

  const req = pickBookingFields(parsed.value);

  if (db == null) return fail(503, "unavailable");

  let pkg = null;
  if (typeof req.packageId === "string" && req.packageId !== "") {
    try {
      pkg = await db.getPublishedPackage(req.packageId);
    } catch {
      return fail(500, "server_error");
    }
  }
  if (!pkg) return fail(400, "validation", { errors: { packageId: "This package is not available" } });

  const today = todayISOInZone(now, BUSINESS.timeZone);
  const v = validateCheckout(req, today, pkg);
  if (!v.valid) return fail(400, "validation", { errors: v.errors });

  const tier = pkg.tiers.find((t) => t.id === req.tierId);
  const b = computeBookingBreakdown(
    { tier, adults: req.adults, children: req.children },
    req.travelDate,
    today,
    BUSINESS.paymentPolicy,
  );

  for (let attempt = 1; attempt <= API_LIMITS.maxIdAttempts; attempt++) {
    const bookingRef = generateBookingRef(random(REF_SPACE));
    const row = {
      booking_ref: bookingRef,
      package_id: pkg.id,
      tier_id: tier.id,
      adults: b.adults,
      children: b.children,
      travel_date: req.travelDate,
      lead_name: req.leadName.trim(),
      email: req.email.trim(),
      phone: req.phone.trim(),
      land_total_inr: b.total,
      advance_inr: b.advance,
      balance_inr: b.balance,
      balance_due_date: b.balanceDueDate,
      rule: b.rule,
      // status defaults to 'pending' in the database
    };
    const res = await safeInsert(db, row);
    if (res.ok) {
      // Best-effort owner notification; a failure must never fail the visitor's request.
      if (typeof notify === "function") {
        try {
          await notify(row, bookingRef);
        } catch {
          log("booking.notify_failed");
        }
      }
      return reply(201, {
        ok: true,
        bookingRef,
        breakdown: {
          total: b.total,
          advanceRate: b.advanceRate,
          advance: b.advance,
          balance: b.balance,
          balanceDueDate: b.balanceDueDate,
          rule: b.rule,
        },
      });
    }
    const code = res.code === "unique_violation" ? "unique_violation" : "error";
    log("booking.insert_failed", { code, attempt }); // codes only: no submitted values or DB text
    if (code !== "unique_violation") return fail(500, "server_error");
  }
  log("booking.id_attempts_exhausted", { attempts: API_LIMITS.maxIdAttempts });
  return fail(500, "server_error");
}
