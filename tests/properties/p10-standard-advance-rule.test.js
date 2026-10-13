// tests/properties/p10-standard-advance-rule.test.js
// Property 10: Standard 50% advance rule
// Validates: Requirements 29.3, 29.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeAdvance } from '../../lib/logic.js';
import { BUSINESS } from '../../lib/data.js';

const policy = BUSINESS.paymentPolicy;
const isoArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2028-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(10, 'Standard 50% advance rule'), () =>
  assertProperty(
    fc.property(
      fc.integer({ min: 2000, max: 5_000_000 }),
      fc.integer({ min: policy.thresholdPerPersonINR, max: 1_000_000 }),
      fc.integer({ min: policy.fullPaymentWithinDays, max: 365 }),
      isoArb,
      (total, perPerson, daysUntil, bookingDate) => {
        const bookingMs = new Date(bookingDate).getTime();
        const departureDate = new Date(bookingMs + daysUntil * 86400000).toISOString().slice(0, 10);
        const result = computeAdvance(total, perPerson, bookingDate, departureDate, policy);
        if (result.rule !== 'standard') return false;
        // Advance must equal ceil(total * rate) = ceil(total * 0.5)
        const expectedAdvance = Math.ceil(Number((total * policy.advanceRate).toPrecision(12)));
        if (result.advance !== expectedAdvance) return false;
        // Balance must be total - advance
        if (result.balance !== total - expectedAdvance) return false;
        // Balance due date must be set (not null)
        if (result.balanceDueDate === null) return false;
        return true;
      },
    ),
  ),
);
