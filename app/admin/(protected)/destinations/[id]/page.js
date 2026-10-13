// /admin/destinations/[id]: destination editor (Requirement 44.8, 44.9). `new`
// opens an empty create form; any other id loads that row (published or not)
// with the Session_Client, or 404s.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin-session";
import { NEW_DESTINATION_ID } from "@/lib/destination-form";
import DestinationForm from "@/components/admin/DestinationForm";
import s from "@/components/admin/PackageForm.module.css";

export const dynamic = "force-dynamic";

const EMPTY = {
  id: "",
  name: "",
  tagline: "",
  region: "international",
  image: "",
  packageId: "",
  sortOrder: 0,
  isPublished: false,
};

export default async function DestinationEditPage({ params, searchParams }) {
  const { id } = await params;
  const { saved } = await searchParams;

  const session = await getAdminSession();
  if (session.status !== "ok") return null; // the layout renders the gate message

  const isCreate = id === NEW_DESTINATION_ID;
  let initial = EMPTY;

  const { data: packages, error: packagesError } = await session.supabase
    .from("packages")
    .select("id, title")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (packagesError) {
    return (
      <p className={s.error} role="alert">
        Could not load the packages. Try again.
      </p>
    );
  }

  if (!isCreate) {
    const { data: row, error } = await session.supabase.from("destinations").select("*").eq("id", id).maybeSingle();
    if (error) {
      return (
        <p className={s.error} role="alert">
          Could not load the destination. Try again.
        </p>
      );
    }
    if (!row) notFound();
    initial = {
      id: row.id,
      name: row.name ?? "",
      tagline: row.tagline ?? "",
      region: row.region,
      image: row.image ?? "",
      packageId: row.package_id ?? "",
      sortOrder: row.sort_order ?? 0,
      isPublished: row.is_published === true,
    };
  }

  return (
    <>
      <div className={s.head}>
        <h1 className={s.title}>{isCreate ? "New destination" : `Edit ${initial.name || initial.id}`}</h1>
        <Link href="/admin/destinations" className={s.link}>
          Back to destinations
        </Link>
      </div>
      <DestinationForm
        key={isCreate ? NEW_DESTINATION_ID : initial.id}
        isCreate={isCreate}
        initial={initial}
        packages={(packages ?? []).map((p) => ({ id: p.id, title: p.title ?? "" }))}
        initialMessage={!isCreate && saved === "1" ? "Saved" : ""}
      />
    </>
  );
}
