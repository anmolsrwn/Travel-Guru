// tests/properties/p18-minimum-departure-date.test.js
// Property 18: Minimum departure date is tomorrow
// Validates: Requirement 16.1
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { minDepartureDate, daysBetween } from '../../lib/logic.js';

const isoArb = fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

test(propertyTag(18, 'Minimum departure date is tomorrow'), () =>
  assertProperty(
    fc.property(isoArb, (today) => {
      const min = minDepartureDate(today);
      // min must be exactly 1 day after today
      return daysBetween(today, min) === 1;
    }),
  ),
);
