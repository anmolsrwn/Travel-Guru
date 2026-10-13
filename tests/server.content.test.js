// Example tests for lib/server/content.js (loadPublicContent, design 7.20).
// Fake clients only: no network access (Requirement 40.10).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPublicContent } from "../lib/server/content.js";
import { packageToRow, destinationToRow } from "../lib/content-mapping.js";
import { PACKAGES, DESTINATIONS } from "../lib/data.js";

const FALLBACK = { packages: PACKAGES, destinations: DESTINATIONS };
const PKG_ROWS = PACKAGES.map((p, i) => packageToRow(p, { sortOrder: i }));
const DEST_ROWS = DESTINATIONS.map((d, i) => destinationToRow(d, { sortOrder: i }));

function fakeClient({ packages, destinations }) {
  const calls = { packages: 0, destinations: 0 };
  const run = (r) => (typeof r === "function" ? r() : Promise.resolve(r));
  return {
    calls,
    fetchPackages: () => { calls.packages += 1; return run(packages); },
    fetchDestinations: () => { calls.destinations += 1; return run(destinations); },
  };
}

function recorder() {
  const entries = [];
  return { entries, log: (event, meta) => entries.push({ event, meta }) };
}

test("null client returns the static fallback for both lists", async () => {
  const out = await loadPublicContent({ client: null, fallback: FALLBACK });
  assert.equal(out.packages, PACKAGES);
  assert.equal(out.destinations, DESTINATIONS);
  assert.deepEqual(out.source, { packages: "fallback", destinations: "fallback" });
});

test("database rows are mapped back to the Data Models shapes", async () => {
  const client = fakeClient({
    packages: { data: PKG_ROWS, error: null },
    destinations: { data: DEST_ROWS, error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK });
  assert.deepEqual(out.packages, PACKAGES);
  assert.deepEqual(out.destinations, DESTINATIONS);
  assert.deepEqual(out.source, { packages: "database", destinations: "database" });
  assert.deepEqual(client.calls, { packages: 1, destinations: 1 });
});

test("error result falls back for that list only and logs the code without message text", async () => {
  const { entries, log } = recorder();
  const client = fakeClient({
    packages: { data: null, error: { code: "PGRST301", message: "secret detail" } },
    destinations: { data: DEST_ROWS, error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK, log });
  assert.equal(out.packages, PACKAGES);
  assert.deepEqual(out.destinations, DESTINATIONS);
  assert.deepEqual(out.source, { packages: "fallback", destinations: "database" });
  assert.deepEqual(entries, [
    { event: "content.fetch_failed", meta: { collection: "packages", code: "PGRST301" } },
  ]);
  assert.ok(!JSON.stringify(entries).includes("secret detail"));
});

test("a throwing fetcher falls back and never throws", async () => {
  const { entries, log } = recorder();
  const client = fakeClient({
    packages: { data: PKG_ROWS, error: null },
    destinations: () => { throw new TypeError("fetch failed: host x"); },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK, log });
  assert.deepEqual(out.packages, PACKAGES);
  assert.equal(out.source.destinations, "fallback");
  assert.equal(out.destinations.length, DESTINATIONS.length);
  assert.deepEqual(entries, [
    { event: "content.fetch_failed", meta: { collection: "destinations", code: "TypeError" } },
  ]);
});

test("a rejected promise also falls back", async () => {
  const client = fakeClient({
    packages: () => Promise.reject(new Error("timeout")),
    destinations: () => Promise.reject(new Error("timeout")),
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK, log: () => { throw new Error("bad logger"); } });
  assert.deepEqual(out.source, { packages: "fallback", destinations: "fallback" });
  assert.equal(out.packages, PACKAGES);
});

test("invalid rows are dropped and only their ids are logged", async () => {
  const { entries, log } = recorder();
  const badPkg = { ...PKG_ROWS[0], id: "bad-pkg", days: PKG_ROWS[0].nights + 5 };
  const badDest = { ...DEST_ROWS[0], id: "bad-dest", region: "moon" };
  const client = fakeClient({
    packages: { data: [badPkg, ...PKG_ROWS.slice(1)], error: null },
    destinations: { data: [badDest, null, ...DEST_ROWS.slice(1)], error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK, log });
  assert.deepEqual(out.packages.map((p) => p.id), PACKAGES.slice(1).map((p) => p.id));
  assert.deepEqual(out.destinations.map((d) => d.id), DESTINATIONS.slice(1).map((d) => d.id));
  assert.deepEqual(out.source, { packages: "database", destinations: "database" });
  assert.deepEqual(entries, [
    { event: "content.row_dropped", meta: { collection: "packages", id: "bad-pkg" } },
    { event: "content.row_dropped", meta: { collection: "destinations", id: "bad-dest" } },
    { event: "content.row_dropped", meta: { collection: "destinations", id: null } },
  ]);
});

test("empty lists from the database are respected (no fallback)", async () => {
  const client = fakeClient({
    packages: { data: [], error: null },
    destinations: { data: [], error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK });
  assert.deepEqual(out, {
    packages: [],
    destinations: [],
    source: { packages: "database", destinations: "database" },
  });
});

test("dangling packageId values become null", async () => {
  const kept = PKG_ROWS.filter((r) => r.id !== "dubai-4n5d");
  const client = fakeClient({
    packages: { data: kept, error: null },
    destinations: { data: DEST_ROWS, error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK });
  const dubai = out.destinations.find((d) => d.id === "dubai");
  const singapore = out.destinations.find((d) => d.id === "singapore");
  assert.equal(dubai.packageId, null);
  assert.equal(singapore.packageId, "singapore-4n5d");
  // input rows and static data are untouched
  assert.equal(DESTINATIONS.find((d) => d.id === "dubai").packageId, "dubai-4n5d");
  assert.equal(DEST_ROWS.find((r) => r.id === "dubai").package_id, "dubai-4n5d");
});

test("an empty package list nulls every destination packageId", async () => {
  const client = fakeClient({
    packages: { data: [], error: null },
    destinations: { data: DEST_ROWS, error: null },
  });
  const out = await loadPublicContent({ client, fallback: FALLBACK });
  assert.ok(out.destinations.every((d) => d.packageId === null));
});
