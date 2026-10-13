"use client";

// Booking confirmation voucher (design wireframe "Voucher_Modal", Req 14.9, 14.10, 14.14, 26.4).
// Opened by CheckoutModal via `modal.replace(VoucherModal, {...})` only after a 201 from
// /api/booking. The reference and every amount come from the SERVER response; nothing is
// recomputed here, so a midnight date change still shows the authoritative figures (Req 14.14).
// No card data exists anywhere in this flow and none is shown.
import { BUSINESS } from "@/lib/data";
import { buildWhatsAppUrl, formatPrice } from "@/lib/logic";
import { Modal } from "./Modal";
import { registerModal, useModal } from "./ModalProvider";
import { formatTripDate } from "./quoteSubmit";
import { WhatsAppIcon, openWhatsApp } from "./WhatsAppButton";
import btn from "@/components/ui/Button.module.css";
import s from "./VoucherModal.module.css";

const TITLE_ID = "voucher-modal-title";
const TERMS_HREF = "/#terms-cancellation";

const inr = (amount) => formatPrice(amount, "INR");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * @param {object} props
 * @param {{title: string}} props.pkg package (plain object)
 * @param {{label: string}} props.tier selected tier
 * @param {{bookingRef: string, breakdown: {total: number, advanceRate: number, advance: number,
 *   balance: number, balanceDueDate: string | null, rule: string}}} props.booking server response
 * @param {{leadName: string, email: string, phone: string}} props.guest
 * @param {number} props.adults
 * @param {number} props.children
 * @param {string} props.travelDate YYYY-MM-DD
 */
export function VoucherModal({ pkg, tier, booking, guest, adults, children, travelDate }) {
  const { close } = useModal();
  const { bookingRef, breakdown } = booking;
  const standard = breakdown.rule === "standard";
  const advancePct = Math.round((breakdown.advanceRate ?? 0) * 100);
  const fullPaymentNow = breakdown.balance === 0;

  const travellers = [plural(adults, "adult", "adults")];
  if (children > 0) travellers.push(plural(children, "child", "children"));

  function handleWhatsApp() {
    openWhatsApp(
      buildWhatsAppUrl(
        BUSINESS.whatsapp,
        `Hello ${BUSINESS.brandName}! My booking request reference is ${bookingRef} for ${pkg.title}.`,
      ),
    );
  }

  return (
    <Modal titleId={TITLE_ID} closeLabel="Close booking confirmation" className={s.voucher}>
      <p className={s.received}>
        <span className={s.check} aria-hidden="true">
          ✓
        </span>
        Booking request received
      </p>
      <h2 id={TITLE_ID} className={s.title}>
        Your Booking Voucher
      </h2>

      <div className={s.refBox}>
        <span className={s.refLabel}>Booking reference</span>
        <span className={s.ref}>{bookingRef}</span>
      </div>

      <dl className={s.rows}>
        <div className={s.row}>
          <dt>Status</dt>
          <dd>
            <span className={s.status}>Pending confirmation</span>
          </dd>
        </div>
        <div className={s.row}>
          <dt>Package</dt>
          <dd>{pkg.title}</dd>
        </div>
        <div className={s.row}>
          <dt>Hotel tier</dt>
          <dd>{tier.label}</dd>
        </div>
        <div className={s.row}>
          <dt>Travel date</dt>
          <dd>{formatTripDate(travelDate)}</dd>
        </div>
        <div className={s.row}>
          <dt>Guests</dt>
          <dd>{travellers.join(", ")}</dd>
        </div>
        {guest?.leadName ? (
          <div className={s.row}>
            <dt>Lead guest</dt>
            <dd>
              {guest.leadName}
              {guest.email ? <span className={s.block}>{guest.email}</span> : null}
              {guest.phone ? <span className={s.block}>{guest.phone}</span> : null}
            </dd>
          </div>
        ) : null}
      </dl>

      <dl className={s.amounts} aria-label="Amounts">
        <div className={s.amountRow}>
          <dt>Land package total</dt>
          <dd>{inr(breakdown.total)}</dd>
        </div>
        <div className={`${s.amountRow} ${s.amountStrong}`}>
          <dt>{standard ? `Advance due on confirmation (${advancePct}%)` : "Full payment due on confirmation"}</dt>
          <dd className={s.advance}>{inr(breakdown.advance)}</dd>
        </div>
        <div className={s.amountRow}>
          <dt>Balance</dt>
          <dd>
            {fullPaymentNow ? (
              "Full payment due on confirmation"
            ) : (
              <>
                {inr(breakdown.balance)}
                {breakdown.balanceDueDate ? (
                  <span className={s.block}>due by {formatTripDate(breakdown.balanceDueDate)}</span>
                ) : null}
              </>
            )}
          </dd>
        </div>
      </dl>
      <p className={s.fine}>Flights &amp; visa quoted separately</p>

      <p className={s.notice} role="status">
        <span aria-hidden="true">ⓘ </span>
        <strong>No payment has been taken.</strong> Our consultant will confirm availability and send payment details.
      </p>

      <section className={s.contact} aria-label="Contact your consultant">
        <h3 className={s.contactTitle}>Talk to your consultant</h3>
        <ul className={s.contactList}>
          {BUSINESS.phones.map((phone) => (
            <li key={phone.tel}>
              <a href={`tel:${phone.tel}`} className={s.link}>
                {phone.display}
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${BUSINESS.email}`} className={s.link}>
              {BUSINESS.email}
            </a>
          </li>
        </ul>
        <p className={s.terms}>
          <a href={TERMS_HREF} target="_blank" rel="noopener noreferrer" className={s.link}>
            Terms &amp; Cancellation Policy
          </a>
        </p>
      </section>

      <div className={s.actions}>
        <button type="button" className={`${btn.btn} ${btn.secondary}`} onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className={`${btn.btn} ${btn.whatsapp}`} onClick={handleWhatsApp}>
          <WhatsAppIcon className={btn.icon} />
          Chat on WhatsApp
        </button>
        <button type="button" className={`${btn.btn} ${btn.primary}`} onClick={close}>
          Done
        </button>
      </div>
    </Modal>
  );
}

registerModal("voucher", VoucherModal);

export default VoucherModal;
