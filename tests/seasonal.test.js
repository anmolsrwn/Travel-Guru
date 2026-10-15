// Seasonal logic tests (Requirement 54): filterPackagesBySeason, isPackageInSeason,
// and validatePackage seasons validation.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { filterPackagesBySeason, isPackageInSeason, validatePackage } from "../lib/logic.js";
import { PACKAGES } from "../lib/data.js";

// ---------------------------------------------------------------------------
// Example-based tests
// ---------------------------------------------------------------------------

describe("filterPackagesBySeason — example-based", () => {
  it("returns [] for an empty packages array", () => {
    assert.deepStrictEqual(filterPackagesBySeason([], 10), []);
  });

  it("returns only packages whose seasons includes 10", () => {
    const result = filterPackagesBySeason(PACKAGES, 10);
    const ids = result.map((p) => p.id);
    // bali, dubai, kerala, vietnam, dubai-abu-dhabi all have 10 in seasons
    assert.ok(ids.includes("bali-6n7d"));
    assert.ok(ids.includes("dubai-4n5d"));
    assert.ok(ids.includes("kerala-5n6d"));
    assert.ok(ids.includes("vietnam-7n8d"));
    // Every returned package must have 10 in its seasons
    for (const pkg of result) {
      assert.ok(pkg.seasons.includes(10), `${pkg.id} should have 10 in seasons`);
    }
  });

  it("returns [] for month 6 (no original 5 packages have 6)", () => {
    // Only filter the original 5 packages
    const original5 = PACKAGES.filter((p) =>
      ["bali-6n7d", "dubai-4n5d", "singapore-4n5d", "kerala-5n6d", "vietnam-7n8d"].includes(p.id),
    );
    const result = filterPackagesBySeason(original5, 6);
    assert.deepStrictEqual(result, []);
  });

  it("excludes packages with seasons: []", () => {
    const pkgs = [{ id: "empty-season", seasons: [] }];
    assert.deepStrictEqual(filterPackagesBySeason(pkgs, 1), []);
  });

  it("excludes packages with no seasons field", () => {
    const pkgs = [{ id: "no-season" }];
    assert.deepStrictEqual(filterPackagesBySeason(pkgs, 1), []);
  });

  it("returns [] for month 0 (invalid)", () => {
    assert.deepStrictEqual(filterPackagesBySeason(PACKAGES, 0), []);
  });

  it("returns [] for month 13 (invalid)", () => {
    assert.deepStrictEqual(filterPackagesBySeason(PACKAGES, 13), []);
  });

  it("returns [] for month null", () => {
    assert.deepStrictEqual(filterPackagesBySeason(PACKAGES, null), []);
  });

  it("returns [] for month undefined", () => {
    assert.deepStrictEqual(filterPackagesBySeason(PACKAGES, undefined), []);
  });
});

describe("isPackageInSeason — example-based", () => {
  it("returns true when month is in the seasons array", () => {
    assert.strictEqual(isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 10), true);
  });

  it("returns false when month is not in the seasons array", () => {
    assert.strictEqual(isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 6), false);
  });

  it("returns false for null pkg", () => {
    assert.strictEqual(isPackageInSeason(null, 10), false);
  });

  it("returns false for null month", () => {
    assert.strictEqual(isPackageInSeason({ seasons: [10] }, null), false);
  });

  it("returns false for pkg without seasons field", () => {
    assert.strictEqual(isPackageInSeason({}, 10), false);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests (≥ 100 runs each)
// ---------------------------------------------------------------------------

// Arbitrary: a package with a valid integer seasons array
const arbSeasons = fc.array(fc.integer({ min: 1, max: 12 }), { minLength: 0, maxLength: 12 }).map((arr) => [
  ...new Set(arr),
]);
const arbPkg = fc.record({
  id: fc.string(),
  seasons: arbSeasons,
});
const arbPkgArray = fc.array(arbPkg, { minLength: 0, maxLength: 20 });
const arbMonth = fc.integer({ min: 1, max: 12 });

describe("filterPackagesBySeason — property-based", () => {
  it("P1: every result has seasons.includes(month)", () => {
    fc.assert(
      fc.property(arbPkgArray, arbMonth, (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        for (const pkg of result) {
          assert.ok(pkg.seasons.includes(month));
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P2: no excluded package has seasons.includes(month)", () => {
    fc.assert(
      fc.property(arbPkgArray, arbMonth, (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        const resultSet = new Set(result);
        for (const pkg of packages) {
          if (!resultSet.has(pkg) && Array.isArray(pkg.seasons) && pkg.seasons.length > 0) {
            assert.ok(!pkg.seasons.includes(month));
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P3: isPackageInSeason agrees with filterPackagesBySeason membership", () => {
    fc.assert(
      fc.property(arbPkgArray, arbMonth, (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        const resultSet = new Set(result);
        for (const pkg of packages) {
          const inFilter = resultSet.has(pkg);
          const inSeason = isPackageInSeason(pkg, month);
          // If included in filter result, must be in season (note: filter excludes empty/missing seasons)
          if (inFilter) assert.ok(inSeason);
          // If in season and has non-empty seasons array, must be in filter
          if (inSeason && Array.isArray(pkg.seasons) && pkg.seasons.length > 0) assert.ok(inFilter);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P4: result is a subset of input (length ≤ input, no new packages)", () => {
    fc.assert(
      fc.property(arbPkgArray, arbMonth, (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        assert.ok(result.length <= packages.length);
        for (const pkg of result) {
          assert.ok(packages.includes(pkg));
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P5: result preserves relative input order", () => {
    fc.assert(
      fc.property(arbPkgArray, arbMonth, (packages, month) => {
        const result = filterPackagesBySeason(packages, month);
        let lastIndex = -1;
        for (const pkg of result) {
          const idx = packages.indexOf(pkg);
          assert.ok(idx > lastIndex);
          lastIndex = idx;
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P6: invalid months return [] / false", () => {
    const arbInvalidMonth = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.double().filter((n) => !Number.isInteger(n)),
      fc.integer({ max: 0 }),
      fc.integer({ min: 13 }),
    );
    fc.assert(
      fc.property(arbPkgArray, arbInvalidMonth, (packages, month) => {
        assert.deepStrictEqual(filterPackagesBySeason(packages, month), []);
        for (const pkg of packages) {
          assert.strictEqual(isPackageInSeason(pkg, month), false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("P7: all PACKAGES entries pass validatePackage after seasons added", () => {
    for (const pkg of PACKAGES) {
      const result = validatePackage(pkg);
      assert.deepStrictEqual(result.errors, {}, `${pkg.id} failed validation: ${JSON.stringify(result.errors)}`);
      assert.strictEqual(result.valid, true);
    }
  });
});
