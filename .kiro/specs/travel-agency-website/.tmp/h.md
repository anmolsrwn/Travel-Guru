### Requirement 2: Pure, Node-Testable Logic and Pinned Dependencies

**User Story:** As a developer, I want all business logic in pure, framework-free functions and a small pinned dependency set, so that I can unit and property test the logic and the API handlers in Node without a browser, Next.js or a database.

Note: revised by the stack revision. The former "zero runtime dependencies" criterion is replaced by criterion 2.7.

#### Acceptance Criteria

1. THE Logic_Module SHALL export exactly the named functions `convertPrice`, `formatPrice`, `filterPackages`, `getTier`, `fromPriceINR`, `packageInclusions`, `destinationsByRegion`, `addDays`, `daysBetween`, `minDepartureDate`, `isDateOnOrAfter`, `computeAdvance`, `computeLandTotal`, `computeBookingBreakdown`, `cancellationCharge`, `clampCount`, `generateTicketId`, `isValidTicketId`, `generateBookingRef`, `validateEmail`, `validatePhone`, `validateQuoteForm`, `validateCheckout`, `validatePackage`, `validateDestination`, `composeQuoteWhatsAppMessage`, `composeBookingWhatsAppMessage`, `buildWhatsAppUrl` and `computeCallbackDeadline`, each with `typeof` equal to "function".
2. THE Logic_Module and every Handler_Core SHALL receive the current date, the current time and random values as function arguments, so that two calls to any exported function with deep-equal inputs (and deep-equal fake dependencies) return deep-equal outputs (or throw the same error type).
3. WHEN any Logic_Module function is called, THE Logic_Module SHALL leave every input argument, including nested arrays, objects and Date values, deep-equal to its pre-call state.
4. WHEN the Logic_Module, the Data_Config, `lib/content-mapping.js`, `lib/seo.js` or any `lib/server/*` module is imported as an ES module in Node.js 20.9 or later with no `window`, `document` or `localStorage` globals defined and without a Next.js build, THE module SHALL load without throwing and without producing console output.
5. THE Logic_Module and Data_Config source SHALL contain zero references to the DOM, `localStorage`, `window`, `Date.now()`, the argument-less `new Date()`, `Math.random()`, `crypto`, `fetch`, `process.env`, `next`, `react` or `@supabase`, and the `lib/server/*` modules SHALL contain zero imports of `next`, `react` or `@supabase`.
6. THE Test_Suite SHALL run example-based tests with the built-in `node:test` runner and property-based tests with fast-check pinned to an exact version (no `^` or `~` range), with at least 100 runs per property, and SHALL exit with code 0 when all tests pass and a non-zero code when any test fails.
7. THE project manifest SHALL declare exactly the runtime dependencies `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr` and `server-only` and the dev dependencies `fast-check`, `eslint` and `eslint-config-next`, each pinned to an exact version with no `^`, `~`, `*`, `latest` or range specifier.
8. THE Logic_Module SHALL perform every money calculation (totals, advance, balance) in whole Indian rupees, independent of the currency selected for display.
9. THE `lib/` modules SHALL import other `lib/` modules with relative paths only (no `@/` alias), so that `node --test` resolves them without a bundler.

