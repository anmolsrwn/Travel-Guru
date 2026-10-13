// Example tests for lib/server/quote.js (handleQuote).
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleQuote } from "../lib/server/quote.js";
import { createRateLimiter } from "../lib/server/rate-limit.js";
import { isValidTicketId, validateQuoteForm } from "../lib/logic.js";
import { API_LIMITS, RATE_LIMITS } from "../lib/data.js";
import { createFakeDb, stubRandom, recordingLog, fakeLimiter } from "./fakes.js";

// 19:00 UTC on 31 Dec 2025 is 00:30 IST on 1 Jan 2026.
const NOW = new Date("2025-12-31T19:00:00.000Z");
const DEADLINE = "2026-01-01T19:00:00.000Z";

const VALID = {
  services: ["Flights", "Hotels"],
  destinations: "Bali",
  departureDate: "2026-02-10",
  fullName: "  Asha Verma ",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  callbackSlot: "morning",
  adults: 2,
  children: 0,
};

const HEADERS = { host: "example.com", origin: "https://example.com", "content-type": "application/json", "x-forwarded-for": "1.2.3.4" };

function run(overrides = {}) {
  const deps = {
    rawBody: JSON.stringify(VALID),
    headers: HEADERS,
    now: NOW,
    random: stubRandom([42]),
    db: createFakeDb(),
    limiter: fakeLimiter(),
    log: recordingLog(),
    ...overrides,
  };
  return handleQuote(deps).then((res) => ({ res, deps }));
}

test("valid request → 201, one lead with IST-year ticket and 24 h deadline", async () => {
  const { res, deps } = await run();
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { ok: true, ticketId: "QT-2026-0042", callbackDeadline: DEADLINE });
  assert.ok(isValidTicketId(res.body.ticketId));
  assert.equal(deps.db.leads.length, 1);
  const row = deps.db.leads[0];
  assert.equal(row.ticket_id, res.body.ticketId);
  assert.equal(row.callback_deadline, DEADLINE);
  assert.equal(row.full_name, "Asha Verma");
  assert.equal(row.departure_city, "Raipur"); // default applied
  assert.deepEqual(deps.random.calls, [10000]);
});

test("only whitelisted columns are stored; extra keys ignored", async () => {
  const body = { ...VALID, id: "x", ticket_id: "QT-1999-0001", status: "closed", created_at: "2000-01-01", evil: 1 };
  const { res, deps } = await run({ rawBody: JSON.stringify(body) });
  assert.equal(res.status, 201);
  const row = deps.db.leads[0];
  assert.deepEqual(Object.keys(row).sort(), [
    "adults", "budget", "callback_deadline", "callback_slot", "child_ages", "children", "departure_city",
    "departure_date", "destinations", "duration", "email", "full_name", "hotel_category", "meal_plan",
    "notes", "phone", "services", "ticket_id", "trip_type",
  ]);
  assert.notEqual(row.ticket_id, "QT-1999-0001");
  assert.equal("status" in row, false);
});

test("cross-origin → 403 before rate limit and db", async () => {
  const limiter = fakeLimiter();
  const { res, deps } = await run({ headers: { ...HEADERS, origin: "https://evil.test" }, limiter });
  assert.deepEqual([res.status, res.body], [403, { ok: false, error: "forbidden" }]);
  assert.equal(limiter.keys.length, 0);
  assert.equal(deps.db.calls.insertLead.length, 0);
});

test("rate limited → 429 with Retry-After in whole seconds", async () => {
  const { res, deps } = await run({ limiter: fakeLimiter({ allowed: false, retryAfterMs: 61500 }) });
  assert.equal(res.status, 429);
  assert.deepEqual(res.body, { ok: false, error: "rate_limited" });
  assert.equal(res.headers["Retry-After"], "62");
  assert.equal(deps.db.calls.insertLead.length, 0);
});

test("rate limit counts invalid requests too (key quote:<ip>)", async () => {
  const limiter = createRateLimiter(RATE_LIMITS.quote);
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const { res } = await run({ rawBody: "{}", limiter });
    statuses.push(res.status);
  }
  assert.deepEqual(statuses, [400, 400, 400, 400, 400, 429]);
  const fake = fakeLimiter();
  await run({ limiter: fake });
  assert.equal(fake.keys[0].key, "quote:1.2.3.4");
});

