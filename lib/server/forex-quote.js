// lib/server/forex-quote.js
// Handler_Core for POST /api/forex-quote: a visitor requests a forex quotation straight from the
// calculator (no trip form). Pure like lib/server/quote.js: every dependency is injected.
// The server is authoritative: it recomputes the quote from the live rates (`getRates`, falling back
// to the static CURRENCIES) and stores the figures with the lead, so the visitor's ticket matches.

import { API_LIMITS, BUSINESS, CALLBACK_SLOTS, FOREX_CONFIG, FOREX_CURRENCIES } from "../data.js";
import {
  calculateForexQuoteForForeignAmount,
  computeCallbackDeadline,
  generateTicketId,
  validateEmail,
  validatePhone,
} from "../logic.js";
import { clientIp, isSameOrigin, parseJsonBody } from "./request.js";
import { todayISOInZone } from "./time.js";
import { currenciesWithLiveRates } from "./forexRates.js";

const reply = (status, body, headers = {}) => ({ status, headers, body });
const fail = (status, error, extraHeaders) => reply(status, { ok: false, error }, extraHeaders);

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

const text = (v) => (typeof v === "string" ? v : "");
const inr = (n) => `INR ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Field errors for the visitor's contact details and request; keys match the calculator form. */
export function validateForexQuoteBody(body) {
  const errors = {};
  const name = text(body.fullName).trim();
  if (name.length < 2 || name.length > 80) errors.fullName = "Enter your full name (2 to 80 characters)";
  const phone = text(body.phone).trim();
  if (phone.length > 20 || !validatePhone(phone)) errors.phone = "Enter a valid phone number";
  const email = text(body.email).trim();
  if (email !== "" && (email.length > 254 || !validateEmail(email))) errors.email = "Enter a valid email address";
  const slot = text(body.callbackSlot);
  if (slot !== "" && !CALLBACK_SLOTS.some((s) => s.id === slot)) errors.callbackSlot = "Choose one of the options";
  if (body.direction !== "buy" && body.direction !== "sell") errors.direction = "Select buy or sell";
  if (!FOREX_CURRENCIES.includes(body.currency)) errors.currency = "Select a currency";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    errors.amount = "Enter a valid amount";
  }
  return errors;
}

/**
 * @param {{
 *   rawBody: string,
 *   headers: Headers | Record<string, string>,
 *   now: Date,
 *   random: (maxExclusive: number) => number,
 *   db: { insertLead(row: object): Promise<{ ok: true } | { ok: false, code: "unique_violation" | "error" }> } | null,
 *   limiter: { check(key: string, nowMs: number): { allowed: boolean, retryAfterMs: number } },
 *   getRates?: () => Promise<{ rates: Record<string, number>, updatedAt: string | null } | null>,
 *   log?: (event: string, meta?: object) => void,
 *   notify?: ((row: object, ticketId: string) => Promise<void>) | null
 * }} deps
 */
export async function handleForexQuote({
  rawBody,
  headers,
  now,
  random,
  db,
  limiter,
  getRates = async () => null,
  log = () => {},
  notify = null,
}) {
  if (!isSameOrigin(header(headers, "origin"), header(headers, "host"))) return fail(403, "forbidden");

  const rl = limiter.check("forex:" + clientIp(headers), now.getTime());
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

  const year = Number.parseInt(todayISOInZone(now, BUSINESS.timeZone).slice(0, 4), 10);
  const slot = text(body.callbackSlot);
  const deadline = computeCallbackDeadline(now, slot, BUSINESS.callbackHours);
  const callbackDeadline = deadline.toISOString();

  // Honeypot: look successful, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return reply(201, { ok: true, ticketId: generateTicketId(year, random(10000)), callbackDeadline });
  }

  const errors = validateForexQuoteBody(body);
  if (Object.keys(errors).length > 0) return reply(400, { ok: false, error: "validation", errors });

  // Recompute from the live rates (static fallback); an out-of-range amount is a field error.
  let live = null;
  try {
    live = await getRates();
  } catch {
    live = null;
  }
  const currencies = currenciesWithLiveRates(live);
  let quote;
  try {
    quote = calculateForexQuoteForForeignAmount(body.direction, body.currency, body.amount, currencies, FOREX_CONFIG);
  } catch {
    return reply(400, { ok: false, error: "validation", errors: { amount: "Amount is outside the allowed range" } });
  }

  const buy = body.direction === "buy";
  const foreign = buy ? quote.targetAmount : quote.sourceAmount;
  const inrAmount = buy ? quote.sourceAmount : quote.targetAmount;
  const summary = {
    direction: body.direction,
    currency: body.currency,
    foreignAmount: foreign,
    inrAmount,
    effectiveRate: foreign > 0 ? Math.round((inrAmount / foreign) * 100) / 100 : 0,
    serviceFee: quote.serviceFee,
    totalINR: quote.totalINR,
  };
  const notes =
    `Forex quote (${live ? "live" : "indicative"} rates): ${body.direction} ${foreign} ${body.currency} ` +
    `at INR ${summary.effectiveRate}/${body.currency}; ${inr(inrAmount)} + fee ${inr(quote.serviceFee)}; ` +
    `${buy ? "total payable" : "total receivable"} ${inr(quote.totalINR)}`;

  if (db === null || db === undefined) return fail(503, "unavailable");

  for (let attempt = 1; attempt <= API_LIMITS.maxIdAttempts; attempt++) {
    const ticketId = generateTicketId(year, random(10000));
    const row = {
      ticket_id: ticketId,
      services: ["Forex"],
      departure_city: "",
      destinations: body.currency,
      departure_date: null,
      duration: "",
      trip_type: "",
      adults: 1,
      children: 0,
      child_ages: "",
      hotel_category: "",
      meal_plan: "",
      budget: "",
      full_name: text(body.fullName).trim(),
      phone: text(body.phone).trim(),
      email: text(body.email).trim(),
      callback_slot: slot,
      callback_deadline: callbackDeadline,
      notes,
      forex_details: { direction: body.direction, currency: body.currency, amount: body.amount },
    };
    let res;
    try {
      res = await db.insertLead(row);
    } catch {
      res = { ok: false, code: "error" };
    }
    if (res && res.ok === true) {
      if (typeof notify === "function") {
        try {
          await notify(row, ticketId);
        } catch {
          log("forex.notify_failed");
        }
      }
      return reply(201, { ok: true, ticketId, callbackDeadline, quote: summary, liveRates: live !== null });
    }
    const code = res && res.code === "unique_violation" ? "unique_violation" : "error";
    log("forex.insert_failed", { code, attempt });
    if (code !== "unique_violation") return fail(500, "server_error");
  }
  log("forex.id_attempts_exhausted", { attempts: API_LIMITS.maxIdAttempts });
  return fail(500, "server_error");
}
