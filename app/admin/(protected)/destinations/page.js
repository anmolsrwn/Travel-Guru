// /admin/destinations: every destination row, published or not (Requirement 44.8).
// Read with the Session_Client so RLS (destinations_admin_all) decides visibility.
import Link from "next/link";
import { getAdminSession } from "@/lib/server/admin-session";
import { BUSINESS } from "@/lib/data";
import t from "@/components/ui/DataTable.module.css";
import btn from "@/components/ui/Button.module.css";
import PageHeader from "@/components/admin/PageHeader";
import s from "@/components/admin/AdminPage.module.css";

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
      <PageHeader
        eyebrow="Catalogue"
        title="Destinations"
        subtitle={error || !rows ? undefined : `${rows.length} destination${rows.length === 1 ? "" : "s"}, published or not.`}
      >
        <Link href="/admin/destinations/new" className={`${btn.btn} ${btn.primary} ${btn.sm}`}>
          New destination
        </Link>
      </PageHeader>

      {error ? (
        <p className={s.alert} role="alert">
          Could not load destinations. Try again.
        </p>
      ) : !rows || rows.length === 0 ? (
        <p className={s.empty}>No destinations yet.</p>
      ) : (
        <div className={s.card}>
        <div className={` `}>
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
                  <span className="sr-only">Actions</span>
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
                  <td data-label="Published">
                    <span className={row.is_published ? `${s.pill} ${s.pillOn}` : s.pill}>{row.is_published ? "Published" : "Draft"}</span>
                  </td>
                  <td data-label="Updated">{formatUpdated(row.updated_at)}</td>
                  <td data-label="Actions">
                    <Link href={`/admin/destinations/${encodeURIComponent(row.id)}`} className={s.rowLink}>
                      Edit<span className="sr-only"> {row.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </>
  );
}
