// Quotations (leads) table for /admin (Requirement 43.1, 43.2, 43.6). Rendered on the
// server; only the per-row StatusSelect is a client component. Read-only apart
// from status: no edit or delete controls.
import { BUSINESS, CURRENCIES, LEAD_STATUSES } from "@/lib/data";
import { buildWhatsAppUrl, formatPrice } from "@/lib/logic";
import { setLeadDone, setLeadRead, updateLeadStatus } from "@/app/admin/(protected)/leads-actions";
import StatusSelect from "./StatusSelect";
import LeadRow from "./LeadRow";
import Detail from "./DetailItem";
import t from "@/components/ui/DataTable.module.css";
import s from "./LeadsTable.module.css";
import a from "./AdminPage.module.css";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: BUSINESS.timeZone,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** Timestamp shown in IST (BUSINESS.timeZone); "—" for missing/invalid values. */
function formatIst(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : `${dateTime.format(d)} IST`;
}

/** Digits for wa.me; a bare 10-digit number is treated as Indian (+91). */
function whatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits.length >= 8 ? digits : "";
}

function telHref(phone) {
  return `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
}

function travellers(lead) {
  const adults = `${lead.adults} adult${lead.adults === 1 ? "" : "s"}`;
  if (!lead.children) return adults;
  const kids = `${lead.children} child${lead.children === 1 ? "" : "ren"}`;
  return lead.child_ages ? `${adults}, ${kids} (ages ${lead.child_ages})` : `${adults}, ${kids}`;
}

/**
 * "Forex: Buy $1,000.00 USD" line from lead.forex_details; null when there is
 * nothing usable. Tolerates null, missing keys, non-numeric amounts and an
 * unknown direction. The amount is a foreign-currency amount.
 */
function forexSummary(details) {
  if (!details || typeof details !== "object") return null;
  const { direction, currency, amount } = details;
  const dir = direction === "buy" ? "Buy" : direction === "sell" ? "Sell" : "";
  const code = typeof currency === "string" ? currency : "";
  const num = typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null;
  let amountText = "";
  if (num !== null) {
    amountText =
      code && Object.hasOwn(CURRENCIES, code) ? formatPrice(num, code) : String(num);
  }
  const parts = [dir, amountText, code].filter(Boolean);
  return parts.length ? `Forex: ${parts.join(" ")}` : null;
}

/** Everything except name, date and services: shown when a row is expanded. */
function LeadDetails({ lead }) {
  const wa = whatsAppNumber(lead.phone);
  const waText = `Hello ${lead.full_name}, this is ${BUSINESS.brandName} about your quotation request ${lead.ticket_id}.`;
  const forex = forexSummary(lead.forex_details);
  return (
    <dl className={s.details}>
      <Detail label="Ticket">{lead.ticket_id}</Detail>
      <Detail label="Phone">
        <span className={s.links}>
          <a href={telHref(lead.phone)}>{lead.phone}</a>
          {wa && (
            <a href={buildWhatsAppUrl(wa, waText)} target="_blank" rel="noopener noreferrer">
              WhatsApp<span className="sr-only"> {lead.full_name} (opens in a new tab)</span>
            </a>
          )}
        </span>
      </Detail>
      <Detail label="Email">{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</Detail>
      <Detail label="Destinations">{lead.destinations || "—"}</Detail>
      <Detail label="Departure">
        {[lead.departure_city, lead.departure_date].filter(Boolean).join(", ") || "—"}
      </Detail>
      <Detail label="Travellers">{travellers(lead)}</Detail>
      <Detail label="Hotel / meal / budget">
        {[lead.hotel_category, lead.meal_plan, lead.budget].filter(Boolean).join(" / ") || "—"}
      </Detail>
      <Detail label="Call-back slot">{lead.callback_slot || "—"}</Detail>
      <Detail label="Call-back deadline">{formatIst(lead.callback_deadline)}</Detail>
      {forex && <Detail label="Forex">{forex}</Detail>}
      <Detail label="Notes" wide>
        <span className={s.notesText}>{lead.notes || "—"}</span>
      </Detail>
      <Detail label="Status" wide>
        <StatusSelect
          formAction={updateLeadStatus}
          id={lead.id}
          value={lead.status}
          options={LEAD_STATUSES}
          label={`Status for ${lead.ticket_id}`}
        />
      </Detail>
    </dl>
  );
}

export default function LeadsTable({ leads }) {
  return (
    <div className={a.card}>
      <div className={`${t.wrap} ${a.scroll}`}>
        <table className={`${t.table} ${s.table}`}>
          <caption className="sr-only">Quotation requests, newest first. Select a row to see its details.</caption>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Solved</span></th>
              <th scope="col">Name</th>
              <th scope="col">Date</th>
              <th scope="col">Service</th>
              <th scope="col"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const forex = forexSummary(lead.forex_details);
              return (
                <LeadRow
                  key={lead.id}
                  id={lead.id}
                  name={lead.full_name}
                  initialRead={lead.is_read !== false}
                  initialDone={lead.is_done === true}
                  onRead={setLeadRead}
                  onDone={setLeadDone}
                  label={`${lead.ticket_id} from ${lead.full_name}`}
                  detail={<LeadDetails lead={lead} />}
                >
                  <td data-label="Date" className={s.nowrap}>{formatIst(lead.created_at)}</td>
                  <td data-label="Service">
                    {(lead.services || []).length ? (
                      <span className={s.badges}>
                        {lead.services.map((service) => (
                          <span
                            key={service}
                            className={service === "Forex" ? `${s.badge} ${s.badgeForex}` : s.badge}
                          >
                            {service}
                          </span>
                        ))}
                      </span>
                    ) : (
                      "—"
                    )}
                    {forex && <span className={s.forexDetails}>{forex}</span>}
                  </td>
                </LeadRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}