// tests/properties/p17-date-arithmetic-roundtrip.test.js
// Property 17: Date arithmetic round-trip — addDays(addDays(d, n), -n) === d
// Validates: Requirement 16.2
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { addDays } from '../../lib/logic.js';

// Generate valid ISO dates in a safe range (avoid year overflow)
const isoArb = fc.date({ noInvalidDate: true, min: new Date('2000-01-01'), max: new Date('2050-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(17, 'Date arithmetic round-trip'), () =>
  assertProperty(
    fc.property(isoArb, fc.integer({ min: -500, max: 500 }), (isoDate, n) => {
      const forward = addDays(isoDate, n);
      const back = addDays(forward, -n);
      return back === isoDate;
    }),
  ),
);
