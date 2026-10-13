// scripts/seed.js pure helpers (Requirement 41.9). No network: main() is not run on import.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedRows, validateSeedContent, SEED_TABLES } from "../scripts/seed.js";
import { PACKAGES, DESTINATIONS } from "../lib/data.js";
import { rowToPackage, rowToDestination } from "../lib/content-mapping.js";
import { validatePackage, validateDestination } from "../lib/logic.js";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED_CATEGORIES = ["international", "domestic", "honeymoon", "family", "beach"];
const REGIONS = ["international", "domestic"];

test("seed content passes validation", () => {
  assert.deepEqual(validateSeedContent(), []);
});

test("validateSeedContent lists the offending ids", () => {
  const broken = { ...PACKAGES[0], id: "Bad Id" };
  const problems = validateSeedContent([broken], []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /package "Bad Id"/);
});

test("buildSeedRows: counts, sort order, published, writes only packages/destinations", () => {
  const { packageRows, destinationRows } = buildSeedRows();
  assert.equal(packageRows.length, PACKAGES.length);
  assert.equal(destinationRows.length, 14);
  packageRows.forEach((r, i) => {
    assert.equal(r.sort_order, i * 10);
    assert.equal(r.is_published, true);
  });
  destinationRows.forEach((r, i) => {
    assert.equal(r.sort_order, i * 10);
    assert.equal(r.is_published, true);
  });
  assert.deepEqual([...SEED_TABLES], ["packages", "destinations"]);
});

test("seed rows round-trip and still validate", () => {
  const { packageRows, destinationRows } = buildSeedRows();
  const packageIds = packageRows.map((r) => r.id);
  for (const row of packageRows) {
    const { valid, errors } = validatePackage(rowToPackage(row));
    assert.ok(valid, `package ${row.id}: ${JSON.stringify(errors)}`);
  }
  for (const row of destinationRows) {
    const { valid, errors } = validateDestination(rowToDestination(row), { packageIds });
    assert.ok(valid, `destination ${row.id}: ${JSON.stringify(errors)}`);
  }
});

test("seed rows satisfy the 0001_init.sql check constraints", () => {
  const { packageRows, destinationRows } = buildSeedRows();
  const packageIds = new Set(packageRows.map((r) => r.id));
  for (const r of packageRows) {
    const at = `package ${r.id}`;
    assert.ok(SLUG.test(r.id) && r.id.length <= 64, `${at}: id`);
    assert.ok(r.title.length >= 2 && r.title.length <= 120, `${at}: title length`);
    assert.ok(REGIONS.includes(r.region), `${at}: region`);
    assert.ok(r.categories.every((c) => ALLOWED_CATEGORIES.includes(c)), `${at}: categories`);
    assert.ok(r.categories.includes(r.region), `${at}: region in categories`);
    assert.ok(Number.isInteger(r.nights) && r.nights >= 1 && r.nights <= 60, `${at}: nights`);
    assert.equal(r.days, r.nights + 1, `${at}: days`);
    assert.ok(r.image.length >= 1 && r.image.length <= 500, `${at}: image length`);
    assert.ok(r.data && typeof r.data === "object" && !Array.isArray(r.data), `${at}: data`);
    for (const t of r.data.tiers ?? []) {
      assert.ok(["deluxe", "superior", "premium"].includes(t.id), `${at}: tier ${t.id}`);
    }
  }
  for (const r of destinationRows) {
    const at = `destination ${r.id}`;
    assert.ok(SLUG.test(r.id) && r.id.length <= 64, `${at}: id`);
    assert.ok(r.name.length >= 1 && r.name.length <= 80, `${at}: name length`);
    assert.ok(r.tagline.length >= 1 && r.tagline.length <= 120, `${at}: tagline length`);
    assert.ok(REGIONS.includes(r.region), `${at}: region`);
    assert.ok(r.image.length >= 1 && r.image.length <= 500, `${at}: image length`);
    assert.ok(r.package_id === null || packageIds.has(r.package_id), `${at}: package_id`);
  }
  assert.equal(PACKAGES.length + DESTINATIONS.length, 23);
});
