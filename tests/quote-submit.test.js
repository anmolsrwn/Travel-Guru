import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { API_LIMITS, BUSINESS } from '../lib/data.js';
import { composeQuoteWhatsAppMessage } from '../lib/logic.js';
import {
  QUOTE_ENDPOINT,
  QUOTE_SUBMIT_MESSAGES,
  callbackSlotLabel,
  formatDeadline,
  formatTripDate,
  postQuote,
  quoteOutcome,
  ticketSummaryRows,
  ticketWhatsAppMessage,
  travellersText,
} from '../components/client/quoteSubmit.js';
import { initialQuoteForm } from '../components/client/quoteFormState.js';

const DEADLINE = '2026-02-13T13:12:00.000Z';

test('quoteOutcome: 201 with server ticket → ticket (Req 19.2)', () => {
  assert.deepEqual(quoteOutcome(201, { ok: true, ticketId: 'QT-2026-4821', callbackDeadline: DEADLINE }), {
    type: 'ticket',
    ticketId: 'QT-2026-4821',
    callbackDeadline: DEADLINE,
  });
});

test('quoteOutcome: malformed 201 is treated as a failure (no modal)', () => {
  assert.equal(quoteOutcome(201, { ticketId: 'bad', callbackDeadline: DEADLINE }).type, 'failed');
  assert.equal(quoteOutcome(201, { ticketId: 'QT-2026-0001', callbackDeadline: 'nope' }).type, 'failed');
  assert.equal(quoteOutcome(201, null).type, 'failed');
});

test('quoteOutcome: 400 errors, 429, others (Req 19.3–19.5)', () => {
  assert.deepEqual(quoteOutcome(400, { error: 'validation', errors: { phone: 'Bad phone' } }), {
    type: 'errors',
    errors: { phone: 'Bad phone' },
  });
  assert.equal(quoteOutcome(400, { error: 'bad_request' }).type, 'failed');
  assert.equal(quoteOutcome(400, { errors: {} }).type, 'failed');
  assert.equal(quoteOutcome(429, { error: 'rate_limited' }).type, 'rateLimited');
  for (const s of [403, 413, 415, 500, 503]) assert.equal(quoteOutcome(s, { error: 'x' }).type, 'failed');
  assert.match(QUOTE_SUBMIT_MESSAGES.rateLimited, /^Too many requests/);
  assert.match(QUOTE_SUBMIT_MESSAGES.failed, /^We couldn't send your request right now/);
});

test('quoteOutcome never opens a ticket for a non-201 status (Req 17.12)', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 100, max: 599 }).filter((s) => s !== 201),
      fc.anything(),
      (status, body) => quoteOutcome(status, body).type !== 'ticket',
    ),
  );
});

test('postQuote: one POST with every field and website, JSON body', async () => {
  const calls = [];
  const data = { ...initialQuoteForm(), fullName: 'Asha' };
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { status: 201, json: async () => ({ ticketId: 'QT-2026-0007', callbackDeadline: DEADLINE }) };
  };
  const out = await postQuote(data, { fetchImpl });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, QUOTE_ENDPOINT);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].init.body), data);
  assert.ok('website' in JSON.parse(calls[0].init.body));
  assert.equal(out.type, 'ticket');
});

test('postQuote: network error, non-JSON body and timeout → failed', async () => {
  assert.equal((await postQuote({}, { fetchImpl: async () => { throw new TypeError('offline'); } })).type, 'failed');
  assert.equal(
    (await postQuote({}, { fetchImpl: async () => ({ status: 500, json: async () => { throw new SyntaxError(); } }) })).type,
    'failed',
  );
  const hang = (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  assert.equal((await postQuote({}, { fetchImpl: hang, timeoutMs: 20 })).type, 'failed');
  assert.equal(API_LIMITS.clientTimeoutMs, 10000);
});

test('ticketSummaryRows: wireframe rows, empty optional rows omitted (Req 17.6)', () => {
  const rows = ticketSummaryRows({
    ...initialQuoteForm(),
    services: ['Holidays', 'Flights'],
    destinations: 'Bali',
    departureDate: '2026-03-14',
    duration: '5-7 days',
    children: 1,
    childAges: ' 6 ',
    fullName: 'Asha',
    phone: '+91 98765 43210',
    email: 'a@example.com',
    callbackSlot: 'morning',
  });
  assert.deepEqual(rows, [
    { label: 'Services', value: 'Trip, Flights' },
    { label: 'Route', value: 'Raipur → Bali' },
    { label: 'Departs', value: '14 Mar 2026' },
    { label: 'Duration', value: '5-7 days' },
    { label: 'Travellers', value: '2 adults, 1 child (ages: 6)' },
    { label: 'Name', value: 'Asha' },
    { label: 'Phone', value: '+91 98765 43210' },
    { label: 'Email', value: 'a@example.com' },
    { label: 'Call-back slot', value: callbackSlotLabel('morning') },
  ]);
  assert.match(callbackSlotLabel('morning'), /^Morning/);
  assert.equal(callbackSlotLabel('nope'), '');
});

test('travellersText and formatTripDate', () => {
  assert.equal(travellersText(2, 0, '5'), '2 adults');
  assert.equal(travellersText(1, 2, ''), '1 adult, 2 children');
  assert.equal(formatTripDate('2026-12-01'), '1 Dec 2026');
  assert.equal(formatTripDate(''), '');
});

test('formatDeadline: day, month, year, hour and minute in the given zone', () => {
  const text = formatDeadline(DEADLINE, { timeZone: 'Asia/Kolkata' });
  assert.match(text, /13/);
  assert.match(text, /Feb/);
  assert.match(text, /2026/);
  assert.match(text, /6:42/);
  assert.equal(formatDeadline('garbage'), '');
});

test('ticketWhatsAppMessage: Ticket_ID line then the composed quote message (Req 17.10)', () => {
  const data = { ...initialQuoteForm(), services: ['Visa'], fullName: 'Asha', phone: '9876543210' };
  const msg = ticketWhatsAppMessage('QT-2026-0042', data, BUSINESS);
  assert.ok(msg.startsWith('*Ticket ID:* QT-2026-0042\n\n'));
  assert.ok(msg.endsWith(composeQuoteWhatsAppMessage(data, BUSINESS)));
});
