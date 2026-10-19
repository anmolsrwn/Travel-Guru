// tests/properties/p19-date-validation.test.js
// Property 19: Date validation
// Validates: Requirements 16.3, 16.4
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { isDateOnOrAfter, minDepartureDate } from '../../lib/logic.js';

const isoArb = fc.date({ noInvalidDate: true, min: new Date('2000-01-01'), max: new Date('2050-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(19, 'Date validation'), () => {
  // 19a: isDateOnOrAfter(d, d) === true (reflexive)
  assertProperty(
    fc.property(isoArb, (d) => isDateOnOrAfter(d, d) === true),
  );

  // 19b: isDateOnOrAfter(tomorrow, today) === true
  assertProperty(
    fc.property(isoArb, (today) => {
      const tomorrow = minDepartureDate(today);
      return isDateOnOrAfter(tomorrow, today) === true;
    }),
  );

  // 19c: isDateOnOrAfter(today, tomorrow) === false
  assertProperty(
    fc.property(isoArb, (today) => {
      const tomorrow = minDepartureDate(today);
      return isDateOnOrAfter(today, tomorrow) === false;
    }),
  );

  // 19d: malformed strings return false, never throw
  assertProperty(
    fc.property(
      fc.oneof(
        fc.constant('not-a-date'),
        fc.constant('2024-13-01'),
        fc.constant('2024-00-01'),
        fc.constant(''),
        fc.constant(null),
        fc.integer(),
      ),
      isoArb,
      (bad, good) =>
        isDateOnOrAfter(bad, good) === false && isDateOnOrAfter(good, bad) === false,
    ),
  );
});
