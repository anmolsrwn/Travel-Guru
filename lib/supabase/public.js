// Cookie-less anon client for public reads (ISR-safe: reads no cookies, so
// the page stays statically regenerated). RLS limits anon to published rows;
// the explicit is_published filter keeps the query intent visible.
import { createClient } from "@supabase/supabase-js";

/**
 * Returns the public content adapter, or null when either public env var is
 * missing (the caller then uses the static catalogue without a network call).
 *
 * Each fetcher resolves to the raw Supabase result `{ data, error }` with rows
 * ordered by sort_order then id; mapping and validation happen in
 * lib/server/content.js.
 *
 * `fetchPublishedPackage(id)` resolves to `{ data: row | null, error }` for
 * one published package (used by lib/supabase/db.js for bookings).
 *
 * @returns {{ fetchPackages: () => Promise<{ data: object[] | null, error: object | null }>,
 *             fetchDestinations: () => Promise<{ data: object[] | null, error: object | null }>,
 *             fetchPublishedPackage: (id: string) => Promise<{ data: object | null, error: object | null }> } | null}
 */
export function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const fetchPublished = async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    return { data, error };
  };

  // Single published package row by id (null data when missing/unpublished).
  const fetchPublishedPackage = async (id) => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();
    return { data, error };
  };

  return {
    fetchPackages: () => fetchPublished("packages"),
    fetchDestinations: () => fetchPublished("destinations"),
    fetchPublishedPackage,
  };
}
