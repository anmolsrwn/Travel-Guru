// tests/properties/p08-inclusions-selection.test.js
// Property 8: Inclusions selection
// Validates: Requirement 11.15
import { test } from 'node:test';
import { propertyTag, assertProperty, fc } from '../helpers.js';
import { packageInclusions } from '../../lib/logic.js';
import { POLICIES } from '../../lib/data.js';

const regionArb = fc.constantFrom('international', 'domestic');
const inclusionsArb = fc.option(
  fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  { nil: null },
);

test(propertyTag(8, 'Inclusions selection'), () => {
  // 8a: when pkg.inclusions is set, returns a copy of that array
  assertProperty(
    fc.property(
      regionArb,
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
      (region, inclusions) => {
        const pkg = { region, inclusions };
        const result = packageInclusions(pkg);
        if (result.length !== inclusions.length) return false;
        if (result === inclusions) return false; // must be new array
        return result.every((item, i) => item === inclusions[i]);
      },
    ),
  );

  // 8b: when pkg.inclusions is null/undefined, returns the region default from POLICIES
  assertProperty(
    fc.property(regionArb, (region) => {
      const pkg = { region, inclusions: null };
      const result = packageInclusions(pkg);
      const expected =
        region === 'domestic' ? POLICIES.inclusionsDomestic : POLICIES.inclusions;
      if (result === expected) return false; // must be new array
      return result.length === expected.length && result.every((item, i) => item === expected[i]);
    }),
  );
});
