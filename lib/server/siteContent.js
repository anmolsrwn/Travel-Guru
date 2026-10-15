// Shared server-side loader for the public pages (home, /trips). Published Supabase rows
// with a static fallback (lib/server/content.js); static `seasons` are merged in because
// DB rows may predate that field.
import { PACKAGES, DESTINATIONS } from "@/lib/data";
import { loadPublicContent } from "@/lib/server/content";
import { getPublicClient } from "@/lib/supabase/public";

// Logs carry only event names, collection names, error codes and record ids (no PII).
function logContent(event, meta) {
  console.warn(event, meta);
}

export async function loadSiteContent() {
  const { packages: rawPackages, destinations } = await loadPublicContent({
    client: getPublicClient(), // null when env vars are missing → static catalogue
    fallback: { packages: PACKAGES, destinations: DESTINATIONS },
    log: logContent,
  });

  const staticSeasonsMap = new Map(PACKAGES.map((p) => [p.id, p.seasons]));
  const packages = rawPackages.map((pkg) =>
    pkg.seasons ? pkg : { ...pkg, seasons: staticSeasonsMap.get(pkg.id) ?? [] },
  );

  return { packages, destinations };
}
