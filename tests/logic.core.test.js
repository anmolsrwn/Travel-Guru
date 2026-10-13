// Example-based tests for the core logic.js functions (design "Example Usage").
import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../lib/data.js";
import * as L from "../lib/logic.js";

const { BUSINESS, CURRENCIES, PACKAGES, POLICIES } = D;
const pkg = (id) => PACKAGES.find((p) => p.id === id);
const bali = pkg("bali-6n7d");
const dubai = pkg("dubai-4n5d");
const kerala = pkg("kerala-5n6d");

test("convertPrice: rates, half-up rounding, INR identity, unknown code", () => {
  assert.equal(L.convertPrice(39000, "USD", CURRENCIES), 468);
  assert.equal(L.convertPrice(1234.56, "INR"), 1234.56);
  assert.equal(L.convertPrice(0.125, "INR"), 0.13); // half up
  assert.equal(L.convertPrice(1, "GBP"), 0.01); // 0.0095 → 0.01
  assert.throws(() => L.convertPrice(100, "XYZ"), RangeError);
  assert.throws(() => L.convertPrice(100, "toString"), RangeError);
});

test("formatPrice: Indian grouping, symbols, decimals, unknown code", () => {
  assert.equal(L.formatPrice(390000, "INR", CURRENCIES), "₹3,90,000");
  assert.equal(L.formatPrice(L.convertPrice(39000, "USD", CURRENCIES), "USD", CURRENCIES), "$468");
  assert.equal(L.formatPrice(1234.5, "USD", CURRENCIES, 2), "$1,234.50");
  assert.equal(L.formatPrice(1234, "EUR"), "€1.234");
  assert.ok(L.formatPrice(500, "AED").startsWith("AED "));
  assert.throws(() => L.formatPrice(1, "XYZ"), RangeError);
});

test("filterPackages: all copy, tag filtering, region partition, empty", () => {
  const all = L.filterPackages(PACKAGES, "all");
  assert.notEqual(all, PACKAGES);
  assert.deepEqual(all, PACKAGES);
  assert.deepEqual(L.filterPackages(PACKAGES, "domestic").map((p) => p.id), ["kerala-5n6d"]);
  assert.deepEqual(
    L.filterPackages(PACKAGES, "beach").map((p) => p.id),
    ["bali-6n7d", "vietnam-7n8d", "malaysia-6n7d", "phuket-krabi-5n6d", "pattaya-bangkok-5n6d"]
  );
  const intl = L.filterPackages(PACKAGES, "international").length;
  assert.equal(intl + L.filterPackages(PACKAGES, "domestic").length, PACKAGES.length);
  assert.deepEqual(L.filterPackages(PACKAGES, "nope"), []);
});

test("fromPriceINR and getTier with cheapest fallback", () => {
  assert.equal(L.fromPriceINR(bali), 39000);
  assert.equal(L.getTier(bali, "premium").id, "premium");
  assert.equal(L.getTier(dubai, null).id, "deluxe");
  assert.equal(L.getTier(dubai, "missing").adultPriceINR, 36000);
});

test("packageInclusions: override, domestic and international defaults", () => {
  assert.deepEqual(L.packageInclusions(kerala, POLICIES), POLICIES.inclusionsDomestic);
  assert.deepEqual(L.packageInclusions(dubai, POLICIES), POLICIES.inclusions);
  assert.deepEqual(L.packageInclusions({ region: "domestic", inclusions: ["X"] }, POLICIES), ["X"]);
});

test("destinationsByRegion: order preserved, new array, unknown region, input untouched", () => {
  const list = [
    { id: "a", region: "international" },
    { id: "b", region: "domestic" },
    { id: "c", region: "international" },
  ];
  const snapshot = structuredClone(list);
  const intl = L.destinationsByRegion(list, "international");
  assert.deepEqual(intl.map((d) => d.id), ["a", "c"]);
  assert.deepEqual(L.destinationsByRegion(list, "domestic").map((d) => d.id), ["b"]);
  assert.deepEqual(L.destinationsByRegion(list, "mars"), []);
  assert.deepEqual(list, snapshot);
  if (Array.isArray(D.DESTINATIONS)) {
    assert.deepEqual(
      L.destinationsByRegion(D.DESTINATIONS, "international").map((d) => d.name),
      ["Thailand", "Singapore", "Malaysia", "Europe", "Dubai", "Vietnam"]
    );
    assert.equal(L.destinationsByRegion(D.DESTINATIONS, "domestic").length, 8);
  }
});

