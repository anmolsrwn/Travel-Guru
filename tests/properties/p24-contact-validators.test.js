// tests/properties/p24-contact-validators.test.js
// Property 24: Contact validators
// Validates: Requirements 15.5, 15.6
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { validateEmail, validatePhone } from '../../lib/logic.js';

test(propertyTag(24, 'Contact validators'), () => {
  // 24a: valid emails pass
  assertProperty(
    fc.property(fc.emailAddress(), (email) => {
      return validateEmail(email) === true;
    }),
  );

  // 24b: non-strings return false
  assertProperty(
    fc.property(
      fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
      (v) => validateEmail(v) === false && validatePhone(v) === false,
    ),
  );

  // 24c: phone with 8–15 digits (optional + prefix) passes
  assertProperty(
    fc.property(
      fc.integer({ min: 10000000, max: 999999999999999 }).map((n) => String(n)),
      (digits) => {
        // 8–15 digits only passes
        if (digits.length >= 8 && digits.length <= 15) {
          return validatePhone(digits) === true;
        }
        return true; // skip if out of range
      },
    ),
  );

  // 24d: strings without @ fail email validation
  assertProperty(
    fc.property(
      fc.string().filter((s) => !s.includes('@')),
      (s) => validateEmail(s) === false,
    ),
  );

  // 24e: too-short digit strings fail phone validation
  assertProperty(
    fc.property(
      fc.integer({ min: 1, max: 9999999 }).map((n) => String(n)),
      (s) => {
        // < 8 digits → false (separators stripped)
        if (s.length < 8) return validatePhone(s) === false;
        return true;
      },
    ),
  );
});
