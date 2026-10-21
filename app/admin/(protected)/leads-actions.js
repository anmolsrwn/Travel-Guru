"use server";
// Lead status mutation (Requirement 43.2, 43.5, 43.6, 42.4, 42.5).
// Only `leads.status` is ever written; there is deliberately no lead edit or
// delete action. The write uses the Session_Client, so RLS (admin UPDATE of
// `status` only) still applies on top of the runAdminMutation gate.
import { revalidatePath } from "next/cache";
import { LEAD_STATUSES } from "@/lib/data";
import { createSessionClient } from "@/lib/supabase/server";
import { runAdminMutation } from "@/lib/server/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * useActionState-compatible action. Reads `id` and `status` from the form.
 * @param {{ saved?: string } | undefined} _prev
 * @param {FormData} formData
 * @returns {Promise<{ ok: true, status: string } | { ok: false, error: string }>}
 */
export async function updateLeadStatus(_prev, formData) {
  const rawId = formData?.get("id");
  const rawStatus = formData?.get("status");
  const id = typeof rawId === "string" ? rawId : "";
  const status = typeof rawStatus === "string" ? rawStatus : "";

  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, error: "Database not configured" };

  const result = await runAdminMutation({
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return error ? null : (data?.user ?? null);
    },
    async isAdminUser(user) {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.user_id === user.id;
    },
    validate() {
      const errors = {};
      if (!UUID_RE.test(id)) errors.id = "Invalid lead id";
      if (!LEAD_STATUSES.includes(status)) errors.status = "Invalid status";
      return { valid: Object.keys(errors).length === 0, errors };
    },
    async mutate() {
      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id)
        .select("status")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Lead not found");
      return data.status;
    },
  });

  if (!result.ok) {
    if (result.reason === "unauthenticated") return { ok: false, error: "Your session has expired. Sign in again." };
    if (result.reason === "forbidden") return { ok: false, error: "Not authorised" };
    if (result.reason === "invalid") return { ok: false, error: "Invalid status" };
    return { ok: false, error: "Could not update the status. Try again." };
  }

  revalidatePath("/admin");
  return { ok: true, status: result.value };
}

/** Shared admin-gated write of one boolean lead flag (`is_read` or `is_done`). */
async function updateLeadFlag(id, column, value) {
  const leadId = typeof id === "string" ? id : "";
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, error: "Database not configured" };

  const result = await runAdminMutation({
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return error ? null : (data?.user ?? null);
    },
    async isAdminUser(user) {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.user_id === user.id;
    },
    validate() {
      const errors = {};
      if (!UUID_RE.test(leadId)) errors.id = "Invalid lead id";
      if (typeof value !== "boolean") errors.value = "Invalid value";
      return { valid: Object.keys(errors).length === 0, errors };
    },
    async mutate() {
      const { data, error } = await supabase
        .from("leads")
        .update({ [column]: value })
        .eq("id", leadId)
        .select(column)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Lead not found");
      return data[column];
    },
  });

  if (!result.ok) {
    if (result.reason === "unauthenticated") return { ok: false, error: "Your session has expired. Sign in again." };
    if (result.reason === "forbidden") return { ok: false, error: "Not authorised" };
    return { ok: false, error: "Could not update. Try again." };
  }

  // No revalidatePath here: the row updates optimistically, and re-rendering the whole list on every
  // open / tick would add a full round trip. The counts in the header refresh on the next visit.
  return { ok: true, value: result.value };
}

/** Mark a quotation opened (read) or unread: `(id, read)`. */
export async function setLeadRead(id, read) {
  return updateLeadFlag(id, "is_read", read);
}

/** Mark a quotation solved (ticked) or not: `(id, done)`. */
export async function setLeadDone(id, done) {
  return updateLeadFlag(id, "is_done", done);
}

/** Permanently delete a quotation: `(id)`. Admin-gated; RLS needs the 0005 delete policy. */
export async function deleteLead(id) {
  const leadId = typeof id === "string" ? id : "";
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, error: "Database not configured" };

  const result = await runAdminMutation({
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return error ? null : (data?.user ?? null);
    },
    async isAdminUser(user) {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.user_id === user.id;
    },
    validate() {
      const errors = {};
      if (!UUID_RE.test(leadId)) errors.id = "Invalid lead id";
      return { valid: Object.keys(errors).length === 0, errors };
    },
    async mutate() {
      const { data, error } = await supabase.from("leads").delete().eq("id", leadId).select("id");
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== 1) throw new Error("Lead not found");
      return true;
    },
  });

  if (!result.ok) {
    if (result.reason === "unauthenticated") return { ok: false, error: "Your session has expired. Sign in again." };
    if (result.reason === "forbidden") return { ok: false, error: "Not authorised" };
    return { ok: false, error: "Could not delete. Try again." };
  }

  revalidatePath("/admin");
  return { ok: true };
}

/** Permanently delete several quotations: `(ids)`. Returns { ok, deleted: string[] }. */
export async function deleteLeads(ids) {
  const list = Array.isArray(ids) ? [...new Set(ids)] : [];
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, error: "Database not configured" };

  const result = await runAdminMutation({
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return error ? null : (data?.user ?? null);
    },
    async isAdminUser(user) {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.user_id === user.id;
    },
    validate() {
      const errors = {};
      if (list.length === 0 || list.length > 200) errors.ids = "Select between 1 and 200 rows";
      else if (!list.every((id) => typeof id === "string" && UUID_RE.test(id))) errors.ids = "Invalid lead id";
      return { valid: Object.keys(errors).length === 0, errors };
    },
    async mutate() {
      const { data, error } = await supabase.from("leads").delete().in("id", list).select("id");
      if (error) throw error;
      return (data ?? []).map((row) => row.id);
    },
  });

  if (!result.ok) {
    if (result.reason === "unauthenticated") return { ok: false, error: "Your session has expired. Sign in again." };
    if (result.reason === "forbidden") return { ok: false, error: "Not authorised" };
    return { ok: false, error: "Could not delete. Try again." };
  }

  revalidatePath("/admin");
  return { ok: true, deleted: result.value };
}
