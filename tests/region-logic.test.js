// tests/region-logic.test.js
// Property tests for the destination region toggle logic.
// Feature: merge-plan-getaway-into-destinations
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertProperty, fc } from './helpers.js';
import { destinationsByRegion, selectRegion } from '../lib/logic.js';

const REGIONS = ['international', 'domestic'];

// Mix of valid and unrelated regions so the "all destinations with a known region" set is non-trivial.
const destArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 12 }),
  region: fc.constantFrom('international', 'domestic', 'mars', ''),
});
const destsArb = fc.array(destArb, { maxLength: 20 });
const regionOrNullArb = fc.constantFrom('international', 'domestic', 'mars', null, undefined);

test('Property 3: Region toggle loses no destination', () => {
  // **Validates: Requirements 2.1, 2.2, 2.3, 2.7**
  assertProperty(
    fc.property(destsArb, (dests) => {
      const reachable = new Set();
      for (const r of REGIONS) {
        // A region is a reachable tab only when it has destinations; the grid for it is destinationsByRegion.
        for (const d of destinationsByRegion(dests, r)) reachable.add(d.id);
      }
      const expected = new Set(dests.filter((d) => REGIONS.includes(d.region)).map((d) => d.id));
      assert.deepEqual([...reachable].sort(), [...expected].sort());
    }),
  );
});

test('Property 3 (via selectRegion): every requested available region shows its full grid', () => {
  // **Validates: Requirements 2.2, 2.7**
  assertProperty(
    fc.property(destsArb, (dests) => {
      const shown = new Set();
      for (const r of REGIONS) {
        const chosen = selectRegion(dests, null, r);
        if (chosen === r) for (const d of destinationsByRegion(dests, chosen)) shown.add(d.id);
      }
      const expected = dests.filter((d) => REGIONS.includes(d.region)).map((d) => d.id);
      assert.deepEqual([...shown].sort(), [...new Set(expected)].sort());
    }),
  );
});

test('Property 4: Region selection falls back to an available region', () => {
  // **Validates: Requirements 2.3, 2.4**
  assertProperty(
    fc.property(destsArb, regionOrNullArb, regionOrNullArb, (dests, active, requested) => {
      const result = selectRegion(dests, active, requested);
      const available = REGIONS.filter((r) => destinationsByRegion(dests, r).length > 0);
      if (available.length === 0) {
        assert.equal(result, null);
      } else {
        assert.ok(available.includes(result), `got ${result}, available ${available}`);
        if (requested != null && available.includes(requested)) assert.equal(result, requested);
        else if (active != null && available.includes(active)) assert.equal(result, active);
        else assert.equal(result, available[0]);
      }
    }),
  );
});

test('selectRegion: examples', () => {
  const dests = [{ id: 'a', region: 'domestic' }];
  assert.equal(selectRegion([], 'domestic', 'international'), null);
  assert.equal(selectRegion(dests, 'international', 'international'), 'domestic');
  assert.equal(selectRegion(dests, null, null), 'domestic');
});
