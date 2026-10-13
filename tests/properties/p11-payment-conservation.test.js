// tests/properties/p11-payment-conservation.test.js
// Property 11: Payment conservation — advance + balance === total for all rules
// Validates: Requirements 29.4, 2.8
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeAdvance } from '../../lib/logic.js';
import { BUSINESS } from '../../lib/data.js';

const policy = BUSINESS.paymentPolicy;
const isoArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(11, 'Payment conservation'), () =>
  assertProperty(
    fc.property(
      fc.integer({ min: 1, max: 10_000_000 }),
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.integer({ min: 0, max: 400 }),
      isoArb,
      (total, perPerson, daysUntil, bookingDate) => {
        const bookingMs = new Date(bookingDate).getTime();
        const departureDate = new Date(bookingMs + daysUntil * 86400000).toISOString().slice(0, 10);
        const result = computeAdvance(total, perPerson, bookingDate, departureDate, policy);
        return result.advance + result.balance === total;
      },
    ),
  ),
);
