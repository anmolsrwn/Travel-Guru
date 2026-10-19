// tests/properties/p09-full-payment-rules.test.js
// Property 9: Full payment rules
// Validates: Requirements 29.1, 29.2
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeAdvance } from '../../lib/logic.js';
import { BUSINESS } from '../../lib/data.js';

const policy = BUSINESS.paymentPolicy;
const isoArb = fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(9, 'Full payment rules'), () => {
  // 9a: within-window rule → 100% advance, balance = 0, balanceDueDate = null
  assertProperty(
    fc.property(
      fc.integer({ min: 1000, max: 5_000_000 }),
      fc.integer({ min: 1000, max: 1_000_000 }),
      fc.integer({ min: 0, max: policy.fullPaymentWithinDays - 1 }),
      isoArb,
      (total, perPerson, daysUntil, bookingDate) => {
        // Construct departure date as bookingDate + daysUntil
        const bookingMs = new Date(bookingDate).getTime();
        const departureDate = new Date(bookingMs + daysUntil * 86400000).toISOString().slice(0, 10);
        const result = computeAdvance(total, perPerson, bookingDate, departureDate, policy);
        return (
          result.rule === 'within-window' &&
          result.advance === total &&
          result.balance === 0 &&
          result.balanceDueDate === null
        );
      },
    ),
  );

  // 9b: below-threshold rule → 100% advance, balance = 0
  assertProperty(
    fc.property(
      fc.integer({ min: 1000, max: 5_000_000 }),
      fc.integer({ min: 0, max: policy.thresholdPerPersonINR - 1 }),
      fc.integer({ min: policy.fullPaymentWithinDays, max: 365 }),
      isoArb,
      (total, perPerson, daysUntil, bookingDate) => {
        const bookingMs = new Date(bookingDate).getTime();
        const departureDate = new Date(bookingMs + daysUntil * 86400000).toISOString().slice(0, 10);
        const result = computeAdvance(total, perPerson, bookingDate, departureDate, policy);
        return (
          result.rule === 'below-threshold' &&
          result.advance === total &&
          result.balance === 0 &&
          result.balanceDueDate === null
        );
      },
    ),
  );
});
