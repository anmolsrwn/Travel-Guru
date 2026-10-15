"use client";

// Forex calculator (forex-counter spec, Req 3.1–3.10, 8.1–8.7, 10.1–10.5).
//
// Inputs: direction (buy/sell radiogroup), currency (native <select>) and a foreign-currency
// amount. The result is recalculated 300 ms after the last change with
// calculateForexQuoteForForeignAmount (lib/logic.js), so the amount is always a FOREIGN amount
// in both directions. The effective rate shown is derived from the quote amounts (INR per
// 1 unit of foreign currency), not from quote.rate.
//
// The amount can be typed in the foreign currency or in INR. "Get my quotation" opens an inline
// contact form and POSTs to /api/forex-quote (no redirect); the server recomputes the quote from
// live rates and the visitor gets a ticket modal (ForexTicketModal).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CALLBACK_SLOTS, CURRENCIES, FOREX_CONFIG, FOREX_CURRENCIES } from "@/lib/data";
import {
  calculateForexQuoteForForeignAmount,
  calculateForexQuoteForInrAmount,
  formatPrice,
  validateEmail,
  validatePhone,
} from "@/lib/logic";
import { ForexTicketModal } from "./ForexTicketModal";
import { FOREX_SUBMIT_MESSAGES, postForexQuote } from "./forexQuoteSubmit";
import { useModal } from "./ModalProvider";
import btn from "@/components/ui/Button.module.css";
import f from "@/components/ui/Field.module.css";
import s from "./ForexCalculator.module.css";

const DEBOUNCE_MS = 300;
const RATES_ENDPOINT = "/api/forex-rates";
const RATES_REFRESH_MS = 5 * 60 * 1000;
const EMPTY_CONTACT = { fullName: "", phone: "", email: "", callbackSlot: "", website: "" };

const DIRECTIONS = [
  { id: "buy", label: "Buy Foreign Currency" },
  { id: "sell", label: "Sell Foreign Currency" },
];

const DISCLAIMER = "Rates are indicative and subject to change. Final rates will be confirmed in your quote.";

/** "Amount must be between ₹5,000 and ₹5,00,000 equivalent" (limits come from FOREX_CONFIG). */
const RANGE_ERROR = `Amount must be between ${formatPrice(FOREX_CONFIG.minTransactionINR, "INR")} and ${formatPrice(
  FOREX_CONFIG.maxTransactionINR,
  "INR",
)} equivalent`;

const IDLE = { status: "idle" };

/** Pure: validate the raw amount string and compute the outcome shown to the visitor. */
function evaluate(direction, currency, rawAmount, unit, currencies) {
  if (rawAmount.trim() === "") return IDLE;
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount < 0) return { status: "error", error: RANGE_ERROR };
  try {
    const quote =
      unit === "inr"
        ? calculateForexQuoteForInrAmount(direction, currency, amount, currencies, FOREX_CONFIG)
        : calculateForexQuoteForForeignAmount(direction, currency, amount, currencies, FOREX_CONFIG);
    const buy = direction === "buy";
    const inr = buy ? quote.sourceAmount : quote.targetAmount;
    const foreign = buy ? quote.targetAmount : quote.sourceAmount;
    return {
      status: "ok",
      quote,
      inr,
      foreign,
      effectiveRate: foreign > 0 ? inr / foreign : 0,
    };
  } catch {
    return { status: "error", error: RANGE_ERROR };
  }
}

/** "16 Oct, 5:32 pm" in the visitor's local time zone; "" when unparseable. */
function formatUpdated(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(d);
}