test("date helpers: rollover, round-trip, strict validation", () => {
  assert.equal(L.minDepartureDate("2026-02-28"), "2026-03-01");
  assert.equal(L.minDepartureDate("2028-02-28"), "2028-02-29");
  assert.equal(L.minDepartureDate("2026-12-31"), "2027-01-01");
  assert.equal(L.addDays("2026-03-14", -21), "2026-02-21");
  assert.equal(L.daysBetween("2026-01-10", "2026-03-14"), 63);
  assert.equal(L.daysBetween("2026-03-14", L.addDays("2026-03-14", -400)), -400);
  assert.equal(L.isDateOnOrAfter("2026-03-01", "2026-03-01"), true);
  assert.equal(L.isDateOnOrAfter("2026-02-28", "2026-03-01"), false);
  for (const bad of ["2026-02-30", "2026-13-01", "26-01-01", "", null, undefined, 20260101]) {
    assert.equal(L.isDateOnOrAfter(bad, "2026-01-01"), false);
  }
  assert.throws(() => L.addDays("2026-02-30", 1), RangeError);
});

test("clampCount: truncation, bounds, non-numeric", () => {
  assert.equal(L.clampCount(3.9, 1, 12), 3);
  assert.equal(L.clampCount(-0.5, 0, 8), 0);
  assert.ok(Object.is(L.clampCount(-0.5, -1, 8), 0));
  assert.equal(L.clampCount(99, 1, 12), 12);
  for (const v of [NaN, Infinity, -Infinity, "5", null, undefined]) assert.equal(L.clampCount(v, 1, 12), 1);
});

test("computeLandTotal: child pricing, clamping, extras ignored", () => {
  const t = L.computeLandTotal({ tier: L.getTier(bali, "deluxe"), adults: 2, children: 1 });
  assert.equal(t.total, 93000);
  assert.equal(t.adultsSubtotal, 78000);
  assert.equal(t.childrenSubtotal, 15000);
  const d = L.computeLandTotal({ tier: L.getTier(dubai, "deluxe"), adults: 20, children: 3 });
  assert.deepEqual([d.adults, d.children, d.total], [12, 0, 432000]);
});

test("computeBookingBreakdown and computeAdvance: three rules", () => {
  const std = L.computeBookingBreakdown(
    { tier: L.getTier(bali, "deluxe"), adults: 2, children: 1 },
    "2026-03-14", "2026-01-10", BUSINESS.paymentPolicy
  );
  assert.deepEqual(
    [std.total, std.advanceRate, std.advance, std.balance, std.balanceDueDate, std.rule, std.daysUntilDeparture],
    [93000, 0.5, 46500, 46500, "2026-02-21", "standard", 63]
  );
  const win = L.computeBookingBreakdown(
    { tier: L.getTier(dubai, "deluxe"), adults: 2, children: 0 },
    "2026-03-14", "2026-03-01", BUSINESS.paymentPolicy
  );
  assert.deepEqual(
    [win.total, win.advanceRate, win.advance, win.balance, win.balanceDueDate, win.rule],
    [72000, 1, 72000, 0, null, "within-window"]
  );
  const below = L.computeAdvance(36000, 18000, "2026-01-10", "2026-06-01");
  assert.deepEqual([below.rule, below.advance, below.balance], ["below-threshold", 36000, 0]);
  // boundaries: exactly 21 days → standard, 20 → full; ₹25,000 → standard, ₹24,999 → full
  assert.equal(L.computeAdvance(50000, 25000, "2026-01-01", "2026-01-22").rule, "standard");
  assert.equal(L.computeAdvance(50000, 25000, "2026-01-01", "2026-01-21").rule, "within-window");
  assert.equal(L.computeAdvance(49998, 24999, "2026-01-01", "2026-06-01").rule, "below-threshold");
  const odd = L.computeAdvance(75001, 75001, "2026-01-01", "2026-06-01");
  assert.deepEqual([odd.advance, odd.balance], [37501, 37500]);
});

test("cancellationCharge: bands, boundaries, invalid input", () => {
  assert.equal(L.cancellationCharge(46), 0.1);
  assert.equal(L.cancellationCharge(45), 0.35);
  assert.equal(L.cancellationCharge(30), 0.5);
  assert.equal(L.cancellationCharge(16), 0.5);
  assert.equal(L.cancellationCharge(15), 0.75);
  assert.equal(L.cancellationCharge(8), 0.75);
  assert.equal(L.cancellationCharge(7), 1);
  assert.equal(L.cancellationCharge(0), 1);
  for (const bad of [-1, 1.5, NaN, "10", null, undefined]) {
    assert.throws(() => L.cancellationCharge(bad), RangeError);
  }
});

test("functions do not mutate inputs", () => {
  const snapshot = structuredClone(PACKAGES);
  L.filterPackages(PACKAGES, "family");
  L.getTier(bali, "x");
  L.packageInclusions(bali, POLICIES).push("mutated");
  L.computeBookingBreakdown({ tier: bali.tiers[0], adults: 2, children: 1 }, "2026-03-14", "2026-01-10");
  assert.deepEqual(PACKAGES, snapshot);
  assert.ok(!POLICIES.inclusions.includes("mutated"));
});
