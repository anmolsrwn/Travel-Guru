// Example tests for handleBooking (design 7.22) with a local in-memory fake database.
import { test } from "node:test";
import assert from "node:assert/strict";

import { handleBooking } from "../lib/server/booking.js";
import { createRateLimiter } from "../lib/server/rate-limit.js";
import { computeBookingBreakdown } from "../lib/logic.js";
import { PACKAGES, BUSINESS } from "../lib/data.js";

const NOW = new Date("2026-01-10T06:00:00Z"); // IST business date 2026-01-10
const HOST = "travelgururaipur.com";

/** Local fake db: published packages from Data_Config, scripted insert results. */
function fakeDb({ insertResults = [], packages = PACKAGES } = {}) {
  const inserted = [];
  const lookups = [];
  let calls = 0;
  return {
    inserted,
    lookups,
    get insertCalls() {
      return calls;
    },
    async getPublishedPackage(id) {
      lookups.push(id);
      return packages.find((p) => p.id === id) ?? null;
    },
    async insertBooking(row) {
      const res = insertResults[calls++] ?? { ok: true };
      if (res instanceof Error) throw res;
      if (res.ok) inserted.push(row);
      return res;
    },
  };
}

const validBody = (extra = {}) => ({
  packageId: "bali-6n7d",
  tierId: "deluxe",
  adults: 2,
  children: 1,
  travelDate: "2026-03-14",
  leadName: "  Asha Verma ",
  email: "asha@example.com",
  phone: "+91 90000 00000",
  agreeTerms: true,
  ...extra,
});

function call({ body = validBody(), rawBody, headers = {}, db = fakeDb(), random, limiter, now = NOW } = {}) {
  let seq = 0;
  return handleBooking({
    rawBody: rawBody ?? JSON.stringify(body),
    headers: { "content-type": "application/json", host: HOST, "x-forwarded-for": "203.0.113.7", ...headers },
    now,
    random: random ?? (() => 1000 + seq++), // distinct values per draw
    db,
    limiter: limiter ?? createRateLimiter({ limit: 5, windowMs: 600000 }),
  });
}

test("valid request: 201, server-priced row, forged prices and card keys ignored", async () => {
  const db = fakeDb();
  const res = await call({
    db,
    body: validBody({
      landTotal: 1, total: 1, advance: 1, balance: 0, advanceRate: 1, adultPriceINR: 1, childPriceINR: 1,
      cardNumber: "4111111111111111", expiry: "12/30", cvc: "123", status: "confirmed", booking_ref: "BK-AAAAAA",
    }),
  });
  assert.equal(res.status, 201);
  assert.equal(db.inserted.length, 1);
  const row = db.inserted[0];
  assert.equal(row.land_total_inr, 93000);
  assert.equal(row.advance_inr, 46500);
  assert.equal(row.balance_inr, 46500);
  assert.equal(row.balance_due_date, "2026-02-21");
  assert.equal(row.rule, "standard");
  assert.equal(row.lead_name, "Asha Verma");
  assert.notEqual(row.booking_ref, "BK-AAAAAA");
  assert.deepEqual(Object.keys(row).sort(), [
    "adults", "advance_inr", "balance_due_date", "balance_inr", "booking_ref", "children", "email",
    "land_total_inr", "lead_name", "package_id", "phone", "rule", "tier_id", "travel_date",
  ]);
  const serialized = JSON.stringify({ row, body: res.body });
  assert.ok(!/4111|cvc|card|12\/30/i.test(serialized));

  const tier = PACKAGES[0].tiers.find((t) => t.id === "deluxe");
  const b = computeBookingBreakdown({ tier, adults: 2, children: 1 }, "2026-03-14", "2026-01-10", BUSINESS.paymentPolicy);
  assert.deepEqual(res.body, {
    ok: true,
    bookingRef: row.booking_ref,
    breakdown: {
      total: b.total, advanceRate: b.advanceRate, advance: b.advance,
      balance: b.balance, balanceDueDate: b.balanceDueDate, rule: b.rule,
    },
  });
  assert.match(res.body.bookingRef, /^BK-[A-Z2-9]{6}$/);
});

