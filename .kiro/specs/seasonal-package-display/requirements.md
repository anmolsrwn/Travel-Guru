# Requirements Document

## Introduction

This document derives the requirements for the **Seasonal Package Display** feature from the approved design (`design.md`). The feature extends the Travel Guru Raipur public page with a "Best Time to Travel" section (`Seasonal_Section`) that lets visitors browse packages by month of travel. It sits between the Collections_Section and the Destinations_Section, presents 12 month tabs in a segmented-control style matching `CategoryFilter`, and filters package cards to show only packages whose `seasons` array includes the selected month number (1–12). The current calendar month is auto-selected on client mount using the visitor's local clock via the existing `useLocalTodayISO()` hook. A compact emerald `In_Season_Badge` is also added to package cards in the existing Collections_Section to flag packages currently in season, without duplicating the section logic.

This spec extends (but does not supersede) the main Travel Guru Raipur spec (`travel-agency-website/requirements.md`). Requirement IDs here use the prefix **S** to avoid conflict with the existing R1–R46 series. All vocabulary from the main spec Glossary carries over unchanged.

## Glossary

- **Seasonal_Section**: The new server component section (`components/sections/SeasonalSection.jsx`) rendered between the Collections_Section and the Destinations_Section, containing the "Best Time to Travel" heading block and the Month_Filter.
- **Season_Tab**: A single `role="tab"` button within the Month_Filter's `role="tablist"`, corresponding to one calendar month.
- **Active_Month**: The integer (1–12) representing the currently selected month in the Month_Filter; `null` before client hydration completes.
- **In_Season_Badge**: The pill badge ("✓ In Season") rendered on a package card in the Collections_Section when `isPackageInSeason(pkg, currentMonth)` returns `true` and the client has hydrated.
- **Month_Filter**: The `SeasonFilter` client component (`components/client/SeasonFilter.jsx`) that renders 12 Season_Tabs, manages the Active_Month state, filters packages and renders the seasonal card grid.
- **MONTH_NAMES**: The exported constant in `lib/data.js` that maps index 0 (January) through index 11 (December) to human-readable month name strings used to label Season_Tabs.

## Requirements

### Requirement 47: Seasonal Data in Packages

**User Story:** As a developer, I want each package entry in `lib/data.js` to declare its ideal travel months, so that the filtering logic and the "Best Time to Travel" section can determine which packages to show for a given month without any server-side date queries.

#### Acceptance Criteria

1. THE Data_Config SHALL export a `MONTH_NAMES` constant as an array of exactly 12 strings in calendar order: `["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]`, where `MONTH_NAMES[0]` corresponds to month integer 1 (January) and `MONTH_NAMES[11]` corresponds to month integer 12 (December).
2. THE Data_Config SHALL add a `seasons` field to every entry in `PACKAGES`, where `seasons` is an array of integers each in the inclusive range [1, 12] with no duplicate values within the same package's array.
3. THE `bali-6n7d` package entry in `PACKAGES` SHALL have `seasons` equal to `[10, 11, 12, 1, 2, 3]`.
4. THE `dubai-4n5d` package entry in `PACKAGES` SHALL have `seasons` equal to `[10, 11, 12, 1, 2, 3, 4]`.
5. THE `singapore-4n5d` package entry in `PACKAGES` SHALL have `seasons` equal to `[2, 3, 4, 7, 8, 9]`.
6. THE `kerala-5n6d` package entry in `PACKAGES` SHALL have `seasons` equal to `[10, 11, 12, 1, 2, 3]`.
7. THE `vietnam-7n8d` package entry in `PACKAGES` SHALL have `seasons` equal to `[10, 11, 12, 1, 2, 3]`.
8. THE Data_Config SHALL remain a pure data module after the addition of `seasons` and `MONTH_NAMES`: no function definitions, no DOM access, no imports of other Site modules, and no `Date.now()` or `new Date()` calls.

### Requirement 48: Pure Logic Functions for Season Filtering