/** The calculator, mounted inside the ForexSection server component (it takes no props). */
export function ForexCalculator() {
  const [direction, setDirection] = useState("buy");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("foreign"); // "foreign" or "inr": which currency the amount is typed in
  const [outcome, setOutcome] = useState(IDLE);
  const [live, setLive] = useState(null); // { rates, updatedAt } once the live feed has loaded
  const [liveFailed, setLiveFailed] = useState(false);

  const [requesting, setRequesting] = useState(false); // contact form revealed
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [contactErrors, setContactErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const sendingRef = useRef(false);
  const nameRef = useRef(null);

  const modal = useModal();
  const radioRefs = useRef([]);
  const uid = useId();
  const directionLabelId = `${uid}-direction-label`;
  const currencyId = `${uid}-currency`;
  const amountId = `${uid}-amount`;
  const unitId = `${uid}-unit`;
  const errorId = `${uid}-amount-error`;

  // Live mid-market rates: loaded on mount and refreshed every few minutes. If the feed is down the
  // calculator keeps using the static indicative rates from CURRENCIES.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(RATES_ENDPOINT, { cache: "no-store" });
        const body = await res.json();
        if (cancelled) return;
        if (res.ok && body?.ok && body.rates) {
          setLive({ rates: body.rates, updatedAt: body.updatedAt });
          setLiveFailed(false);
        } else {
          setLiveFailed(true);
        }
      } catch {
        if (!cancelled) setLiveFailed(true);
      }
    }
    load();
    const timer = setInterval(load, RATES_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // CURRENCIES with the live rate swapped in for each supported currency.
  const currencies = useMemo(() => {
    if (!live) return CURRENCIES;
    const merged = { ...CURRENCIES };
    for (const code of FOREX_CURRENCIES) {
      if (Number.isFinite(live.rates[code]) && live.rates[code] > 0) {
        merged[code] = { ...CURRENCIES[code], rate: live.rates[code] };
      }
    }
    return merged;
  }, [live]);

  // Debounced recalculation (Req 3.6): cleanup cancels the pending run on every change.
  useEffect(() => {
    const timer = setTimeout(
      () => setOutcome(evaluate(direction, currency, amount, unit, currencies)),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [direction, currency, amount, unit, currencies]);

  // Move focus to the name field when the contact form opens.
  useEffect(() => {
    if (requesting) nameRef.current?.focus();
  }, [requesting]);

  const buy = direction === "buy";
  const hasError = outcome.status === "error";

  // Roving tabindex: arrows move focus and select (automatic activation); Home/End jump.
  function onRadioKeyDown(event, index) {
    const last = DIRECTIONS.length - 1;
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setDirection(DIRECTIONS[next].id);
    radioRefs.current[next]?.focus();
  }

  function updateContact(key, value) {
    setContact((prev) => ({ ...prev, [key]: value }));
    setContactErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  // Step 1: reveal the contact fields right under the result (no navigation).
  function handleStartRequest() {
    if (outcome.status !== "ok") return;
    setRequesting(true);
    setSubmitError(null);
  }

  // Step 2: send the request straight to the server, which recomputes the quote from live rates,
  // stores the lead, emails the team and returns the ticket shown in the modal.
  async function handleSubmitRequest(event) {
    event.preventDefault();
    if (sendingRef.current || outcome.status !== "ok") return;

    const errors = {};
    if (contact.fullName.trim().length < 2) errors.fullName = "Enter your full name";
    if (!validatePhone(contact.phone.trim())) errors.phone = "Enter a valid phone number";
    if (contact.email.trim() !== "" && !validateEmail(contact.email.trim())) errors.email = "Enter a valid email address";
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setSubmitError(null);
    const result = await postForexQuote({
      fullName: contact.fullName.trim(),
      phone: contact.phone.trim(),
      email: contact.email.trim(),
      callbackSlot: contact.callbackSlot,
      direction,
      currency,
      amount: outcome.foreign, // the quote API always takes the foreign-currency amount
      website: contact.website,
    });
    sendingRef.current = false;
    setSending(false);

    if (result.type === "ticket") {
      modal.open(
        ForexTicketModal,
        {
          ticketId: result.ticketId,
          callbackDeadline: result.callbackDeadline,
          quote: result.quote,
          liveRates: result.liveRates,
          contact: { fullName: contact.fullName.trim(), phone: contact.phone.trim(), email: contact.email.trim() },
          onDone: resetRequest,
        },
      );
    } else if (result.type === "errors") {
      setContactErrors(result.errors);
      setSubmitError(result.errors.amount ?? "Please check the highlighted fields.");
    } else if (result.type === "rateLimited") {
      setSubmitError(FOREX_SUBMIT_MESSAGES.rateLimited);
    } else {
      setSubmitError(FOREX_SUBMIT_MESSAGES.failed);
    }
  }

  function resetRequest() {
    setRequesting(false);
    setContact(EMPTY_CONTACT);
    setContactErrors({});
    setSubmitError(null);
    setAmount("");
  }

  return (
    <div className={s.calculator}>
      <div className={s.inputs}>
        <div className={s.field}>
          <span id={directionLabelId} className={f.label}>
            Direction
          </span>
          <div role="radiogroup" aria-labelledby={directionLabelId} className={s.toggle}>
            {DIRECTIONS.map((d, index) => {
              const selected = d.id === direction;
              return (
                <button
                  key={d.id}
                  ref={(node) => {
                    radioRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected ? "true" : "false"}
                  tabIndex={selected ? 0 : -1}
                  className={s.option}
                  onClick={() => setDirection(d.id)}
                  onKeyDown={(event) => onRadioKeyDown(event, index)}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor={currencyId}>
            {buy ? "I want to buy" : "I want to sell"}
          </label>
          <select
            id={currencyId}
            className={f.select}
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {FOREX_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} ({CURRENCIES[code].symbol.trim()})
              </option>
            ))}
          </select>
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor={unitId}>
            I will enter the amount in
          </label>
          <select id={unitId} className={f.select} value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="foreign">{currency} (foreign currency)</option>
            <option value="inr">INR (Indian rupees)</option>
          </select>
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor={amountId}>
            Amount ({unit === "inr" ? "INR" : currency})
          </label>
          <input
            id={amountId}
            className={f.input}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            placeholder="0.00"
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? errorId : undefined}
            onChange={(event) => setAmount(event.target.value)}
          />
          {hasError ? (
            <p id={errorId} role="alert" className={f.error}>
              {outcome.error}
            </p>
          ) : null}
        </div>
      </div>

      <div className={s.results}>
        <div aria-live="polite" className={s.live}>
          {outcome.status === "ok" ? (
            <dl className={s.rows}>
              <div className={s.row}>
                <dt>INR equivalent</dt>
                <dd>{formatPrice(outcome.inr, "INR", CURRENCIES, 2)}</dd>
              </div>
              <div className={s.row}>
                <dt>Effective rate</dt>
                <dd>{`1 ${currency} = ${formatPrice(outcome.effectiveRate, "INR", CURRENCIES, 2)}`}</dd>
              </div>
              {outcome.quote.serviceFee > 0 ? (
                <div className={s.row}>
                  <dt>Service fee</dt>
                  <dd>{formatPrice(outcome.quote.serviceFee, "INR", CURRENCIES, 2)}</dd>
                </div>
              ) : null}
              <div className={`${s.row} ${s.total}`}>
                <dt>{buy ? "Total payable" : "Total receivable"}</dt>
                <dd>{formatPrice(outcome.quote.totalINR, "INR", CURRENCIES, 2)}</dd>
              </div>
              <div className={s.row}>
                <dt>{buy ? "You receive" : "You sell"}</dt>
                <dd>{formatPrice(outcome.foreign, currency, CURRENCIES, 2)}</dd>
              </div>
            </dl>
          ) : (
            <p className={s.placeholder}>Enter an amount to see the indicative INR value.</p>
          )}
        </div>

        <div className={s.rates} aria-label="Live exchange rates">
          <p className={s.ratesHead}>
            <span className={live ? s.liveDot : s.staticDot} aria-hidden="true" />
            {live
              ? `Live market rates${live.updatedAt ? `, updated ${formatUpdated(live.updatedAt)}` : ""}`
              : liveFailed
                ? "Live rates unavailable, showing indicative rates"
                : "Loading live rates…"}
          </p>
          <ul className={s.rateList}>
            {FOREX_CURRENCIES.map((code) => (
              <li key={code} className={s.rateItem}>
                <span>{`1 ${code}`}</span>
                <strong>{formatPrice(1 / currencies[code].rate, "INR", CURRENCIES, 2)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <p className={s.disclaimer}>{DISCLAIMER}</p>

        {!requesting ? (
          <button
            type="button"
            className={`${btn.btn} ${btn.primary} ${s.cta}`}
            onClick={handleStartRequest}
            disabled={outcome.status !== "ok"}
          >
            {`Get my quotation to ${buy ? "buy" : "sell"} ${currency}`}
          </button>
        ) : (
          <form className={s.request} onSubmit={handleSubmitRequest} noValidate aria-labelledby={`${uid}-req-title`}>
            <h3 id={`${uid}-req-title`} className={s.requestTitle}>
              Where should we send your quotation?
            </h3>

            <div className={f.field}>
              <label className={f.label} htmlFor={`${uid}-name`}>
                Full name
              </label>
              <input
                id={`${uid}-name`}
                ref={nameRef}
                className={f.input}
                type="text"
                autoComplete="name"
                maxLength={80}
                value={contact.fullName}
                aria-invalid={contactErrors.fullName ? "true" : "false"}
                onChange={(event) => updateContact("fullName", event.target.value)}
              />
              {contactErrors.fullName ? (
                <p role="alert" className={f.error}>
                  {contactErrors.fullName}
                </p>
              ) : null}
            </div>

            <div className={f.field}>
              <label className={f.label} htmlFor={`${uid}-phone`}>
                Phone (WhatsApp preferred)
              </label>
              <input
                id={`${uid}-phone`}
                className={f.input}
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={contact.phone}
                aria-invalid={contactErrors.phone ? "true" : "false"}
                onChange={(event) => updateContact("phone", event.target.value)}
              />
              {contactErrors.phone ? (
                <p role="alert" className={f.error}>
                  {contactErrors.phone}
                </p>
              ) : null}
            </div>

            <div className={f.field}>
              <label className={f.label} htmlFor={`${uid}-email`}>
                Email (optional)
              </label>
              <input
                id={`${uid}-email`}
                className={f.input}
                type="email"
                autoComplete="email"
                maxLength={254}
                value={contact.email}
                aria-invalid={contactErrors.email ? "true" : "false"}
                onChange={(event) => updateContact("email", event.target.value)}
              />
              {contactErrors.email ? (
                <p role="alert" className={f.error}>
                  {contactErrors.email}
                </p>
              ) : null}
            </div>

            <div className={f.field}>
              <label className={f.label} htmlFor={`${uid}-slot`}>
                Best time to call (optional)
              </label>
              <select
                id={`${uid}-slot`}
                className={f.select}
                value={contact.callbackSlot}
                onChange={(event) => updateContact("callbackSlot", event.target.value)}
              >
                <option value="">No preference</option>
                {CALLBACK_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Honeypot: hidden from people, filled only by bots. */}
            <div className={s.honeypot} aria-hidden="true">
              <label htmlFor={`${uid}-website`}>Website</label>
              <input
                id={`${uid}-website`}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={contact.website}
                onChange={(event) => updateContact("website", event.target.value)}
              />
            </div>

            {submitError ? (
              <p role="alert" className={f.error}>
                {submitError}
              </p>
            ) : null}

            <button type="submit" className={`${btn.btn} ${btn.primary} ${s.cta}`} disabled={sending}>
              {sending ? "Preparing your quotation…" : "Send & get my quotation"}
            </button>
            <button type="button" className={`${btn.btn} ${btn.secondary} ${s.cta}`} onClick={() => setRequesting(false)}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForexCalculator;
