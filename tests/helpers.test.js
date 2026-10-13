import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyTag, fcParams, assertProperty, fc, MIN_RUNS } from './helpers.js';

test('propertyTag uses the required format', () => {
  assert.equal(
    propertyTag(1, 'Conversion identity'),
    'Feature: travel-agency-website, Property 1: Conversion identity'
  );
  assert.throws(() => propertyTag(0, 'x'));
  assert.throws(() => propertyTag(2, '  '));
});

test('fcParams enforces at least 100 runs', () => {
  assert.equal(MIN_RUNS, 100);
  assert.equal(fcParams().numRuns, 100);
  assert.equal(fcParams({ numRuns: 10 }).numRuns, 100);
  assert.equal(fcParams({ numRuns: 500, seed: 42 }).numRuns, 500);
  assert.equal(fcParams({ seed: 42 }).seed, 42);
});

test('assertProperty executes the property at least 100 times', () => {
  let runs = 0;
  assertProperty(fc.property(fc.integer(), () => { runs += 1; return true; }), { numRuns: 1 });
  assert.ok(runs >= 100);
});
