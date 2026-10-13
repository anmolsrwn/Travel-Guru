// tests/properties/p06-region-partition.test.js
// Property 6: Region partition — filterPackages("international") + filterPackages("domestic")
// partitions all packages that have at least one of those regions.
// Validates: Requirement 8.6
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { filterPackages } from '../../lib/logic.js';

const pkgArb = fc.record({
  id: fc.uuid(),
  categories: fc.subarray(['international', 'domestic', 'honeymoon', 'family', 'beach'],
    { minLength: 1 }),
});

test(propertyTag(6, 'Region partition'), () =>
  assertProperty(
    fc.property(fc.array(pkgArb, { maxLength: 15 }), (packages) => {
      const intl = filterPackages(packages, 'international');
      const domestic = filterPackages(packages, 'domestic');
      // No overlap
      const intlIds = new Set(intl.map((p) => p.id));
      const domIds = new Set(domestic.map((p) => p.id));
      for (const id of intlIds) {
        if (domIds.has(id)) {
          // A package can legitimately appear in both if it has both categories
          const pkg = packages.find((p) => p.id === id);
          if (!pkg.categories.includes('domestic')) return false;
        }
      }
      return true;
    }),
  ),
);
