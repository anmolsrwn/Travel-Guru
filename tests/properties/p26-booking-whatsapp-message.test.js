// tests/properties/p26-booking-whatsapp-message.test.js
// Property 26: Booking WhatsApp message completeness
// Validates: Requirements 12.4, 12.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { composeBookingWhatsAppMessage } from '../../lib/logic.js';
import { PACKAGES, BUSINESS } from '../../lib/data.js';

const packageArb = fc.constantFrom(...PACKAGES);

test(propertyTag(26, 'Booking WhatsApp message completeness'), () => {
  // 26a: message is a non-empty string
  assertProperty(
    fc.property(
      packageArb,
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 0, max: 8 }),
      (pkg, adults, children) => {
        const tier = pkg.tiers[0];
        const breakdown = {
          tierId: tier.id,
          adults,
          children,
          total: adults * tier.adultPriceINR,
          advance: Math.ceil(adults * tier.adultPriceINR * 0.5),
          balance: Math.floor(adults * tier.adultPriceINR * 0.5),
          rule: 'standard',
          balanceDueDate: '2030-01-01',
        };
        const msg = composeBookingWhatsAppMessage(pkg, {}, breakdown, BUSINESS);
        return typeof msg === 'string' && msg.trim().length > 0;
      },
    ),
  );

  // 26b: message contains the package title
  assertProperty(
    fc.property(packageArb, (pkg) => {
      const tier = pkg.tiers[0];
      const breakdown = {
        tierId: tier.id,
        adults: 2,
        children: 0,
        total: 2 * tier.adultPriceINR,
        advance: tier.adultPriceINR,
        balance: tier.adultPriceINR,
        rule: 'standard',
        balanceDueDate: '2030-01-01',
      };
      const msg = composeBookingWhatsAppMessage(pkg, {}, breakdown, BUSINESS);
      return msg.includes(pkg.title);
    }),
  );

  // 26c: last line is "Flights & visa to be quoted separately."
  assertProperty(
    fc.property(packageArb, (pkg) => {
      const tier = pkg.tiers[0];
      const breakdown = {
        tierId: tier.id,
        adults: 2,
        children: 0,
        total: 2 * tier.adultPriceINR,
        advance: tier.adultPriceINR,
        balance: tier.adultPriceINR,
        rule: 'standard',
        balanceDueDate: '2030-01-01',
      };
      const msg = composeBookingWhatsAppMessage(pkg, {}, breakdown, BUSINESS);
      const lastLine = msg.split('\n').filter((l) => l.trim()).at(-1);
      return lastLine === 'Flights & visa to be quoted separately.';
    }),
  );
});
