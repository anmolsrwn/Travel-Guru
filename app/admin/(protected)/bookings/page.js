// /admin/bookings: Booking_Requests newest first, 50 per page (Requirement 43.3, 43.4).
// Only `status` can be changed (via BookingStatusSelect → bookings/actions.js updateBookingStatus); no edits or
// deletes of any other field (Requirement 43.6).
import Link from "next/link";
import { getAdminSession } from "@/lib/server/admin-session";
import BookingsTable from "@/components/admin/BookingsTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

const PAGE_SIZE = 50;

const COLUMNS = [
  "id",
  "booking_ref",
  "created_at",
  "package_id",
  "tier_id",
  "adults",
  "children",
  "travel_date",
  "lead_name",
  "email",
  "phone",
  "land_total_inr",
  "advance_inr",
  "balance_inr",
  "balance_due_date",
  "rule",
  "status",
  // Many-to-one embed through bookings.package_id → packages.id (admins read all packages).
  "packages(title)",
].join(",");

function parsePage(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^[1-9][0-9]{0,5}$/.test(value)) return 1;
  return Number(value);
}

export default async function AdminBookingsPage({ searchParams }) {
  // Re-check here: the layout and this page render in parallel (cached per request).
  const session = await getAdminSession();
  if (session.status !== "ok") return null;

  const page = parsePage((await searchParams)?.page);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await session.supabase
    .from("bookings")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = (data ?? []).map((r) => ({ ...r, package_title: r.packages?.title ?? null }));
  const total = typeof count === "number" ? count : from + rows.length;
  const hasPrev = page > 1;
  const hasNext = from + rows.length < total;

  return (
    <>
      <h1>Bookings</h1>
      {error ? (
        <p role="alert">Could not load bookings. Try again later.</p>
      ) : rows.length === 0 ? (
        <p>{page > 1 ? "No bookings on this page." : "No booking requests yet."}</p>
      ) : (
        <BookingsTable rows={rows} />
      )}
      {(hasPrev || hasNext) && (
        <nav aria-label="Bookings pages">
          {hasPrev && <Link href={`/admin/bookings?page=${page - 1}`}>Previous page</Link>}
          {hasPrev && hasNext && " · "}
          {hasNext && <Link href={`/admin/bookings?page=${page + 1}`}>Next page</Link>}
        </nav>
      )}
    </>
  );
}
