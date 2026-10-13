"use server";
// Destination CMS Server Actions (Requirement 44.8, 44.9, 40.2, 42.4).
// Every mutation re-checks the admin server-side through runAdminMutation and
// writes with the Session_Client, so RLS (destinations_admin_all) applies as well.
// Only async functions are exported ('use server' rule).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin-session";
import { runAdminMutation } from "@/lib/server/admin";
import { destinationFieldsFromFormData, readDestinationForm } from "@/lib/destination-form";

const UNIQUE_VIOLATION = "23505";

const MESSAGES = Object.freeze({
  saved: "Saved",
  notConfigured: "Database not configured",
  unauthenticated: "Your session has ended. Sign in again.",
  forbidden: "Not authorised",
  invalid: "Fix the errors below.",
  duplicate: "A destination with this id already exists.",
  notFound: "Destination not found.",
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

function revalidateDestinationPaths(id) {
  revalidatePath("/");
  revalidatePath("/admin/destinations");
  if (id) revalidatePath(`/admin/destinations/${id}`);
}

/**
 * useActionState-compatible save. Creates (insert) when `originalId` is empty,
 * otherwise upserts the existing id. Returns { ok, message, errors }.
 * @param {unknown} _prevState
 * @param {FormData} formData
 */
export async function saveDestination(_prevState, formData) {
  const session = await getAdminSession();
  if (session.status === "not-configured") return { ok: false, message: MESSAGES.notConfigured, errors: {} };

  // Package ids come from the database (Session_Client) and are only read for a verified admin.
  let packageIds = [];
  if (session.status === "ok") {
    const { data, error } = await session.supabase.from("packages").select("id");
    if (error) return { ok: false, message: MESSAGES.failed, errors: {} };
    packageIds = (data ?? []).map((p) => p.id);
  }

  const form = readDestinationForm(destinationFieldsFromFormData(formData), packageIds);

  const result = await runAdminMutation({
    ...adminDeps(session),
    validate: () => form,
    async mutate() {
      const table = session.supabase.from("destinations");
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
  revalidateDestinationPaths(id);
  // A new destination moves to its edit URL so a second save updates instead of inserting again.
  if (form.isCreate) redirect(`/admin/destinations/${encodeURIComponent(id)}?saved=1`);
  return { ok: true, message: MESSAGES.saved, errors: {} };
}

/**
 * Deletes a destination (the client asks for confirmation first). Redirects to
 * the list on success; returns { ok: false, message } otherwise.
 * @param {string} id
 */
export async function deleteDestination(id) {
  const session = await getAdminSession();
  if (session.status === "not-configured") return { ok: false, message: MESSAGES.notConfigured };

  const result = await runAdminMutation({
    ...adminDeps(session),
    validate: () =>
      typeof id === "string" && id.length > 0 && id.length <= 64
        ? { valid: true, errors: {} }
        : { valid: false, errors: { id: "Invalid id" } },
    async mutate() {
      const { data, error } = await session.supabase.from("destinations").delete().eq("id", id).select("id");
      if (error) throw error;
      return Array.isArray(data) ? data.length : 0;
    },
  });

  if (!result.ok) {
    if (result.reason === "invalid") return { ok: false, message: MESSAGES.notFound };
    if (result.reason === "error") return { ok: false, message: MESSAGES.deleteFailed };
    return { ok: false, message: authMessage(result.reason) };
  }
  if (result.value === 0) return { ok: false, message: MESSAGES.notFound };

  revalidateDestinationPaths(null);
  redirect("/admin/destinations");
}
