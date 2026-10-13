import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { API_LIMITS } from '../lib/data.js';
import {
  BOOKING_ENDPOINT,
  BOOKING_PAYLOAD_KEYS,
  BOOKING_SUBMIT_MESSAGES,
  bookingOutcome,
  postBooking,
} from '../components/client/bookingSubmit.js';

// Only fakes here: no test ever reaches a real /api/booking or database.
const BREAKDOWN = {
  total: 155000,
  advanceRate: 0.3,
  advance: 46500,
  balance: 108500,
  balanceDueDate: '2026-03-01',
  rule: 'standard',
};
const GOOD_201 = { ok: true, bookingRef: 'BK-7KQ2MX', breakdown: BREAKDOWN };

const PAYLOAD = {
  packageId: 'kerala-classic',
  tierId: 'standard',
  adults: 2,
  children: 1,
  travelDate: '2026-04-10',
  leadName: 'Asha Verma',
  email: 'asha@example.com',
  phone: '+919876543210',
  agreeTerms: true,
};

const fakeResponse = (status, body) => ({
  status,
  json: async () => {
    if (body === undefined) throw new SyntaxError('not json');
    return body;
  },
});

test('bookingOutcome: 201 with server ref and breakdown → voucher (Req 14.9, 14.14)', () => {
  assert.deepEqual(bookingOutcome(201, GOOD_201), {
    type: 'voucher',
    bookingRef: 'BK-7KQ2MX',
    breakdown: BREAKDOWN,
  });
  const full = { ...BREAKDOWN, advance: 155000, balance: 0, balanceDueDate: null, rule: 'within-window', advanceRate: 1 };
  assert.equal(bookingOutcome(201, { bookingRef: 'BK-AAAAAA', breakdown: full }).type, 'voucher');
});

test('bookingOutcome: malformed 201 is a failure (no voucher)', () => {
  assert.equal(bookingOutcome(201, null).type, 'failed');
  assert.equal(bookingOutcome(201, { bookingRef: 'BK-7KQ2MX' }).type, 'failed');
  assert.equal(bookingOutcome(201, { ...GOOD_201, bookingRef: 'bad' }).type, 'failed');
  assert.equal(bookingOutcome(201, { ...GOOD_201, bookingRef: 'BK-0O1IL1' }).type, 'failed');
  assert.equal(bookingOutcome(201, { ...GOOD_201, breakdown: { ...BREAKDOWN, total: '155000' } }).type, 'failed');
  assert.equal(bookingOutcome(201, { ...GOOD_201, breakdown: { ...BREAKDOWN, advance: NaN } }).type, 'failed');
  assert.equal(bookingOutcome(201, { ...GOOD_201, breakdown: { ...BREAKDOWN, balanceDueDate: 'soon' } }).type, 'failed');
});

test('bookingOutcome: 400 errors, 429, others (Req 14.11, 14.12)', () => {
  assert.deepEqual(
    bookingOutcome(400, { error: 'validation', errors: { packageId: 'This package is not available', email: 'Enter a valid email' } }),
    { type: 'errors', errors: { packageId: 'This package is not available', email: 'Enter a valid email' } },
  );
  assert.equal(bookingOutcome(400, { error: 'bad_json' }).type, 'failed');
  assert.equal(bookingOutcome(400, { errors: {} }).type, 'failed');
  assert.equal(bookingOutcome(429, { error: 'rate_limited' }).type, 'rateLimited');
  for (const s of [403, 413, 415, 500, 503]) assert.equal(bookingOutcome(s, { error: 'x' }).type, 'failed');
  assert.match(BOOKING_SUBMIT_MESSAGES.failed, /^We couldn't send your booking request right now/);
  assert.match(BOOKING_SUBMIT_MESSAGES.failed, /confirm on WhatsApp\.$/);
  assert.match(BOOKING_SUBMIT_MESSAGES.rateLimited, /^Too many requests/);
});

test('bookingOutcome never opens a voucher for a non-201 status', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 100, max: 599 }).filter((s) => s !== 201),
      fc.anything(),
      (status, body) => bookingOutcome(status, body).type !== 'voucher',
    ),
  );
});

test('postBooking: one POST of JSON with exactly the nine fields, extras and prices dropped (Req 14.7)', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return fakeResponse(201, GOOD_201);
  };
  const dirty = { ...PAYLOAD, total: 1, advance: 1, balance: 1, cardNumber: '4111111111111111', status: 'confirmed' };
  const outcome = await postBooking(dirty, { fetchImpl });
  assert.equal(outcome.type, 'voucher');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, BOOKING_ENDPOINT);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(Object.keys(sent), BOOKING_PAYLOAD_KEYS);
  assert.deepEqual(sent, PAYLOAD);
  assert.equal(BOOKING_PAYLOAD_KEYS.length, 9);
});

test('postBooking: 400, 429, 500 and non-JSON bodies map to outcomes', async () => {
  const run = (res) => postBooking(PAYLOAD, { fetchImpl: async () => res });
  assert.deepEqual(await run(fakeResponse(400, { errors: { phone: 'Bad phone' } })), {
    type: 'errors',
    errors: { phone: 'Bad phone' },
  });
  assert.equal((await run(fakeResponse(429, { error: 'rate_limited' }))).type, 'rateLimited');
  assert.equal((await run(fakeResponse(500, { error: 'server_error' }))).type, 'failed');
  assert.equal((await run(fakeResponse(503, undefined))).type, 'failed');
  assert.equal((await run(fakeResponse(201, undefined))).type, 'failed');
});

test('postBooking: network error resolves to failed, never throws', async () => {
  const fetchImpl = async () => {
    throw new TypeError('fetch failed');
  };
  assert.deepEqual(await postBooking(PAYLOAD, { fetchImpl }), { type: 'failed' });
});

test('postBooking: aborts after the timeout and resolves to failed', async () => {
  let aborted = false;
  const fetchImpl = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        aborted = true;
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
  const started = Date.now();
  const outcome = await postBooking(PAYLOAD, { fetchImpl, timeoutMs: 20 });
  assert.deepEqual(outcome, { type: 'failed' });
  assert.equal(aborted, true);
  assert.ok(Date.now() - started < 2000);
  assert.equal(API_LIMITS.clientTimeoutMs, 10000);
});
