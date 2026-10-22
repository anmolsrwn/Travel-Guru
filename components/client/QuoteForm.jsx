"use client";

// 24h Quotation form (design wireframe 8, Req 15.1–15.4, 15.19, 15.20, 16.5, 17.1,
// 18.1, 18.2, 18.8–18.10, 19.6, 19.7, 7.5–7.7, 35.4, 24.1, 24.2, 25.6).
//
// Three steps (services, trip details, your details) plus a hidden honeypot `website`.
// Validation: validateQuoteForm(data, localTodayISO(), {mode}) from lib/logic.js, errors
// inline under each field (aria-describedby + aria-invalid), a count in an aria-live
// summary and focus on the first invalid field in form order.
//
// Buttons:
//   - "Submit & Guarantee 24h Call Back with Quotation": validates in Submit_Mode, then
//     submitQuote(payload) POSTs to /api/quote (postQuote in quoteSubmit.js: "Sending…",
//     button disabled, 10 s timeout). 201 → TicketModal with the server ticketId and
//     callbackDeadline ("Done" resets the form); 400 → inline errors; 429 / 5xx /
//     network / timeout → message + WhatsApp button, values kept (Req 17.2, 19.1–19.5).
//   - "Instant Quote via WhatsApp": validates in WhatsApp_Mode, then opens wa.me with the
//     composed message. No API call, no ticket, no reset (Req 18.8, 19.7).
//
// Quote intents from the Services "Enquire" links and destination "Get a Quote"
// buttons are applied per the contract in QuoteIntentProvider.jsx.
import { useEffect, useRef, useState } from "react";
import {
  BUDGETS,
  BUSINESS,
  CALLBACK_SLOTS,
  CURRENCIES,
  DURATIONS,
  FLIGHT_CLASSES,
  FOREX_CURRENCIES,
  HOTEL_CATEGORIES,
  JOURNEY_TYPES,
  LIMITS,
  MEAL_PLANS,
  QUOTE_SERVICE_OPTIONS,
  SERVICES,
  TRAIN_CLASSES,
  TRANSPORT_MODES,
  TRIP_TYPES,
  serviceLabel,
} from "@/lib/data";
import {
  buildWhatsAppUrl,
  clampCount,
  composeQuoteWhatsAppMessage,
  minDepartureDate,
  validateQuoteForm,
} from "@/lib/logic";
import { useModal } from "./ModalProvider";
import { useQuoteIntent } from "./QuoteIntentProvider";
import { TicketModal } from "./TicketModal";
import { postQuote, QUOTE_SUBMIT_MESSAGES } from "./quoteSubmit";
import { openWhatsApp, WhatsAppIcon } from "./WhatsAppButton";
import { localTodayISO, useLocalTodayISO } from "./localToday";
import {
  applyQuoteIntent,
  firstInvalidField,
  hasTicketService,
  initialQuoteForm,
  isTicketMode,
  parseCount,
  quotePayload,
  toggleService,
} from "./quoteFormState";
import { ACCENT_CLASS, ServiceGlyph } from "@/components/ui/ServiceGlyph";
import btn from "@/components/ui/Button.module.css";
import card from "@/components/ui/Card.module.css";
import f from "@/components/ui/Field.module.css";
import svc from "@/components/ui/Service.module.css";
import st from "@/components/ui/Stepper.module.css";
import s from "./QuoteForm.module.css";

// First card wins when two cards share a quote option (Holidays and Packages both map to "Holidays").
const SERVICE_BY_OPTION = Object.fromEntries(
  [...SERVICES].reverse().map((service) => [service.quoteOption, service]),
);

const SELECT_OPTIONS = {
  duration: DURATIONS.map((v) => ({ value: v, label: v })),
  tripType: TRIP_TYPES.map((v) => ({ value: v, label: v })),
  hotelCategory: HOTEL_CATEGORIES.map((v) => ({ value: v, label: v })),
  mealPlan: MEAL_PLANS.map((v) => ({ value: v, label: v })),
  budget: BUDGETS.map((v) => ({ value: v, label: v })),
  flightClass: FLIGHT_CLASSES.map((v) => ({ value: v, label: v })),
  trainClass: TRAIN_CLASSES.map((v) => ({ value: v, label: v })),
  callbackSlot: CALLBACK_SLOTS.map((slot) => ({ value: slot.id, label: slot.label })),
};

const fieldId = (name) => `q-${name}`;
const errorId = (name) => `q-${name}-error`;
/** Element that receives focus for a field error (first service tile for `services`). */
const focusId = (name) => (name === "services" ? `${fieldId("services")}-0` : fieldId(name));

