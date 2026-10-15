"use client";

// Forex quotation ticket: shown after POST /api/forex-quote returns 201. Every figure comes from
// the server response (the quote it computed and stored), never from the browser.
import { useRef, useState } from "react";
import { BUSINESS, CURRENCIES } from "@/lib/data";
import { buildWhatsAppUrl, formatPrice } from "@/lib/logic";
import { Modal } from "./Modal";
import { useModal } from "./ModalProvider";
import { openWhatsApp, WhatsAppIcon } from "./WhatsAppButton";
import { formatDeadline } from "./quoteSubmit";
import btn from "@/components/ui/Button.module.css";
import s from "./TicketModal.module.css";

const TITLE_ID = "forex-ticket-modal-title";

const money = (n) => formatPrice(n, "INR", CURRENCIES, 2);

/** Label/value rows for the quotation. */
export function forexTicketRows(quote, contact) {
  const buy = quote.direction === "buy";
  const rows = [
    ["Service", `Forex: ${buy ? "buy" : "sell"} ${quote.currency}`],
    [buy ? "You receive" : "You sell", formatPrice(quote.foreignAmount, quote.currency, CURRENCIES, 2)],
    ["Rate", `1 ${quote.currency} = ${money(quote.effectiveRate)}`],
    ["INR value", money(quote.inrAmount)],
  ];
  if (quote.serviceFee > 0) rows.push(["Service fee", money(quote.serviceFee)]);
  rows.push([buy ? "Total payable" : "Total receivable", money(quote.totalINR)]);
  rows.push(["Name", contact.fullName], ["Phone", contact.phone]);
  if (contact.email) rows.push(["Email", contact.email]);
  return rows;
}

function whatsappMessage(ticketId, quote) {
  const buy = quote.direction === "buy";
  return [
    `*Ticket ID:* ${ticketId}`,
    "",
    `Hello ${BUSINESS.brandName}! I requested a forex quotation.`,
    `*Service:* Forex, ${buy ? "buy" : "sell"} ${quote.currency}`,
    `*Amount:* ${formatPrice(quote.foreignAmount, quote.currency, CURRENCIES, 2)}`,
    `*${buy ? "Total payable" : "Total receivable"}:* ${money(quote.totalINR)}`,
  ].join("\n");
}

/**
 * @param {object} props
 * @param {string} props.ticketId
 * @param {string} props.callbackDeadline server ISO timestamp
 * @param {object} props.quote server quote summary
 * @param {boolean} props.liveRates whether the quote used live market rates
 * @param {{fullName: string, phone: string, email: string}} props.contact
 * @param {() => void} [props.onDone]
 */
export function ForexTicketModal({ ticketId, callbackDeadline, quote, liveRates, contact, onDone }) {
  const { close } = useModal();
  const idRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const deadlineText = formatDeadline(callbackDeadline);

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(ticketId);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the ticket ID and press Ctrl+C to copy.");
    }
  }

  function handleDone() {
    onDone?.();
    close();
  }

  return (
    <Modal titleId={TITLE_ID} closeLabel="Close quotation">
      <p className={s.received}>
        <span className={s.check} aria-hidden="true">
          ✓
        </span>
        Quotation ready
      </p>
      <h2 id={TITLE_ID} className={s.title}>
        Your Forex Quotation
      </h2>

      <div className={s.ticketBox}>
        <span className="sr-only">Ticket ID: </span>
        <span ref={idRef} className={s.ticketId}>
          {ticketId}
        </span>
      </div>

      <dl className={s.rows}>
        {forexTicketRows(quote, contact).map(([label, value]) => (
          <div key={label} className={s.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className={s.row}>
          <dt>Call back</dt>
          <dd>
            <span className={s.block}>
              Within {BUSINESS.callbackHours} hours to confirm and complete your exchange
              {deadlineText && (
                <>
                  {" "}
                  (by <time dateTime={callbackDeadline}>{deadlineText}</time>)
                </>
              )}
            </span>
          </dd>
        </div>
      </dl>

      <p className={s.note}>
        <span aria-hidden="true">ⓘ</span>{" "}
        {liveRates ? "Based on live market rates." : "Based on indicative rates."} Rates move through the day, so the
        final rate is confirmed when we call you.
      </p>

      <div className={s.actions}>
        <button type="button" className={`${btn.btn} ${btn.secondary}`} onClick={handleCopy}>
          Copy Ticket ID
        </button>
        <button
          type="button"
          className={`${btn.btn} ${btn.whatsapp}`}
          onClick={() => openWhatsApp(buildWhatsAppUrl(BUSINESS.whatsapp, whatsappMessage(ticketId, quote)))}
        >
          <WhatsAppIcon className={btn.icon} />
          Continue on WhatsApp
        </button>
        <button type="button" className={`${btn.btn} ${btn.primary}`} onClick={handleDone}>
          Done
        </button>
      </div>
      <p className={s.copyStatus} role="status" aria-live="polite">
        {copyStatus}
      </p>
    </Modal>
  );
}

export default ForexTicketModal;
