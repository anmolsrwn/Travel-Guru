// /admin/destinations: every destination row, published or not (Requirement 44.8).
// Read with the Session_Client so RLS (destinations_admin_all) decides visibility.
import Link from "next/link";
import { getAdminSession } from "@/lib/server/admin-session";
import { BUSINESS } from "@/lib/data";
import t from "@/components/ui/DataTable.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "@/components/admin/PackageForm.module.css";

export const dynamic = "force-dynamic";

const istFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: BUSINESS.timeZone,
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUpdated(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : `${istFormat.format(d)} IST`;
}

export default async function DestinationsPage() {
  const session = await getAdminSession();
  if (session.status !== "ok") return null; // the layout renders the gate message

  const { data: rows, error } = await session.supabase
    .from("destinations")
    .select("id, name, region, package_id, is_published, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return (
    <>
      <div className={s.head}>
        <h1 className={s.title}>Destinations</h1>
        <Link href="/admin/destinations/new" className={`${btn.btn} ${btn.primary} ${btn.sm}`}>
          New destination
        </Link>
      </div>

      {error ? (
        <p className={s.error} role="alert">
          Could not load destinations. Try again.
        </p>
      ) : !rows || rows.length === 0 ? (
        <p className={s.muted}>No destinations yet.</p>
      ) : (
        <div className={`${t.wrap} ${s.scroll}`}>
          <table className={t.table}>
            <caption className={t.caption}>All destinations ({rows.length})</caption>
            <thead>
              <tr>
                <th scope="col">Sort</th>
                <th scope="col">Id</th>
                <th scope="col">Name</th>
                <th scope="col">Region</th>
                <th scope="col">Linked package</th>
                <th scope="col">Published</th>
                <th scope="col">Updated</th>
                <th scope="col">
                  <span className={s.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Sort">{row.sort_order}</td>
                  <td data-label="Id">
                    <code>{row.id}</code>
                  </td>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Region">{row.region}</td>
                  <td data-label="Linked package">{row.package_id ? <code>{row.package_id}</code> : "—"}</td>
                  <td data-label="Published">{row.is_published ? "Yes" : "No"}</td>
                  <td data-label="Updated">{formatUpdated(row.updated_at)}</td>
                  <td data-label="Actions">
                    <Link href={`/admin/destinations/${encodeURIComponent(row.id)}`} className={s.link}>
                      Edit<span className={s.srOnly}> {row.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