test("uses the IST business date, not the UTC date", async () => {
  // 2026-02-20T19:00Z is 2026-02-21 00:30 IST: travel 2026-03-14 is exactly 21 days away → standard.
  const db = fakeDb();
  const res = await call({ db, now: new Date("2026-02-20T19:00:00Z") });
  assert.equal(res.status, 201);
  assert.equal(db.inserted[0].rule, "standard");
  // One day later in IST it falls inside the 21-day window → 100% at booking.
  const db2 = fakeDb();
  const res2 = await call({ db: db2, now: new Date("2026-02-21T19:00:00Z") });
  assert.equal(res2.status, 201);
  assert.equal(db2.inserted[0].rule, "within-window");
  assert.equal(db2.inserted[0].advance_inr, 93000);
});

test("cross-origin or malformed Origin → 403 without touching db or limiter", async () => {
  const db = fakeDb();
  const limiter = createRateLimiter({ limit: 1, windowMs: 600000 });
  for (const origin of ["https://evil.example", "not a url"]) {
    const res = await call({ db, limiter, headers: { origin } });
    assert.equal(res.status, 403);
    assert.deepEqual(res.body, { ok: false, error: "forbidden" });
  }
  assert.equal(db.lookups.length, 0);
  assert.equal((await call({ db, limiter, headers: { origin: `https://${HOST}` } })).status, 201);
});

test("rate limit: 6th request → 429 with Retry-After, invalid requests also count", async () => {
  const limiter = createRateLimiter({ limit: 5, windowMs: 600000 });
  for (let i = 0; i < 5; i++) {
    const res = await call({ limiter, rawBody: "{bad" });
    assert.equal(res.status, 400);
  }
  const res = await call({ limiter });
  assert.equal(res.status, 429);
  assert.deepEqual(res.body, { ok: false, error: "rate_limited" });
  assert.equal(res.headers["Retry-After"], "600");
});

test("body parsing errors: 415, 413, 400 bad_json without db access", async () => {
  const db = fakeDb();
  assert.equal((await call({ db, headers: { "content-type": "text/plain" } })).status, 415);
  assert.equal((await call({ db, rawBody: JSON.stringify({ x: "a".repeat(20000) }) })).status, 413);
  const bad = await call({ db, rawBody: "[1,2]" });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { ok: false, error: "bad_json" });
  assert.equal(db.lookups.length, 0);
});

test("db null → 503 unavailable", async () => {
  const res = await call({ db: null });
  assert.equal(res.status, 503);
  assert.deepEqual(res.body, { ok: false, error: "unavailable" });
});

test("unknown or unpublished package → 400 packageId error, nothing inserted", async () => {
  for (const packageId of ["nope", 42, undefined]) {
    const db = fakeDb();
    const res = await call({ db, body: validBody({ packageId }) });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { ok: false, error: "validation", errors: { packageId: "This package is not available" } });
    assert.equal(db.insertCalls, 0);
  }
});

test("invalid checkout fields → 400 with validator errors, nothing inserted", async () => {
  const db = fakeDb();
  const res = await call({
    db,
    body: validBody({ tierId: "gold", adults: 0, travelDate: "2026-01-10", email: 5, agreeTerms: "yes" }),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "validation");
  for (const key of ["tierId", "adults", "travelDate", "email", "agreeTerms"]) assert.ok(res.body.errors[key], key);
  assert.equal(db.insertCalls, 0);
});

test("retries on unique_violation with a new ref, then succeeds", async () => {
  const db = fakeDb({ insertResults: [{ ok: false, code: "unique_violation" }, { ok: false, code: "unique_violation" }] });
  const refs = [];
  const orig = db.insertBooking.bind(db);
  db.insertBooking = async (row) => (refs.push(row.booking_ref), orig(row));
  const res = await call({ db });
  assert.equal(res.status, 201);
  assert.equal(refs.length, 3);
  assert.equal(new Set(refs).size, 3);
  assert.equal(res.body.bookingRef, refs[2]);
});

test("5 collisions → 500 after exactly 5 attempts", async () => {
  const db = fakeDb({ insertResults: Array(6).fill({ ok: false, code: "unique_violation" }) });
  const res = await call({ db });
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { ok: false, error: "server_error" });
  assert.equal(db.insertCalls, 5);
});

test("other db errors or thrown adapter → 500 server_error without details", async () => {
  for (const r of [{ ok: false, code: "error" }, new Error("duplicate key secret detail")]) {
    const db = fakeDb({ insertResults: [r] });
    const res = await call({ db });
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { ok: false, error: "server_error" });
    assert.equal(db.insertCalls, 1);
  }
});
