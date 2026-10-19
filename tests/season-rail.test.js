// tests/season-rail.test.js
// Property tests for the home page season rail selection.
// Feature: merge-plan-getaway-into-destinations
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertProperty, fc } from './helpers.js';
import { selectRailPackages, filterPackagesBySeason, RAIL_MAX_CARDS } from '../lib/logic.js';

const monthArb = fc.integer({ min: 1, max: 12 });
const pkgArb = fc.record({
  id: fc.uuid(),
  seasons: fc.array(monthArb, { maxLength: 12 }),
});
const pkgsArb = fc.array(pkgArb, { maxLength: 20 });

/**
 * Property 1: Rail selection is in-season and capped
 * **Validates: Requirements 1.1, 1.2**
 */
test('Feature: merge-plan-getaway-into-destinations, Property 1: Rail selection is in-season and capped', () => {
  assertProperty(
    fc.property(pkgsArb, monthArb, (packages, month) => {
      const picks = selectRailPackages(packages, month);
      const inSeason = filterPackagesBySeason(packages, month);
      assert.ok(picks.length <= RAIL_MAX_CARDS);
      assert.equal(picks.length, Math.min(inSeason.length, RAIL_MAX_CARDS));
      assert.ok(picks.every((p) => p.seasons.includes(month)));
      // Cap does not hide results: first N in-season packages in input order.
      assert.deepEqual(picks, inSeason.slice(0, RAIL_MAX_CARDS));
    })
  );
});

test('selectRailPackages returns exactly 3 when more than 3 packages match', () => {
  const pkgs = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, seasons: [5] }));
  assert.equal(selectRailPackages(pkgs, 5).length, 3);
});

/**
 * Property 2: Empty selection renders nothing
 * SeasonRail returns null exactly when selectRailPackages is empty.
 * **Validates: Requirements 1.5**
 */
test('Feature: merge-plan-getaway-into-destinations, Property 2: Empty selection renders nothing', () => {
  assertProperty(
    fc.property(pkgsArb, monthArb, (packages, month) => {
      // Strip the chosen month so no package is in season.
      const offSeason = packages.map((p) => ({
        ...p,
        seasons: p.seasons.filter((m) => m !== month),
      }));
      assert.deepEqual(selectRailPackages(offSeason, month), []);
    })
  );
});
