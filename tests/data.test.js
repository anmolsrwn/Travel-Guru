// tests/data.test.js
// Task 2.6: Data integrity tests for lib/data.js (Req 28.9, 1.1–1.5, 30.3, 34.1, 34.2, 34.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS,
  CATEGORIES,
  CURRENCIES,
  CALLBACK_SLOTS,
  QUOTE_SERVICE_OPTIONS,
  TIER_IDS,
  LIMITS,
  LEAD_STATUSES,
  BOOKING_STATUSES,
  RATE_LIMITS,
  API_LIMITS,
  IMAGE_HOSTS,
  FORBIDDEN_CLAIMS,
  PACKAGES,
  DESTINATIONS,
  POLICIES,
} from '../lib/data.js';

// ---------------------------------------------------------------------------
// BUSINESS
// ---------------------------------------------------------------------------
test('BUSINESS has all required keys', () => {
  const required = [
    'brandName', 'shortName', 'logoInitials', 'logo', 'favicon', 'ogImage',
    'heroImage', 'timeZone', 'tagline', 'motto', 'website', 'email', 'phones',
    'whatsapp', 'expert', 'address', 'originCity', 'baseCurrency', 'paymentPolicy',
    'quoteValidityHours', 'callbackHours', 'whatsappResponseMins', 'ticketPrefix',
    'bookingPrefix', 'rating', 'badges',
  ];
  for (const key of required) {
    assert.ok(Object.prototype.hasOwnProperty.call(BUSINESS, key), `BUSINESS missing key: ${key}`);
  }
});

test('BUSINESS has no leadEndpoint key', () => {
  assert.ok(!Object.prototype.hasOwnProperty.call(BUSINESS, 'leadEndpoint'),
    'BUSINESS must not have leadEndpoint');
});

test('BUSINESS asset paths are root-relative', () => {
  assert.ok(BUSINESS.logo.src.startsWith('/assets/'), 'logo.src must be root-relative');
  assert.ok(BUSINESS.favicon.startsWith('/assets/'), 'favicon must be root-relative');
  assert.ok(BUSINESS.ogImage.startsWith('/assets/'), 'ogImage must be root-relative');
  assert.ok(BUSINESS.expert.photo.startsWith('/assets/'), 'expert.photo must be root-relative');
});

test('BUSINESS.timeZone is "Asia/Kolkata"', () => {
  assert.equal(BUSINESS.timeZone, 'Asia/Kolkata');
});

test('BUSINESS.heroImage is a URL (not root-relative)', () => {
  assert.ok(
    BUSINESS.heroImage.startsWith('http://') || BUSINESS.heroImage.startsWith('https://'),
    'heroImage must be a URL',
  );
});

// ---------------------------------------------------------------------------
// CURRENCIES
// ---------------------------------------------------------------------------
test('CURRENCIES includes INR and has correct shape', () => {
  assert.ok('INR' in CURRENCIES, 'CURRENCIES must include INR');
  for (const [code, cur] of Object.entries(CURRENCIES)) {
    assert.equal(typeof cur.symbol, 'string', `${code}.symbol must be a string`);
    assert.equal(typeof cur.rate, 'number', `${code}.rate must be a number`);
    assert.ok(cur.rate > 0, `${code}.rate must be positive`);
    assert.equal(typeof cur.locale, 'string', `${code}.locale must be a string`);
    assert.ok(Number.isInteger(cur.decimals) && cur.decimals >= 0,
      `${code}.decimals must be a non-negative integer`);
  }
  assert.equal(CURRENCIES.INR.rate, 1, 'INR rate must be 1');
});

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------
test('CATEGORIES has "all" as first entry and at least 5 entries', () => {
  assert.ok(Array.isArray(CATEGORIES));
  assert.equal(CATEGORIES[0].id, 'all', 'First category must be "all"');
  assert.ok(CATEGORIES.length >= 5, 'Must have at least 5 categories');
  for (const c of CATEGORIES) {
    assert.equal(typeof c.id, 'string', 'category.id must be a string');
    assert.equal(typeof c.label, 'string', 'category.label must be a string');
  }
  // Unique ids
  const ids = CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'CATEGORIES ids must be unique');
});

// ---------------------------------------------------------------------------
// TIER_IDS
// ---------------------------------------------------------------------------
test('TIER_IDS has at least 2 entries and each is a non-empty string', () => {
  assert.ok(Array.isArray(TIER_IDS) && TIER_IDS.length >= 2);
  for (const id of TIER_IDS) {
    assert.equal(typeof id, 'string');
    assert.ok(id.trim().length > 0, `TIER_IDS entry must be non-empty: "${id}"`);
  }
  assert.equal(new Set(TIER_IDS).size, TIER_IDS.length, 'TIER_IDS must be unique');
});

