"use client";

// Quotation Ticket modal (design wireframe "Quotation Ticket modal", Req 17.6–17.11,
// 17.13). Opened by QuoteForm only after a 201 from /api/quote with the server's
// ticketId and callbackDeadline; no ticket is generated in the browser (Req 17.12).
import { useRef, useState } from "react";
import { BUSINESS } from "@/lib/data";
import { buildWhatsAppUrl } from "@/lib/logic";
import { Modal } from "./Modal";
import { useModal } from "./ModalProvider";
import { openWhatsApp, WhatsAppIcon } from "./WhatsAppButton";
import { callbackSlotLabel, formatDeadline, ticketSummaryRows, ticketWhatsAppMessage } from "./quoteSubmit";
import btn from "@/components/ui/Button.module.css";
import s from "./TicketModal.module.css";

const TITLE_ID = "ticket-modal-title";

/** Select the text of `el` so the visitor can copy it by hand (Req 17.9). */
function selectText(el) {
  if (!el) return;
  const selection = window.getSelection?.();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * @param {object} props
 * @param {string} props.ticketId server Ticket_ID
 * @param {string} props.callbackDeadline server ISO timestamp
 * @param {object} props.data submitted quotePayload
 * @param {() => void} [props.onDone] called by "Done" before closing (resets the form)
 */
export function TicketModal({ ticketId, callbackDeadline, data, onDone }) {
  const { close } = useModal();
  const idRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  // Only ever rendered in the browser (opened after a fetch), so this is local time.
  const deadlineText = formatDeadline(callbackDeadline);

  const rows = ticketSummaryRows(data);
  const slotLabel = callbackSlotLabel(data?.callbackSlot);

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(ticketId);
      setCopyStatus("Copied");
    } catch {
      selectText(idRef.current);
      setCopyStatus("Ticket ID selected. Press Ctrl+C (or ⌘+C) to copy.");
    }
  }

  function handleWhatsApp() {
    openWhatsApp(buildWhatsAppUrl(BUSINESS.whatsapp, ticketWhatsAppMessage(ticketId, data, BUSINESS)));
  }

  function handleDone() {
    onDone?.();
    close();
  }

  return (
    <Modal titleId={TITLE_ID} closeLabel="Close ticket">
      <p className={s.received}>
        <span className={s.check} aria-hidden="true">
          ✓
        </span>
        Request received
      </p>
      <h2 id={TITLE_ID} className={s.title}>
        Your Quotation Ticket
      </h2>

      <div className={s.ticketBox}>
        <span className="sr-only">Ticket ID: </span>
        <span ref={idRef} className={s.ticketId}>
          {ticketId}
        </span>
      </div>

      <dl className={s.rows}>
        {rows
          .filter((row) => row.label !== "Call-back slot")
          .map((row) => (
            <div key={row.label} className={s.row}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        <div className={s.row}>
          <dt>Call back</dt>
          <dd>
            {slotLabel && <span className={s.block}>{slotLabel}</span>}
            <span className={s.block}>
              Within {BUSINESS.callbackHours} hours, in your preferred window where possible
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
        <span aria-hidden="true">ⓘ</span> Quoted prices are valid for {BUSINESS.quoteValidityHours} hours, subject to
        availability.
      </p>

      <div className={s.actions}>
        <button type="button" className={`${btn.btn} ${btn.secondary}`} onClick={handleCopy}>
          Copy Ticket ID
        </button>
        <button type="button" className={`${btn.btn} ${btn.whatsapp}`} onClick={handleWhatsApp}>
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

export default TicketModal;
