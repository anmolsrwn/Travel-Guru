"use client";

// Booking checkout modal (design "Booking checkout modal" wireframe; Req 11.10, 11.11,
// 12.1-12.8, 13.6-13.11, 14.1, 14.2, 14.13, 9.8, 16.5, 26.4, 29.7, 29.8).
// Registered as "checkout": `modal.open("checkout", { pkg }, trigger)` from "Book Now" and
// `modal.replace("checkout", { pkg, tierId })` from the ItineraryModal hand-off.
//
// Two tabs share one form state object, so switching never loses a value (Req 12.7):
//   "whatsapp" (Mode A, "WhatsApp Instant")  summary + "Confirm on WhatsApp"
//   "booking"  (Mode B, "Booking Request")   INR breakdown, guest details, Terms, demo notice
//
// Submit (task 13.8, Req 14.6, 14.7, 14.9, 14.11, 14.12): `submitBooking` inside the component
// runs validateCheckout (inline errors + focus on the first invalid field in FIELD_ORDER, nothing
// sent), then postBooking (bookingSubmit.js). 201 → modal.replace(VoucherModal) with the server
// reference and breakdown; 400 → field errors (and `packageId` above the button); 429 / 5xx /
// network / timeout → `errors.submit` plus "Confirm on WhatsApp instead", every value kept.
// No card number, expiry or CVC field exists anywhere (stack revision); no payment is taken.
import { useId, useRef, useState } from "react";
import { BUSINESS } from "@/lib/data";
import {
  clampCount,
  composeBookingWhatsAppMessage,
  computeBookingBreakdown,
  computeLandTotal,
  formatPrice,
  getTier,
  isDateOnOrAfter,
  minDepartureDate,
  validateCheckout,
} from "@/lib/logic";
import { Modal } from "@/components/client/Modal";
import { registerModal, useModal } from "@/components/client/ModalProvider";
import { Price, useCurrency } from "@/components/client/CurrencyProvider";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import { VoucherModal } from "@/components/client/VoucherModal";
import { BOOKING_SUBMIT_MESSAGES, postBooking } from "@/components/client/bookingSubmit";
import { localTodayISO, useLocalTodayISO } from "@/components/client/localToday";
import btn from "@/components/ui/Button.module.css";
import field from "@/components/ui/Field.module.css";
import seg from "@/components/ui/Segmented.module.css";
import st from "@/components/ui/Stepper.module.css";
import s from "./CheckoutModal.module.css";

const MODES = [
  { id: "whatsapp", label: "WhatsApp Instant" },
  { id: "booking", label: "Booking Request" },
];

const ADULTS_RANGE = [1, 12];
const CHILDREN_RANGE = [0, 8];
const TERMS_HREF = "/#terms-cancellation";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Display order of the Mode B fields (focus order for the first invalid field, task 13.8). */
export const FIELD_ORDER = ["tierId", "adults", "children", "travelDate", "leadName", "email", "phone", "agreeTerms"];

const inr = (amount) => formatPrice(amount, "INR");

/** "2026-02-21" → "21 Feb 2026"; anything else is returned unchanged. */
export function formatISODate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return String(iso ?? "");
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/**
 * The single policy note for a Booking_Breakdown rule (Req 29.7), numbers from the policy.
 * @param {"standard" | "within-window" | "below-threshold"} rule
 */
export function policyNote(rule, policy = BUSINESS.paymentPolicy) {
  if (rule === "standard") {
    return `${Math.round(policy.advanceRate * 100)}% advance, balance ${policy.balanceDueDaysBefore} days before departure`;
  }
  if (rule === "within-window") {
    return `Full payment required: departure is within ${policy.fullPaymentWithinDays} days`;
  }
  return `Full payment required: package is below ${inr(policy.thresholdPerPersonINR)} per person`;
}

/** The nine fields sent to POST /api/booking: ids and inputs only, never a price (Req 14.7). */
export function buildBookingPayload(pkg, form) {
  return {
    packageId: pkg.id,
    tierId: form.tierId,
    adults: form.adults,
    children: form.children,
    travelDate: form.travelDate,
    leadName: form.leadName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    agreeTerms: form.agreeTerms === true,
  };
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className={field.error}>
      {message}
    </p>
  );
}