// ---------------------------------------------------------------------------
// LIMITS
// ---------------------------------------------------------------------------
test('LIMITS has required keys with correct types', () => {
  assert.ok(Array.isArray(LIMITS.adults) && LIMITS.adults.length === 2);
  assert.ok(Array.isArray(LIMITS.children) && LIMITS.children.length === 2);
  assert.ok(Number.isInteger(LIMITS.childAgesMaxLength));
  assert.ok(Array.isArray(LIMITS.fullName) && LIMITS.fullName.length === 2);
  assert.ok(Number.isInteger(LIMITS.departureCityMax));
  assert.ok(Number.isInteger(LIMITS.destinationsMax));
  assert.ok(Number.isInteger(LIMITS.emailMax));
  assert.ok(Number.isInteger(LIMITS.phoneMax));
  assert.ok(Number.isInteger(LIMITS.notesMax));
});

// ---------------------------------------------------------------------------
// LEAD_STATUSES / BOOKING_STATUSES
// ---------------------------------------------------------------------------
test('LEAD_STATUSES is a non-empty string array', () => {
  assert.ok(Array.isArray(LEAD_STATUSES) && LEAD_STATUSES.length > 0);
  assert.ok(LEAD_STATUSES.includes('new'));
});

test('BOOKING_STATUSES is a non-empty string array', () => {
  assert.ok(Array.isArray(BOOKING_STATUSES) && BOOKING_STATUSES.length > 0);
  assert.ok(BOOKING_STATUSES.includes('pending'));
});

// ---------------------------------------------------------------------------
// RATE_LIMITS / API_LIMITS / IMAGE_HOSTS / FORBIDDEN_CLAIMS
// ---------------------------------------------------------------------------
test('RATE_LIMITS has quote, booking and login entries', () => {
  for (const key of ['quote', 'booking', 'login']) {
    assert.ok(RATE_LIMITS[key]?.limit > 0, `RATE_LIMITS.${key}.limit must be positive`);
    assert.ok(RATE_LIMITS[key]?.windowMs > 0, `RATE_LIMITS.${key}.windowMs must be positive`);
  }
});

test('API_LIMITS has maxBodyBytes, maxIdAttempts, clientTimeoutMs', () => {
  assert.ok(Number.isInteger(API_LIMITS.maxBodyBytes) && API_LIMITS.maxBodyBytes > 0);
  assert.ok(Number.isInteger(API_LIMITS.maxIdAttempts) && API_LIMITS.maxIdAttempts > 0);
  assert.ok(Number.isInteger(API_LIMITS.clientTimeoutMs) && API_LIMITS.clientTimeoutMs > 0);
});

test('IMAGE_HOSTS is a non-empty array of strings', () => {
  assert.ok(Array.isArray(IMAGE_HOSTS) && IMAGE_HOSTS.length > 0);
  for (const h of IMAGE_HOSTS) assert.equal(typeof h, 'string');
});

test('FORBIDDEN_CLAIMS is a non-empty array of strings', () => {
  assert.ok(Array.isArray(FORBIDDEN_CLAIMS) && FORBIDDEN_CLAIMS.length > 0);
  for (const claim of FORBIDDEN_CLAIMS) assert.equal(typeof claim, 'string');
});

// ---------------------------------------------------------------------------
// CALLBACK_SLOTS
// ---------------------------------------------------------------------------
test('CALLBACK_SLOTS has at least 1 entry with id and label', () => {
  assert.ok(Array.isArray(CALLBACK_SLOTS) && CALLBACK_SLOTS.length >= 1);
  const ids = CALLBACK_SLOTS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'CALLBACK_SLOTS ids must be unique');
  for (const s of CALLBACK_SLOTS) {
    assert.equal(typeof s.id, 'string');
    assert.equal(typeof s.label, 'string');
  }
});

// ---------------------------------------------------------------------------
// QUOTE_SERVICE_OPTIONS
// ---------------------------------------------------------------------------
test('QUOTE_SERVICE_OPTIONS has 8 unique non-empty strings', () => {
  assert.equal(QUOTE_SERVICE_OPTIONS.length, 8);
  assert.equal(new Set(QUOTE_SERVICE_OPTIONS).size, 8, 'Must be unique');
  for (const o of QUOTE_SERVICE_OPTIONS) assert.ok(o.trim().length > 0);
});

// ---------------------------------------------------------------------------
// PACKAGES
// ---------------------------------------------------------------------------
test('exactly four real PACKAGES', () => {
  assert.equal(PACKAGES.length, 4, `Expected 4 packages, got ${PACKAGES.length}`);
});

