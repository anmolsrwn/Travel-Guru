// /admin/packages/[id]: package editor (Requirement 44.2). `new` opens an
// empty create form; any other id loads that row (published or not) with the
// Session_Client, or 404s.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin-session";
import { rowToPackage } from "@/lib/content-mapping";
import { NEW_PACKAGE_DATA, NEW_PACKAGE_ID, dataJsonFor } from "@/lib/package-form";
import { PACKAGES } from "@/lib/data";
import PackageForm from "@/components/admin/PackageForm";
import s from "@/components/admin/PackageForm.module.css";

export const dynamic = "force-dynamic";

const EMPTY = {
  id: "",
  title: "",
  region: "international",
  categories: ["international"],
  nights: 1,
  days: 2,
  image: "",
  sortOrder: 0,
  isPublished: false,
  data: JSON.stringify(NEW_PACKAGE_DATA, null, 2),
};

export default async function PackageEditPage({ params, searchParams }) {
  const { id } = await params;
  const { saved } = await searchParams;

  const session = await getAdminSession();
  if (session.status !== "ok") return null; // the layout renders the gate message

  const isCreate = id === NEW_PACKAGE_ID;
  let initial = EMPTY;

  if (!isCreate) {
    const { data: row, error } = await session.supabase.from("packages").select("*").eq("id", id).maybeSingle();
    if (error) {
      return (
        <p className={s.error} role="alert">
          Could not load the package. Try again.
        </p>
      );
    }
    if (!row) notFound();
    const pkg = rowToPackage(row);
    initial = {
      id: row.id,
      title: row.title ?? "",
      region: row.region,
      categories: Array.isArray(row.categories) ? row.categories : [],
      nights: row.nights,
      days: row.days,
      image: row.image ?? "",
      sortOrder: row.sort_order ?? 0,
      isPublished: row.is_published === true,
      data: dataJsonFor(pkg),
    };
  }

  // "Load example" prefill for new packages: the first built-in package, without its id.
  let example = null;
  if (isCreate && PACKAGES.length > 0) {
    const p = PACKAGES[0];
    example = {
      title: p.title,
      region: p.region,
      categories: p.categories,
      nights: p.nights,
      days: p.days,
      image: p.image ?? "",
      data: dataJsonFor(p),
    };
  }

  return (
    <>
      <div className={s.head}>
        <h1 className={s.title}>{isCreate ? "New package" : `Edit ${initial.title || initial.id}`}</h1>
        <Link href="/admin/packages" className={s.link}>
          Back to packages
        </Link>
      </div>
      <PackageForm
        key={isCreate ? NEW_PACKAGE_ID : initial.id}
        isCreate={isCreate}
        initial={initial}
        example={example}
        initialMessage={!isCreate && saved === "1" ? "Saved" : ""}
      />
    </>
  );
}
