"use server";
// Booking status Server Action (Requirement 43.4, 43.5, 43.6, 42.4).
// Re-checks the admin server-side through runAdminMutation and writes with the
// Session_Client, so RLS (admin UPDATE on `status` only) applies as well.
// Only `status` is ever written. Only async functions are exported ('use server' rule).
import { revalidatePath } from "next/cache";
import { getVerifiedAdminSession } from "@/lib/server/admin-session";
import { runAdminMutation } from "@/lib/server/admin";
import { BOOKING_STATUSES } from "@/lib/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MESSAGES = Object.freeze({
  notConfigured: "Database not configured",
  unauthenticated: "Your session has ended. Sign in again.",
  forbidden: "Not authorised",
  invalid: "Invalid status",
  notFound: "Booking not found",
  failed: "Could not update the status. Try again.",
});

/**
 * useActionState-compatible status update.
 * Reads `id` (uuid) and `status` (one of BOOKING_STATUSES) from the form.
 * Returns { ok: true, status, message } or { ok: false, message }.
 * @param {unknown} _prevState
 * @param {FormData} formData
 */
export async function updateBookingStatus(_prevState, formData) {
  const rawId = formData?.get("id");
  const rawStatus = formData?.get("status");
  const id = typeof rawId === "string" ? rawId : "";
  const status = typeof rawStatus === "string" ? rawStatus : "";

  const session = await getVerifiedAdminSession();
  if (session.status === "not-configured") return { ok: false, message: MESSAGES.notConfigured };

  const result = await runAdminMutation({
    getUser: () => (session.status === "ok" ? session.user : null),
    isAdminUser: () => session.status === "ok",
    validate() {
      const errors = {};
      if (!UUID_RE.test(id)) errors.id = "Invalid booking id";
      if (!BOOKING_STATUSES.includes(status)) errors.status = MESSAGES.invalid;
      return { valid: Object.keys(errors).length === 0, errors };
    },
    async mutate() {
      const { data, error } = await session.supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select("status");
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== 1) throw new Error(MESSAGES.notFound);
      return data[0].status;
    },
  });

  if (!result.ok) {
    if (result.reason === "unauthenticated") return { ok: false, message: MESSAGES.unauthenticated };
    if (result.reason === "forbidden") return { ok: false, message: MESSAGES.forbidden };
    if (result.reason === "invalid") return { ok: false, message: MESSAGES.invalid };
    return { ok: false, message: MESSAGES.failed };
  }

  revalidatePath("/admin/bookings");
  return { ok: true, status: result.value, message: `Saved: ${result.value}` };
}