test('PACKAGES have unique ids', () => {
  const ids = PACKAGES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length,
    `Duplicate package ids: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
});

test('each PACKAGE has required top-level keys', () => {
  const required = ['id', 'title', 'region', 'categories', 'nights', 'days', 'image', 'tiers'];
  for (const pkg of PACKAGES) {
    for (const key of required) {
      assert.ok(Object.prototype.hasOwnProperty.call(pkg, key),
        `Package "${pkg.id}" missing key: ${key}`);
    }
  }
});

test('PACKAGES: days = nights + 1', () => {
  for (const pkg of PACKAGES) {
    assert.equal(pkg.days, pkg.nights + 1,
      `Package "${pkg.id}": days (${pkg.days}) must equal nights + 1 (${pkg.nights + 1})`);
  }
});

test('PACKAGES: region included in categories', () => {
  for (const pkg of PACKAGES) {
    assert.ok(Array.isArray(pkg.categories) && pkg.categories.includes(pkg.region),
      `Package "${pkg.id}": region "${pkg.region}" must be in categories`);
  }
});

test('PACKAGES: each tier has adultPriceINR > 0', () => {
  for (const pkg of PACKAGES) {
    assert.ok(Array.isArray(pkg.tiers) && pkg.tiers.length >= 1,
      `Package "${pkg.id}": must have at least 1 tier`);
    for (const tier of pkg.tiers) {
      assert.ok(tier.adultPriceINR > 0,
        `Package "${pkg.id}", tier "${tier.id}": adultPriceINR must be > 0`);
      assert.ok(TIER_IDS.includes(tier.id),
        `Package "${pkg.id}", tier "${tier.id}": id must be in TIER_IDS`);
    }
  }
});

test('PACKAGES cover at least international and domestic categories', () => {
  const allCats = PACKAGES.flatMap((p) => p.categories);
  assert.ok(allCats.includes('international'), 'Must have at least one international package');
  assert.ok(allCats.includes('domestic'), 'Must have at least one domestic package');
});

test('PACKAGES Singapore package has priceNote', () => {
  // At least one package should have a priceNote in one of its tiers (Singapore requirement)
  const withPriceNote = PACKAGES.flatMap((p) => p.tiers).some((t) => t.priceNote);
  assert.ok(withPriceNote, 'At least one tier must have a priceNote (Singapore requirement)');
});

// ---------------------------------------------------------------------------
// DESTINATIONS
// ---------------------------------------------------------------------------
test('14 DESTINATIONS', () => {
  assert.equal(DESTINATIONS.length, 14, `Expected 14 destinations, got ${DESTINATIONS.length}`);
});

test('DESTINATIONS have unique ids', () => {
  const ids = DESTINATIONS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length,
    `Duplicate destination ids: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
});

test('each DESTINATION has required keys and valid region', () => {
  const pkgIds = new Set(PACKAGES.map((p) => p.id));
  for (const d of DESTINATIONS) {
    assert.ok(d.id, `Destination missing id`);
    assert.ok(d.name, `Destination "${d.id}" missing name`);
    assert.ok(d.tagline, `Destination "${d.id}" missing tagline`);
    assert.ok(['international', 'domestic'].includes(d.region),
      `Destination "${d.id}" has invalid region: ${d.region}`);
    assert.ok(d.image, `Destination "${d.id}" missing image`);
    // packageId must be null or a valid package id
    if (d.packageId != null) {
      assert.ok(pkgIds.has(d.packageId),
        `Destination "${d.id}": packageId "${d.packageId}" not in PACKAGES`);
    }
  }
});

test('DESTINATIONS have both international and domestic entries', () => {
  const regions = new Set(DESTINATIONS.map((d) => d.region));
  assert.ok(regions.has('international'), 'Must have international destinations');
  assert.ok(regions.has('domestic'), 'Must have domestic destinations');
});

// ---------------------------------------------------------------------------
// POLICIES (cancellation)
// ---------------------------------------------------------------------------
test('POLICIES.cancellation.table has contiguous bands covering 0+', () => {
  const table = POLICIES.cancellation.table;
  assert.ok(Array.isArray(table) && table.length > 0, 'cancellation table must be non-empty');

  // Sort by minDays to check contiguity
  const sorted = [...table].sort((a, b) => a.minDays - b.minDays);
  assert.equal(sorted[0].minDays, 0, `First band must start at 0, starts at ${sorted[0].minDays}`);

  for (let i = 0; i < sorted.length; i++) {
    const band = sorted[i];
    assert.ok(Number.isInteger(band.minDays) && band.minDays >= 0,
      `Band ${i}: minDays must be a non-negative integer`);
    assert.ok(
      band.maxDays === null || (Number.isInteger(band.maxDays) && band.maxDays >= band.minDays),
      `Band ${i}: maxDays must be null or >= minDays`,
    );
    assert.ok(typeof band.rate === 'number' && band.rate >= 0 && band.rate <= 1,
      `Band ${i}: rate must be in [0, 1]`);

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const expectedNext = band.maxDays != null ? band.maxDays + 1 : null;
      if (expectedNext !== null) {
        assert.equal(next.minDays, expectedNext,
          `Band gap: band ${i} ends at ${band.maxDays}, band ${i + 1} starts at ${next.minDays}`);
      }
    }
  }
  // Last band must be open-ended (maxDays === null) or cover all remaining days
  const last = sorted[sorted.length - 1];
  assert.equal(last.maxDays, null, `Last cancellation band must be open-ended (maxDays: null)`);
});
