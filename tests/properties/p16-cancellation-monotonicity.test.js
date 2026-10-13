// tests/properties/p16-cancellation-monotonicity.test.js
// Property 16: Cancellation monotonicity and invalid input
// Validates: Requirements 30.2, 30.4
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { cancellationCharge } from '../../lib/logic.js';

test(propertyTag(16, 'Cancellation monotonicity and invalid input'), () => {
  // 16a: charge is monotonically non-increasing with days prior
  // (more days → lower or equal cancellation charge)
  assertProperty(
    fc.property(
      fc.integer({ min: 0, max: 200 }),
      fc.integer({ min: 0, max: 200 }),
      (a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const rateLo = cancellationCharge(lo);
        const rateHi = cancellationCharge(hi);
        // Fewer days prior (lo) → higher or equal charge
        return rateLo >= rateHi;
      },
    ),
  );

  // 16b: invalid inputs (non-integer, negative, non-numeric) throw RangeError
  assertProperty(
    fc.property(
      fc.oneof(
        fc.integer({ min: -1000, max: -1 }),
        fc.float({ min: 0.1, max: 100.9, noNaN: true }).filter((n) => !Number.isInteger(n)),
        fc.constant(NaN),
        fc.constant(null),
        fc.string(),
      ),
      (days) => {
        assert.throws(() => cancellationCharge(days), RangeError);
        return true;
      },
    ),
  );
});
