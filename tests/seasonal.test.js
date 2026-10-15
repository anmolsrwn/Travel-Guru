// tests/seasonal.test.js
// Example-based and property-based tests for seasonal filtering functions.
// Validates: Requirements 54.1, 54.2, 54.3, 54.4
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, assertProperty, fc } from './helpers.js';
import { filterPackagesBySeason, isPackageInSeason, validatePackage } from '../lib/logic.js';
import { PACKAGES } from '../lib/data.js';

// ---------------------------------------------------------------------------
// Example-based tests
// ---------------------------------------------------------------------------

test('filterPackagesBySeason([], 10) returns []', () => {
  assert.deepEqual(filterPackagesBySeason([], 10), []);
});

test('filterPackagesBySeason(PACKAGES, 10) returns bali, dubai, kerala, vietnam in input order', () => {
  const result = filterPackagesBySeason(PACKAGES, 10);
  assert.equal(result.length, 4);
  assert.equal(result[0].id, 'bali-6n7d');
  assert.equal(result[1].id, 'dubai-4n5d');
  assert.equal(result[2].id, 'kerala-5n6d');
  assert.equal(result[3].id, 'vietnam-7n8d');
});

test('filterPackagesBySeason(PACKAGES, 6) returns [] (no package has 6 in its seasons)', () => {
  assert.deepEqual(filterPackagesBySeason(PACKAGES, 6), []);
});

test('package with seasons: [] is excluded for any month', () => {
  const pkgs = [{ id: 'empty-seasons', seasons: [] }];
  for (let m = 1; m <= 12; m++) {
    assert.deepEqual(filterPackagesBySeason(pkgs, m), []);
  }
});

test('package with no seasons field is excluded for any month', () => {
  const pkgs = [{ id: 'no-seasons' }];
  for (let m = 1; m <= 12; m++) {
    assert.deepEqual(filterPackagesBySeason(pkgs, m), []);
  }
});

test('filterPackagesBySeason(PACKAGES, 0) returns [] (month 0 is invalid)', () => {
  assert.deepEqual(filterPackagesBySeason(PACKAGES, 0), []);
});

test('filterPackagesBySeason(PACKAGES, 13) returns [] (month 13 is invalid)', () => {
  assert.deepEqual(filterPackagesBySeason(PACKAGES, 13), []);
});

test('filterPackagesBySeason(PACKAGES, null) returns []', () => {
  assert.deepEqual(filterPackagesBySeason(PACKAGES, null), []);
});

test('filterPackagesBySeason(PACKAGES, undefined) returns []', () => {
  assert.deepEqual(filterPackagesBySeason(PACKAGES, undefined), []);
});

test('isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 10) returns true', () => {
  assert.equal(isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 10), true);
});

test('isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 6) returns false', () => {
  assert.equal(isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 6), false);
});

test('isPackageInSeason(null, 10) returns false', () => {
  assert.equal(isPackageInSeason(null, 10), false);
});

test('isPackageInSeason({ seasons: [10] }, null) returns false', () => {
  assert.equal(isPackageInSeason({ seasons: [10] }, null), false);
});

test('isPackageInSeason({}, 10) returns false (no seasons field)', () => {
  assert.equal(isPackageInSeason({}, 10), false);
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/** A package with a valid seasons array (integers 1–12, possibly empty). */
const seasonalPkgArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  seasons: fc.array(fc.integer({ min: 1, max: 12 }), { maxLength: 12 }),
});

const validMonthArb = fc.integer({ min: 1, max: 12 });

/**
 * Validates: Requirements S2.2, S2.3
 * **Validates: Requirements 54.3**
 */
test(propertyTag(1, 'Season filter only returns in-season packages'), () => {
  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 20 }),
      validMonthArb,
      (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        return result.every((pkg) => pkg.seasons.includes(month));
      },
    ),
  );
});

