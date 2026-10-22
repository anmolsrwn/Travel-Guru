// tests/ticket-details.test.js
// Flight / train ticket requests: validation, payload shaping, storage row and message.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS } from '../lib/data.js';
import { validateQuoteForm, composeQuoteWhatsAppMessage } from '../lib/logic.js';
import { toLeadRow, ticketDetailsFor } from '../lib/server/quote.js';
import { initialQuoteForm, quotePayload, isTicketMode, hasTicketService, toggleService } from '../components/client/quoteFormState.js';

const TODAY = '2026-01-01';
const base = (over = {}) => ({
  services: ['Flights'],
  fullName: 'Asha Verma',
  phone: '9876543210',
  email: 'asha@example.com',
  destinations: 'Delhi',
  departureDate: '2026-02-10',
  adults: 2,
  children: 0,
  ...over,
});

test('older clients without ticketDetails are still valid', () => {
  assert.equal(validateQuoteForm(base(), TODAY).valid, true);
});

test('one way with a class is valid', () => {
  const r = validateQuoteForm(base({ ticketDetails: { journey: 'One way', returnDate: '', flightClass: 'Economy', trainClass: '' } }), TODAY);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
});

test('round trip needs a return date', () => {
  const r = validateQuoteForm(base({ ticketDetails: { journey: 'Round trip', returnDate: '' } }), TODAY);
  assert.ok(r.errors.returnDate);
});

test('round trip with the return date before the travel date is rejected', () => {
  const r = validateQuoteForm(base({ ticketDetails: { journey: 'Round trip', returnDate: '2026-02-05' } }), TODAY);
  assert.ok(r.errors.returnDate);
});

test('round trip with a later return date is valid, same day too', () => {
  assert.equal(validateQuoteForm(base({ ticketDetails: { journey: 'Round trip', returnDate: '2026-02-20' } }), TODAY).valid, true);
  assert.equal(validateQuoteForm(base({ ticketDetails: { journey: 'Round trip', returnDate: '2026-02-10' } }), TODAY).valid, true);
});

test('unknown journey or class values are rejected', () => {
  const bad = validateQuoteForm(base({ ticketDetails: { journey: 'Sideways', flightClass: 'First' } }), TODAY);
  assert.ok(bad.errors.ticketJourney);
  assert.ok(bad.errors.flightClass);
});

test('whatsapp mode does not insist on the return date', () => {
  const r = validateQuoteForm(base({ ticketDetails: { journey: 'Round trip', returnDate: '' } }), TODAY, { mode: 'whatsapp' });
  assert.equal(r.errors.returnDate, undefined);
});

test('ticketDetailsFor keeps only informative, whitelisted values', () => {
  assert.equal(ticketDetailsFor(base({ ticketDetails: { journey: 'One way', flightClass: '' } })), null);
  assert.equal(ticketDetailsFor(base({ services: ['Hotels'], ticketDetails: { journey: 'Round trip', returnDate: '2026-02-20' } })), null);
  assert.deepEqual(
    ticketDetailsFor(base({ ticketDetails: { journey: 'Round trip', returnDate: '2026-02-20', flightClass: 'Business', trainClass: '3rd AC (3A)', extra: 'x' } })),
    { journey: 'Round trip', returnDate: '2026-02-20', flightClass: 'Business' },
  );
});

test('toLeadRow adds ticket_details only when there is something to store', () => {
  const deadline = new Date('2026-01-02T00:00:00Z');
  const plain = toLeadRow(base({ departureCity: 'Raipur', duration: '', tripType: '', childAges: '', hotelCategory: '', mealPlan: '', budget: '', callbackSlot: '', notes: '' }), 'QT-2026-0001', deadline);
  assert.equal('ticket_details' in plain, false);
  const withDetails = toLeadRow(
    base({ departureCity: 'Raipur', duration: '', tripType: '', childAges: '', hotelCategory: '', mealPlan: '', budget: '', callbackSlot: '', notes: '', ticketDetails: { journey: 'Round trip', returnDate: '2026-02-20' } }),
    'QT-2026-0002',
    deadline,
  );
  assert.deepEqual(withDetails.ticket_details, { journey: 'Round trip', returnDate: '2026-02-20' });
});

test('ticket mode helpers', () => {
  assert.equal(isTicketMode([]), true);
  assert.equal(isTicketMode(['Flights', 'Train']), true);
  assert.equal(isTicketMode(['Flights', 'Hotels']), false);
  assert.equal(hasTicketService(['Train']), true);
  assert.equal(hasTicketService(['Forex']), false);
});

