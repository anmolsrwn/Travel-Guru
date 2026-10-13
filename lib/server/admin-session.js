// Request-scoped admin gate for Server Components (Requirement 42.3, 42.5).
// Wires the pure checkAdmin() to the Supabase Session_Client so RLS applies:
//   getUser     → supabase.auth.getUser() (validates the token with Supabase Auth)
//   isAdminUser → select the caller's own row from public.admins (RLS policy
//                 admins_select_self lets a user read only their own row)
// Wrapped in React cache() so the admin layout and the page it wraps share one
// check (and one client) per request. Pages MUST still call getAdminSession()
// themselves before reading data: layouts and pages render in parallel, so a
// layout check alone does not stop a page's data fetch.
import "server-only";
import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/server/admin";

/**
 * @returns {Promise<
 *   | { status: "not-configured" }
 *   | { status: "unauthenticated" }
 *   | { status: "forbidden" }
 *   | { status: "ok", user: any, supabase: import("@supabase/supabase-js").SupabaseClient }
 * >}
 */
export const getAdminSession = cache(async function getAdminSession() {
  const supabase = await createSessionClient();
  if (!supabase) return { status: "not-configured" };

  const result = await checkAdmin({
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data?.user ?? null;
    },
    async isAdminUser(user) {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      // Throwing makes checkAdmin fail closed with "forbidden".
      if (error) throw error;
      return data?.user_id === user.id;
    },
  });

  if (!result.ok) return { status: result.reason };
  return { status: "ok", user: result.user, supabase };
});
