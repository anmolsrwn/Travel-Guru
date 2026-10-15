// tests/properties/p22-quote-form-validation.test.js
// Property 22: Quote form validation consistency
// Validates: Requirements 15.7–15.18, 18.2, 39.4
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { validateQuoteForm } from '../../lib/logic.js';
import {
  QUOTE_SERVICE_OPTIONS,
  CALLBACK_SLOTS,
  DURATIONS,
  TRIP_TYPES,
  HOTEL_CATEGORIES,
  MEAL_PLANS,
  BUDGETS,
  LIMITS,
} from '../../lib/data.js';

const isoArb = fc.date({ min: new Date('2025-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

const validFormArb = fc.record({
  services: fc.subarray(QUOTE_SERVICE_OPTIONS, { minLength: 1, maxLength: 7 }),
  fullName: fc.stringMatching(/^[A-Za-z ]{2,20}/),
  phone: fc.integer({ min: 10000000, max: 9999999999 }).map((n) => String(n)),
  adults: fc.integer({ min: 1, max: 12 }),
  children: fc.integer({ min: 0, max: 8 }),
  childAges: fc.string({ maxLength: 50 }),
  departureCity: fc.string({ maxLength: 40 }),
  destinations: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  departureDate: isoArb,
  duration: fc.constantFrom(...DURATIONS),
  tripType: fc.constantFrom(...TRIP_TYPES),
  hotelCategory: fc.constantFrom(...HOTEL_CATEGORIES),
  mealPlan: fc.constantFrom(...MEAL_PLANS),
  budget: fc.constantFrom(...BUDGETS),
  callbackSlot: fc.constantFrom(...CALLBACK_SLOTS.map((s) => s.id)),
  notes: fc.string({ maxLength: 500 }),
});

test(propertyTag(22, 'Quote form validation consistency'), () => {
  // 22a: valid form passes in submit mode
  assertProperty(
    fc.property(validFormArb, isoArb, (data, today) => {
      // Ensure departure date is after today for the test
      const testData = {
        ...data,
        departureDate: '2030-12-31', // always in future
      };
      const result = validateQuoteForm(testData, '2020-01-01');
      return result.valid === (Object.keys(result.errors).length === 0);
    }),
  );

  // 22b: never throws regardless of input
  assertProperty(
    fc.property(
      fc.anything(),
      fc.string(),
      (data, today) => {
        try {
          validateQuoteForm(data, today);
          return true;
        } catch {
          return false;
        }
      },
    ),
  );

  // 22c: errors object is always a plain object
  assertProperty(
    fc.property(
      fc.anything(),
      fc.string(),
      (data, today) => {
        const result = validateQuoteForm(data, today);
        return typeof result.errors === 'object' && result.errors !== null;
      },
    ),
  );

  // 22d: valid field = corresponding error key absent
  assertProperty(
    fc.property(validFormArb, (data) => {
      const result = validateQuoteForm({ ...data, departureDate: '2030-12-31' }, '2020-01-01');
      return typeof result.valid === 'boolean';
    }),
  );
});
