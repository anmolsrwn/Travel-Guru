// /admin — Leads (Requirement 43.1, 43.2, 43.6, 42.4, 42.5).
// The (protected) layout renders <main>; this page renders content only and
// re-checks the admin session itself before reading data (layouts and pages
// render in parallel). Reads use the Session_Client, so RLS (admins only) applies.
import Link from "next/link";
import { getAdminSession } from "@/lib/server/admin-session";
import LeadsTable from "@/components/admin/LeadsTable";
import btn from "@/components/ui/Button.module.css";
import PageHeader from "@/components/admin/PageHeader";
import ExportPanel from "@/components/admin/ExportPanel";
import s from "@/components/admin/AdminPage.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const LEAD_COLUMNS =
  "id, ticket_id, created_at, services, departure_city, destinations, departure_date, adults, children, child_ages, hotel_category, meal_plan, budget, full_name, phone, email, callback_slot, callback_deadline, notes, forex_details, status, is_read, is_done";

/** `?page=` → positive integer (default 1). */
function parsePage(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d{1,6}$/.test(value)) return 1;
  const n = Number(value);
  return n >= 1 ? n : 1;
}

export default async function AdminLeadsPage({ searchParams }) {
  const session = await getAdminSession();
  // The layout shows the notice / redirect for these cases; never read data here.
  if (session.status !== "ok") return null;

  const page = parsePage((await searchParams)?.page);
  const from = (page - 1) * PAGE_SIZE;

  // Falls back to the old column list (everything shown as read) until migration 0003 is applied.
  let { data, count, error } = await session.supabase
    .from("leads")
    .select(LEAD_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) {
    const retry = await session.supabase
      .from("leads")
      .select(LEAD_COLUMNS.replace(", is_read, is_done", ""), { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    ({ data, count, error } = retry);
  }

  const { count: unreadCount } = await session.supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  const { count: openCount } = await session.supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("is_done", false);

  const leads = error ? [] : data || [];
  const total = error ? 0 : count ?? leads.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Enquiries"
        title="Quotations"
        subtitle={`Quotation requests, newest first. Times are shown in IST.${error ? "" : ` ${total} total${unreadCount ? `, ${unreadCount} unread` : ""}${openCount ? `, ${openCount} to solve` : ""}.`}`}
      />
      <ExportPanel type="leads" />

      {error ? (
        <p className={s.alert} role="alert">
          Could not load quotations. Try again.
        </p>
      ) : leads.length === 0 ? (
        <p className={s.empty}>{total === 0 ? "No quotations yet." : "No quotations on this page."}</p>
      ) : (
        <LeadsTable leads={leads} />
      )}

      {!error && total > 0 && (
        <nav className={s.pager} aria-label="Quotations pages">
          <p className={s.pagerText}>
            Page {page} of {totalPages} ({total} quotation{total === 1 ? "" : "s"})
          </p>
          <div className={s.pagerLinks}>
            {page > 1 && (
              <Link
                href={page - 1 === 1 ? "/admin" : `/admin?page=${Math.min(page - 1, totalPages)}`}
                className={`${btn.btn} ${btn.secondary} ${btn.sm}`}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin?page=${page + 1}`} className={`${btn.btn} ${btn.secondary} ${btn.sm}`}>
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
