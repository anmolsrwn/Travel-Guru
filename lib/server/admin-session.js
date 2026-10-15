// Request-scoped admin gate for Server Components (Requirement 42.3, 42.5).
// Wires the pure checkAdmin() to the Supabase Session_Client so RLS applies:
//   identity    → see below
//   isAdminUser → select the caller's own row from public.admins (RLS policy
//                 admins_select_self lets a user read only their own row)
// Wrapped in React cache() so the admin layout and the page it wraps share one
// check (and one client) per request. Pages MUST still call getAdminSession()
// themselves before reading data: layouts and pages render in parallel, so a
// layout check alone does not stop a page's data fetch.
//
// Two variants:
//   getAdminSession()         fast, for reads. Identity comes from auth.getClaims(), which verifies
//                             the JWT signature locally (no Auth-server round trip when the project
//                             uses asymmetric signing keys; the library falls back to getUser()
//                             otherwise). RLS still restricts every read to admins.
//   getVerifiedAdminSession() strict, for writes. auth.getUser() asks the Auth server, so a revoked
//                             session is rejected immediately.
import "server-only";
import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/server/admin";

async function isAdminRow(supabase, user) {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  // Throwing makes checkAdmin fail closed with "forbidden".
  if (error) throw error;
  return data?.user_id === user.id;
}

async function buildSession(getUser) {
  const supabase = await createSessionClient();
  if (!supabase) return { status: "not-configured" };

  const result = await checkAdmin({
    getUser: () => getUser(supabase),
    isAdminUser: (user) => isAdminRow(supabase, user),
  });

  if (!result.ok) return { status: result.reason };
  return { status: "ok", user: result.user, supabase };
}

/**
 * @returns {Promise<
 *   | { status: "not-configured" }
 *   | { status: "unauthenticated" }
 *   | { status: "forbidden" }
 *   | { status: "ok", user: any, supabase: import("@supabase/supabase-js").SupabaseClient }
 * >}
 */
export const getAdminSession = cache(() =>
  buildSession(async (supabase) => {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    return { id: data.claims.sub, email: data.claims.email };
  })
);

/** Same result shape as getAdminSession, but the user is confirmed by the Auth server. */
export const getVerifiedAdminSession = cache(() =>
  buildSession(async (supabase) => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user ?? null;
  })
);
