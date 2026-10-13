// tests/properties/p20-ticket-id-format.test.js
// Property 20: Ticket ID format
// Validates: Requirements 17.3, 17.4
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { generateTicketId, isValidTicketId } from '../../lib/logic.js';

const TICKET_RE = /^QT-\d{4}-\d{4}$/;

test(propertyTag(20, 'Ticket ID format'), () => {
  // 20a: generated ids match the pattern
  assertProperty(
    fc.property(
      fc.integer({ min: 2000, max: 2099 }),
      fc.integer({ min: -100000, max: 100000 }),
      (year, n) => {
        const id = generateTicketId(year, n);
        return TICKET_RE.test(id);
      },
    ),
  );

  // 20b: isValidTicketId returns true for generated ids
  assertProperty(
    fc.property(
      fc.integer({ min: 2024, max: 2030 }),
      fc.nat(99999),
      (year, n) => {
        return isValidTicketId(generateTicketId(year, n));
      },
    ),
  );

  // 20c: isValidTicketId returns false for non-matching strings and non-strings
  assertProperty(
    fc.property(
      fc.oneof(
        fc.string().filter((s) => !TICKET_RE.test(s)),
        fc.constant(null),
        fc.integer(),
      ),
      (bad) => !isValidTicketId(bad),
    ),
  );

  // 20d: the NNNN segment is the last 4 digits of |n % 10000|
  assertProperty(
    fc.property(
      fc.integer({ min: 2024, max: 2030 }),
      fc.integer({ min: -100000, max: 100000 }),
      (year, n) => {
        const id = generateTicketId(year, n);
        const seg = id.slice(-4);
        const expected = String(((n % 10000) + 10000) % 10000).padStart(4, '0');
        return seg === expected;
      },
    ),
  );
});