test('quotePayload blanks holiday fields and shapes ticketDetails', () => {
  const form = { ...initialQuoteForm(), services: ['Flights', 'Train'], hotelCategory: '4★', budget: 'Luxury', duration: '3-4 days', journey: 'Round trip', returnDate: '2026-02-20', flightClass: 'Economy', trainClass: 'Sleeper (SL)' };
  const p = quotePayload(form);
  assert.equal(p.hotelCategory, '');
  assert.equal(p.budget, '');
  assert.equal(p.duration, '');
  assert.deepEqual(p.ticketDetails, { journey: 'Round trip', returnDate: '2026-02-20', flightClass: 'Economy', trainClass: 'Sleeper (SL)' });
  const oneWay = quotePayload({ ...form, journey: 'One way', services: ['Train'] });
  assert.deepEqual(oneWay.ticketDetails, { journey: 'One way', returnDate: '', flightClass: '', trainClass: 'Sleeper (SL)' });
  assert.equal('journey' in p, false);
});

test('the WhatsApp message carries the ticket details', () => {
  const msg = composeQuoteWhatsAppMessage(base({ ticketDetails: { journey: 'Round trip', returnDate: '2026-02-20', flightClass: 'Business' } }), BUSINESS);
  assert.ok(msg.includes('*Journey:* Round trip'));
  assert.ok(msg.includes('*Return:* 2026-02-20'));
  assert.ok(msg.includes('*Flight class:* Business'));
});

test('trip: transport must be Flight, Train or Any', () => {
  assert.equal(validateQuoteForm(base({ services: ['Holidays'], ticketDetails: { transport: 'Train', trainClass: '3rd AC (3A)' } }), TODAY).valid, true);
  assert.equal(validateQuoteForm(base({ services: ['Holidays'], ticketDetails: { transport: 'Any' } }), TODAY).valid, true);
  const bad = validateQuoteForm(base({ services: ['Holidays'], ticketDetails: { transport: 'Rocket' } }), TODAY);
  assert.ok(bad.errors.transport);
});

test('trip: ticketDetailsFor always stores the transport and its class only', () => {
  assert.deepEqual(ticketDetailsFor(base({ services: ['Holidays'], ticketDetails: { transport: 'Any' } })), { transport: 'Any' });
  assert.deepEqual(
    ticketDetailsFor(base({ services: ['Holidays'], ticketDetails: { transport: 'Flight', flightClass: 'Business', trainClass: 'Sleeper (SL)' } })),
    { transport: 'Flight', flightClass: 'Business' },
  );
  assert.deepEqual(ticketDetailsFor(base({ services: ['Holidays'], ticketDetails: { transport: 'weird' } })), { transport: 'Any' });
});

test('trip: payload keeps holiday fields and sends only the chosen transport class', () => {
  const form = { ...initialQuoteForm(), services: ['Holidays'], hotelCategory: '4★', budget: 'Luxury', transport: 'Train', flightClass: 'Economy', trainClass: '2nd AC (2A)' };
  const p = quotePayload(form);
  assert.equal(p.hotelCategory, '4★');
  assert.equal(p.budget, 'Luxury');
  assert.deepEqual(p.ticketDetails, { transport: 'Train', flightClass: '', trainClass: '2nd AC (2A)' });
  assert.equal('transport' in p, false);
});

test('Trip and flight / train tiles are exclusive', () => {
  assert.deepEqual(toggleService(['Flights', 'Train'], 'Holidays'), ['Holidays']);
  assert.deepEqual(toggleService(['Holidays'], 'Flights'), ['Flights']);
  assert.deepEqual(toggleService(['Flights'], 'Train'), ['Flights', 'Train']);
  assert.deepEqual(toggleService(['Holidays'], 'Holidays'), []);
});

test('trip: the WhatsApp message shows "Trip" and how they will travel', () => {
  const msg = composeQuoteWhatsAppMessage(base({ services: ['Holidays'], ticketDetails: { transport: 'Flight', flightClass: 'Economy' } }), BUSINESS);
  assert.ok(msg.includes('*Services:* Trip'));
  assert.ok(msg.includes('*Travel by:* Flight'));
  assert.ok(msg.includes('*Flight class:* Economy'));
});
