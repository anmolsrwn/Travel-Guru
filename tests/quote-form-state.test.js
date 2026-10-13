import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { QUOTE_SERVICE_OPTIONS, DESTINATION_QUOTE_SERVICE } from '../lib/data.js';
import { validateQuoteForm } from '../lib/logic.js';
import {
  QUOTE_FIELD_ORDER,
  applyQuoteIntent,
  checkService,
  firstInvalidField,
  initialQuoteForm,
  parseCount,
  quotePayload,
  toggleService,
} from '../components/client/quoteFormState.js';
import { localTodayISO } from '../components/client/localToday.js';

test('initialQuoteForm: Raipur, 2 adults, 0 children, everything else empty (Req 15.2, 17.13)', () => {
  const f = initialQuoteForm();
  assert.deepEqual(f.services, []);
  assert.equal(f.departureCity, 'Raipur');
  assert.equal(f.adults, 2);
  assert.equal(f.children, 0);
  for (const k of ['destinations', 'departureDate', 'fullName', 'phone', 'email', 'callbackSlot', 'notes', 'website']) {
    assert.equal(f[k], '', k);
  }
  assert.notEqual(initialQuoteForm(), f, 'fresh object each call');
});

test('checkService never unchecks; toggleService toggles (Req 7.5, 7.6)', () => {
  const subset = fc.subarray(QUOTE_SERVICE_OPTIONS);
  fc.assert(
    fc.property(subset, fc.constantFrom(...QUOTE_SERVICE_OPTIONS), (services, option) => {
      const checked = checkService(services, option);
      assert.ok(checked.includes(option));
      for (const s of services) assert.ok(checked.includes(s));
      assert.deepEqual(checkService(checked, option), checked);
      const toggled = toggleService(services, option);
      assert.equal(toggled.includes(option), !services.includes(option));
    }),
  );
  assert.deepEqual(checkService(['Flights'], 'Nope'), ['Flights']);
});

test('applyQuoteIntent: service ticks and clears only the services error (Req 7.7)', () => {
  const form = { ...initialQuoteForm(), services: ['Visa'] };
  const errors = { services: 'x', phone: 'y' };
  const r = applyQuoteIntent(form, errors, { type: 'service', value: 'Flights', nonce: 1 });
  assert.deepEqual(r.form.services, ['Flights', 'Visa']);
  assert.deepEqual(r.errors, { phone: 'y' });
});

test('applyQuoteIntent: destination replaces destinations and ticks Holidays (Req 35.4)', () => {
  const form = { ...initialQuoteForm(), services: ['Visa'], destinations: 'Goa' };
  const errors = { services: 'x', destinations: 'z', email: 'e' };
  const r = applyQuoteIntent(form, errors, {
    type: 'destination', value: 'Bali', service: DESTINATION_QUOTE_SERVICE, nonce: 2,
  });
  assert.equal(r.form.destinations, 'Bali');
  assert.ok(r.form.services.includes('Visa') && r.form.services.includes(DESTINATION_QUOTE_SERVICE));
  assert.deepEqual(r.errors, { email: 'e' });
});

test('quotePayload drops child ages at 0 children (Req 15.3)', () => {
  const f = { ...initialQuoteForm(), childAges: 'x'.repeat(150) };
  assert.equal(quotePayload(f).childAges, '');
  assert.equal(quotePayload({ ...f, children: 1 }).childAges.length, 150);
});

test('parseCount and firstInvalidField', () => {
  assert.equal(parseCount(''), '');
  assert.equal(parseCount('3'), 3);
  assert.equal(parseCount('abc'), '');
  const { errors } = validateQuoteForm(quotePayload(initialQuoteForm()), '2026-01-01');
  assert.equal(firstInvalidField(errors), 'services');
  assert.equal(firstInvalidField({ email: 'e', phone: 'p' }), 'phone');
  assert.equal(firstInvalidField({}), null);
  for (const k of Object.keys(errors)) assert.ok(QUOTE_FIELD_ORDER.includes(k), k);
});

test('localTodayISO uses local date fields', () => {
  assert.equal(localTodayISO(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.match(localTodayISO(), /^\d{4}-\d{2}-\d{2}$/);
});
