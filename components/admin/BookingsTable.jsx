// Bookings table for /admin/bookings (Requirement 43.3, 43.4, 43.6).
// Server Component: read-only cells plus a BookingStatusSelect per row; status is the
// only editable field. Amounts in INR, created time in IST.
import { formatPrice } from "@/lib/logic";
import { BOOKING_STATUSES } from "@/lib/data";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";
import t from "@/components/ui/DataTable.module.css";
import a from "./AdminPage.module.css";

const IST = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatIst(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${IST.format(d)} IST`;
}

function inr(amount) {
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0
    ? formatPrice(amount, "INR")
    : "—";
}

const TIER_LABELS = { deluxe: "Deluxe", superior: "Superior", premium: "Premium" };
const RULE_LABELS = {
  "within-window": "Full payment (within window)",
  "below-threshold": "Full payment (below threshold)",
  standard: "Advance + balance",
};

/** @param {{ rows: Array<Record<string, any>> }} props */
export default function BookingsTable({ rows }) {
  return (
    <div className={a.card}>
    <div className={`${t.wrap} ${a.scroll}`}>
      <table className={t.table}>
        <caption className="sr-only">Booking requests, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Reference</th>
            <th scope="col">Created</th>
            <th scope="col">Package</th>
            <th scope="col">Tier</th>
            <th scope="col">Adults</th>
            <th scope="col">Children</th>
            <th scope="col">Travel date</th>
            <th scope="col">Lead name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col" className={t.num}>Land total</th>
            <th scope="col" className={t.num}>Advance</th>
            <th scope="col" className={t.num}>Balance</th>
            <th scope="col">Balance due</th>
            <th scope="col">Rule</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td data-label="Reference">{b.booking_ref}</td>
              <td data-label="Created">{formatIst(b.created_at)}</td>
              <td data-label="Package">{b.package_title || b.package_id}</td>
              <td data-label="Tier">{TIER_LABELS[b.tier_id] ?? b.tier_id}</td>
              <td data-label="Adults">{b.adults}</td>
              <td data-label="Children">{b.children}</td>
              <td data-label="Travel date">{b.travel_date}</td>
              <td data-label="Lead name">{b.lead_name}</td>
              <td data-label="Email">
                <a href={`mailto:${b.email}`}>{b.email}</a>
              </td>
              <td data-label="Phone">
                <a href={`tel:${String(b.phone).replace(/[^\d+]/g, "")}`}>{b.phone}</a>
              </td>
              <td data-label="Land total" className={t.num}>{inr(b.land_total_inr)}</td>
              <td data-label="Advance" className={t.num}>{inr(b.advance_inr)}</td>
              <td data-label="Balance" className={t.num}>{inr(b.balance_inr)}</td>
              <td data-label="Balance due">{b.balance_due_date ?? "—"}</td>
              <td data-label="Rule">{RULE_LABELS[b.rule] ?? b.rule}</td>
              <td data-label="Status">
                <BookingStatusSelect
                  id={b.id}
                  value={b.status}
                  options={BOOKING_STATUSES}
                  label={`Status for ${b.booking_ref}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
