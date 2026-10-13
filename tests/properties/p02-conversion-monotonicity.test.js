// tests/properties/p02-conversion-monotonicity.test.js
// Property 2: Conversion monotonicity — if a <= b, convert(a, code) <= convert(b, code)
// Validates: Requirement 9.3
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { convertPrice } from '../../lib/logic.js';
import { CURRENCIES } from '../../lib/data.js';

const currencyArb = fc.constantFrom(...Object.keys(CURRENCIES));

test(propertyTag(2, 'Conversion monotonicity'), () =>
  assertProperty(
    fc.property(
      fc.nat(5_000_000),
      fc.nat(5_000_000),
      currencyArb,
      (a, b, code) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return convertPrice(lo, code) <= convertPrice(hi, code);
      },
    ),
  ),
);
