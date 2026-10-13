// tests/properties/p21-booking-ref-format.test.js
// Property 21: Booking reference format
// Validates: Requirement 14.8
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { generateBookingRef } from '../../lib/logic.js';

const REF_RE = /^BK-[A-HJ-NP-Z2-9]{6}$/;

test(propertyTag(21, 'Booking reference format'), () => {
  // 21a: generated refs match the pattern for all valid n
  assertProperty(
    fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
      return REF_RE.test(generateBookingRef(n));
    }),
  );

  // 21b: deterministic — same n always gives same ref
  assertProperty(
    fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
      return generateBookingRef(n) === generateBookingRef(n);
    }),
  );

  // 21c: out-of-range n throws RangeError
  assertProperty(
    fc.property(
      fc.oneof(
        fc.integer({ min: -100000, max: -1 }),
        fc.integer({ min: 0x100000000, max: 0x200000000 }),
        fc.constant(0.5),
        fc.constant(NaN),
      ),
      (n) => {
        assert.throws(() => generateBookingRef(n), RangeError);
        return true;
      },
    ),
  );

  // 21d: no I, O, 0, 1 in the 6-char segment
  assertProperty(
    fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
      const code = generateBookingRef(n).slice(3);
      return !/[IO01]/.test(code);
    }),
  );
});