test("body errors: 415, 400 bad_json, 413", async () => {
  let { res } = await run({ headers: { ...HEADERS, "content-type": "text/plain" } });
  assert.deepEqual([res.status, res.body], [415, { ok: false, error: "unsupported_media_type" }]);
  ({ res } = await run({ rawBody: "[1,2]" }));
  assert.deepEqual([res.status, res.body], [400, { ok: false, error: "bad_json" }]);
  ({ res } = await run({ rawBody: JSON.stringify({ ...VALID, notes: "x".repeat(API_LIMITS.maxBodyBytes) }) }));
  assert.deepEqual([res.status, res.body], [413, { ok: false, error: "too_large" }]);
});

test("honeypot filled → 201 well-formed ticket, nothing stored", async () => {
  const { res, deps } = await run({ rawBody: JSON.stringify({ ...VALID, website: " spam " }) });
  assert.equal(res.status, 201);
  assert.ok(isValidTicketId(res.body.ticketId));
  assert.equal(res.body.callbackDeadline, DEADLINE);
  assert.equal(deps.db.calls.insertLead.length, 0);
});

test("whitespace-only honeypot is treated as empty", async () => {
  const { res, deps } = await run({ rawBody: JSON.stringify({ ...VALID, website: "   " }) });
  assert.equal(res.status, 201);
  assert.equal(deps.db.leads.length, 1);
});

test("invalid fields → 400 with validator errors, no insert, no echo", async () => {
  const bad = { ...VALID, email: "nope", fullName: 12345, services: [] };
  const { res, deps } = await run({ rawBody: JSON.stringify(bad) });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "validation");
  assert.equal(res.body.ok, false);
  const expected = validateQuoteForm({ ...bad, departureCity: "Raipur" }, "2026-01-01", { mode: "submit" }).errors;
  assert.deepEqual(res.body.errors, expected);
  assert.equal(JSON.stringify(res.body).includes("nope"), false);
  assert.equal(deps.db.calls.insertLead.length, 0);
});

test("today is the IST business date: IST today rejected, IST tomorrow accepted", async () => {
  let { res } = await run({ rawBody: JSON.stringify({ ...VALID, departureDate: "2026-01-01" }) });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.departureDate);
  ({ res } = await run({ rawBody: JSON.stringify({ ...VALID, departureDate: "2026-01-02" }) }));
  assert.equal(res.status, 201);
});

test("db null → 503 unavailable after validation", async () => {
  const { res } = await run({ db: null });
  assert.deepEqual([res.status, res.body], [503, { ok: false, error: "unavailable" }]);
});

test("unique violation retries with a new n and succeeds", async () => {
  const db = createFakeDb({ leadScript: ["unique_violation", "unique_violation"] });
  const { res } = await run({ db, random: stubRandom([1, 2, 3]) });
  assert.equal(res.status, 201);
  assert.equal(res.body.ticketId, "QT-2026-0003");
  assert.equal(db.calls.insertLead.length, 3);
  assert.equal(db.leads.length, 1);
});

test("all attempts collide → 500 after exactly maxIdAttempts inserts", async () => {
  const db = createFakeDb({ leadScript: Array(10).fill("unique_violation") });
  const { res } = await run({ db, random: stubRandom([1, 2, 3, 4, 5, 6]) });
  assert.deepEqual([res.status, res.body], [500, { ok: false, error: "server_error" }]);
  assert.equal(db.calls.insertLead.length, API_LIMITS.maxIdAttempts);
});

test("db error or throw → 500 without retry, logs carry codes only", async () => {
  for (const step of ["error", "throw"]) {
    const db = createFakeDb({ leadScript: [step] });
    const log = recordingLog();
    const { res } = await run({ db, log });
    assert.deepEqual([res.status, res.body], [500, { ok: false, error: "server_error" }]);
    assert.equal(db.calls.insertLead.length, 1);
    const logged = JSON.stringify(log.entries);
    assert.ok(logged.includes('"code":"error"'));
    for (const secret of ["Asha", "asha@example.com", "98765", "secret db detail"]) {
      assert.equal(logged.includes(secret), false);
    }
  }
});
