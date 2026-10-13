// tests/properties/p03-conversion-accuracy.test.js
// Property 3: Conversion accuracy and unknown-code rejection
// Validates: Requirements 9.1, 9.4
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { convertPrice } from '../../lib/logic.js';
import { CURRENCIES } from '../../lib/data.js';

const currencyArb = fc.constantFrom(...Object.keys(CURRENCIES));

// Accuracy: result must be exactly roundHalfUp2(amount * rate)
function roundHalfUp2(x) {
  const scaled = Number((x * 100).toPrecision(15));
  return Math.floor(scaled + 0.5) / 100;
}

test(propertyTag(3, 'Conversion accuracy and unknown-code rejection'), () => {
  // 3a: result equals roundHalfUp2(amount * rate) for known codes
  assertProperty(
    fc.property(fc.nat(10_000_000), currencyArb, (amount, code) => {
      const expected = roundHalfUp2(amount * CURRENCIES[code].rate);
      const actual = convertPrice(amount, code);
      return actual === expected;
    }),
  );

  // 3b: unknown code throws RangeError
  assertProperty(
    fc.property(
      fc.nat(10_000_000),
      fc.stringMatching(/^[A-Z]{3,4}$/).filter((s) => !(s in CURRENCIES)),
      (amount, code) => {
        assert.throws(() => convertPrice(amount, code), RangeError);
        return true;
      },
    ),
  );

  // 3c: negative amount throws RangeError
  assertProperty(
    fc.property(
      fc.integer({ min: -10_000_000, max: -1 }),
      currencyArb,
      (amount, code) => {
        assert.throws(() => convertPrice(amount, code), RangeError);
        return true;
      },
    ),
  );
});
