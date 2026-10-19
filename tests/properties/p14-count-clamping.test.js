// tests/properties/p14-count-clamping.test.js
// Property 14: Count clamping
// Validates: Requirements 13.1, 13.2, 13.3
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { clampCount } from '../../lib/logic.js';

test(propertyTag(14, 'Count clamping'), () => {
  // 14a: result is always within [min, max]
  assertProperty(
    fc.property(
      fc.integer({ min: -100, max: 100 }),
      fc.integer({ min: 0, max: 20 }),
      fc.integer({ min: 0, max: 20 }),
      (n, lo, hi) => {
        const min = Math.min(lo, hi);
        const max = Math.max(lo, hi);
        const result = clampCount(n, min, max);
        return result >= min && result <= max;
      },
    ),
  );

  // 14b: non-numeric / non-finite → min
  assertProperty(
    fc.property(
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.constant(Infinity),
        fc.constant(-Infinity),
        fc.string(),
      ),
      fc.integer({ min: 0, max: 8 }),
      (n, min) => {
        const max = min + 5;
        return clampCount(n, min, max) === min;
      },
    ),
  );

  // 14c: integer input in range returned unchanged
  assertProperty(
    fc.property(fc.integer({ min: 1, max: 12 }), (n) => {
      return clampCount(n, 1, 12) === n;
    }),
  );

  // 14d: truncates fractional part
  assertProperty(
    fc.property(fc.float({ min: 1.0, max: Math.fround(11.99), noNaN: true }), (n) => {
      return clampCount(n, 1, 12) === Math.trunc(n);
    }),
  );
});