/** [ − ] n [ + ] with disabled bounds (Req 13.9). */
function CountStepper({ id, label, value, range, onChange, describedBy, invalid }) {
  const [min, max] = range;
  return (
    <div className={st.stepper}>
      <button
        type="button"
        className={st.button}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clampCount(value - 1, min, max))}
      >
        −
      </button>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        className={st.input}
        value={value}
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid ? "true" : undefined}
        onChange={(event) => {
          const n = event.target.valueAsNumber;
          if (!Number.isNaN(n)) onChange(clampCount(n, min, max));
        }}
      />
      <button
        type="button"
        className={st.button}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clampCount(value + 1, min, max))}
      >
        +
      </button>
    </div>
  );
}

/** Label/value rows of the summary box. `children` is the value cell. */
function Row({ label, note, strong, children }) {
  return (
    <div className={`${s.row}${strong ? ` ${s.rowStrong}` : ""}`}>
      <dt>
        {label}
        {note ? <span className={s.rowNote}>{note}</span> : null}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Indicative conversion line, only while the display currency is not INR (Req 9.8, 13.11). */
function IndicativeLine({ total, advance }) {
  const { currency } = useCurrency();
  if (currency === BUSINESS.baseCurrency) return null;
  return (
    <p className={s.indicative}>
      <span aria-hidden="true">≈ </span>
      <Price amountINR={total} /> total
      {advance != null ? (
        <>
          {" / "}
          <Price amountINR={advance} /> advance
        </>
      ) : null}
      , indicative
    </p>
  );
}

/**
 * @param {object} props
 * @param {object} props.pkg Package (plain object)
 * @param {string | null} [props.tierId] initially selected tier; defaults to the cheapest
 */
export function CheckoutModal({ pkg, tierId: initialTierId = null }) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const tabsId = `${uid}-tabs`;
  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;
  const policy = BUSINESS.paymentPolicy;

  const { currency } = useCurrency();
  const today = useLocalTodayISO() ?? localTodayISO(); // visitor-device local date (Req 16.5)
  const minDate = minDepartureDate(today);

  // Mode B is the default (Req 12.1). All field values live in one object (Req 12.7).
  const [mode, setMode] = useState("booking");
  const [form, setForm] = useState(() => ({
    tierId: getTier(pkg, initialTierId).id,
    adults: 2,
    children: 0,
    travelDate: "",
    leadName: "",
    email: "",
    phone: "",
    agreeTerms: false,
  }));
  // Filled by validateCheckout / the 400 response; keys are the form field names plus
  // `packageId` and `submit`. An entry is cleared when its field changes (below).
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // synchronous guard: exactly one request per confirm
  const tabRefs = useRef({});
  const modal = useModal();

  const tier = getTier(pkg, form.tierId);
  const hasChildPrice = tier.childPriceINR != null;
  const selection = { tier, adults: form.adults, children: hasChildPrice ? form.children : 0 };
  const dateValid = isDateOnOrAfter(form.travelDate, minDate);
  const land = computeLandTotal(selection);
  const breakdown = dateValid ? computeBookingBreakdown(selection, form.travelDate, today, policy) : null;
  const shown = breakdown ?? land;
  const isStandard = breakdown?.rule === "standard";
  const advancePct = breakdown ? `${Math.round(breakdown.advanceRate * 100)}%` : null;

  /** Clear the error of each named field (other fields' errors stay, Req 15.20 pattern). */
  function clearErrors(...names) {
    setErrors((prev) => {
      if (!names.some((n) => n in prev)) return prev;
      const next = { ...prev };
      names.forEach((n) => delete next[n]);
      return next;
    });
  }

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearErrors(name);
  }

  function selectTier(id) {
    const next = getTier(pkg, id);
    setForm((prev) => ({ ...prev, tierId: next.id, children: next.childPriceINR == null ? 0 : prev.children }));
    clearErrors("tierId", "children");
  }

  function onTabKeyDown(event) {
    const index = MODES.findIndex((m) => m.id === mode);
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % MODES.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + MODES.length) % MODES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = MODES.length - 1;
    if (next === null) return;
    event.preventDefault();
    setMode(MODES[next].id);
    tabRefs.current[MODES[next].id]?.focus();
  }

  /** Focus the first invalid field in display order (Req 14.6); the tier group focuses its first radio. */
  function focusFirstInvalid(found) {
    for (const name of FIELD_ORDER) {
      if (!found[name]) continue;
      const el = document.getElementById(fieldId(name));
      const target = el?.matches("input, select, textarea, button") ? el : el?.querySelector("input");
      if (target) {
        target.focus();
        return;
      }
    }
  }

  /** validateCheckout → postBooking → voucher / errors (Req 14.6, 14.7, 14.9, 14.11, 14.12). */
  async function submitBooking(data) {
    const { valid, errors: found } = validateCheckout(data, localTodayISO(), pkg);
    if (!valid) {
      setErrors(found);
      focusFirstInvalid(found);
      return;
    }
    setErrors({});
    const outcome = await postBooking(data);
    if (outcome.type === "voucher") {
      modal.replace(VoucherModal, {
        pkg,
        tier: getTier(pkg, data.tierId),
        booking: { bookingRef: outcome.bookingRef, breakdown: outcome.breakdown },
        guest: { leadName: data.leadName, email: data.email, phone: data.phone },
        adults: data.adults,
        children: data.children,
        travelDate: data.travelDate,
      });
    } else if (outcome.type === "errors") {
      setErrors(outcome.errors);
      focusFirstInvalid(outcome.errors);
    } else {
      setErrors({ submit: BOOKING_SUBMIT_MESSAGES[outcome.type] });
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (mode !== "booking" || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await submitBooking(buildBookingPayload(pkg, { ...form, children: selection.children }));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const whatsappMessage = () =>
    composeBookingWhatsAppMessage(
      pkg,
      { tierId: tier.id, travelDate: dateValid ? form.travelDate : undefined, currency },
      shown,
      BUSINESS,
    );

  const describe = (name) => (errors[name] ? errorId(name) : undefined);
  const invalid = (name) => (errors[name] ? "true" : undefined);
  const guestFields = [
    { name: "leadName", label: "Lead guest name", type: "text", autoComplete: "name", maxLength: 80 },
    { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 254 },
    { name: "phone", label: "Phone / WhatsApp", type: "tel", autoComplete: "tel", maxLength: 20 },
  ];

  return (
    <Modal titleId={titleId} closeLabel="Close booking">
      <h2 id={titleId} className={s.title}>
        {`Book: ${pkg.title}`}
      </h2>

      <div role="tablist" aria-label="Booking method" className={s.tabs} onKeyDown={onTabKeyDown}>
        {MODES.map((m) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              ref={(el) => {
                tabRefs.current[m.id] = el;
              }}
              type="button"
              role="tab"
              id={`${tabsId}-${m.id}`}
              aria-selected={selected ? "true" : "false"}
              aria-controls={`${tabsId}-panel`}
              tabIndex={selected ? 0 : -1}
              className={s.tab}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <form
        noValidate
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-${mode}`}
        className={s.panel}
        onSubmit={onSubmit}
      >
        {/* Tier */}
        <div className={field.field}>
          <span id={`${fieldId("tierId")}-label`} className={field.label}>
            Hotel tier
          </span>
          <div
            id={fieldId("tierId")}
            role="radiogroup"
            aria-labelledby={`${fieldId("tierId")}-label`}
            aria-describedby={describe("tierId")}
            className={seg.group}
          >
            {pkg.tiers.map((t) => (
              <label key={t.id} className={seg.option}>
                <input
                  type="radio"
                  name={fieldId("tier")}
                  value={t.id}
                  className={seg.input}
                  checked={t.id === tier.id}
                  onChange={() => selectTier(t.id)}
                />
                <span className={seg.segment}>{t.label}</span>
              </label>
            ))}
          </div>
          <FieldError id={errorId("tierId")} message={errors.tierId} />
          {tier.priceNote ? <p className={field.hint}>{tier.priceNote}</p> : null}
        </div>

        {/* Travellers */}
        <div className={s.pair}>
          <div className={field.field}>
            <label htmlFor={fieldId("adults")} className={field.label}>
              Adults <span className={s.range}>(1–12)</span>
            </label>
            <CountStepper
              id={fieldId("adults")}
              label="adults"
              value={form.adults}
              range={ADULTS_RANGE}
              onChange={(n) => update("adults", n)}
              describedBy={describe("adults")}
              invalid={errors.adults}
            />
            <FieldError id={errorId("adults")} message={errors.adults} />
          </div>

          {hasChildPrice ? (
            <div className={field.field}>
              <label htmlFor={fieldId("children")} className={field.label}>
                Children <span className={s.range}>(0–8)</span>
              </label>
              <CountStepper
                id={fieldId("children")}
                label="children"
                value={form.children}
                range={CHILDREN_RANGE}
                onChange={(n) => update("children", n)}
                describedBy={describe("children")}
                invalid={errors.children}
              />
              <FieldError id={errorId("children")} message={errors.children} />
            </div>
          ) : (
            <p className={s.childNote}>
              Child pricing on request,{" "}
              <WhatsAppButton
                icon={false}
                className={s.inlineLink}
                message={`Hello ${BUSINESS.brandName}! What is the child price for ${pkg.title} (${tier.label} tier)?`}
              >
                ask us on WhatsApp
              </WhatsAppButton>
            </p>
          )}
        </div>

        {/* Travel date */}
        <div className={field.field}>
          <label htmlFor={fieldId("travelDate")} className={field.label}>
            Travel date{mode === "booking" ? <span className={field.required}> *</span> : null}
          </label>
          <input
            id={fieldId("travelDate")}
            name="travelDate"
            type="date"
            className={field.input}
            min={minDate}
            value={form.travelDate}
            aria-describedby={[describe("travelDate"), `${fieldId("travelDate")}-hint`].filter(Boolean).join(" ")}
            aria-invalid={invalid("travelDate")}
            onChange={(event) => update("travelDate", event.target.value)}
          />
          <FieldError id={errorId("travelDate")} message={errors.travelDate} />
          <p id={`${fieldId("travelDate")}-hint`} className={field.hint}>
            {dateValid ? "Advance and balance below follow this date." : "Pick a date to see your advance and balance."}
          </p>
        </div>

        {mode === "whatsapp" ? (
          /* ---------------- Mode A: WhatsApp Instant ---------------- */
          <>
            <section className={s.summary} aria-label="Booking summary">
              <dl className={s.rows}>
                <Row label="Package">{pkg.title}</Row>
                <Row label="Duration">{`${pkg.nights}N/${pkg.days}D`}</Row>
                <Row label="Hotel tier">{tier.label}</Row>
                <Row label="Adults">{land.adults}</Row>
                {land.children > 0 ? <Row label="Children">{land.children}</Row> : null}
                {form.travelDate ? <Row label="Travel date">{formatISODate(form.travelDate)}</Row> : null}
                <Row label="Land package total" strong>
                  {inr(land.total)}
                </Row>
                {breakdown ? (
                  <>
                    <Row label={`Advance due on confirmation (${advancePct})`} strong>
                      <span className={s.advance}>{inr(breakdown.advance)}</span>
                    </Row>
                    <Row label="Balance">
                      {isStandard
                        ? `${inr(breakdown.balance)} due by ${formatISODate(breakdown.balanceDueDate)}`
                        : "Full payment due on confirmation"}
                    </Row>
                  </>
                ) : (
                  <Row label="Advance">Advance as per Travel Guru payment policy</Row>
                )}
              </dl>
              <p className={s.fine}>Flights &amp; visa quoted separately</p>
            </section>
            <IndicativeLine total={land.total} advance={breakdown?.advance ?? null} />
            <div className={s.actions}>
              <WhatsAppButton message={whatsappMessage}>Confirm on WhatsApp</WhatsAppButton>
            </div>
          </>
        ) : (
          /* ---------------- Mode B: Booking Request ---------------- */
          <>
            <section className={s.summary} aria-label="Price breakdown">
              <dl className={s.rows}>
                <Row label={`Adults ${land.adults} × ${inr(tier.adultPriceINR)}`}>{inr(land.adultsSubtotal)}</Row>
                {land.children > 0 ? (
                  <Row label={`Children ${land.children} × ${inr(tier.childPriceINR)}`}>
                    {inr(land.childrenSubtotal)}
                  </Row>
                ) : null}
                <Row label="Land package total" strong>
                  {inr(land.total)}
                </Row>
                {breakdown ? (
                  <>
                    <Row label={`Advance due on confirmation (${advancePct})`} strong>
                      <span className={s.advance}>{inr(breakdown.advance)}</span>
                    </Row>
                    <Row
                      label="Balance"
                      note={isStandard ? `due by ${formatISODate(breakdown.balanceDueDate)}` : null}
                    >
                      {isStandard ? inr(breakdown.balance) : "Full payment due on confirmation"}
                    </Row>
                  </>
                ) : null}
              </dl>
              <p className={s.fine}>Flights &amp; visa quoted separately</p>
            </section>

            {breakdown ? (
              <p className={s.policy}>
                <span aria-hidden="true">ⓘ </span>
                {policyNote(breakdown.rule, policy)}
              </p>
            ) : (
              <p className={s.policy}>
                <span aria-hidden="true">ⓘ </span>
                Advance as per Travel Guru payment policy. Choose a travel date to see the exact amounts.
              </p>
            )}
            <IndicativeLine total={land.total} advance={breakdown?.advance ?? null} />

            {/* Lead guest */}
            <div className={s.guest}>
              {guestFields.map((f) => (
                <div key={f.name} className={field.field}>
                  <label htmlFor={fieldId(f.name)} className={field.label}>
                    {f.label} <span className={field.required}>*</span>
                  </label>
                  <input
                    id={fieldId(f.name)}
                    name={f.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    maxLength={f.maxLength}
                    className={field.input}
                    value={form[f.name]}
                    aria-describedby={describe(f.name)}
                    aria-invalid={invalid(f.name)}
                    onChange={(event) => update(f.name, event.target.value)}
                  />
                  <FieldError id={errorId(f.name)} message={errors[f.name]} />
                </div>
              ))}
            </div>

            {/* Terms (Req 14.13): link opens the cancellation panel in a new tab, modal stays open. */}
            <div className={field.field}>
              <label className={s.agree}>
                <input
                  id={fieldId("agreeTerms")}
                  name="agreeTerms"
                  type="checkbox"
                  className={s.checkbox}
                  checked={form.agreeTerms}
                  aria-describedby={describe("agreeTerms")}
                  aria-invalid={invalid("agreeTerms")}
                  onChange={(event) => update("agreeTerms", event.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <a href={TERMS_HREF} target="_blank" rel="noopener noreferrer" className={s.termsLink}>
                    Terms &amp; Cancellation Policy
                  </a>
                </span>
              </label>
              <FieldError id={errorId("agreeTerms")} message={errors.agreeTerms} />
            </div>

            <p className={s.demo}>
              <span aria-hidden="true">ⓘ </span>
              Demo: no payment is taken. We&apos;ll confirm availability and send payment details.
            </p>

            {/* 400 packageId error and send failures; the failure carries the Mode A WhatsApp fallback (Req 14.12). */}
            <div role="alert" className={s.alert}>
              {errors.packageId ? <p className={field.error}>{errors.packageId}</p> : null}
              {errors.submit ? (
                <>
                  <p className={field.error}>{errors.submit}</p>
                  <WhatsAppButton message={whatsappMessage}>Confirm on WhatsApp instead</WhatsAppButton>
                </>
              ) : null}
            </div>

            <div className={s.submitBlock}>
              <button
                type="submit"
                className={`${btn.btn} ${btn.primary} ${btn.block}`}
                data-action="checkout-submit"
                disabled={submitting}
                aria-busy={submitting ? "true" : undefined}
              >
                {submitting ? "Sending…" : "Confirm Booking Request"}
              </button>
              <p className={s.dueLine}>
                {breakdown
                  ? `${isStandard ? "Advance due on confirmation" : "Full payment due on confirmation"}: ${inr(breakdown.advance)}`
                  : "Choose a travel date to see the advance due."}
              </p>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

registerModal("checkout", CheckoutModal);

export default CheckoutModal;