**User Story:** As a developer, I want pure, testable functions in `lib/logic.js` that filter packages by season and check whether a single package is in season, so that all filtering logic can be verified independently of any UI framework.

#### Acceptance Criteria

1. THE Logic_Module SHALL export a function `filterPackagesBySeason(packages, month)` and a function `isPackageInSeason(pkg, month)`, each with `typeof` equal to `"function"`.
2. WHEN `filterPackagesBySeason` is called with a valid packages array and a month integer in [1, 12], THE Logic_Module SHALL return a new array (never the input array itself) containing exactly the packages whose `seasons` array includes `month`, in the same relative order as the input array.
3. WHEN `filterPackagesBySeason` is called with a month integer in [1, 12], THE Logic_Module SHALL exclude any package whose `seasons` field is missing, is not an array, or is an empty array (`[]`).
4. IF `filterPackagesBySeason` is called with a `month` that is not an integer, is less than 1, is greater than 12, is `null`, is `undefined`, or is `NaN`, THEN THE Logic_Module SHALL return an empty array without throwing.
5. IF `filterPackagesBySeason` is called with a `packages` argument that is not an array, THEN THE Logic_Module SHALL return an empty array without throwing.
6. WHEN `isPackageInSeason(pkg, month)` is called with a package object whose `seasons` array contains `month`, THE Logic_Module SHALL return `true`.
7. WHEN `isPackageInSeason(pkg, month)` is called with a package whose `seasons` array does not contain `month`, or whose `seasons` field is missing or not an array, THE Logic_Module SHALL return `false`.
8. IF `isPackageInSeason` is called with `month` equal to `null`, `undefined`, a non-integer, a value less than 1 or a value greater than 12, THEN THE Logic_Module SHALL return `false` without throwing.
9. IF `isPackageInSeason` is called with `pkg` equal to `null`, `undefined` or any non-object value, THEN THE Logic_Module SHALL return `false` without throwing.
10. WHEN either `filterPackagesBySeason` or `isPackageInSeason` is called, THE Logic_Module SHALL leave every input argument, including the `packages` array and every `pkg` object, deep-equal to its pre-call state (no mutation).
11. THE Logic_Module SHALL never throw for any combination of inputs to `filterPackagesBySeason` or `isPackageInSeason`; both functions SHALL handle all exotic inputs (wrong types, `null`, `undefined`, objects without `seasons`) gracefully.

### Requirement 49: Package Validation Update

**User Story:** As a developer, I want the `validatePackage` function in `lib/logic.js` to validate the `seasons` field, so that any package with an invalid seasons value is caught before it reaches the site.

#### Acceptance Criteria

1. WHEN `validatePackage` is called with a package that has no `seasons` field (the field is `undefined`), THE Validator SHALL treat the absence as valid (the `seasons` field is optional for backward compatibility) and include no `seasons` error in the result.
2. WHEN `validatePackage` is called with a package whose `seasons` field is an empty array (`[]`), THE Validator SHALL treat it as valid and include no `seasons` error.
3. WHEN `validatePackage` is called with a package whose `seasons` field is an array of integers all in [1, 12] with no duplicates, THE Validator SHALL treat it as valid and include no `seasons` error.
4. IF `validatePackage` is called with a package whose `seasons` field is not an array (for example, a string, number or plain object), THEN THE Validator SHALL return `valid: false` with a `seasons` error.
5. IF `validatePackage` is called with a package whose `seasons` array contains any element that is not an integer, THEN THE Validator SHALL return `valid: false` with a `seasons` error.
6. IF `validatePackage` is called with a package whose `seasons` array contains any integer outside [1, 12] (for example, 0 or 13), THEN THE Validator SHALL return `valid: false` with a `seasons` error.
7. IF `validatePackage` is called with a package whose `seasons` array contains duplicate values (for example, `[10, 10]`), THEN THE Validator SHALL return `valid: false` with a `seasons` error.
8. WHEN `validatePackage` is called with any of the five PACKAGES entries after the `seasons` field has been added as specified in Requirement S1, THE Validator SHALL return `{ valid: true, errors: {} }` for every such entry.

