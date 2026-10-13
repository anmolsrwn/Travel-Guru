// Shared fast-check configuration for property-based tests.
// Every property runs at least MIN_RUNS times and is tagged with the
// format "Feature: travel-agency-website, Property {n}: {title}".
import fc from 'fast-check';

export const FEATURE = 'travel-agency-website';
export const MIN_RUNS = 100;

/** Build the canonical property tag. */
export function propertyTag(n, title) {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Property number must be a positive integer, got ${n}`);
  }
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error('Property title must be a non-empty string');
  }
  return `Feature: ${FEATURE}, Property ${n}: ${title.trim()}`;
}

/** fast-check parameters with numRuns clamped to at least MIN_RUNS. */
export function fcParams(overrides = {}) {
  const numRuns = Math.max(MIN_RUNS, overrides.numRuns ?? MIN_RUNS);
  return { ...overrides, numRuns };
}

/**
 * Run a property with the enforced config.
 * Usage inside node:test:
 *   test(propertyTag(1, 'Conversion identity'), () =>
 *     assertProperty(fc.property(arb, (x) => ...)));
 */
export function assertProperty(property, overrides = {}) {
  fc.assert(property, fcParams(overrides));
}

export { fc };
