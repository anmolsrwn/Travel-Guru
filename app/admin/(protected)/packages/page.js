// /admin/packages: every package row, published or not (Requirement 44.1).
// Read with the Session_Client so RLS (packages_admin_all) decides visibility.
import Link from "next/link";
import { getAdminSession } from "@/lib/server/admin-session";
import { rowToPackage } from "@/lib/content-mapping";
import { fromPriceINR, formatPrice } from "@/lib/logic";
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

/** From_Price of a row; "—" when its tiers are unusable. */
function fromPrice(row) {
  try {
    const n = fromPriceINR(rowToPackage(row));
    return Number.isFinite(n) && n > 0 ? formatPrice(n, "INR") : "—";
  } catch {
    return "—";
  }
}

export default async function PackagesPage() {
  const session = await getAdminSession();
  if (session.status !== "ok") return null; // the layout renders the gate message

  const { data: rows, error } = await session.supabase
    .from("packages")
    .select("id, title, region, categories, nights, days, image, data, is_published, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Packages"
        subtitle={error || !rows ? undefined : `${rows.length} package${rows.length === 1 ? "" : "s"}, published or not.`}
      >
        <Link href="/admin/packages/new" className={`${btn.btn} ${btn.primary} ${btn.sm}`}>
          New package
        </Link>
      </PageHeader>

      {error ? (
        <p className={s.alert} role="alert">
          Could not load packages. Try again.
        </p>
      ) : !rows || rows.length === 0 ? (
        <p className={s.empty}>No packages yet.</p>
      ) : (
        <div className={s.card}>
        <div className={` `}>
          <table className={t.table}>
            <caption className={t.caption}>All packages ({rows.length})</caption>
            <thead>
              <tr>
                <th scope="col">Sort</th>
                <th scope="col">Id</th>
                <th scope="col">Title</th>
                <th scope="col">Region</th>
                <th scope="col">Nights / days</th>
                <th scope="col" className={t.num}>From</th>
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
                  <td data-label="Title">{row.title}</td>
                  <td data-label="Region">{row.region}</td>
                  <td data-label="Nights / days">
                    {row.nights}N / {row.days}D
                  </td>
                  <td data-label="From" className={t.num}>
                    {fromPrice(row)}
                  </td>
                  <td data-label="Published">
                    <span className={row.is_published ? `${s.pill} ${s.pillOn}` : s.pill}>{row.is_published ? "Published" : "Draft"}</span>
                  </td>
                  <td data-label="Updated">{formatUpdated(row.updated_at)}</td>
                  <td data-label="Actions">
                    <Link href={`/admin/packages/${encodeURIComponent(row.id)}`} className={s.rowLink}>
                      Edit<span className="sr-only"> {row.title}</span>
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