### Requirement 50: "Best Time to Travel" Section Shell

**User Story:** As a Visitor, I want a dedicated "Best Time to Travel" section on the page, so that I can understand at a glance which months are ideal for each destination and navigate directly to relevant packages.

#### Acceptance Criteria

1. THE Seasonal_Section SHALL render a `<section>` element with `id="best-time"` placed in the page DOM between the Collections_Section and the Destinations_Section, so that the page section order becomes: … Collections_Section → Seasonal_Section → Destinations_Section → ….
2. THE Seasonal_Section SHALL render an eyebrow element containing the text "Best Time to Travel".
3. THE Seasonal_Section SHALL render an H2 heading whose accent word "getaway" is wrapped in a `--brand-grad` gradient-text element, matching the heading accent pattern used in other sections.
4. THE Seasonal_Section SHALL render a lead paragraph containing the text "Packages curated for Indian travellers departing from Raipur. Select a month to see what's in season."
5. THE Seasonal_Section SHALL apply the alternating section background using the `--bg-1` token (the `section--alt` CSS class pattern), matching alternating sections elsewhere on the page.
6. WHEN JavaScript is disabled or has not yet executed, THE Seasonal_Section SHALL render a static fallback listing all packages with their titles and from-prices in INR, ensuring the section content is visible without JavaScript.
7. THE Seasonal_Section SHALL apply the scroll-reveal entrance animation via the existing `Reveal` component, consistent with every other page section.
8. THE Seasonal_Section SHALL be implemented as a React Server Component, importing the Month_Filter client component as `children` passed in from the page, matching the `Collections` / `CategoryFilter` server-shell-plus-client-component pattern.

### Requirement 51: Month Tab Filter (SeasonFilter Client Component)

**User Story:** As a Visitor, I want to select a month from a tab control and see only the packages ideal for that month, so that I can plan a trip without browsing irrelevant packages.

#### Acceptance Criteria

1. THE Month_Filter SHALL render a `role="tablist"` container holding exactly 12 `role="tab"` buttons, one per calendar month, labelled with the corresponding entry from `MONTH_NAMES` in month-number order (January through December).
2. THE Month_Filter SHALL indicate the current calendar month (derived from `useLocalTodayISO()` after hydration) with a distinct visual indicator using the `--emerald` token (a dot, underline or similar mark), separate from the active/selected state, so that a Visitor can see at a glance which month is "now".
3. WHEN the client has hydrated and `useLocalTodayISO()` returns a date string, THE Month_Filter SHALL automatically set the Active_Month to the current calendar month integer derived from that date string (parsing the month as `parseInt(isoDate.slice(5, 7), 10)`).
4. WHILE the client has not yet hydrated (`useLocalTodayISO()` returns `null`), THE Month_Filter SHALL render all 12 Season_Tabs with `aria-selected="false"` on every tab and SHALL display a loading indicator in the card grid area (for example, "Loading best season for you…"), with no tab pre-selected.
5. WHEN a Visitor activates a Season_Tab, THE Month_Filter SHALL set `aria-selected="true"` on that tab and `aria-selected="false"` on every other tab, and SHALL update the visible card grid to show only packages returned by `filterPackagesBySeason(packages, activeMonth)`.
6. THE active Season_Tab SHALL be styled with a `var(--blue-grad)` fill background, matching the active segmented-control segment style used in `CategoryFilter`.
7. THE Month_Filter SHALL implement roving-tabindex keyboard navigation on the `role="tablist"`: pressing ArrowRight SHALL move focus to the next tab (wrapping from December to January), pressing ArrowLeft SHALL move focus to the previous tab (wrapping from January to December), pressing Home SHALL move focus to the January tab and pressing End SHALL move focus to the December tab.
8. WHILE the viewport is a Mobile_Viewport, THE Month_Filter tab row SHALL be horizontally scrollable without causing horizontal page overflow, with `scrollbar-width: none` and `overscroll-behavior-x: contain`, matching the Category_Filter scroll behaviour.

