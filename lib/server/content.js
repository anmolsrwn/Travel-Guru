// lib/server/content.js
// Content_Source (design 7.20): published packages and destinations from the
// injected public client, with a per-list static fallback. Pure: the client and
// logger are injected; imports nothing from Next.js, React or Supabase.
// Logs carry only event names, collection names, error codes and record ids.

import { rowToPackage, rowToDestination } from "../content-mapping.js";
import { validatePackage, validateDestination } from "../logic.js";

/** Safe error code for logs: a short string code, never message text. */
function errorCode(error) {
  const code = error && typeof error === "object" ? error.code : undefined;
  if (typeof code === "string" && /^[A-Za-z0-9_.-]{1,40}$/.test(code)) return code;
  return "error";
}

/** Safe error name for thrown values (e.g. "TypeError", "AbortError"). */
function errorName(e) {
  const name = e && typeof e === "object" ? e.name : undefined;
  return typeof name === "string" && /^[A-Za-z0-9_]{1,40}$/.test(name) ? name : "Error";
}

/** Record id for logs, or null when the row has no string id. */
function rowId(row) {
  return row && typeof row === "object" && typeof row.id === "string" ? row.id.slice(0, 64) : null;
}

/** Wraps the injected logger so a failing logger never breaks rendering. */
function safeLogger(log) {
  return (event, meta) => {
    try {
      if (typeof log === "function") log(event, meta);
    } catch {
      /* logging must never throw */
    }
  };
}

/**
 * Fetches one collection, maps and validates the rows; falls back to the
 * static list on an error result, a non-array result or a throw.
 * An empty array from the database is respected (no fallback).
 * @returns {Promise<{ list: object[], source: "database" | "fallback" }>}
 */
async function loadList(fetchRows, mapRow, validate, fallbackList, collection, log) {
  const fallback = () => ({ list: Array.isArray(fallbackList) ? fallbackList : [], source: "fallback" });
  try {
    const result = await fetchRows();
    const { data, error } = result && typeof result === "object" ? result : {};
    if (error) {
      log("content.fetch_failed", { collection, code: errorCode(error) });
      return fallback();
    }
    if (!Array.isArray(data)) {
      log("content.fetch_failed", { collection, code: "invalid_data" });
      return fallback();
    }
    const list = [];
    for (const row of data) {
      let item;
      try {
        item = mapRow(row);
      } catch {
        log("content.row_dropped", { collection, id: rowId(row) });
        continue;
      }
      let ok = false;
      try {
        ok = validate(item).valid === true;
      } catch {
        ok = false;
      }
      if (ok) list.push(item);
      else log("content.row_dropped", { collection, id: rowId(row) });
    }
    return { list, source: "database" };
  } catch (e) {
    log("content.fetch_failed", { collection, code: errorName(e) });
    return fallback();
  }
}

/**
 * Returns the public Catalogue (Requirement 40).
 * @param {{
 *   client: { fetchPackages: () => Promise<{ data: object[] | null, error: object | null }>,
 *             fetchDestinations: () => Promise<{ data: object[] | null, error: object | null }> } | null,
 *   fallback: { packages: object[], destinations: object[] },
 *   log?: (event: string, meta: object) => void
 * }} args
 * @returns {Promise<{ packages: object[], destinations: object[],
 *   source: { packages: "database" | "fallback", destinations: "database" | "fallback" } }>}
 */
export async function loadPublicContent({ client, fallback, log = () => {} } = {}) {
  const fb = fallback && typeof fallback === "object" ? fallback : {};
  const fbPackages = Array.isArray(fb.packages) ? fb.packages : [];
  const fbDestinations = Array.isArray(fb.destinations) ? fb.destinations : [];

  // No client (env vars missing): static content, no network call.
  if (!client) {
    return {
      packages: fbPackages,
      destinations: fbDestinations,
      source: { packages: "fallback", destinations: "fallback" },
    };
  }

  const safeLog = safeLogger(log);
  const packages = await loadList(
    () => client.fetchPackages(),
    rowToPackage,
    (p) => validatePackage(p),
    fbPackages,
    "packages",
    safeLog,
  );
  const destinations = await loadList(
    () => client.fetchDestinations(),
    rowToDestination,
    (d) => validateDestination(d, {}),
    fbDestinations,
    "destinations",
    safeLog,
  );

  // Dangling packageId (missing or unpublished package) → null.
  const known = new Set(packages.list.map((p) => p.id));
  return {
    packages: packages.list,
    destinations: destinations.list.map((d) =>
      d && d.packageId && !known.has(d.packageId) ? { ...d, packageId: null } : d,
    ),
    source: { packages: packages.source, destinations: destinations.source },
  };
}
