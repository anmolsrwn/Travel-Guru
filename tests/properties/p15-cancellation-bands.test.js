// tests/properties/p15-cancellation-bands.test.js
// Property 15: Cancellation bands and boundaries
// Validates: Requirement 30.1
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { cancellationCharge } from '../../lib/logic.js';
import { POLICIES } from '../../lib/data.js';

const table = POLICIES.cancellation.table;
const maxDays = Math.max(...table.map((b) => b.maxDays ?? 0)) + 10;

test(propertyTag(15, 'Cancellation bands and boundaries'), () => {
  // 15a: every non-negative integer up to a large bound returns a valid rate in [0, 1]
  assertProperty(
    fc.property(fc.integer({ min: 0, max: maxDays + 50 }), (days) => {
      const rate = cancellationCharge(days);
      return typeof rate === 'number' && rate >= 0 && rate <= 1;
    }),
  );

  // 15b: each band's minDays returns the band's rate
  for (const band of table) {
    const rate = cancellationCharge(band.minDays);
    if (rate !== band.rate) {
      throw new Error(
        `Band minDays=${band.minDays}: expected rate ${band.rate}, got ${rate}`,
      );
    }
    if (band.maxDays !== null) {
      const rateAtMax = cancellationCharge(band.maxDays);
      if (rateAtMax !== band.rate) {
        throw new Error(
          `Band maxDays=${band.maxDays}: expected rate ${band.rate}, got ${rateAtMax}`,
        );
      }
    }
  }
});
