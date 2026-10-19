// tests/properties/p28-callback-deadline.test.js
// Property 28: Callback deadline offset
// Validates: Requirement 17.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { computeCallbackDeadline } from '../../lib/logic.js';
import { CALLBACK_SLOTS, BUSINESS } from '../../lib/data.js';

const slotIdArb = fc.constantFrom(...CALLBACK_SLOTS.map((s) => s.id));
const hoursArb = fc.integer({ min: 1, max: 72 });

test(propertyTag(28, 'Callback deadline offset'), () => {
  // 28a: deadline = now + hours * 3600000 ms
  assertProperty(
    fc.property(
      fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
      slotIdArb,
      hoursArb,
      (now, slotId, hours) => {
        const deadline = computeCallbackDeadline(now, slotId, hours);
        const expectedMs = now.getTime() + hours * 3_600_000;
        return deadline.getTime() === expectedMs;
      },
    ),
  );

  // 28b: uses BUSINESS.callbackHours when hours omitted
  assertProperty(
    fc.property(
      fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
      slotIdArb,
      (now, slotId) => {
        const deadline = computeCallbackDeadline(now, slotId);
        const expectedMs = now.getTime() + BUSINESS.callbackHours * 3_600_000;
        return deadline.getTime() === expectedMs;
      },
    ),
  );

  // 28c: input `now` is not mutated
  assertProperty(
    fc.property(
      fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
      slotIdArb,
      (now, slotId) => {
        const originalTime = now.getTime();
        computeCallbackDeadline(now, slotId, 24);
        return now.getTime() === originalTime;
      },
    ),
  );

  // 28d: result is a Date (not the same object as now)
  assertProperty(
    fc.property(
      fc.date({ noInvalidDate: true, min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
      slotIdArb,
      (now, slotId) => {
        const deadline = computeCallbackDeadline(now, slotId, 24);
        return deadline instanceof Date && deadline !== now;
      },
    ),
  );
});
