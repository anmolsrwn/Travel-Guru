// Shared fast-check generators for CMS content (Packages and Destinations).
// Shapes mirror the real PACKAGES / DESTINATIONS in lib/data.js. Every generated value
// passes validatePackage / validateDestination with the default options.
// Text is built from letter-only words, so no FORBIDDEN_CLAIMS phrase can appear.
// Optional keys are omitted (never `undefined`) so row mappings round-trip.
import fc from 'fast-check';
import { CATEGORIES, IMAGE_HOSTS, TIER_IDS } from '../lib/data.js';

const WORDS = [
  'Bali', 'Ubud', 'Dubai', 'Kerala', 'Munnar', 'Sentosa', 'beach', 'villa', 'tour', 'drive',
  'private', 'sharing', 'hotel', 'resort', 'desert', 'safari', 'cruise', 'temple', 'garden', 'lake',
]; // every word ≤ 7 characters (textArb length bound relies on it)

/** 1+ words joined by spaces, at most `maxLen` characters (each word ≤ 7 chars). */
export const textArb = (maxLen, minWords = 1) =>
  fc
    .array(fc.constantFrom(...WORDS), { minLength: minWords, maxLength: Math.max(minWords, Math.floor((maxLen + 1) / 8)) })
    .map((ws) => ws.join(' '));

const slugArb = fc
  .array(fc.stringMatching(/^[a-z0-9]{1,8}$/), { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join('-'));

const priceArb = fc.integer({ min: 1, max: 10_000_000 });
const nullablePriceArb = fc.option(priceArb, { nil: null });

export const imageArb = fc.oneof(
  fc.stringMatching(/^[a-z0-9-]{1,30}$/).map((name) => `/assets/${name}.jpg`),
  fc
    .tuple(fc.constantFrom(...IMAGE_HOSTS), fc.stringMatching(/^[a-z0-9-]{1,40}$/))
    .map(([host, photo]) => `https://${host}/photo-${photo}?auto=format&fit=crop&w=800&q=70`),
);

/** Split `total` (≥ 1) into 1–min(total, 10) positive integers. */
const partitionArb = (total) =>
  fc
    .uniqueArray(fc.integer({ min: 1, max: total - 1 }), { maxLength: Math.min(total, 10) - 1 })
    .map((cuts) => {
      const sorted = [...cuts].sort((a, b) => a - b);
      const bounds = [0, ...sorted, total];
      return bounds.slice(1).map((b, i) => b - bounds[i]);
    });

const hotelsArb = (nights) =>
  (nights > 1 ? partitionArb(nights) : fc.constant([1])).chain((parts) =>
    fc.tuple(
      ...parts.map((n) =>
        fc.record({
          location: textArb(80),
          nights: fc.constant(n),
          names: fc.array(textArb(80), { minLength: 1, maxLength: 6 }),
          roomType: fc.option(textArb(120), { nil: null }),
        }),
      ),
    ),
  );

const tierArb = (id, nights) =>
  fc.record(
    {
      id: fc.constant(id),
      label: textArb(40),
      hotelLabel: textArb(40),
      priceNote: textArb(300),
      adultPriceINR: priceArb,
      childPriceINR: nullablePriceArb,
      hotels: hotelsArb(nights),
    },
    { requiredKeys: ['id', 'label', 'adultPriceINR', 'childPriceINR', 'hotels'] },
  );

const tiersArb = (nights) =>
  fc
    .shuffledSubarray(TIER_IDS, { minLength: 2, maxLength: 3 })
    .chain((ids) => fc.tuple(...ids.map((id) => tierArb(id, nights))));

const extrasArb = fc.record({
  flightFareINR: nullablePriceArb,
  flightNote: fc.option(textArb(300), { nil: null }),
  visa: fc.option(fc.record({ feeINR: priceArb, type: textArb(80) }), { nil: null }),
  onArrivalCharges: fc.array(textArb(200), { maxLength: 10 }),
});

const itineraryArb = (days) =>
  fc.tuple(
    ...Array.from({ length: days }, (_, i) =>
      fc.record(
        {
          day: fc.constant(i + 1),
          title: textArb(120),
          transferType: fc.constantFrom('private', 'sharing', 'mixed'),
          description: textArb(1000),
        },
        { requiredKeys: ['day', 'title', 'description'] },
      ),
    ),
  );

const FILTER_CATEGORIES = CATEGORIES.map((c) => c.id).filter((id) => id !== 'all');
const regionArb = fc.constantFrom('international', 'domestic');

/** Well-formed package: nights 1–10, days = nights + 1, 2–3 unique tiers, allowed image. */
export const validPackageArb = fc
  .record({ region: regionArb, nights: fc.integer({ min: 1, max: 10 }) })
  .chain(({ region, nights }) =>
    fc.record(
      {
        id: slugArb,
        title: textArb(110).map((t) => `Trip to ${t}`),
        destination: textArb(110).map((t) => `${t} Region`),
        region: fc.constant(region),
        categories: fc
          .subarray(FILTER_CATEGORIES.filter((c) => c !== region))
          .map((rest) => [region, ...rest]),
        nights: fc.constant(nights),
        days: fc.constant(nights + 1),
        image: imageArb,
        highlights: fc.array(textArb(80), { maxLength: 6 }),
        hotelStarRating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
        mealPlan: textArb(200),
        transferBasis: textArb(200),
        tiers: tiersArb(nights),
        extras: extrasArb,
        inclusions: fc.array(textArb(200), { minLength: 1, maxLength: 20 }),
        itinerary: itineraryArb(nights + 1),
        isSample: fc.boolean(),
        notes: fc.array(textArb(300), { maxLength: 5 }),
      },
      {
        requiredKeys: [
          'id', 'title', 'destination', 'region', 'categories', 'nights', 'days', 'image', 'highlights',
          'hotelStarRating', 'mealPlan', 'transferBasis', 'tiers', 'extras', 'itinerary',
        ],
      },
    ),
  );

/**
 * Well-formed destination whose `packageId` is null or drawn from `packageIds`
 * (any slug when `packageIds` is omitted or empty). Validate with the same ids.
 * @param {string[]} [packageIds]
 */
export const destinationArbWith = (packageIds) =>
  fc.record({
    id: slugArb,
    name: textArb(80),
    tagline: textArb(120),
    region: regionArb,
    image: imageArb,
    packageId: fc.option(
      Array.isArray(packageIds) && packageIds.length > 0 ? fc.constantFrom(...packageIds) : slugArb,
      { nil: null },
    ),
  });

/** Well-formed destination; `packageId` is null or any slug (validate without `packageIds`). */
export const destinationArb = destinationArbWith();
