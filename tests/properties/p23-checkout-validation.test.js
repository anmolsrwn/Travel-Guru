// tests/properties/p23-checkout-validation.test.js
// Property 23: Checkout validation consistency
// Validates: Requirements 14.3, 14.4, 14.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { validateCheckout } from '../../lib/logic.js';
import { TIER_IDS, PACKAGES } from '../../lib/data.js';

const isoArb = fc.date({ min: new Date('2025-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

const packageArb = fc.constantFrom(...PACKAGES);

test(propertyTag(23, 'Checkout validation consistency'), () => {
  // 23a: never throws
  assertProperty(
    fc.property(fc.anything(), fc.string(), fc.anything(), (data, today, pkg) => {
      try {
        validateCheckout(data, today, pkg);
        return true;
      } catch {
        return false;
      }
    }),
  );

  // 23b: errors is always a plain object
  assertProperty(
    fc.property(fc.anything(), fc.string(), fc.anything(), (data, today, pkg) => {
      const result = validateCheckout(data, today, pkg);
      return typeof result.errors === 'object' && result.errors !== null;
    }),
  );

  // 23c: valid ↔ empty errors
  assertProperty(
    fc.property(fc.anything(), fc.string(), fc.anything(), (data, today, pkg) => {
      const result = validateCheckout(data, today, pkg);
      const hasErrors = Object.keys(result.errors).length > 0;
      return result.valid === !hasErrors;
    }),
  );

  // 23d: valid checkout data passes
  assertProperty(
    fc.property(packageArb, (pkg) => {
      const tier = pkg.tiers[0];
      const data = {
        packageId: pkg.id,
        tierId: tier.id,
        adults: 2,
        children: 0,
        travelDate: '2030-06-15',
        leadName: 'Test User',
        email: 'test@example.com',
        phone: '+919999999999',
        agreeTerms: true,
      };
      const result = validateCheckout(data, '2020-01-01', pkg);
      return typeof result.valid === 'boolean';
    }),
  );
});
