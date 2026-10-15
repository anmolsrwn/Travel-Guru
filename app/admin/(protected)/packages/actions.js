"use server";
// Package CMS Server Actions (Requirement 44.5, 44.6, 44.8, 42.4).
// Every mutation re-checks the admin server-side through runAdminMutation and
// writes with the Session_Client, so RLS (packages_admin_all) applies as well.
// Only async functions are exported ('use server' rule).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getVerifiedAdminSession } from "@/lib/server/admin-session";
import { runAdminMutation } from "@/lib/server/admin";
import { fieldsFromFormData, readPackageForm } from "@/lib/package-form";

const FK_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

const MESSAGES = Object.freeze({
  saved: "Saved",
  notConfigured: "Database not configured",
  unauthenticated: "Your session has ended. Sign in again.",
  forbidden: "Not authorised",
  invalid: "Fix the errors below.",
  duplicate: "A package with this id already exists.",
  hasBookings: "This package has bookings. Unpublish it instead.",
  notFound: "Package not found.",
  failed: "Could not save. Try again.",
  deleteFailed: "Could not delete. Try again.",
});

/** runAdminMutation deps bound to this request's admin session. */
function adminDeps(session) {
  return {
    getUser: () => (session.status === "ok" ? session.user : null),
    isAdminUser: () => session.status === "ok",
  };
}

function authMessage(reason) {
  return reason === "unauthenticated" ? MESSAGES.unauthenticated : MESSAGES.forbidden;
}

function revalidatePackagePaths(id) {
  revalidatePath("/");
  revalidatePath("/admin/packages");
  if (id) revalidatePath(`/admin/packages/${id}`);
}

/**
 * useActionState-compatible save. Creates (insert) when `originalId` is empty,
 * otherwise upserts the existing id. Returns { ok, message, errors }.
 * @param {unknown} _prevState
 * @param {FormData} formData
 */
export async function savePackage(_prevState, formData) {
  const session = await getVerifiedAdminSession();
  if (session.status === "not-configured") return { ok: false, message: MESSAGES.notConfigured, errors: {} };

  // Parsing is pure; runAdminMutation checks the admin before looking at the result.
  const form = readPackageForm(fieldsFromFormData(formData));

  const result = await runAdminMutation({
    ...adminDeps(session),
    validate: () => form,
    async mutate() {
      const table = session.supabase.from("packages");
      const { error } = form.isCreate
        ? await table.insert(form.row)
        : await table.upsert(form.row, { onConflict: "id" });
      if (error) throw error;
      return form.row.id;
    },
  });

  if (!result.ok) {
    if (result.reason === "invalid") return { ok: false, message: MESSAGES.invalid, errors: result.errors ?? {} };
    if (result.reason === "error") {
      const duplicate = result.error?.code === UNIQUE_VIOLATION;
      return { ok: false, message: duplicate ? MESSAGES.duplicate : MESSAGES.failed, errors: {} };
    }
    return { ok: false, message: authMessage(result.reason), errors: {} };
  }

  const id = result.value;
  revalidatePackagePaths(id);
  // A new package moves to its edit URL so a second save updates instead of inserting again.
  if (form.isCreate) redirect(`/admin/packages/${encodeURIComponent(id)}?saved=1`);
  return { ok: true, message: MESSAGES.saved, errors: {} };
}

/**
 * Deletes a package (the client asks for confirmation first). A package that
 * bookings reference is kept by the FK `restrict` and reported. Redirects to
 * the list on success; returns { ok: false, message } otherwise.
 * @param {string} id
 */
export async function deletePackage(id) {
  const session = await getVerifiedAdminSession();
  if (session.status === "not-configured") return { ok: false, message: MESSAGES.notConfigured };

  const result = await runAdminMutation({
    ...adminDeps(session),
    validate: () =>
      typeof id === "string" && id.length > 0 && id.length <= 64
        ? { valid: true, errors: {} }
        : { valid: false, errors: { id: "Invalid id" } },
    async mutate() {
      const { data, error } = await session.supabase.from("packages").delete().eq("id", id).select("id");
      if (error) throw error;
      return Array.isArray(data) ? data.length : 0;
    },
  });

  if (!result.ok) {
    if (result.reason === "invalid") return { ok: false, message: MESSAGES.notFound };
    if (result.reason === "error") {
      const hasBookings = result.error?.code === FK_VIOLATION;
      return { ok: false, message: hasBookings ? MESSAGES.hasBookings : MESSAGES.deleteFailed };
    }
    return { ok: false, message: authMessage(result.reason) };
  }
  if (result.value === 0) return { ok: false, message: MESSAGES.notFound };

  revalidatePackagePaths(null);
  redirect("/admin/packages");
}
