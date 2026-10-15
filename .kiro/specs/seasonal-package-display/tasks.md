# Implementation Plan: Seasonal Package Display

## Overview

Add the "Best Time to Travel" feature to the Travel Guru Raipur public page. Work goes in four layers:

1. **Data** — add `seasons` arrays and `MONTH_NAMES` to `lib/data.js`
2. **Logic** — add `filterPackagesBySeason` and `isPackageInSeason` to `lib/logic.js`; extend `validatePackage`
3. **Tests** — unit and property-based tests in `tests/seasonal.test.js`
4. **UI** — `SeasonalSection` server component shell, `SeasonFilter` client component, CSS Modules, page wiring, and the "In Season" badge in `CategoryFilter`

All `lib/` modules use relative imports only; no TypeScript; CSS Modules only.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3", "4", "5"] },
    { "wave": 4, "tasks": ["6"] }
  ]
}
```

## Notes

- All `lib/` imports within components use the `@/` alias (`@/lib/logic`, `@/lib/data`); `lib/` modules themselves use relative imports only.
- `SeasonalPackageCard` is internal to `SeasonFilter.jsx` (not a separate file), matching the convention in `CategoryFilter.jsx`.
- The `fromPriceINR` function already exists in `lib/logic.js` and is imported as-is.
- `useLocalTodayISO` already exists in `components/client/localToday.js` — no new hook needed.
- Prices in seasonal cards are always in INR (not currency-converted) — this section is a browsing aid, not a pricing interface.
- No new npm packages needed; all dependencies are already pinned in `package.json`.

## Tasks

- [x] 1. Extend `lib/data.js` with seasonal data
  - Add `seasons` field to each of the 5 `PACKAGES` entries:
    - `bali-6n7d`: `seasons: [10, 11, 12, 1, 2, 3]`
    - `dubai-4n5d`: `seasons: [10, 11, 12, 1, 2, 3, 4]`
    - `singapore-4n5d`: `seasons: [2, 3, 4, 7, 8, 9]`
    - `kerala-5n6d`: `seasons: [10, 11, 12, 1, 2, 3]`
    - `vietnam-7n8d`: `seasons: [10, 11, 12, 1, 2, 3]`
  - Export `MONTH_NAMES` constant: `["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]`
  - Keep `lib/data.js` as pure data only (no functions, no imports, no `new Date()`)
  - _Requirements: 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 47.7, 47.8_

- [x] 2. Add pure logic functions and extend validation in `lib/logic.js`
  - [x] 2.1 Implement `filterPackagesBySeason(packages, month)`
    - Returns a new array of packages whose `seasons` includes `month`
    - Excludes packages with missing, non-array, or empty `seasons`
    - Returns `[]` for invalid months (non-integer, < 1, > 12, null, undefined, NaN)
    - Returns `[]` for non-array `packages` argument
    - Never throws, never mutates inputs
    - _Requirements: 48.1, 48.2, 48.3, 48.4, 48.5, 48.10, 48.11_
  - [x] 2.2 Implement `isPackageInSeason(pkg, month)`
    - Returns `true` iff `pkg.seasons` is an array containing `month` (integer 1–12)
    - Returns `false` for null/undefined/non-object `pkg`
    - Returns `false` for null/undefined/non-integer/out-of-range `month`
    - Never throws, never mutates inputs
    - _Requirements: 48.1, 48.6, 48.7, 48.8, 48.9, 48.10, 48.11_
  - [x] 2.3 Extend `validatePackage` to validate the `seasons` field
    - Missing `seasons` (undefined) → valid (backward compatible)
    - Empty array `[]` → valid
    - Array of integers all in [1, 12] with no duplicates → valid
    - Non-array value → `valid: false` with `seasons` error
    - Array containing non-integers → `valid: false` with `seasons` error
    - Array containing integers outside [1, 12] → `valid: false` with `seasons` error
    - Array with duplicate values → `valid: false` with `seasons` error
    - All 5 PACKAGES entries must pass validation after task 1
    - _Requirements: 49.1, 49.2, 49.3, 49.4, 49.5, 49.6, 49.7, 49.8_

- [x] 3. Write tests in `tests/seasonal.test.js`
  - Uses `node:test` and `fast-check` (already pinned in package.json); imports from `lib/` only
  - Example-based tests:
    - `filterPackagesBySeason([], 10)` → `[]`
    - Filter month 10 → bali, dubai, kerala, vietnam (in input order)
    - Filter month 6 → `[]` (no package has 6 in seasons)
    - Package with `seasons: []` excluded for any month
    - Package with no `seasons` field excluded for any month
    - Filter month 0 → `[]`; month 13 → `[]`; month null → `[]`; month undefined → `[]`
    - `isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 10)` → `true`
    - `isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 6)` → `false`
    - `isPackageInSeason(null, 10)` → `false`
    - `isPackageInSeason({ seasons: [10] }, null)` → `false`
    - `isPackageInSeason({}, 10)` → `false`
  - 7 property-based tests (≥ 100 runs each):
    - **P1**: Every result of `filterPackagesBySeason` has `seasons.includes(month)` (validates 48.2, 48.3)
    - **P2**: No excluded package has `seasons.includes(month)` (validates 48.2, 48.3)
    - **P3**: `isPackageInSeason(pkg, month)` agrees with membership in filter result (validates 48.2, 48.6, 48.7)
    - **P4**: Result length ≤ input length; no new packages introduced (validates 48.2)
    - **P5**: Result preserves relative input order (validates 48.2)
    - **P6**: Invalid months → `[]` / `false` for all edge cases (validates 48.4, 48.8)
    - **P7**: All 5 PACKAGES entries pass `validatePackage` after seasons added (validates 47.2–47.7, 49.3, 49.8)
  - Run passes: `npm test` exits with code 0
  - _Requirements: 54.1, 54.2, 54.3, 54.4_

- [x] 4. Build `SeasonalSection` server component shell
  - Create `components/sections/SeasonalSection.jsx` as a React Server Component (no `'use client'`)
  - Renders `<section id="best-time">` with alternating `--bg-1` background
  - Eyebrow: "Best Time to Travel"
  - H2: "Ideal month for your next **getaway**" with "getaway" in `--brand-grad` gradient text (matching other section H2 accent words)
  - Lead paragraph: "Packages curated for Indian travellers departing from Raipur. Select a month to see what's in season."
  - Accepts `children` prop (the `SeasonFilter` client component); when no JS / no children, renders a static fallback listing each package with title and from-price in INR
  - Wraps in `Reveal` for scroll-reveal entrance animation
  - Create `components/sections/SeasonalSection.module.css` with section layout, eyebrow, heading, lead paragraph styles (using existing design tokens)
  - _Requirements: 50.1, 50.2, 50.3, 50.4, 50.5, 50.6, 50.7, 50.8_

- [x] 5. Build `SeasonFilter` client component and `SeasonalPackageCard`
  - Create `components/client/SeasonFilter.jsx` (`'use client'`)
  - Uses `useLocalTodayISO()` from `components/client/localToday.js` (already exists)
  - State: `activeMonth` (integer 1–12 or null); initialises to null, snaps to current month after hydration
  - Renders `role="tablist"` with 12 `role="tab"` buttons labelled from `MONTH_NAMES`
  - Active tab: `--blue-grad` fill, `aria-selected="true"`, roving tabindex
  - Current month indicator: small `--emerald` dot on the corresponding tab (separate from active state)
  - Pre-hydration: all tabs `aria-selected="false"`, card area shows "Loading best season for you…"
  - Keyboard: ArrowLeft/ArrowRight wrapping, Home/End; automatic activation on focus (same pattern as `CategoryFilter`)
  - Tab row horizontally scrollable on mobile (`scrollbar-width: none`, `overscroll-behavior-x: contain`)
  - Calls `filterPackagesBySeason(packages, activeMonth)` to get visible cards
  - Renders `SeasonalPackageCard` per visible package in a responsive grid (3-col desktop, 2-col tablet, 1-col mobile)
  - Empty state: "No packages curated for [Month Name] yet." + "Browse all" link to `#collections`
  - `SeasonalPackageCard` (internal): `SafeImage` with `loading="lazy"` + gradient placeholder fallback, title, `{region} · {nights}N/{days}D`, up to 2 highlights, `fromPriceINR(pkg)` in INR labelled "from ₹… /pp", anchor to `#collections`
  - Create `components/client/SeasonFilter.module.css` (tabs, card grid, cards, empty state, loading state, mobile scroll)
  - Import `filterPackagesBySeason`, `fromPriceINR` from `@/lib/logic`; `MONTH_NAMES` from `@/lib/data`
  - _Requirements: 51.1, 51.2, 51.3, 51.4, 51.5, 51.6, 51.7, 51.8, 52.1, 52.2, 52.3, 52.4, 52.5, 52.6, 52.7, 52.8_

- [x] 6. Wire the section into the public page and add the "In Season" badge
  - [x] 6.1 Register `SeasonalSection` in `app/(site)/page.js`
    - Import `SeasonalSection` from `@/components/sections/SeasonalSection`
    - Import `SeasonFilter` from `@/components/client/SeasonFilter`
    - Insert `<SeasonalSection packages={packages}><SeasonFilter packages={packages} /></SeasonalSection>` between the `<Collections …/>` and `<Destinations …/>` elements
    - Pass `packages` serialised from the page's `loadPublicContent` result (same prop already passed to Collections)
    - _Requirements: 50.1, 50.8_
  - [x] 6.2 Add "In Season" badge to `CategoryFilter`
    - In `components/client/CategoryFilter.jsx`, call `useLocalTodayISO()` and derive `currentMonth` (`parseInt(isoDate.slice(5,7), 10)` or `null`)
    - For each visible package card, call `isPackageInSeason(pkg, currentMonth)`; when `true` and `currentMonth !== null`, render the `In_Season_Badge`
    - Badge: pill, `rgba(16, 185, 129, 0.15)` fill, `--emerald` text, `1px solid rgba(16, 185, 129, 0.4)` border, `--r-pill`, label `<span aria-hidden="true">✓</span> In Season`
    - Badge placed after any `isSample` chip and before highlights; only rendered client-side (no SSR mismatch)
    - Add badge styles to `components/client/CategoryFilter.module.css` (or a shared badge module if one exists)
    - Import `isPackageInSeason` from `@/lib/logic`
    - _Requirements: 53.1, 53.2, 53.3, 53.4, 53.5, 53.6, 53.7_
