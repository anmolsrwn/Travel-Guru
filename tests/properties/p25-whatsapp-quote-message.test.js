// tests/properties/p25-whatsapp-quote-message.test.js
// Property 25: WhatsApp quote message completeness
// Validates: Requirements 18.3, 18.4, 18.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { composeQuoteWhatsAppMessage } from '../../lib/logic.js';
import { QUOTE_SERVICE_OPTIONS, CALLBACK_SLOTS, BUSINESS } from '../../lib/data.js';

const validFormArb = fc.record({
  services: fc.subarray(QUOTE_SERVICE_OPTIONS, { minLength: 1, maxLength: Math.min(4, QUOTE_SERVICE_OPTIONS.length) }),
  fullName: fc.string({ minLength: 2, maxLength: 40 }),
  phone: fc.integer({ min: 10000000, max: 9999999999 }).map((n) => String(n)),
  adults: fc.integer({ min: 1, max: 6 }),
  children: fc.integer({ min: 0, max: 4 }),
  childAges: fc.string({ maxLength: 30 }),
  departureCity: fc.string({ maxLength: 20 }),
  destinations: fc.string({ minLength: 1, maxLength: 50 }),
  departureDate: fc.constant('2030-01-15'),
  callbackSlot: fc.constantFrom(...CALLBACK_SLOTS.map((s) => s.id)),
  notes: fc.string({ maxLength: 100 }),
});

test(propertyTag(25, 'WhatsApp quote message completeness'), () => {
  // 25a: message is always a non-empty string
  assertProperty(
    fc.property(validFormArb, (data) => {
      const msg = composeQuoteWhatsAppMessage(data, BUSINESS);
      return typeof msg === 'string' && msg.trim().length > 0;
    }),
  );

  // 25b: message contains the fullName
  assertProperty(
    fc.property(validFormArb.filter((d) => d.fullName.trim().length >= 2), (data) => {
      const msg = composeQuoteWhatsAppMessage(data, BUSINESS);
      return msg.includes(data.fullName.trim());
    }),
  );

  // 25c: message contains at least one service
  assertProperty(
    fc.property(validFormArb, (data) => {
      const msg = composeQuoteWhatsAppMessage(data, BUSINESS);
      return data.services.some((svc) => msg.includes(svc));
    }),
  );

  // 25d: message contains the destinations when non-empty
  assertProperty(
    fc.property(validFormArb.filter((d) => d.destinations.trim().length > 0), (data) => {
      const msg = composeQuoteWhatsAppMessage(data, BUSINESS);
      return msg.includes(data.destinations.trim());
    }),
  );
});
