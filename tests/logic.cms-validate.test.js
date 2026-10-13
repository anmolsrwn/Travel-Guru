// Example tests for validatePackage and validateDestination (design 7.18 / 7.19).
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { DESTINATIONS, PACKAGES } from "../lib/data.js";
import { validateDestination, validatePackage } from "../lib/logic.js";
import { destinationArb, destinationArbWith, validPackageArb } from "./arbitraries.js";

const PACKAGE_IDS = PACKAGES.map((p) => p.id);
const bali = () => structuredClone(PACKAGES.find((p) => p.id === "bali-6n7d"));
const kerala = () => structuredClone(DESTINATIONS.find((d) => d.id === "kerala"));

const errorsOf = (pkg) => validatePackage(pkg).errors;

test("all PACKAGES are valid (Req 28.10, 44.4)", () => {
  assert.equal(PACKAGES.length, 9);
  for (const p of PACKAGES) assert.deepEqual(validatePackage(p), { valid: true, errors: {} }, p.id);
});

test("all 14 DESTINATIONS are valid with packageIds = PACKAGES ids (Req 28.10)", () => {
  assert.equal(DESTINATIONS.length, 14);
  for (const d of DESTINATIONS) {
    assert.deepEqual(validateDestination(d, { packageIds: PACKAGE_IDS }), { valid: true, errors: {} }, d.id);
  }
});

test("validatePackage: non-object input gives only a root error and never throws", () => {
  for (const v of [null, undefined, 42, "pkg", [], true]) {
    const r = validatePackage(v);
    assert.equal(r.valid, false);
    assert.deepEqual(Object.keys(r.errors), ["root"]);
  }
  assert.equal(validatePackage({}).valid, false);
  assert.doesNotThrow(() => validatePackage({ tiers: [null, 1], extras: { visa: 3 }, itinerary: "x" }));
  assert.doesNotThrow(() => validatePackage(bali(), null));
});

test("validatePackage: days must equal nights + 1 (error on days)", () => {
  const p = bali();
  p.days = 8;
  assert.deepEqual(Object.keys(errorsOf(p)), ["days"]);
});

test("validatePackage: image host and /assets/ paths", () => {
  const p = bali();
  p.image = "https://evil.example.com/a.jpg";
  assert.ok(errorsOf(p).image);
  p.image = "http://images.unsplash.com/a.jpg";
  assert.ok(errorsOf(p).image);
  p.image = "/assets/bali.jpg";
  assert.equal(validatePackage(p).valid, true);
  p.image = "/assets/../secret";
  assert.ok(errorsOf(p).image);
});

test("validatePackage: hotel nights must sum to package nights (error on tiers[i].hotels)", () => {
  const p = bali();
  p.tiers[1].hotels[0].nights = 2;
  assert.deepEqual(Object.keys(errorsOf(p)), ["tiers[1].hotels"]);
});

test("validatePackage: tier ids unique and known, 2–3 tiers, prices in range", () => {
  const dup = bali();
  dup.tiers[1].id = "deluxe";
  assert.ok(errorsOf(dup)["tiers[1].id"]);

  const unknown = bali();
  unknown.tiers[0].id = "gold";
  assert.ok(errorsOf(unknown)["tiers[0].id"]);

  const one = bali();
  one.tiers = one.tiers.slice(0, 1);
  assert.ok(errorsOf(one).tiers);

  const price = bali();
  price.tiers[0].adultPriceINR = 10_000_001;
  price.tiers[1].childPriceINR = 1.5;
  const e = errorsOf(price);
  assert.ok(e["tiers[0].adultPriceINR"]);
  assert.ok(e["tiers[1].childPriceINR"]);
});

test("validatePackage: region must be listed in categories", () => {
  const p = bali();
  p.categories = ["beach"];
  assert.deepEqual(Object.keys(errorsOf(p)), ["categories"]);
});

test("validatePackage: itinerary numbering and transfer type", () => {
  const p = bali();
  p.itinerary[2].day = 4;
  p.itinerary[3].transferType = "bus";
  const e = errorsOf(p);
  assert.ok(e["itinerary[2].day"]);
  assert.ok(e["itinerary[3].transferType"]);
});

test("validatePackage: forbidden claim in any string, case-insensitive (Req 32.5)", () => {
  const p = bali();
  p.tiers[0].hotels[0].names[0] = "Resort, 100% REFUNDABLE";
  assert.deepEqual(Object.keys(errorsOf(p)), ["tiers[0].hotels[0].names[0]"]);

  const q = bali();
  q.highlights.push("IATA-Style ticketing");
  assert.ok(errorsOf(q)["highlights[3]"]);
});

test("validatePackage: over-long title", () => {
  const p = bali();
  p.title = "x".repeat(121);
  assert.deepEqual(Object.keys(errorsOf(p)), ["title"]);
});

test("validateDestination: packageId membership and other rules", () => {
  const d = kerala();
  assert.equal(validateDestination(d).valid, true);
  assert.deepEqual(Object.keys(validateDestination(d, { packageIds: ["bali-6n7d"] }).errors), ["packageId"]);
  assert.equal(validateDestination({ ...d, packageId: null }, { packageIds: [] }).valid, true);

  const bad = { ...d, id: "Kerala!", region: "asia", image: "https://evil.example.com/x.jpg", tagline: "25% deposit" };
  assert.deepEqual(Object.keys(validateDestination(bad).errors).sort(), ["id", "image", "region", "tagline"]);
});

test("validateDestination: non-object input gives root error and never throws", () => {
  for (const v of [null, 7, "d", []]) {
    assert.deepEqual(Object.keys(validateDestination(v).errors), ["root"]);
  }
  assert.doesNotThrow(() => validateDestination(kerala(), null));
});

test("shared arbitraries generate valid content", () => {
  for (const p of fc.sample(validPackageArb, 50)) {
    assert.deepEqual(validatePackage(p).errors, {}, JSON.stringify(p));
  }
  for (const d of fc.sample(destinationArb, 50)) assert.deepEqual(validateDestination(d).errors, {});
  for (const d of fc.sample(destinationArbWith(PACKAGE_IDS), 50)) {
    assert.deepEqual(validateDestination(d, { packageIds: PACKAGE_IDS }).errors, {});
  }
});