/**
 * Validates: Requirements S2.2, S2.3
 * **Validates: Requirements 54.3**
 */
test(propertyTag(2, 'Season filter excludes out-of-season packages'), () => {
  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 20 }),
      validMonthArb,
      (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        // No result element should have a seasons array that does not contain month
        return !result.some((pkg) => !pkg.seasons.includes(month));
      },
    ),
  );
});

/**
 * Validates: Requirements S2.2, S2.6, S2.7
 * **Validates: Requirements 54.3**
 */
test(propertyTag(3, 'isPackageInSeason agrees with filterPackagesBySeason'), () => {
  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 20 }),
      validMonthArb,
      (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        // Every package in the result must have isPackageInSeason === true
        const allInResultAreInSeason = result.every((pkg) => isPackageInSeason(pkg, month));
        // Every package NOT in the result must have isPackageInSeason === false
        const resultSet = new Set(result);
        const allOutOfResultAreNotInSeason = packages
          .filter((pkg) => !resultSet.has(pkg))
          .every((pkg) => !isPackageInSeason(pkg, month));
        return allInResultAreInSeason && allOutOfResultAreNotInSeason;
      },
    ),
  );
});

/**
 * Validates: Requirements S2.2
 * **Validates: Requirements 54.3**
 */
test(propertyTag(4, 'Season filter result is a subset of input'), () => {
  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 20 }),
      validMonthArb,
      (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        // Every element in result is present in the input (by reference)
        const allPresent = result.every((pkg) => packages.includes(pkg));
        // Result length is no greater than input length
        const lengthOk = result.length <= packages.length;
        return allPresent && lengthOk;
      },
    ),
  );
});

/**
 * Validates: Requirements S2.2
 * **Validates: Requirements 54.3**
 */
test(propertyTag(5, 'Season filter preserves input order'), () => {
  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 20 }),
      validMonthArb,
      (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        // The result elements must appear in the same relative order as in packages
        let lastIndex = -1;
        for (const pkg of result) {
          const idx = packages.indexOf(pkg);
          if (idx <= lastIndex) return false;
          lastIndex = idx;
        }
        return true;
      },
    ),
  );
});

/**
 * Validates: Requirements S2.4, S2.8
 * **Validates: Requirements 54.3**
 */
test(propertyTag(6, 'Invalid month returns empty / false'), () => {
  // Out-of-range integers: < 1 or > 12
  const outOfRangeIntArb = fc.oneof(
    fc.integer({ min: -1000, max: 0 }),
    fc.integer({ min: 13, max: 1000 }),
  );
  // Non-integer numbers (finite and non-finite)
  const nonIntNumberArb = fc.oneof(
    fc.double({ noNaN: true, noDefaultInfinity: false }).filter((n) => !Number.isInteger(n)),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity),
  );
  // Null and undefined
  const nullishArb = fc.constantFrom(null, undefined);

  const invalidMonthArb = fc.oneof(outOfRangeIntArb, nonIntNumberArb, nullishArb);

  assertProperty(
    fc.property(
      fc.array(seasonalPkgArb, { maxLength: 10 }),
      seasonalPkgArb,
      invalidMonthArb,
      (packages, pkg, month) => {
        const filterResult = filterPackagesBySeason(packages, month);
        const inSeasonResult = isPackageInSeason(pkg, month);
        return filterResult.length === 0 && inSeasonResult === false;
      },
    ),
  );
});

/**
 * Validates: Requirements S1.2–S1.7, S3.3, S3.8
 * **Validates: Requirements 54.3**
 */
test(propertyTag(7, 'All PACKAGES entries pass validatePackage'), () => {
  // This is a deterministic check over a fixed array, run as a property for consistency
  assertProperty(
    fc.property(fc.constant(PACKAGES), (packages) => {
      return packages.every((pkg) => {
        const r = validatePackage(pkg);
        return r.valid === true;
      });
    }),
  );
});
