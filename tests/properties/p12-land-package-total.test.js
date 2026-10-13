// tests/properties/p12-land-package-total.test.js
// Property 12: Land package total
// Validates: Requirements 13.4, 13.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeLandTotal } from '../../lib/logic.js';
import { LIMITS } from '../../lib/data.js';

const [aMin, aMax] = LIMITS.adults;
const [cMin, cMax] = LIMITS.children;

const tierArb = fc.record({
  id: fc.constantFrom('deluxe', 'superior', 'premium'),
  adultPriceINR: fc.integer({ min: 1, max: 1_000_000 }),
  childPriceINR: fc.option(fc.integer({ min: 1, max: 500_000 }), { nil: null }),
});

test(propertyTag(12, 'Land package total'), () => {
  // 12a: total = adults * adultPrice + children * childPrice (or 0 if no child price)
  assertProperty(
    fc.property(
      tierArb,
      fc.integer({ min: aMin, max: aMax }),
      fc.integer({ min: cMin, max: cMax }),
      (tier, adults, children) => {
        const result = computeLandTotal({ tier, adults, children });
        if (result.adults !== adults) return false;
        const expectedChildren = tier.childPriceINR === null ? 0 : children;
        if (result.children !== expectedChildren) return false;
        const expectedTotal =
          adults * tier.adultPriceINR +
          (tier.childPriceINR === null ? 0 : expectedChildren * tier.childPriceINR);
        if (result.total !== expectedTotal) return false;
        return true;
      },
    ),
  );

  // 12b: children forced to 0 when childPriceINR is null
  assertProperty(
    fc.property(
      fc.record({
        id: fc.constant('deluxe'),
        adultPriceINR: fc.integer({ min: 1, max: 1_000_000 }),
        childPriceINR: fc.constant(null),
      }),
      fc.integer({ min: aMin, max: aMax }),
      fc.integer({ min: 1, max: cMax }),
      (tier, adults, children) => {
        const result = computeLandTotal({ tier, adults, children });
        return result.children === 0 && result.childPriceINR === null;
      },
    ),
  );
});
