# Implementation Plan: Merge Plan Getaway into Destinations

## Overview

Replace the `SeasonalSection` carousel with a compact `SeasonRail` inside `Destinations`, add a region toggle to `DestinationTiles`, rewire `app/(site)/page.js`, delete the legacy seasonal files, and verify with tests and a build. JavaScript, CSS Modules, `node --test`, and `fast-check` as already used in the repo.

## Tasks

- [x] 1. Build the season rail
  - [x] 1.1 Create `SeasonRail` component and styles
    - Add `components/client/SeasonRail.jsx` (client) using `useLocalTodayISO`, `filterPackagesBySeason`, `MONTH_NAMES`, `fromPriceINR`, `SafeImage`
    - Render "Best for {Month}" label, "See all packages" link to `/trips`, and up to 3 cards (image, region and duration meta, title, from-price, "View Package" link to `/trips`)
    - Wrap in `id="best-time"`; reserve fixed min-height before hydration; render nothing when no picks; no timers, arrows, or dots
    - Add `components/client/SeasonRail.module.css` (3 columns from 768px, scroll-snap row on mobile, reduced-motion hover)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.3_

  - [x]* 1.2 Write property tests for rail selection
    - Extract a pure `selectRailPackages(packages, month)` helper if needed and test in `tests/season-rail.test.js`
    - **Property 1: Rail selection is in-season and capped**
    - **Validates: Requirements 1.1, 1.2**

  - [x]* 1.3 Write property test for empty selection
    - **Property 2: Empty selection renders nothing**
    - **Validates: Requirements 1.5**

- [x] 2. Update Destinations and DestinationTiles
  - [x] 2.1 Add seasonal slot to `Destinations`
    - In `components/sections/Destinations.jsx` accept `seasonal` prop, render it above children
    - Set eyebrow "Plan Your Next Getaway", single `h2` "Where would you like to go?", lead text, and keep the no-JS static International and Domestic fallback
    - Add rail and toggle spacing styles to `Destinations.module.css` if needed
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 2.2 Add region toggle to `DestinationTiles`
    - Add a pure `selectRegion(destinations, active, requested)` helper (in `lib/logic.js` or beside the component)
    - Render a segmented `tablist` with `tab` buttons, `aria-selected`, `aria-controls`, a `tabpanel` wrapper, and arrow-key navigation; render only the active grid
    - Hide the toggle when one region has data; fall back to the first available region; keep quote and itinerary handlers unchanged
    - Add `.regionTabs` styles to `Destinations.module.css`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

  - [x]* 2.3 Write property tests for region logic
    - **Property 3: Region toggle loses no destination**
    - **Property 4: Region selection falls back to an available region**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

- [x] 3. Wire the page and remove legacy code
  - [x] 3.1 Update `app/(site)/page.js`
    - Import `SeasonRail`; render order Hero, TrustStrip, ExploreLinks, Services, `Destinations` with `seasonal={<SeasonRail packages={packages} />}`, HowItWorks
    - Remove `SeasonalSection` and `SeasonFilter` imports and usage; update the story-order comment
    - Check section background alternation around `Destinations` and `HowItWorks`, adjust `section--alt` if needed
    - _Requirements: 3.4, 3.5, 4.1_

  - [x] 3.2 Delete legacy seasonal files
    - Delete `components/sections/SeasonalSection.jsx`, `components/sections/SeasonalSection.module.css`, `components/client/SeasonFilter.jsx`, `components/client/SeasonFilter.module.css`
    - Grep for leftover references in `app`, `components`, `lib`, and `tests`
    - _Requirements: 3.5, 4.2_

- [ ] 4. Verify tests and build
  - [x] 4.1 Update affected tests
    - Remove or update any test referencing the legacy components (none found by grep in `tests/` at planning time)
    - Run `npm test` and `npm run lint`; fix failures
    - _Requirements: 4.5_

  - [~] 4.2 Run production build
    - Run `npm run build` and fix any errors
    - _Requirements: 4.4_

- [~] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` with a minimum of 100 runs
- Run `npm run dev` manually to check layout at 1280px and 390px

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "2.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2"] }
  ]
}
```
