// Session client for the admin area and server actions: @supabase/ssr with
// next/headers cookies, so RLS applies to every admin operation. Reading
// cookies makes the calling route dynamic, which the admin area requires.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a per-request Supabase session client, or returns null when either
 * public env var is missing. Never share the returned client across requests.
 *
 * @returns {Promise<import("@supabase/supabase-js").SupabaseClient | null>}
 */
export async function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.js refreshes the session cookies on every /admin request.
        }
      },
    },
  });
}
