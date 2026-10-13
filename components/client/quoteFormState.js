// Pure state helpers for the QuoteForm (task 13.9). No React, no DOM: importable from
// node --test. The component keeps one `form` object (Quote_Form_Data + honeypot) and
// one `errors` object keyed like validateQuoteForm's errors.
import { BUSINESS, QUOTE_SERVICE_OPTIONS } from "../../lib/data.js"; // relative: also loaded by node --test

/** Fields in form order; used to focus the first invalid field (Req 15.19). */
export const QUOTE_FIELD_ORDER = [
  "services",
  "departureCity",
  "destinations",
  "departureDate",
  "duration",
  "tripType",
  "adults",
  "children",
  "childAges",
  "hotelCategory",
  "mealPlan",
  "budget",
  "fullName",
  "phone",
  "email",
  "callbackSlot",
  "notes",
];

/** Empty form: no services, Raipur, 2 adults, 0 children, everything else "" (Req 15.2, 17.13). */
export function initialQuoteForm() {
  return {
    services: [],
    departureCity: BUSINESS.originCity.name,
    destinations: "",
    departureDate: "",
    duration: "",
    tripType: "",
    adults: 2,
    children: 0,
    childAges: "",
    hotelCategory: "",
    mealPlan: "",
    budget: "",
    fullName: "",
    phone: "",
    email: "",
    callbackSlot: "",
    notes: "",
    website: "", // honeypot (Req 19.6)
  };
}

/** `services` with `option` checked, never unchecking; unknown options are ignored. */
export function checkService(services, option) {
  if (!QUOTE_SERVICE_OPTIONS.includes(option) || services.includes(option)) return services;
  // Keep QUOTE_SERVICE_OPTIONS order so the composed message is stable.
  return QUOTE_SERVICE_OPTIONS.filter((o) => o === option || services.includes(o));
}

/** `services` with `option` toggled (tile click), in QUOTE_SERVICE_OPTIONS order. */
export function toggleService(services, option) {
  if (services.includes(option)) return services.filter((o) => o !== option);
  return checkService(services, option);
}

/**
 * Apply a quote intent (QuoteIntentProvider contract) to the form and errors.
 *   service:     check `value`, clear the services error (Req 7.5–7.7)
 *   destination: replace destinations with `value`, check `service`, clear the
 *                services and destinations errors (Req 35.4)
 * Unknown intents return the inputs unchanged.
 * @returns {{ form: object, errors: Record<string, string> }}
 */
export function applyQuoteIntent(form, errors, intent) {
  if (!intent || typeof intent !== "object") return { form, errors };
  const without = (keys) => {
    const next = { ...errors };
    for (const k of keys) delete next[k];
    return next;
  };

  if (intent.type === "service") {
    return { form: { ...form, services: checkService(form.services, intent.value) }, errors: without(["services"]) };
  }
  if (intent.type === "destination") {
    return {
      form: { ...form, destinations: String(intent.value ?? ""), services: checkService(form.services, intent.service) },
      errors: without(["services", "destinations"]),
    };
  }
  return { form, errors };
}

/**
 * Data to validate / send / compose: Quote_Form_Data plus `website`. Child ages are
 * dropped while children is 0, since that field is hidden (Req 15.3).
 */
export function quotePayload(form) {
  return { ...form, childAges: form.children > 0 ? form.childAges : "" };
}

/** Number input value → integer state; empty or non-numeric input stays "" so validation flags it. */
export function parseCount(raw) {
  if (raw === "" || raw === null || raw === undefined) return "";
  const n = Number(raw);
  return Number.isFinite(n) ? n : "";
}

/** First field in form order that has an error, or null. */
export function firstInvalidField(errors) {
  return QUOTE_FIELD_ORDER.find((k) => errors[k]) ?? null;
}
