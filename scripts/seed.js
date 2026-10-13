// Seeds the Supabase `packages` and `destinations` tables from lib/data.js
// (Requirement 41.9, design 6.6). Run with `npm run seed`
// (= node --env-file=.env.local scripts/seed.js). Pass `--force` to overwrite
// rows that already exist (e.g. rows an admin has edited).
//
// Plain Node ESM: no `@/` alias and no `server-only`, so it builds its own
// service role client. The key is never printed. Only `packages` and
// `destinations` are written; `leads`, `bookings` and `admins` are never touched.
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { PACKAGES, DESTINATIONS } from "../lib/data.js";
import { validatePackage, validateDestination } from "../lib/logic.js";
import { packageToRow, destinationToRow } from "../lib/content-mapping.js";

/** The only tables this script ever writes. */
export const SEED_TABLES = Object.freeze(["packages", "destinations"]);

/**
 * Validates every package and destination.
 * @returns {string[]} one line per invalid entry ("package \"id\": path, path"); empty when all valid
 */
export function validateSeedContent(packages = PACKAGES, destinations = DESTINATIONS) {
  const problems = [];
  for (const pkg of packages) {
    const { valid, errors } = validatePackage(pkg);
    if (!valid) problems.push(`package "${pkg?.id}": ${Object.keys(errors).join(", ")}`);
  }
  const packageIds = packages.map((p) => p?.id);
  for (const dest of destinations) {
    const { valid, errors } = validateDestination(dest, { packageIds });
    if (!valid) problems.push(`destination "${dest?.id}": ${Object.keys(errors).join(", ")}`);
  }
  return problems;
}

/**
 * Pure: builds the rows to upsert. Packages get sort_order = index × 10,
 * destinations keep their poster order the same way; all rows are published.
 * @returns {{ packageRows: object[], destinationRows: object[] }}
 */
export function buildSeedRows(packages = PACKAGES, destinations = DESTINATIONS) {
  return {
    packageRows: packages.map((p, i) => packageToRow(p, { sortOrder: i * 10, isPublished: true })),
    destinationRows: destinations.map((d, i) =>
      destinationToRow(d, { sortOrder: i * 10, isPublished: true }),
    ),
  };
}

function fail(message) {
  console.error(`seed: ${message}`);
  process.exit(1);
}

/**
 * Upserts rows into `table`. Without force, existing ids are skipped
 * (ignoreDuplicates), so the returned rows are only the inserted ones.
 * @returns {Promise<{ written: number, skipped: number }>}
 */
async function upsertRows(client, table, rows, force) {
  if (!SEED_TABLES.includes(table)) fail(`refusing to write table ${table}`);
  const { data, error } = await client
    .from(table)
    .upsert(rows, { onConflict: "id", ignoreDuplicates: !force })
    .select("id");
  // Error code only: never the request, the response body or the key.
  if (error) fail(`writing ${table} failed (code ${error.code ?? "unknown"})`);
  const written = Array.isArray(data) ? data.length : 0;
  return { written, skipped: rows.length - written };
}

async function main() {
  const force = process.argv.slice(2).includes("--force");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    fail(
      `missing environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.local.example to .env.local, fill in the values and run `npm run seed`.",
    );
  }

  const problems = validateSeedContent();
  if (problems.length > 0) {
    fail(`lib/data.js content is invalid, nothing was written:\n  ${problems.join("\n  ")}`);
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (force) {
    console.warn(
      "seed: WARNING --force overwrites existing packages and destinations with the lib/data.js content (admin edits are lost).",
    );
  }

  const { packageRows, destinationRows } = buildSeedRows();

  // Packages first: destinations reference them through package_id.
  const pkgResult = await upsertRows(client, "packages", packageRows, force);
  const destResult = await upsertRows(client, "destinations", destinationRows, force);

  const verb = force ? "written" : "inserted";
  console.log(`seed: packages ${verb} ${pkgResult.written}, skipped ${pkgResult.skipped}`);
  console.log(`seed: destinations ${verb} ${destResult.written}, skipped ${destResult.skipped}`);
}

// Run only when executed directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    fail(`unexpected error (${err?.name ?? "Error"})`);
  });
}
