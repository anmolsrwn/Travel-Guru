// Bookings table for /admin/bookings (Requirement 43.3, 43.4, 43.6).
// Server Component: read-only cells plus a BookingStatusSelect per row; status is the
// only editable field. Amounts in INR, created time in IST.
import { formatPrice } from "@/lib/logic";
import { BOOKING_STATUSES } from "@/lib/data";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";
import LeadRow from "./LeadRow";
import Detail from "./DetailItem";
import { BulkProvider, SelectAll } from "./BulkSelect";
import { deleteBooking, deleteBookings, setBookingDone, setBookingRead } from "@/app/admin/(protected)/bookings/actions";
import t from "@/components/ui/DataTable.module.css";
import a from "./AdminPage.module.css";
import s from "./LeadsTable.module.css";

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

/** Everything except name, date and package: shown when a row is expanded. */
function BookingDetails({ b }) {
  return (
    <dl className={s.details}>
      <Detail label="Reference">{b.booking_ref}</Detail>
      <Detail label="Tier">{TIER_LABELS[b.tier_id] ?? b.tier_id}</Detail>
      <Detail label="Travel date">{b.travel_date}</Detail>
      <Detail label="Travellers">
        {b.adults} adult{b.adults === 1 ? "" : "s"}
        {b.children ? `, ${b.children} child${b.children === 1 ? "" : "ren"}` : ""}
      </Detail>
      <Detail label="Email">
        <a href={`mailto:${b.email}`}>{b.email}</a>
      </Detail>
      <Detail label="Phone">
        <a href={`tel:${String(b.phone).replace(/[^\d+]/g, "")}`}>{b.phone}</a>
      </Detail>
      <Detail label="Land total">{inr(b.land_total_inr)}</Detail>
      <Detail label="Advance">{inr(b.advance_inr)}</Detail>
      <Detail label="Balance">{inr(b.balance_inr)}</Detail>
      <Detail label="Balance due">{b.balance_due_date ?? "—"}</Detail>
      <Detail label="Rule">{RULE_LABELS[b.rule] ?? b.rule}</Detail>
      <Detail label="Status" wide>
        <BookingStatusSelect
          id={b.id}
          value={b.status}
          options={BOOKING_STATUSES}
          label={`Status for ${b.booking_ref}`}
        />
      </Detail>
    </dl>
  );
}

/** @param {{ rows: Array<Record<string, any>> }} props */
export default function BookingsTable({ rows }) {
  return (
    <BulkProvider ids={rows.map((b) => b.id)} onDeleteMany={deleteBookings} noun="booking">
    <div className={a.card}>
      <div className={`${t.wrap} ${a.scroll}`}>
        <table className={`${t.table} ${s.table}`}>
          <caption className="sr-only">Booking requests, newest first. Select a row to see its details.</caption>
          <thead>
            <tr>
              <th scope="col"><SelectAll /></th>
              <th scope="col"><span className="sr-only">Done</span></th>
              <th scope="col">Name</th>
              <th scope="col">Date</th>
              <th scope="col">Package</th>
              <th scope="col"><span className="sr-only">Details</span></th>
              <th scope="col"><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <LeadRow
                key={b.id}
                id={b.id}
                name={b.lead_name}
                initialRead={b.is_read !== false}
                initialDone={b.is_done === true}
                onRead={setBookingRead}
                onDone={setBookingDone}
                onDelete={deleteBooking}
                label={`${b.booking_ref} from ${b.lead_name}`}
                detail={<BookingDetails b={b} />}
              >
                <td data-label="Date" className={s.nowrap}>{formatIst(b.created_at)}</td>
                <td data-label="Package">{b.package_title || b.package_id}</td>
              </LeadRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </BulkProvider>
  );
}