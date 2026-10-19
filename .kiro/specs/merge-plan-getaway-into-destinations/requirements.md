# Requirements Document

## Introduction

The home page merges the "Top picks for your next getaway" seasonal section into the "Where would you like to go?" destinations section. The merged section shows a compact rail of up to three in-season packages and a destination tile grid with a region toggle that shows International or Domestic one at a time.

## Glossary

- **Destinations_Section**: The server-rendered home page section with id `destinations` and the single heading "Where would you like to go?".
- **Season_Rail**: The client component that renders up to three in-season package cards inside the Destinations_Section.
- **Destination_Tiles**: The client component that renders destination tiles with a region toggle.
- **Region_Toggle**: The segmented tablist control that switches between the International and Domestic tile grids.
- **Home_Page**: The page rendered by `app/(site)/page.js`.
- **In_Season_Package**: A package whose `seasons` array contains the current month number (1 to 12).
- **Legacy_Seasonal_Components**: `SeasonalSection.jsx`, `SeasonalSection.module.css`, `SeasonFilter.jsx` and `SeasonFilter.module.css`.

## Requirements

### Requirement 1: Compact in-season rail

**User Story:** As a visitor, I want in-season packages shown compactly inside the destinations section, so that I see this month's best options without scrolling through a tall carousel.

#### Acceptance Criteria

1. WHEN the current month is resolved, THE Season_Rail SHALL render only packages whose `seasons` array contains the current month number.
2. WHEN more than three In_Season_Packages exist, THE Season_Rail SHALL render exactly three cards.
3. WHEN the current month is resolved, THE Season_Rail SHALL display the label "Best for {Month}" and a "See all packages" link to `/trips`.
4. THE Season_Rail SHALL render each card with an image, region and duration meta, a title, a from-price, and a "View Package" link to `/trips`.
5. IF no In_Season_Package exists for the current month, THEN THE Season_Rail SHALL render no cards and no empty-state text.
6. WHILE the current month is unresolved before hydration, THE Season_Rail SHALL render a placeholder with a fixed minimum height.
7. THE Season_Rail SHALL render without auto-advance timers, arrows, or dots.
8. THE Season_Rail SHALL expose the wrapper id `best-time`.

### Requirement 2: Region toggle for destination tiles

**User Story:** As a visitor, I want one region of destinations visible at a time, so that the section stays short.

#### Acceptance Criteria

1. WHEN at least two regions have destinations, THE Destination_Tiles SHALL render the Region_Toggle with one tab per region that has destinations.
2. WHEN a visitor selects a region tab, THE Destination_Tiles SHALL render only the grid of that region.
3. WHEN only one region has destinations, THE Destination_Tiles SHALL hide the Region_Toggle and render that region grid.
4. IF the active region has no destinations after a content update, THEN THE Destination_Tiles SHALL activate the first region that has destinations.
5. THE Region_Toggle SHALL use `role="tablist"`, `role="tab"` with `aria-selected`, and `aria-controls` referencing a `role="tabpanel"` wrapper.
6. WHEN a visitor presses an arrow key on a focused tab, THE Region_Toggle SHALL move focus and selection to the adjacent tab.
7. FOR ALL destination lists, THE union of tiles reachable through the Region_Toggle SHALL equal the set of all destinations that have an International or Domestic region.
8. WHEN a visitor activates "Get a Quote" on a tile, THE Destination_Tiles SHALL call `quoteDestination` with the destination name.
9. WHEN a visitor activates "View Package" on a tile whose `packageId` resolves to a package, THE Destination_Tiles SHALL open the `itinerary` modal for that package.

### Requirement 3: Single merged section header

**User Story:** As a visitor, I want a single clear section header, so that the page reads as one story.

#### Acceptance Criteria

1. THE Destinations_Section SHALL render one `h2` with the text "Where would you like to go?" and the eyebrow "Plan Your Next Getaway".
2. WHERE a `seasonal` prop is provided, THE Destinations_Section SHALL render the seasonal slot above the children.
3. IF no children are provided, THEN THE Destinations_Section SHALL render the static International and Domestic groups.
4. THE Home_Page SHALL contain exactly one element with id `destinations`.
5. THE Home_Page SHALL contain no section rendered by `SeasonalSection`.
6. WHEN JavaScript is unavailable, THE Destinations_Section SHALL list both the International and Domestic groups from the server fallback.

### Requirement 4: Page wiring and legacy cleanup

**User Story:** As a maintainer, I want the old seasonal components removed and the page wired to the merged section, so that no dead code remains.

#### Acceptance Criteria

1. THE Home_Page SHALL render, in order, Hero, TrustStrip, ExploreLinks, Services, Destinations with the Season_Rail in the `seasonal` prop, and HowItWorks.
2. THE repository SHALL contain no Legacy_Seasonal_Components and no imports of them.
3. THE Season_Rail SHALL reuse `filterPackagesBySeason`, `MONTH_NAMES`, `fromPriceINR` and `useLocalTodayISO` without modification.
4. WHEN the project build runs, THE build SHALL complete without errors.
5. WHEN the test suite runs, THE test suite SHALL pass with no tests referencing Legacy_Seasonal_Components.
