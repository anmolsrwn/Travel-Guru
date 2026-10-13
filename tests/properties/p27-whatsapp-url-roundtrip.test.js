// tests/properties/p27-whatsapp-url-roundtrip.test.js
// Property 27: WhatsApp URL round-trip
// Validates: Requirements 18.6, 18.7
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { buildWhatsAppUrl } from '../../lib/logic.js';

test(propertyTag(27, 'WhatsApp URL round-trip'), () => {
  // 27a: URL starts with https://wa.me/
  assertProperty(
    fc.property(
      fc.stringMatching(/^\d{10,15}$/),
      fc.string({ minLength: 1, maxLength: 200 }),
      (number, message) => {
        const url = buildWhatsAppUrl(number, message);
        return url.startsWith(`https://wa.me/${number}?text=`);
      },
    ),
  );

  // 27b: message is recoverable via decodeURIComponent
  assertProperty(
    fc.property(
      fc.stringMatching(/^\d{10,15}$/),
      fc.string({ minLength: 1, maxLength: 200 }),
      (number, message) => {
        const url = buildWhatsAppUrl(number, message);
        const textParam = url.split('?text=')[1];
        return decodeURIComponent(textParam) === message;
      },
    ),
  );

  // 27c: number embedded verbatim
  assertProperty(
    fc.property(
      fc.stringMatching(/^\d{10,15}$/),
      fc.string({ minLength: 1, maxLength: 50 }),
      (number, message) => {
        const url = buildWhatsAppUrl(number, message);
        return url.includes(`wa.me/${number}?`);
      },
    ),
  );
});
