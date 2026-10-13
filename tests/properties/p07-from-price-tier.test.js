// tests/properties/p07-from-price-and-tier.test.js
// Property 7: From price and tier lookup
// Validates: Requirements 8.7, 8.8, 27.7
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { fromPriceINR, getTier } from '../../lib/logic.js';
import { TIER_IDS } from '../../lib/data.js';

const tierIdArb = fc.constantFrom(...TIER_IDS);
const priceArb = fc.integer({ min: 1, max: 5_000_000 });

const tierArb = fc.record({
  id: tierIdArb,
  adultPriceINR: priceArb,
  childPriceINR: fc.option(priceArb, { nil: null }),
});

const pkgArb = fc
  .uniqueArray(tierIdArb, { minLength: 2, maxLength: 3 })
  .chain((ids) =>
    fc.tuple(...ids.map((id) => fc.record({ id: fc.constant(id), adultPriceINR: priceArb }))),
  )
  .map((tiers) => ({ tiers }));

test(propertyTag(7, 'From price and tier lookup'), () => {
  // 7a: fromPriceINR returns the minimum adultPriceINR
  assertProperty(
    fc.property(pkgArb, (pkg) => {
      const result = fromPriceINR(pkg);
      const expected = Math.min(...pkg.tiers.map((t) => t.adultPriceINR));
      return result === expected;
    }),
  );

  // 7b: getTier with a valid tierId returns that tier
  assertProperty(
    fc.property(pkgArb, (pkg) => {
      for (const tier of pkg.tiers) {
        const result = getTier(pkg, tier.id);
        if (result.id !== tier.id) return false;
      }
      return true;
    }),
  );

  // 7c: getTier with an unknown tierId returns the cheapest tier
  assertProperty(
    fc.property(pkgArb, (pkg) => {
      const unknown = 'nonexistent-tier-id';
      const result = getTier(pkg, unknown);
      const cheapest = pkg.tiers.reduce(
        (min, t) => (t.adultPriceINR < min.adultPriceINR ? t : min),
        pkg.tiers[0],
      );
      return result.adultPriceINR === cheapest.adultPriceINR;
    }),
  );
});
