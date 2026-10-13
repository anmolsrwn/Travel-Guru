import "server-only";
// Database adapters for the route handlers (design 5.6). They translate
// Supabase results into the small contracts the pure handler cores expect and
// never let database error text escape: callers only ever see a code.
import { getServiceClient } from "@/lib/supabase/service";
import { getPublicClient } from "@/lib/supabase/public";
import { rowToPackage } from "@/lib/content-mapping";
import { validatePackage } from "@/lib/logic";

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Maps a Supabase/Postgres error to the adapter result. Only the code is
 * inspected; the message and details are deliberately dropped.
 * @param {{ code?: string } | null | undefined} error
 * @returns {{ ok: true } | { ok: false, code: "unique_violation" | "error" }}
 */
export function toInsertResult(error) {
  if (!error) return { ok: true };
  return { ok: false, code: error.code === UNIQUE_VIOLATION ? "unique_violation" : "error" };
}

/** Inserts one row into `table` with the service client; never throws. */
async function insertRow(client, table, row) {
  try {
    const { error } = await client.from(table).insert(row);
    return toInsertResult(error);
  } catch {
    return { ok: false, code: "error" };
  }
}

/**
 * Lead adapter for handleQuote, or null when the service env vars are missing
 * (the handler then responds 503).
 * @returns {{ insertLead: (row: object) => Promise<{ ok: true } | { ok: false, code: "unique_violation" | "error" }> } | null}
 */
export function getLeadDb() {
  const service = getServiceClient();
  if (!service) return null;
  return {
    insertLead: (row) => insertRow(service, "leads", row),
  };
}

/**
 * Booking adapter for handleBooking, or null when the service env vars (or
 * the anon key used for the published-package read) are missing.
 * @returns {{ getPublishedPackage: (id: string) => Promise<object | null>,
 *             insertBooking: (row: object) => Promise<{ ok: true } | { ok: false, code: "unique_violation" | "error" }> } | null}
 */
export function getBookingDb() {
  const service = getServiceClient();
  if (!service) return null;
  const publicDb = getPublicClient();
  if (!publicDb) return null;

  return {
    /**
     * The published package with this id as a validated Package, or null when
     * it is missing, unpublished or fails validatePackage. A query error
     * throws a detail-free Error (the handler maps a throw to 500).
     */
    async getPublishedPackage(id) {
      if (typeof id !== "string" || id === "") return null;
      const { data, error } = await publicDb.fetchPublishedPackage(id);
      if (error) throw new Error("package_lookup_failed");
      if (!data) return null;
      const pkg = rowToPackage(data);
      return validatePackage(pkg).valid ? pkg : null;
    },
    insertBooking: (row) => insertRow(service, "bookings", row),
  };
}