function summaryText(count) {
  return count === 1
    ? "1 field needs your attention. Please correct the highlighted field."
    : `${count} fields need your attention. Please correct the highlighted fields.`;
}

export function QuoteForm() {
  const [form, setForm] = useState(initialQuoteForm);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [appliedNonce, setAppliedNonce] = useState(null);
  const [sending, setSending] = useState(false);
  /** null | "rateLimited" | "failed" (Req 19.4, 19.5) */
  const [submitError, setSubmitError] = useState(null);
  const sendingRef = useRef(false); // synchronous guard: exactly one request per submit
  const submitRef = useRef(null);
  const { intent, consumeIntent } = useQuoteIntent();
  const modal = useModal();

  // null on the server and while hydrating, local date after mount (Req 16.5).
  const todayISO = useLocalTodayISO();
  const minDate = todayISO ? minDepartureDate(todayISO) : undefined;

  // Apply a new intent while rendering (state adjustment, no effect round-trip).
  if (intent && intent.nonce !== appliedNonce) {
    setAppliedNonce(intent.nonce);
    const next = applyQuoteIntent(form, errors, intent);
    setForm(next.form);
    setErrors(next.errors);
  }

  // Then mark it consumed in the provider.
  useEffect(() => {
    if (intent) consumeIntent(intent.nonce);
  }, [intent, consumeIntent]);

  const errorCount = Object.keys(errors).length;

  /** Set one field and clear only that field's error (Req 15.20). */
  function update(name, value, alsoClear = []) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const keys = [name, ...alsoClear].filter((k) => k in prev);
      if (keys.length === 0) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function setCount(name, value) {
    // Child ages are hidden at 0 children, so drop a stale childAges error with them.
    update(name, value, name === "children" && !(value > 0) ? ["childAges"] : []);
  }

  /** Show client or server (400) validation errors: inline, summary, focus (Req 15.19, 19.3). */
  function showErrors(nextErrors) {
    setErrors(nextErrors);
    setSummary(summaryText(Object.keys(nextErrors).length));
    const first = firstInvalidField(nextErrors);
    if (first) document.getElementById(focusId(first))?.focus();
  }

  function validate(mode) {
    const data = quotePayload(form);
    // Fresh local date at click time, so a page left open past midnight stays correct.
    const result = validateQuoteForm(data, localTodayISO(), { mode });
    if (!result.valid) {
      showErrors(result.errors);
      return null;
    }
    setErrors({});
    setSummary("");
    return data;
  }

  /** "Done" in the TicketModal: back to the initial form (Req 17.13). */
  function resetForm() {
    setForm(initialQuoteForm());
    setErrors({});
    setSummary("");
    setSubmitError(null);
  }

  /** POST the validated payload and route the outcome (Req 17.2, 19.1–19.5). */
  async function submitQuote(data) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSubmitError(null);
    const outcome = await postQuote(data);
    sendingRef.current = false;
    setSending(false);

    if (outcome.type === "ticket") {
      modal.open(
        TicketModal,
        { ticketId: outcome.ticketId, callbackDeadline: outcome.callbackDeadline, data, onDone: resetForm },
        submitRef.current,
      );
    } else if (outcome.type === "errors") {
      showErrors(outcome.errors);
    } else {
      setSubmitError(outcome.type);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    const data = validate("submit");
    if (data) submitQuote(data);
  }

  function handleFallbackWhatsApp() {
    // Values are kept, so the composed message carries everything entered (Req 19.4, 19.5).
    openWhatsApp(buildWhatsAppUrl(BUSINESS.whatsapp, composeQuoteWhatsAppMessage(quotePayload(form), BUSINESS)));
  }

  function handleWhatsApp() {
    const data = validate("whatsapp");
    if (!data) return; // Req 18.10: no URL opened
    openWhatsApp(buildWhatsAppUrl(BUSINESS.whatsapp, composeQuoteWhatsAppMessage(data, BUSINESS)));
  }

  /** id / aria-invalid / aria-describedby for a control; `hint` adds a hint id. */
  function a11y(name, hint) {
    const describedBy = [hint ? `${fieldId(name)}-hint` : null, errors[name] ? errorId(name) : null]
      .filter(Boolean)
      .join(" ");
    return {
      id: fieldId(name),
      name,
      "aria-invalid": errors[name] ? "true" : undefined,
      "aria-describedby": describedBy || undefined,
    };
  }

  function errorText(name) {
    return errors[name] ? (
      <p id={errorId(name)} className={f.error}>
        {errors[name]}
      </p>
    ) : null;
  }

  function label(name, text, { required = false, optional = false } = {}) {
    return (
      <label className={f.label} htmlFor={fieldId(name)}>
        {text}
        {required && (
          <span className={f.required} aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {optional && <span className={s.optional}> (optional)</span>}
      </label>
    );
  }

  function selectField(name, text, opts) {
    return (
      <div className={f.field}>
        {label(name, text, opts)}
        <select className={f.select} value={form[name]} onChange={(e) => update(name, e.target.value)} {...a11y(name)}>
          <option value="">Select…</option>
          {SELECT_OPTIONS[name].map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errorText(name)}
      </div>
    );
  }

  function stepper(name, text, [min, max]) {
    const value = form[name];
    const current = typeof value === "number" ? value : min;
    const noun = name === "adults" ? "adults" : "children";
    return (
      <div className={f.field}>
        {label(name, text)}
        <div className={st.stepper}>
          <button
            type="button"
            className={st.button}
            aria-label={`Decrease ${noun}`}
            aria-controls={fieldId(name)}
            disabled={typeof value === "number" && value <= min}
            onClick={() => setCount(name, clampCount(current - 1, min, max))}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            className={st.input}
            value={value}
            onChange={(e) => setCount(name, parseCount(e.target.value))}
            {...a11y(name)}
          />
          <button
            type="button"
            className={st.button}
            aria-label={`Increase ${noun}`}
            aria-controls={fieldId(name)}
            disabled={typeof value === "number" && value >= max}
            onClick={() => setCount(name, clampCount(current + 1, min, max))}
          >
            +
          </button>
        </div>
        {errorText(name)}
      </div>
    );
  }

  const servicesInvalid = Boolean(errors.services);
  // Ticket mode: only flights / train (/ forex) are offered, so the holiday fields are hidden.
  const ticketMode = isTicketMode(form.services);
  const ticketish = hasTicketService(form.services);

  return (
    <form className={`${card.glass} ${s.form}`} noValidate onSubmit={handleSubmit} aria-label="Quotation request">
      {/* Step 1 */}
      <div className={s.step}>
        <h3 className={s.stepTitle} tabIndex={-1} data-quote-focus>
          <span className={s.stepNo}>Step 1</span> · What do you need?
        </h3>
        <fieldset className={s.fieldset} aria-describedby={servicesInvalid ? errorId("services") : undefined}>
          <legend className="sr-only">
            Services <span aria-hidden="true">*</span>
          </legend>
          <div className={s.tiles}>
            {QUOTE_SERVICE_OPTIONS.map((option, i) => {
              const service = SERVICE_BY_OPTION[option];
              return (
                <label key={option} className={svc.tile}>
                  <input
                    type="checkbox"
                    id={`${fieldId("services")}-${i}`}
                    name="services"
                    value={option}
                    className={svc.tileInput}
                    checked={form.services.includes(option)}
                    onChange={() => update("services", toggleService(form.services, option))}
                    aria-invalid={servicesInvalid ? "true" : undefined}
                    aria-describedby={servicesInvalid ? errorId("services") : undefined}
                  />
                  <span className={svc.tileBody}>
                    {service && (
                      <span className={`${svc.iconCircle} ${ACCENT_CLASS[service.accent] ?? ""}`} aria-hidden="true">
                        <ServiceGlyph name={service.icon} />
                      </span>
                    )}
                    <span className={svc.tileLabel}>{serviceLabel(option)}</span>
                    <span className={svc.check} aria-hidden="true" />
                  </span>
                </label>
              );
            })}
          </div>
          {errorText("services")}
        </fieldset>

        {/* Forex details, only while the Forex tile is ticked (forex-counter Req 5.1, 5.2). */}
        {form.services.includes("Forex") && (
          <div className={s.forexFields}>
            <div className={f.field}>
              <span className={f.label} id="q-forexDirection-label">
                Direction
                <span className={f.required} aria-hidden="true">
                  {" "}
                  *
                </span>
              </span>
              <div
                className={s.radioGroup}
                role="radiogroup"
                aria-labelledby="q-forexDirection-label"
                aria-invalid={errors.forexDirection ? "true" : undefined}
                aria-describedby={errors.forexDirection ? errorId("forexDirection") : undefined}
              >
                {[
                  ["buy", "Buy Foreign Currency"],
                  ["sell", "Sell Foreign Currency"],
                ].map(([value, text], i) => (
                  <label key={value} className={s.radioOption}>
                    <input
                      type="radio"
                      name="forexDirection"
                      id={i === 0 ? fieldId("forexDirection") : undefined}
                      value={value}
                      checked={form.forexDirection === value}
                      onChange={() => update("forexDirection", value)}
                    />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
              {errorText("forexDirection")}
            </div>

            <div className={f.field}>
              {label("forexCurrency", "Currency", { required: true })}
              <select
                className={f.select}
                value={form.forexCurrency}
                onChange={(e) => update("forexCurrency", e.target.value, ["forexAmount"])}
                {...a11y("forexCurrency")}
              >
                <option value="">Select currency</option>
                {FOREX_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {CURRENCIES[code] ? `${code} (${CURRENCIES[code].symbol})` : code}
                  </option>
                ))}
              </select>
              {errorText("forexCurrency")}
            </div>

            <div className={f.field}>
              {label("forexAmount", form.forexCurrency ? `Amount (${form.forexCurrency})` : "Amount", {
                required: true,
              })}
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className={f.input}
                value={form.forexAmount}
                onChange={(e) => update("forexAmount", e.target.value)}
                {...a11y("forexAmount")}
              />
              {errorText("forexAmount")}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className={s.step}>
        <h3 className={s.stepTitle}>
          <span className={s.stepNo}>Step 2</span> · Trip details
        </h3>
        <div className={s.grid}>
          <div className={f.field}>
            {label("departureCity", ticketish ? "From" : "Departure City")}
            <input
              type="text"
              className={f.input}
              autoComplete="address-level2"
              maxLength={LIMITS.departureCityMax}
              value={form.departureCity}
              onChange={(e) => update("departureCity", e.target.value)}
              {...a11y("departureCity")}
            />
            {errorText("departureCity")}
          </div>

          <div className={f.field}>
            {label("destinations", ticketish ? "To" : "Destination(s)", { required: true })}
            <input
              type="text"
              className={f.input}
              placeholder={ticketish ? "e.g. Delhi, Dubai" : "e.g. Bali, Singapore"}
              maxLength={LIMITS.destinationsMax}
              value={form.destinations}
              onChange={(e) => update("destinations", e.target.value)}
              {...a11y("destinations")}
            />
            {errorText("destinations")}
          </div>

          <div className={f.field}>
            {label("departureDate", ticketish ? "Travel date" : "Departure Date", { required: true })}
            <input
              type="date"
              className={f.input}
              min={minDate}
              value={form.departureDate}
              onChange={(e) => update("departureDate", e.target.value)}
              {...a11y("departureDate")}
            />
            {errorText("departureDate")}
          </div>

          {ticketish && (
            <>
              <div className={f.field}>
                <span className={f.label} id="q-ticketJourney-label">
                  Journey
                </span>
                <div
                  className={s.radioGroup}
                  role="radiogroup"
                  aria-labelledby="q-ticketJourney-label"
                  aria-invalid={errors.ticketJourney ? "true" : undefined}
                  aria-describedby={errors.ticketJourney ? errorId("ticketJourney") : undefined}
                >
                  {JOURNEY_TYPES.map((value, i) => (
                    <label key={value} className={s.radioOption}>
                      <input
                        type="radio"
                        name="journey"
                        id={i === 0 ? fieldId("ticketJourney") : undefined}
                        value={value}
                        checked={form.journey === value}
                        onChange={() => update("journey", value, ["ticketJourney", "returnDate"])}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
                {errorText("ticketJourney")}
              </div>

              {form.journey === "Round trip" && (
                <div className={f.field}>
                  {label("returnDate", "Return date", { required: true })}
                  <input
                    type="date"
                    className={f.input}
                    min={form.departureDate || minDate}
                    value={form.returnDate}
                    onChange={(e) => update("returnDate", e.target.value)}
                    {...a11y("returnDate")}
                  />
                  {errorText("returnDate")}
                </div>
              )}

              {form.services.includes("Flights") && selectField("flightClass", "Flight class", { optional: true })}
              {form.services.includes("Train") && selectField("trainClass", "Train class", { optional: true })}
            </>
          )}

          {!ticketMode && (
            <>
              {form.services.includes("Holidays") && (
                <>
                  <div className={f.field}>
                    <span className={f.label} id="q-transport-label">
                      Travel by
                    </span>
                    <div
                      className={s.radioGroup}
                      role="radiogroup"
                      aria-labelledby="q-transport-label"
                      aria-invalid={errors.transport ? "true" : undefined}
                      aria-describedby={errors.transport ? errorId("transport") : undefined}
                    >
                      {TRANSPORT_MODES.map((value, i) => (
                        <label key={value} className={s.radioOption}>
                          <input
                            type="radio"
                            name="transport"
                            id={i === 0 ? fieldId("transport") : undefined}
                            value={value}
                            checked={form.transport === value}
                            onChange={() => update("transport", value)}
                          />
                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                    {errorText("transport")}
                  </div>
                  {form.transport === "Flight" && selectField("flightClass", "Flight class", { optional: true })}
                  {form.transport === "Train" && selectField("trainClass", "Train class", { optional: true })}
                </>
              )}
              {selectField("duration", "Duration")}
              {selectField("tripType", "Trip type")}
            </>
          )}

          <div className={s.counts}>
            {stepper("adults", "Adults", LIMITS.adults)}
            {stepper("children", "Children", LIMITS.children)}
          </div>

          {form.children > 0 && (
            <div className={`${f.field} ${s.wide}`}>
              {label("childAges", "Child ages", { optional: true })}
              <input
                type="text"
                className={f.input}
                placeholder="e.g. 6, 9"
                maxLength={LIMITS.childAgesMaxLength}
                value={form.childAges}
                onChange={(e) => update("childAges", e.target.value)}
                {...a11y("childAges")}
              />
              {errorText("childAges")}
            </div>
          )}

          {!ticketMode && (
            <>
              {selectField("hotelCategory", "Hotel category")}
              {selectField("mealPlan", "Meal plan", { optional: true })}
              {selectField("budget", "Budget")}
            </>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className={s.step}>
        <h3 className={s.stepTitle}>
          <span className={s.stepNo}>Step 3</span> · Your details
        </h3>
        <div className={s.grid}>
          <div className={f.field}>
            {label("fullName", "Full Name", { required: true })}
            <input
              type="text"
              className={f.input}
              autoComplete="name"
              maxLength={LIMITS.fullName[1]}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              {...a11y("fullName")}
            />
            {errorText("fullName")}
          </div>

          <div className={f.field}>
            {label("phone", "Phone / WhatsApp", { required: true })}
            <input
              type="tel"
              className={f.input}
              autoComplete="tel"
              inputMode="tel"
              maxLength={LIMITS.phoneMax}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              {...a11y("phone")}
            />
            {errorText("phone")}
          </div>

          <div className={f.field}>
            {label("email", "Email", { required: true })}
            <input
              type="email"
              className={f.input}
              autoComplete="email"
              maxLength={LIMITS.emailMax}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              {...a11y("email")}
            />
            {errorText("email")}
          </div>

          {selectField("callbackSlot", "Call-back slot")}

          <div className={`${f.field} ${s.wide}`}>
            {label("notes", "Special requests", { optional: true })}
            <textarea
              className={f.textarea}
              rows={4}
              placeholder={ticketish ? "e.g. morning flight, preferred airline or train name" : undefined}
              maxLength={LIMITS.notesMax}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              {...a11y("notes")}
            />
            {errorText("notes")}
          </div>
        </div>
      </div>

      {/* Honeypot (Req 19.6): hidden from people, filled only by bots. */}
      <div className={s.honeypot} aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input
          type="text"
          id={fieldId("website")}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className={s.actions}>
        {/* Always mounted so screen readers pick up changes (Req 15.19). */}
        <p className={s.summary} role="status" aria-live="polite">
          {errorCount > 0 ? summary : ""}
        </p>
        <button
          ref={submitRef}
          type="submit"
          className={`${btn.btn} ${btn.primary} ${btn.block} ${s.wrap}`}
          disabled={sending}
        >
          {sending ? (
            "Sending…"
          ) : (
            <>
              <span aria-hidden="true">⚡</span>
              Submit &amp; Guarantee {BUSINESS.callbackHours}h Call Back with Quotation
            </>
          )}
        </button>
        {/* Always mounted so the failure message is announced (Req 19.4, 19.5). */}
        <div role="alert">
          {submitError && (
            <div className={s.submitError}>
              <p className={s.submitErrorText}>{QUOTE_SUBMIT_MESSAGES[submitError]}</p>
              <button
                type="button"
                className={`${btn.btn} ${btn.whatsapp} ${btn.sm}`}
                onClick={handleFallbackWhatsApp}
              >
                <WhatsAppIcon className={btn.icon} />
                Send on WhatsApp instead
              </button>
            </div>
          )}
        </div>
        <p className={s.or}>
          <span>or</span>
        </p>
        <button type="button" className={`${btn.btn} ${btn.whatsapp} ${btn.block} ${s.wrap}`} onClick={handleWhatsApp}>
          <WhatsAppIcon className={btn.icon} />
          {`Instant Quote via WhatsApp`}
        </button>
        <p className={s.privacy}>
          <span aria-hidden="true">🔒</span> We never share your details.
        </p>
      </div>
    </form>
  );
}

export default QuoteForm;
