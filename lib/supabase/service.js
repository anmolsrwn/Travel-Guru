import "server-only";
// Service role client for the route handlers. Bypasses RLS: never import this
// from a client component, and never pass the key or the client to one, to a
// response body or to a log. This is the only app module that reads the key.
import { createClient } from "@supabase/supabase-js";

/**
 * Returns a service role Supabase client, or null when the server env vars
 * are missing (the route handlers then respond 503 "unavailable").
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
