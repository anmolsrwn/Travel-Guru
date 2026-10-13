import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS,
  SERVICES,
  SERVICE_ACCENTS,
  QUOTE_SERVICE_OPTIONS,
  REVIEWS,
  FAQ,
} from '../lib/data.js';

const nonEmpty = (s) => typeof s === 'string' && s.trim() !== '';

test('SERVICES: 8 services in poster order with subtitles and accents (Req 7.1)', () => {
  assert.deepEqual(
    SERVICES.map((s) => [s.title, s.subtitle, s.accent]),
    [
      ['Flights', 'Domestic & International', '--svc-blue'],
      ['Hotels', 'Best Stays Worldwide', '--svc-orange'],
      ['Passport', 'New / Renewal Assistance', '--svc-purple'],
      ['Visa', 'Tourist / Business Visa Support', '--svc-red'],
      ['Holidays', 'Domestic & International Packages', '--svc-green'],
      ['Travel Insurance', 'Travel Safe Always', '--svc-teal'],
      ['Train', 'IRCTC Ticket Booking & Assistance', '--svc-violet'],
      ['Packages', 'Customized & Group Tour Packages', '--svc-pink'],
    ]
  );
});

test('SERVICES: field shapes and one-to-one quote/accent mapping (Req 7.2)', () => {
  for (const s of SERVICES) {
    for (const k of ['id', 'icon', 'title', 'subtitle', 'summary']) assert.ok(nonEmpty(s[k]), `${s.id}.${k}`);
    assert.ok(Array.isArray(s.bullets) && s.bullets.length >= 1 && s.bullets.length <= 3);
    assert.ok(s.bullets.every(nonEmpty));
    assert.ok(SERVICE_ACCENTS.includes(s.accent));
    assert.ok(QUOTE_SERVICE_OPTIONS.includes(s.quoteOption));
  }
  assert.equal(new Set(SERVICES.map((s) => s.id)).size, 8);
  assert.deepEqual([...new Set(SERVICES.map((s) => s.quoteOption))].sort(), [...QUOTE_SERVICE_OPTIONS].sort());
  assert.equal(new Set(SERVICES.map((s) => s.accent)).size, 8);
  assert.equal(new Set(SERVICE_ACCENTS).size, 8);
  assert.doesNotMatch(JSON.stringify(SERVICES), /cruise|forex|scenic rail/i);
});

test('REVIEWS: at least 3 placeholder entries (Req 20.5)', () => {
  assert.ok(REVIEWS.length >= 3);
  for (const r of REVIEWS) {
    for (const k of ['quote', 'name', 'city', 'destination']) assert.ok(nonEmpty(r[k]));
    assert.equal(r.isPlaceholder, true);
  }
});

test('FAQ: 8-10 entries covering required topics, no cruise/forex/booking-fee claims (Req 21.4)', () => {
  assert.ok(FAQ.length >= 8 && FAQ.length <= 10);
  for (const f of FAQ) assert.ok(nonEmpty(f.q) && nonEmpty(f.a));
  const text = FAQ.map((f) => `${f.q} ${f.a}`).join(' ');
  for (const re of [/fare/i, /passport/i, /visa/i, /IRCTC/, /insurance/i, /customi[sz]ed/i, /group/i, /cancellation/i, /how do you accept payments/i]) {
    assert.match(text, re);
  }
  assert.doesNotMatch(text, /cruise|forex|booking fee/i);
  assert.ok(FAQ.some((f) => f.link?.href === '#terms-cancellation'));
});

test('FAQ payment answer states the Payment_Policy values (Req 21.5)', () => {
  const p = BUSINESS.paymentPolicy;
  const pay = FAQ.find((f) => /pay to book/i.test(f.q));
  assert.ok(pay);
  assert.match(pay.a, /₹25,000 per person/);
  assert.match(pay.a, new RegExp(`${p.advanceRate * 100}% advance`));
  assert.match(pay.a, new RegExp(`${p.balanceDueDaysBefore} days before departure`));
  assert.match(pay.a, new RegExp(`within ${p.fullPaymentWithinDays} days of departure, 100%`));
  assert.match(pay.a, /100% is payable/);
});
