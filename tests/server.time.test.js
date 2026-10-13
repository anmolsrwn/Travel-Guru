import { test } from "node:test";
import assert from "node:assert/strict";
import { todayISOInZone } from "../lib/server/time.js";

const IST = "Asia/Kolkata";

test("todayISOInZone: evening UTC rolls over to the next IST day", () => {
  assert.equal(todayISOInZone(new Date("2026-01-15T20:00:00Z"), IST), "2026-01-16");
});

test("todayISOInZone: boundary at 18:30 UTC (IST midnight)", () => {
  assert.equal(todayISOInZone(new Date("2026-01-15T18:29:59.999Z"), IST), "2026-01-15");
  assert.equal(todayISOInZone(new Date("2026-01-15T18:30:00Z"), IST), "2026-01-16");
});

test("todayISOInZone: year rollover and leap day", () => {
  assert.equal(todayISOInZone(new Date("2025-12-31T19:00:00Z"), IST), "2026-01-01");
  assert.equal(todayISOInZone(new Date("2028-02-28T18:30:00Z"), IST), "2028-02-29");
});

test("todayISOInZone: UTC zone returns the UTC date", () => {
  assert.equal(todayISOInZone(new Date("2026-07-04T23:59:59Z"), "UTC"), "2026-07-04");
});
