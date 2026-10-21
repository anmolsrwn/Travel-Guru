// tests/properties/p13-breakdown-composition.test.js
// Property 13: Breakdown composition — computeBookingBreakdown fields are consistent
// Validates: Requirement 29.6
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeBookingBreakdown } from '../../lib/logic.js';
import { BUSINESS, LIMITS } from '../../lib/data.js';

const policy = BUSINESS.paymentPolicy;
const [aMin, aMax] = LIMITS.adults;
const [cMin, cMax] = LIMITS.children;
const isoArb = fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2029-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

const tierArb = fc.record({
  id: fc.constantFrom('deluxe', 'superior', 'premium'),
  adultPriceINR: fc.integer({ min: 1000, max: 500_000 }),
  childPriceINR: fc.option(fc.integer({ min: 500, max: 250_000 }), { nil: null }),
});

test(propertyTag(13, 'Breakdown composition'), () =>
  assertProperty(
    fc.property(
      tierArb,
      fc.integer({ min: aMin, max: aMax }),
      fc.integer({ min: cMin, max: cMax }),
      fc.integer({ min: 0, max: 365 }),
      isoArb,
      (tier, adults, children, daysUntil, bookingDate) => {
        const bookingMs = new Date(bookingDate).getTime();
        const departureDate = new Date(bookingMs + daysUntil * 86400000).toISOString().slice(0, 10);
        const result = computeBookingBreakdown(
          { tier, adults, children },
          departureDate,
          bookingDate,
          policy,
        );
        // Conservation
        if (result.advance + result.balance !== result.total) return false;
        // Land total consistency
        const expectedChildren = tier.childPriceINR === null ? 0 : result.children;
        const expectedTotal =
          result.adults * tier.adultPriceINR +
          (tier.childPriceINR === null ? 0 : expectedChildren * tier.childPriceINR);
        if (result.total !== expectedTotal) return false;
        // currency must be INR
        if (result.currency !== 'INR') return false;
        return true;
      },
    ),
  ),
);
