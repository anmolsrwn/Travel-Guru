// lib/server/notify.js
// Email notification for new quote requests. Sends over SMTP (nodemailer), configured by env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   (required)
//   QUOTE_NOTIFY_TO                              (recipient; defaults to BUSINESS.email)
//   SMTP_FROM                                    (sender; defaults to SMTP_USER)
// When SMTP is not configured, notifyQuote logs "quote.email_not_configured" and does nothing.
// It never throws: a failed email must not fail the visitor's submission.

import nodemailer from "nodemailer";
import { BUSINESS } from "../data.js";

const SEND_TIMEOUT_MS = 8000;

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Strip CR/LF so user input can never inject mail headers into the subject. */
const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

/** Label/value rows for the email, skipping empty values. */
export function quoteEmailRows(row, ticketId) {
  const f = row.forex_details;
  const rows = [
    ["Ticket ID", ticketId],
    ["Name", row.full_name],
    ["Phone", row.phone],
    ["Email", row.email],
    ["Services", (row.services || []).join(", ")],
    ["From", row.departure_city],
    ["Destinations", row.destinations],
    ["Departure date", row.departure_date],
    ["Duration", row.duration],
    ["Trip type", row.trip_type],
    ["Adults", String(row.adults ?? "")],
    ["Children", String(row.children ?? "")],
    ["Child ages", row.child_ages],
    ["Hotel category", row.hotel_category],
    ["Meal plan", row.meal_plan],
    ["Budget", row.budget],
    ["Call-back slot", row.callback_slot],
    ["Call back by", row.callback_deadline],
    ["Forex", f ? `${f.direction} ${f.amount} ${f.currency}` : ""],
    ["Notes", row.notes],
  ];
  return rows.filter(([, v]) => String(v ?? "").trim() !== "");
}

export function buildQuoteEmail(row, ticketId) {
  const rows = quoteEmailRows(row, ticketId);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html =
    `<h2>New quote request ${escapeHtml(ticketId)}</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(([k, v]) => `<tr><td><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v)}</td></tr>`)
      .join("") +
    `</table>`;
  return {
    subject: oneLine(`New quote ${ticketId} - ${row.full_name} (${(row.services || []).join(", ")})`),
    text,
    html,
  };
}

/**
 * @param {object} row  the lead row stored in the database (toLeadRow output)
 * @param {string} ticketId
 * @param {(event: string, meta?: object) => void} [log]
 */
export async function notifyQuote(row, ticketId, log = () => {}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, QUOTE_NOTIFY_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    log("quote.email_not_configured");
    return;
  }
  try {
    const port = Number(SMTP_PORT) || 465;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS,
    });
    const { subject, text, html } = buildQuoteEmail(row, ticketId);
    const msg = {
      from: SMTP_FROM || SMTP_USER,
      to: QUOTE_NOTIFY_TO || BUSINESS.email,
      subject,
      text,
      html,
    };
    // Let the owner reply straight to the customer when they gave a valid-looking email.
    if (row.email && !/[\r\n]/.test(row.email)) msg.replyTo = row.email;
    await transport.sendMail(msg);
    log("quote.email_sent");
  } catch (err) {
    log("quote.email_failed", { code: err && err.code ? String(err.code) : "unknown" });
  }
}
