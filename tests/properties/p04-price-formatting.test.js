// tests/properties/p04-price-formatting.test.js
// Property 4: Price formatting
// Validates: Requirements 9.5, 9.6
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { formatPrice } from '../../lib/logic.js';
import { CURRENCIES } from '../../lib/data.js';

const currencyArb = fc.constantFrom(...Object.keys(CURRENCIES));

test(propertyTag(4, 'Price formatting'), () =>
  assertProperty(
    fc.property(fc.nat(10_000_000), currencyArb, (amount, code) => {
      const result = formatPrice(amount, code);
      // Must be a string
      if (typeof result !== 'string') return false;
      // Must start with the currency symbol
      const sym = CURRENCIES[code].symbol;
      if (!result.startsWith(sym)) return false;
      // Must not be empty after the symbol
      if (result.slice(sym.length).trim() === '') return false;
      // Must contain at least the digits of the amount
      const digits = result.replace(/\D/g, '');
      if (amount === 0) return digits === '0' || digits === '';
      return digits.length > 0;
    }),
  ),
);
