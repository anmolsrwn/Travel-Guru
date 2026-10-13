// tests/properties/p01-conversion-identity.test.js
// Property 1: Conversion identity — convert(amount, "INR") === roundHalfUp2(amount * 1)
// Validates: Requirement 9.2
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { convertPrice } from '../../lib/logic.js';

test(propertyTag(1, 'Conversion identity'), () =>
  assertProperty(
    fc.property(fc.nat(10_000_000), (amount) => {
      const result = convertPrice(amount, 'INR');
      return result === amount; // INR rate = 1, so result equals input
    }),
  ),
);
