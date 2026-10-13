// Leads table for /admin (Requirement 43.1, 43.2, 43.6). Rendered on the
// server; only the per-row StatusSelect is a client component. Read-only apart
// from status: no edit or delete controls.
import { BUSINESS, LEAD_STATUSES } from "@/lib/data";
import { buildWhatsAppUrl } from "@/lib/logic";
import { updateLeadStatus } from "@/app/admin/(protected)/leads-actions";
import StatusSelect from "./StatusSelect";
import t from "@/components/ui/DataTable.module.css";
import s from "./LeadsTable.module.css";

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

export default function LeadsTable({ leads }) {
  return (
    <div className={`${t.wrap} ${s.scroll}`}>
      <table className={`${t.table} ${s.table}`}>
        <caption className="sr-only">Quotation requests, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Created</th>
            <th scope="col">Ticket</th>
            <th scope="col">Name</th>
            <th scope="col">Phone</th>
            <th scope="col">Email</th>
            <th scope="col">Services</th>
            <th scope="col">Destinations</th>
            <th scope="col">Departure</th>
            <th scope="col">Travellers</th>
            <th scope="col">Hotel / meal / budget</th>
            <th scope="col">Slot</th>
            <th scope="col">Deadline</th>
            <th scope="col">Notes</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const wa = whatsAppNumber(lead.phone);
            const waText = `Hello ${lead.full_name}, this is ${BUSINESS.brandName} about your quotation request ${lead.ticket_id}.`;
            return (
              <tr key={lead.id}>
                <td data-label="Created" className={s.nowrap}>{formatIst(lead.created_at)}</td>
                <td data-label="Ticket" className={s.nowrap}>{lead.ticket_id}</td>
                <td data-label="Name">{lead.full_name}</td>
                <td data-label="Phone">
                  <span className={s.links}>
                    <a href={telHref(lead.phone)}>{lead.phone}</a>
                    {wa && (
                      <a href={buildWhatsAppUrl(wa, waText)} target="_blank" rel="noopener noreferrer">
                        WhatsApp<span className="sr-only"> {lead.full_name} (opens in a new tab)</span>
                      </a>
                    )}
                  </span>
                </td>
                <td data-label="Email">
                  {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}
                </td>
                <td data-label="Services">{(lead.services || []).join(", ") || "—"}</td>
                <td data-label="Destinations">{lead.destinations || "—"}</td>
                <td data-label="Departure">
                  {[lead.departure_city, lead.departure_date].filter(Boolean).join(", ") || "—"}
                </td>
                <td data-label="Travellers">{travellers(lead)}</td>
                <td data-label="Hotel / meal / budget">
                  {[lead.hotel_category, lead.meal_plan, lead.budget].filter(Boolean).join(" / ") || "—"}
                </td>
                <td data-label="Slot">{lead.callback_slot || "—"}</td>
                <td data-label="Deadline" className={s.nowrap}>{formatIst(lead.callback_deadline)}</td>
                <td data-label="Notes" className={s.notes}>{lead.notes || "—"}</td>
                <td data-label="Status">
                  <StatusSelect
                    formAction={updateLeadStatus}
                    id={lead.id}
                    value={lead.status}
                    options={LEAD_STATUSES}
                    label={`Status for ${lead.ticket_id}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
