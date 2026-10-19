// Client helper for POST /api/forex-quote. Never throws; takes `fetchImpl` so it is testable.
import { API_LIMITS } from "../../lib/data.js";
import { isValidTicketId } from "../../lib/logic.js";
import { sendWeb3Alert } from "./web3Notify.js";

export const FOREX_QUOTE_ENDPOINT = "/api/forex-quote";

export const FOREX_SUBMIT_MESSAGES = {
  rateLimited: "Too many requests. Please try again in a few minutes, or continue on WhatsApp.",
  failed: "We couldn't prepare your quotation right now. Please try again or continue on WhatsApp.",
};

/**
 * @param {object} data { fullName, phone, email, callbackSlot, direction, currency, amount, website }
 * @returns {Promise<
 *   | { type: "ticket", ticketId: string, callbackDeadline: string, quote: object, liveRates: boolean }
 *   | { type: "errors", errors: Record<string, string> }
 *   | { type: "rateLimited" } | { type: "failed" }>}
 */
export async function postForexQuote(data, { fetchImpl = globalThis.fetch, timeoutMs = API_LIMITS.clientTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(FOREX_QUOTE_ENDPOINT, {
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
    const b = body !== null && typeof body === "object" ? body : {};
    if (res.status === 201) {
      const deadline = typeof b.callbackDeadline === "string" ? new Date(b.callbackDeadline) : null;
      if (isValidTicketId(b.ticketId) && deadline && !Number.isNaN(deadline.getTime()) && b.quote && typeof b.quote === "object") {
        sendWeb3Alert(`New forex quote ${b.ticketId} - ${data?.fullName ?? ""}`, {
          "Ticket ID": b.ticketId,
          Name: data?.fullName,
          Phone: data?.phone,
          Email: data?.email,
          Forex: `${data?.direction ?? ""} ${data?.amount ?? ""} ${data?.currency ?? ""}`,
          "Call-back slot": data?.callbackSlot,
        });
        return {
          type: "ticket",
          ticketId: b.ticketId,
          callbackDeadline: b.callbackDeadline,
          quote: b.quote,
          liveRates: b.liveRates === true,
        };
      }
      return { type: "failed" };
    }
    if (res.status === 400 && b.errors && typeof b.errors === "object" && !Array.isArray(b.errors)) {
      const errors = Object.fromEntries(Object.entries(b.errors).filter(([, v]) => typeof v === "string" && v !== ""));
      if (Object.keys(errors).length > 0) return { type: "errors", errors };
    }
    if (res.status === 429) return { type: "rateLimited" };
    return { type: "failed" };
  } catch {
    return { type: "failed" };
  } finally {
    clearTimeout(timer);
  }
}