### Requirement 52: Seasonal Package Cards

**User Story:** As a Visitor browsing by month, I want to see a card for each in-season package showing the key details and a link to the full collections section, so that I can identify interesting packages and navigate to the booking flow.

#### Acceptance Criteria

1. THE Month_Filter SHALL call `filterPackagesBySeason(packages, activeMonth)` to determine which packages are visible for the current Active_Month, and SHALL re-filter on every Active_Month change.
2. FOR each visible package, THE Month_Filter SHALL render a card showing: the package image with `loading="lazy"`, the package title, the region and nights/days formatted as "{nights}N/{days}D", up to 2 highlights from the package's `highlights` array (truncating if more than 2 are present), and the from-price expressed as `fromPriceINR(pkg)` formatted in INR (not converted to any other currency), labelled "from ₹… /pp".
3. Each seasonal package card SHALL contain an anchor linking to `#collections` (not to a booking modal or a separate page), so that the section functions as a browsing aid that drives Visitors to the full Collections_Section for booking.
4. WHILE the viewport is a Desktop_Viewport or Wide_Viewport, THE Month_Filter card grid SHALL arrange visible cards in a 3-column grid.
5. WHILE the viewport is a Tablet_Viewport, THE Month_Filter card grid SHALL arrange visible cards in a 2-column grid.
6. WHILE the viewport is a Mobile_Viewport, THE Month_Filter card grid SHALL arrange visible cards in a 1-column grid.
7. IF `filterPackagesBySeason` returns an empty array for the Active_Month, THEN THE Month_Filter SHALL display an empty-state message reading "No packages curated for [Month Name] yet." and a link with accessible text "Browse all" pointing to `#collections`, and SHALL render no package cards.
8. Package images in seasonal cards SHALL use the same image-loading pattern as the Collections_Section (lazy loading below the fold) and SHALL display a gradient placeholder background if the image fails to load.

### Requirement 53: "In Season" Badge in Collections

**User Story:** As a Visitor browsing the main Collections section, I want to see which packages are currently in season at a glance, so that I can prioritise the most timely options without navigating to the "Best Time to Travel" section.

#### Acceptance Criteria

1. THE `CategoryFilter` component SHALL call `useLocalTodayISO()` and derive `currentMonth` as `parseInt(isoDate.slice(5, 7), 10)` (integer 1–12) after hydration, matching the same derivation used in the Month_Filter.
2. FOR each package card rendered by `CategoryFilter`, THE App_Layer SHALL call `isPackageInSeason(pkg, currentMonth)` and, WHEN the result is `true`, render an In_Season_Badge on that card.
3. THE In_Season_Badge SHALL be rendered as a pill badge with label "✓ In Season", `--emerald` tint background (solid fill at low opacity: `rgba(16, 185, 129, 0.15)`), `--emerald` text colour, a 1px border of `rgba(16, 185, 129, 0.4)`, and `border-radius: var(--r-pill)`.
4. The checkmark character "✓" in the In_Season_Badge SHALL be marked `aria-hidden="true"` so that assistive technologies read the badge label as "In Season" without the decorative symbol.
5. THE In_Season_Badge SHALL NOT be rendered during server-side rendering or during the hydration phase; it SHALL only appear after the client has mounted and `currentMonth` is a non-null integer, so that no hydration mismatch occurs.
6. WHEN `currentMonth` is `null` (before hydration), THE `CategoryFilter` SHALL render every package card without any In_Season_Badge.
7. THE In_Season_Badge, when visible, SHALL be placed on the card after any `isSample` chip and before the highlights list, matching the visual hierarchy of other badge types.

### Requirement 54: Tests for Seasonal Logic

**User Story:** As a developer, I want comprehensive unit and property-based tests for the seasonal filtering functions, so that I can verify correctness across all edge cases and confirm that the data additions do not break existing validation.

