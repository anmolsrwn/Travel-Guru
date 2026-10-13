// tests/properties/p05-filter-correctness.test.js
// Property 5: Filter correctness
// Validates: Requirements 8.4, 8.5
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { filterPackages } from '../../lib/logic.js';
import { CATEGORIES } from '../../lib/data.js';

const categoryIdArb = fc.constantFrom(...CATEGORIES.map((c) => c.id));
const pkgArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  categories: fc.subarray(['international', 'domestic', 'honeymoon', 'family', 'beach'],
    { minLength: 1 }),
});

test(propertyTag(5, 'Filter correctness'), () => {
  // 5a: "all" returns every package (new array)
  assertProperty(
    fc.property(fc.array(pkgArb, { maxLength: 10 }), (packages) => {
      const result = filterPackages(packages, 'all');
      if (result.length !== packages.length) return false;
      if (result === packages) return false; // must be new array
      return true;
    }),
  );

  // 5b: specific category — returned packages all contain that category
  assertProperty(
    fc.property(
      fc.array(pkgArb, { maxLength: 10 }),
      fc.constantFrom('international', 'domestic', 'honeymoon', 'family', 'beach'),
      (packages, catId) => {
        const result = filterPackages(packages, catId);
        return result.every((p) => p.categories.includes(catId));
      },
    ),
  );

  // 5c: specific category — no package with that category is omitted
  assertProperty(
    fc.property(
      fc.array(pkgArb, { maxLength: 10 }),
      fc.constantFrom('international', 'domestic', 'honeymoon', 'family', 'beach'),
      (packages, catId) => {
        const result = filterPackages(packages, catId);
        const resultIds = new Set(result.map((p) => p.id));
        const expected = packages.filter((p) => p.categories.includes(catId));
        return expected.every((p) => resultIds.has(p.id));
      },
    ),
  );

  // 5d: non-array input returns []
  assertProperty(
    fc.property(
      fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer(), fc.string()),
      categoryIdArb,
      (nonArray, catId) => {
        return filterPackages(nonArray, catId).length === 0;
      },
    ),
  );
});