#### Acceptance Criteria

1. THE Test_Suite SHALL include a test file `tests/seasonal.test.js` that imports `filterPackagesBySeason`, `isPackageInSeason` and `validatePackage` from `lib/logic.js` and `PACKAGES` from `lib/data.js`, and that runs under `node --test "tests/**/*.test.js"` without requiring a browser, Next.js or a database.
2. THE test file SHALL include at least the following example-based tests:
   - `filterPackagesBySeason([], 10)` returns `[]`
   - `filterPackagesBySeason(packages, 10)` returns only the packages whose `seasons` includes 10 (bali, dubai, kerala, vietnam), in input order
   - `filterPackagesBySeason(packages, 6)` returns `[]` (no package has 6 in its `seasons` array per the S1 data)
   - A package with `seasons: []` is excluded from filter results for any month
   - A package with no `seasons` field is excluded from filter results for any month
   - `filterPackagesBySeason(packages, 0)` returns `[]` (month 0 is invalid)
   - `filterPackagesBySeason(packages, 13)` returns `[]` (month 13 is invalid)
   - `filterPackagesBySeason(packages, null)` returns `[]`
   - `filterPackagesBySeason(packages, undefined)` returns `[]`
   - `isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 10)` returns `true`
   - `isPackageInSeason({ seasons: [10, 11, 12, 1, 2, 3] }, 6)` returns `false`
   - `isPackageInSeason(null, 10)` returns `false`
   - `isPackageInSeason({ seasons: [10] }, null)` returns `false`
   - `isPackageInSeason({}, 10)` returns `false` (no `seasons` field)
3. THE test file SHALL include the following 7 property-based tests using fast-check with at least 100 runs each:
   - **Property S8.P1 — Season filter only returns in-season packages**: For any array of packages (with valid integer seasons arrays) and any valid month (integer 1–12), every element of `filterPackagesBySeason(packages, month)` SHALL have `pkg.seasons.includes(month) === true`. **Validates: S2.2, S2.3**
   - **Property S8.P2 — Season filter excludes out-of-season packages**: For any array of packages and any valid month, no element of `filterPackagesBySeason(packages, month)` SHALL have a `seasons` array that does not contain `month`. **Validates: S2.2, S2.3**
   - **Property S8.P3 — `isPackageInSeason` agrees with `filterPackagesBySeason`**: For any array of packages and any valid month, a package `pkg` appears in `filterPackagesBySeason(packages, month)` if and only if `isPackageInSeason(pkg, month)` returns `true`. **Validates: S2.2, S2.6, S2.7**
   - **Property S8.P4 — Season filter result is a subset of input**: For any array of packages and any valid month, every element of `filterPackagesBySeason(packages, month)` SHALL be referentially present in the original input array (result length ≤ input length, no packages added). **Validates: S2.2**
   - **Property S8.P5 — Season filter preserves input order**: For any array of packages and any valid month, the relative order of elements in `filterPackagesBySeason(packages, month)` SHALL match their relative order in the input array. **Validates: S2.2**
   - **Property S8.P6 — Invalid month returns empty / false**: For any packages array, `filterPackagesBySeason(packages, month)` SHALL return `[]` and `isPackageInSeason(pkg, month)` SHALL return `false` when `month` is `null`, `undefined`, a non-integer number, an integer less than 1 or an integer greater than 12. **Validates: S2.4, S2.8**
   - **Property S8.P7 — All PACKAGES entries pass `validatePackage` after seasons field is added**: For every entry in the `PACKAGES` constant exported from `lib/data.js` (after the `seasons` field is added per Requirement S1), `validatePackage(pkg)` SHALL return `{ valid: true }`. **Validates: S1.2–S1.7, S3.3, S3.8**
4. THE Test_Suite SHALL continue to exit with code 0 after all tests in `tests/seasonal.test.js` pass, and SHALL exit with a non-zero code if any test in the file fails.
