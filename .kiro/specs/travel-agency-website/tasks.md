
# Implementation Plan: Travel Guru Raipur Website

## Overview

Port the site to Next.js (App Router, React, plain JavaScript), CSS Modules with `app/globals.css` tokens, Route Handlers (`/api/quote`, `/api/booking`) and Supabase (Postgres + RLS + Auth admin CMS), following the design's file layout. Work goes bottom-up: tooling and scaffold, then the pure core (`lib/data.js`, `lib/logic.js` moved from the root and completed), then pure modules and handler cores in `lib/server/` with property tests, then the Supabase migration and wiring, route handlers, the public page (Server Component sections and client components), the admin area, and finally cleanup of the vanilla files. All code is JavaScript (`.js` / `.jsx`); `lib/` uses relative imports only, app and component files use `@/`.

Already done in the vanilla build and only moved by task 2.1: the `data.js` content and the currency, catalogue, destination, date, payment and cancellation functions in `logic.js`, plus the existing example tests (20 passing). No property tests exist yet.

## Tasks

- [ ] 1. Set up tooling and the Next.js scaffold
  - [x] 1.1 Update `package.json` with pinned dependencies and scripts
    - Keep `"type": "module"`; runtime deps pinned exactly: `next` 16.4.0, `react` 19.3.0, `react-dom` 19.3.0, `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7, `server-only` 0.0.1; dev deps `fast-check` 4.10.2, `eslint` 9.39.5, `eslint-config-next` 16.4.0 (re-check the versions on the registry before installing; no `^`/`~`)
    - Scripts `dev`, `build`, `start`, `lint` (`eslint .`), `test` (`node --test "tests/**/*.test.js"`), `seed` (`node --env-file=.env.local scripts/seed.js`); `engines.node` `>=20.9`; update the description; run `npm install`
    - _Requirements: 2.6, 2.7, 46.3_
  - [x] 1.2 Add `jsconfig.json`, `eslint.config.mjs`, `.gitignore` and `.env.local.example`
    - `jsconfig.json` with `baseUrl "."` and `paths { "@/*": ["./*"] }`; flat ESLint config based on `eslint-config-next`, ignoring `.next/`, `node_modules/`, `prototype/` and the legacy root `index.html`/`app.js`/`styles.css` until task 15.1 deletes them
    - `.gitignore`: add `.next/`, `.env.local` and `.env*.local`; `.env.local.example` with placeholder values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - _Requirements: 46.1, 46.2, 46.4, 45.4_
  - [x] 1.3 Create `next.config.js` with security headers
    - `poweredByHeader: false`; `headers()` for all routes: CSP built from `IMAGE_HOSTS` (imported from `./lib/data.js`) plus the host of `NEXT_PUBLIC_SUPABASE_URL` in `img-src`, `'unsafe-eval'` only in development, `X-Frame-Options DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, HSTS in production only, and `X-Robots-Tag: noindex, nofollow` on `/admin/:path*`
    - _Requirements: 45.1, 45.2, 42.8, 27.4_
  - [x] 1.4 Move `assets/` to `public/assets/` and add a minimal App Router scaffold
    - Move `assets/.gitkeep` to `public/assets/.gitkeep` and remove the empty root `assets/`
    - Minimal `app/layout.js` (`<html lang="en">`, imports `./globals.css`), placeholder `app/globals.css` and `app/page.js` so `next build` and `npm run lint` run from the start (replaced by tasks 11 and 12)
    - _Requirements: 46.1, 46.5, 33.8_
  - [ ]* 1.5 Write manifest tests in `tests/manifest.test.js`
    - Exact versions only, exactly the dependency set of Requirement 2.7, the scripts and `engines.node` of Requirement 46.3, `"type": "module"`, no `tailwind` dependency
    - _Requirements: 2.6, 2.7, 46.3, 3.15_

- [ ] 2. Port the pure core to `lib/`
  - [x] 2.1 Move `data.js` to `lib/data.js` and `logic.js` to `lib/logic.js`
    - Use `git mv` to keep history; `lib/logic.js` keeps importing `./data.js`
    - Switch the imports in `tests/logic.core.test.js` and `tests/data.services.test.js` to `../lib/`; keep `tests/helpers.js` and `tests/helpers.test.js`; `npm test` passes with the same 20 tests
    - _Requirements: 46.5, 2.9, 46.7_
  - [x] 2.2 Apply the stack-revision changes to `lib/data.js`
    - `BUSINESS`: asset paths root-relative (`/assets/logo.png`, `/assets/favicon.png`, `/assets/og-image.jpg`, `/assets/founder.jpg`), remove `leadEndpoint`, add `heroImage` (PLACEHOLDER Unsplash URL) and `timeZone: "Asia/Kolkata"`
    - Add `LEAD_STATUSES`, `BOOKING_STATUSES`, `RATE_LIMITS`, `API_LIMITS`, `IMAGE_HOSTS`, `FORBIDDEN_CLAIMS`; extend `LIMITS` with `fullName`, `departureCityMax`, `destinationsMax`, `emailMax`, `phoneMax`, `notesMax`
    - Data only: no functions, no imports
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7_
  - [x] 2.3 Content in `lib/data.js` (exists in the root `data.js`; moved by 2.1)
    - `CURRENCIES`, `CATEGORIES`, `TIER_IDS`, option lists, `CALLBACK_SLOTS`, `QUOTE_SERVICE_OPTIONS`, `SERVICES`, `SERVICE_ACCENTS`, `REVIEWS`, `FAQ`, the four real `PACKAGES`, `POLICIES`, the 14 `DESTINATIONS` and `DESTINATION_QUOTE_SERVICE`
    - _Requirements: 1.4, 7.1, 7.2, 20.5, 21.4, 21.5, 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 30.3, 31.6, 34.1, 34.2, 34.5_
  - [x] 2.4 Core functions in `lib/logic.js` (exist in the root `logic.js`; moved by 2.1)
    - `convertPrice`, `formatPrice`, `filterPackages`, `fromPriceINR`, `getTier`, `packageInclusions`, `destinationsByRegion`, `addDays`, `daysBetween`, `minDepartureDate`, `isDateOnOrAfter`, `clampCount`, `computeLandTotal`, `computeAdvance`, `computeBookingBreakdown`, `cancellationCharge`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 8.4, 8.5, 8.6, 8.7, 8.8, 11.15, 27.7, 34.3, 34.4, 16.1, 16.2, 16.3, 16.4, 13.1, 13.2, 13.3, 13.4, 13.5, 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 30.1, 30.2, 30.4, 2.8_
  - [x]* 2.5 Existing tests (`tests/helpers.js`, `helpers.test.js`, `logic.core.test.js`, `data.services.test.js`; imports switched by 2.1)
    - _Requirements: 2.6, 7.1, 7.2, 20.5, 21.4, 21.5_
  - [ ]* 2.6 Write data integrity tests in `tests/data.test.js`
    - Package rules, real prices and extras, Singapore `priceNote`, exactly four real packages, category coverage, destinations (count, poster order, unique ids, regions, `packageId` links), `BUSINESS` keys and values (no `leadEndpoint`, root-relative assets, `timeZone`), `CURRENCIES` shape, option-list sizes and uniqueness, new constants, contiguous cancellation bands; failures name the offending id and rule
    - _Requirements: 28.9, 1.1, 1.2, 1.3, 1.4, 1.5, 30.3, 34.1, 34.2, 34.5_

- [ ] 3. Property tests for the ported logic
  - Each property lives in its own file `tests/properties/pNN-<slug>.test.js`, uses `propertyTag`/`assertProperty` from `tests/helpers.js` (≥ 100 runs) and defines its own generators
  - [ ]* 3.1 Write property test for conversion identity
    - **Property 1: Conversion identity**
    - **Validates: Requirements 9.2**
  - [ ]* 3.2 Write property test for conversion monotonicity
    - **Property 2: Conversion monotonicity**
    - **Validates: Requirements 9.3**
  - [ ]* 3.3 Write property test for conversion accuracy and unknown-code rejection
    - **Property 3: Conversion accuracy and unknown-code rejection**
    - **Validates: Requirements 9.1, 9.4**
  - [ ]* 3.4 Write property test for price formatting
    - **Property 4: Price formatting**
    - **Validates: Requirements 9.5, 9.6**
  - [ ]* 3.5 Write property test for filter correctness
    - **Property 5: Filter correctness**
    - **Validates: Requirements 8.4, 8.5**
  - [ ]* 3.6 Write property test for region partition
    - **Property 6: Region partition**
    - **Validates: Requirements 8.6**
  - [ ]* 3.7 Write property test for from price and tier lookup
    - **Property 7: From price and tier lookup**
    - **Validates: Requirements 8.7, 8.8, 27.7**
  - [ ]* 3.8 Write property test for inclusions selection
    - **Property 8: Inclusions selection**
    - **Validates: Requirements 11.15**
  - [ ]* 3.9 Write property test for destination region partition
    - **Property 30: Destination region partition**
    - **Validates: Requirements 34.3, 34.4**
  - [ ]* 3.10 Write property test for date arithmetic round-trip
    - **Property 17: Date arithmetic round-trip**
    - **Validates: Requirements 16.2**
  - [ ]* 3.11 Write property test for minimum departure date
    - **Property 18: Minimum departure date is tomorrow**
    - **Validates: Requirements 16.1**
  - [ ]* 3.12 Write property test for date validation
    - **Property 19: Date validation**
    - **Validates: Requirements 16.3, 16.4**
  - [ ]* 3.13 Write property test for count clamping
    - **Property 14: Count clamping**
    - **Validates: Requirements 13.1, 13.2, 13.3**
  - [ ]* 3.14 Write property test for land package total
    - **Property 12: Land package total**
    - **Validates: Requirements 13.4, 13.5**
  - [ ]* 3.15 Write property test for full payment rules
    - **Property 9: Full payment rules**
    - **Validates: Requirements 29.1, 29.2**
  - [ ]* 3.16 Write property test for the standard 50% advance rule
    - **Property 10: Standard 50% advance rule**
    - **Validates: Requirements 29.3, 29.5**
  - [ ]* 3.17 Write property test for payment conservation
    - **Property 11: Payment conservation**
    - **Validates: Requirements 29.4, 2.8**
  - [ ]* 3.18 Write property test for breakdown composition
    - **Property 13: Breakdown composition**
    - **Validates: Requirements 29.6**
  - [ ]* 3.19 Write property test for cancellation bands and boundaries
    - **Property 15: Cancellation bands and boundaries**
    - **Validates: Requirements 30.1**
  - [ ]* 3.20 Write property test for cancellation monotonicity and invalid input
    - **Property 16: Cancellation monotonicity and invalid input**
    - **Validates: Requirements 30.2, 30.4**
  - [ ]* 3.21 Extend payment edge-case unit tests in `tests/logic.core.test.js`
    - Exactly 21 vs 20 days; ₹25,000 vs ₹24,999 per person; odd totals (advance rounded up); tiers without child price; 1 and 12 adults; leap-day and 31 December balance due dates
    - _Requirements: 29.1, 29.2, 29.3, 13.4_

- [ ] 4. Complete `lib/logic.js` (IDs, validation, WhatsApp, CMS validators)
  - [x] 4.1 Implement `generateTicketId`, `isValidTicketId`, `generateBookingRef` and `computeCallbackDeadline`
    - Ticket `QT-YYYY-NNNN` with `((n % 10000) + 10000) % 10000`; booking ref `BK-` + 6 chars from the alphabet `A-HJ-NP-Z2-9` derived deterministically from n ∈ [0, 2³²); deadline = new Date `now + hours × 3,600,000`, input untouched; no clock or randomness inside
    - _Requirements: 17.3, 17.4, 17.5, 14.8, 2.2_
  - [ ]* 4.2 Write property test for ticket ID format
    - **Property 20: Ticket ID format**
    - **Validates: Requirements 17.3, 17.4**
  - [ ]* 4.3 Write property test for booking reference format
    - **Property 21: Booking reference format**
    - **Validates: Requirements 14.8**
  - [ ]* 4.4 Write property test for callback deadline offset
    - **Property 28: Callback deadline offset**
    - **Validates: Requirements 17.5**
  - [x] 4.5 Implement `validateEmail`, `validatePhone`, `validateQuoteForm` and `validateCheckout`
    - Quote form per design 7.11 with `LIMITS` text limits (`departureCity` ≤ 80, `destinations` ≤ 200, `email` ≤ 254, raw `phone` ≤ 20, `fullName` 2–80, `childAges` ≤ 100, `notes` ≤ 1000, `services` ≤ 8), Submit/WhatsApp modes, option checks, defaults for missing fields, non-string values for string fields are errors, never throws
    - Checkout per design 7.12: tier membership, adults/children ranges with the child-price rule, travel date ≥ tomorrow, `leadName`/`email`/`phone`, `agreeTerms` message; no card checks; extra keys ignored
    - _Requirements: 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11, 15.12, 15.13, 15.14, 15.15, 15.16, 15.17, 15.18, 18.2, 39.4, 14.3, 14.4, 14.5_
  - [ ]* 4.6 Write property test for contact validators
    - **Property 24: Contact validators**
    - **Validates: Requirements 15.5, 15.6**
  - [ ]* 4.7 Write property test for quote form validation consistency
    - **Property 22: Quote form validation consistency**
    - **Validates: Requirements 15.7, 15.8, 15.9, 15.10, 15.11, 15.12, 15.13, 15.14, 15.15, 15.16, 15.17, 15.18, 18.2, 39.4**
  - [ ]* 4.8 Write property test for checkout validation consistency
    - **Property 23: Checkout validation consistency**
    - **Validates: Requirements 14.3, 14.4, 14.5**
  - [x] 4.9 Implement `composeQuoteWhatsAppMessage`, `composeBookingWhatsAppMessage` and `buildWhatsAppUrl`
    - Quote message field order and labels per design 7.13 (slot by label, children with ages); booking message with Breakdown or LandTotal variants per 7.14, amounts in INR, last line "Flights & visa to be quoted separately."; `https://wa.me/{number}?text={encodeURIComponent(message)}`
    - _Requirements: 18.3, 18.4, 18.5, 18.6, 18.7, 12.4, 12.5_
  - [ ]* 4.10 Write property test for WhatsApp quote message completeness
    - **Property 25: WhatsApp quote message completeness**
    - **Validates: Requirements 18.3, 18.4, 18.5**
  - [ ]* 4.11 Write property test for booking WhatsApp message completeness
    - **Property 26: Booking WhatsApp message completeness**
    - **Validates: Requirements 12.4, 12.5**
  - [ ]* 4.12 Write property test for WhatsApp URL round-trip
    - **Property 27: WhatsApp URL round-trip**
    - **Validates: Requirements 18.6, 18.7**
  - [x] 4.13 Implement `validatePackage` and `validateDestination`
    - Every rule of design 7.18 / 7.19 with errors keyed by path (`root`, `days`, `tiers[1].hotels`, …), allowed image hosts or `/assets/` paths, case-insensitive `FORBIDDEN_CLAIMS` scan of every string, `packageId` membership when `packageIds` is supplied; pure, never throws
    - Add shared generators `tests/arbitraries.js` (`validPackageArb`, `destinationArb`) used by properties 31, 32, 37 and 38
    - Fix any `lib/data.js` package or destination that fails validation
    - _Requirements: 44.3, 44.4, 44.9, 32.5, 28.10_
  - [ ]* 4.14 Write property test for package and destination validation
    - **Property 31: Package and destination validation**
    - **Validates: Requirements 44.3, 44.4, 44.9**
    - Also asserts the four `PACKAGES` and the 14 `DESTINATIONS` (with `packageIds` = `PACKAGES` ids) are valid (Requirement 28.10)
  - [ ]* 4.15 Write example tests in `tests/logic.validation.test.js`
    - Ticket/booking ID examples, validator boundaries (exactly 100/1000 chars, 8 and 15 phone digits), WhatsApp message examples, `validatePackage` error paths (`days`, `image`, `tiers[i].hotels`, forbidden claim)
    - _Requirements: 14.8, 15.11, 15.17, 17.3, 18.4, 44.3_
  - [ ]* 4.16 Write property test for purity and module smoke tests
    - **Property 29: Purity**
    - **Validates: Requirements 2.2, 2.3**
    - Also in `tests/logic.module.test.js`: exact export list of `lib/logic.js`, Node import of `lib/data.js` and `lib/logic.js` without browser globals and without console output, source scan for the forbidden code occurrences of Requirement 2.5
    - _Requirements: 2.1, 2.4, 2.5, 1.7_

- [ ] 5. Implement the row mapping and SEO modules
  - [x] 5.1 Implement `lib/content-mapping.js`
    - `packageToRow`, `rowToPackage`, `destinationToRow`, `rowToDestination` per design 6.5; columns win over `data` keys; unknown `data` keys dropped; inputs not mutated
    - _Requirements: 40.8_
  - [ ]* 5.2 Write property test for row mapping round-trip
    - **Property 37: Row mapping round-trip**
    - **Validates: Requirements 40.8**
  - [x] 5.3 Implement `lib/seo.js`
    - `buildMetadata(business)` (title "{brandName} · {tagline}", description, `metadataBase`, Open Graph with the 1200×630 image, `twitter.card`, icons) and `buildViewport()` (`themeColor "#070a1a"`)
    - _Requirements: 33.3_
  - [ ]* 5.4 Write unit tests in `tests/seo.test.js`
    - Every value of criterion 33.3 equals the `BUSINESS` value; failures name the field
    - _Requirements: 33.4_

- [ ] 6. Implement the server handler cores in `lib/server/`
  - [x] 6.1 Implement `lib/server/request.js`
    - `parseJsonBody` (415 / 413 by UTF-8 bytes / 400 `bad_json` for non-object JSON, never throws), `clientIp`, `isSameOrigin`
    - _Requirements: 39.3, 39.5_
  - [ ]* 6.2 Write property test for request parsing limits
    - **Property 40: Request parsing limits**
    - **Validates: Requirements 39.3, 39.5**
  - [x] 6.3 Implement `lib/server/rate-limit.js`
    - `createRateLimiter({ limit, windowMs, maxKeys = 10000 })` sliding-window log with LRU eviction, `check(key, nowMs)` → `{ allowed, remaining, retryAfterMs }`
    - _Requirements: 39.1, 39.2_
  - [ ]* 6.4 Write property test for the rate limiter bound
    - **Property 36: Rate limiter bound**
    - **Validates: Requirements 39.1**
  - [x] 6.5 Implement `lib/server/time.js`
    - `todayISOInZone(date, timeZone)` with `Intl.DateTimeFormat("en-CA", …)`
    - _Requirements: 37.8_
  - [ ]* 6.6 Write property test for the business-timezone date
    - **Property 41: Business-timezone date**
    - **Validates: Requirements 37.8**
  - [x] 6.7 Implement `lib/server/quote.js` (`handleQuote`)
    - Order per design 7.21: same-origin → rate limit (`"quote:" + ip`, before validation) with `Retry-After` → body parse → whitelist + defaults → honeypot (201, unstored ticket) → `validateQuoteForm` in Submit_Mode with the IST date + type checks → 503 when `db` is null → insert with up to `API_LIMITS.maxIdAttempts` ticket attempts; responses never echo submitted values or DB error text
    - Add `tests/fakes.js`: in-memory fake `db` (`insertLead`, `insertBooking`, `getPublishedPackage`, scripted `unique_violation`/`error`/throw), stub `random` and recording `log`, shared by the handler tests
    - _Requirements: 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.8, 39.6, 45.5_
  - [ ]* 6.8 Write property test for quote handler outcomes
    - **Property 34: Quote handler outcomes**
    - **Validates: Requirements 37.2, 37.4, 37.5, 37.7**
  - [x] 6.9 Implement `lib/server/booking.js` (`handleBooking`)
    - Order per design 7.22: same checks as `handleQuote`, whitelist of the nine fields (price-like and card keys ignored), 503 when `db` is null, `getPublishedPackage`, `validateCheckout` with the IST date and the DB package, `computeBookingBreakdown` with the DB tier, insert with up to 5 booking-ref attempts, 201 `{ ok, bookingRef, breakdown }`
    - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5, 38.6, 38.7, 38.8, 38.9, 38.10, 26.5, 39.6_
  - [ ]* 6.10 Write property test for server price recomputation
    - **Property 32: Server price recomputation**
    - **Validates: Requirements 38.4, 38.5**
  - [ ]* 6.11 Write property test for payload whitelisting and no card data
    - **Property 33: Payload whitelisting and no card data**
    - **Validates: Requirements 37.6, 38.6, 26.5**
  - [ ]* 6.12 Write property test for unique ID retry
    - **Property 35: Unique ID retry**
    - **Validates: Requirements 37.3, 38.7**
  - [x] 6.13 Implement `lib/server/content.js` (`loadPublicContent`)
    - Null client → fallback without network; per-list fallback on `{ error }` or throw; map rows, drop rows failing `validatePackage` / `validateDestination` (log ids only); empty list respected; dangling `packageId` → `null`; never throws
    - _Requirements: 40.1, 40.3, 40.4, 40.5, 40.6, 40.7, 45.5_
  - [ ]* 6.14 Write property test for content fallback
    - **Property 38: Content fallback**
    - **Validates: Requirements 40.3, 40.4, 40.5, 40.6, 40.7**
  - [x] 6.15 Implement `lib/server/admin.js`
    - `checkAdmin({ getUser, isAdminUser })` and `runAdminMutation({ getUser, isAdminUser, validate, mutate })`; `mutate` runs only for admins with valid input
    - _Requirements: 42.3, 42.4, 43.5_
  - [ ]* 6.16 Write property test for the admin authorization gate
    - **Property 39: Admin authorization gate**
    - **Validates: Requirements 42.4, 43.5**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement the Supabase schema and wiring
  - [x] 8.1 Write `supabase/migrations/0001_init.sql`
    - Enums, `set_updated_at()`, tables `admins`, `packages`, `destinations`, `leads`, `bookings` with the columns, keys, defaults and check constraints of design 6.4; `public.is_admin()` security definer; FKs (`bookings.package_id` restrict, `destinations.package_id` set null); `updated_at` triggers; RLS on all five tables; policies; revokes and `grant update (status)`
    - _Requirements: 41.1, 41.2, 41.3, 41.4, 41.5, 41.6, 41.7, 41.8_
  - [ ]* 8.2 Write static migration tests in `tests/migration.test.js`
    - RLS enabled on all five tables, read policies limited to `is_published`, no `anon` policy on `leads`/`bookings`/`admins`, no INSERT policy on `leads`/`bookings`, revokes and `grant update (status)` present
    - _Requirements: 41.10_
  - [x] 8.3 Implement `lib/supabase/public.js`, `server.js` and `service.js`
    - `public.js`: `getPublicClient()` → `null` when either public env var is missing, else an adapter `{ fetchPackages, fetchDestinations }` over a cookie-less anon client (`persistSession: false`, published rows ordered by `sort_order`, `id`)
    - `server.js`: `@supabase/ssr` `createServerClient` with `cookies()` `getAll`/`setAll`
    - `service.js`: first line `import "server-only"`; `getServiceClient()` → `null` when the service env vars are missing; the only app module reading `SUPABASE_SERVICE_ROLE_KEY`
    - _Requirements: 40.1, 40.3, 42.1, 42.5, 45.3_
  - [x] 8.4 Implement `lib/supabase/db.js` adapters
    - `getLeadDb()` / `getBookingDb()` → `null` when `getServiceClient()` is `null`; `insertLead`, `insertBooking` (service client), `getPublishedPackage` (anon client, `is_published`, `rowToPackage`, `null` when invalid); map `23505` → `unique_violation`, everything else → `error`, no error text leaked
    - _Requirements: 37.7, 38.2, 38.9, 45.5_
  - [x] 8.5 Implement `scripts/seed.js`
    - Own service-role client from env, clear exit message when missing; validate all `PACKAGES` and `DESTINATIONS` first; upsert packages (`sort_order` = index × 10) then destinations, published, `ignoreDuplicates` unless `--force` (with warning); print inserted/skipped counts; never touches `leads`, `bookings` or `admins`
    - _Requirements: 41.9_

- [ ] 9. Implement the route handlers
  - [x] 9.1 Implement `app/api/quote/route.js`
    - `runtime = "nodejs"`, `dynamic = "force-dynamic"`; module-scope limiter from `RATE_LIMITS.quote`; early 413 on declared `Content-Length` > `API_LIMITS.maxBodyBytes`; wires `handleQuote` with `new Date()`, `crypto.randomInt`, `getLeadDb()`; JSON response with `Cache-Control: no-store` plus core headers
    - _Requirements: 37.1, 39.1, 39.3_
  - [x] 9.2 Implement `app/api/booking/route.js`
    - Same wiring with `RATE_LIMITS.booking`, `handleBooking` and `getBookingDb()`
    - _Requirements: 38.1, 39.1, 39.3_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, `npm run lint` is clean and `next build` succeeds; ask the user if questions arise.

- [ ] 11. Build the design system, root layout and shared client primitives
  - [x] 11.1 Write `app/globals.css`
    - All color, service accent, radius, shadow and spacing tokens on `:root` (no `--gold-*`), resets, container, section padding per breakpoint (640/1024px), eyebrow, gradient text, focus ring (2px `--brand-sky`), `@supports` glass fallback, motion easing/durations and the `prefers-reduced-motion` overrides
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.8, 3.10, 24.4, 24.5, 25.8, 25.9_
  - [x] 11.2 Write the shared CSS Modules in `components/ui/`
    - Buttons (primary, secondary, WhatsApp), glass card, badges, form fields with error state, service icon circle and checkbox tile, segmented control, stepper, accordion, data table with stacked mobile rows
    - _Requirements: 3.2, 3.7, 3.9, 3.13, 24.7_
  - [x] 11.3 Implement `app/layout.js`
    - Poppins (600/700/800) and Plus Jakarta Sans (400–700) via `next/font/google` with `display: "swap"` and CSS variables; `metadata = buildMetadata(BUSINESS)`, `viewport = buildViewport()`; `<html lang="en">`, `<body>` with the modal portal root
    - _Requirements: 3.3, 33.3, 27.4, 27.5_
  - [x] 11.4 Implement client primitives `SafeImage`, `LogoImage`, `WhatsAppButton` and `Reveal`
    - `SafeImage`: `<img>` with width/height, lazy unless `priority`, `onError` gradient placeholder; `LogoImage`: logo `<img>` with fallback to the CSS "TG" Logo_Mark (`role="img"`, same accessible name); `WhatsAppButton`: `buildWhatsAppUrl` + `window.open(…, "noopener")` with `location.href` fallback; `Reveal`: one-shot `IntersectionObserver`, no-op without IO or under reduced motion
    - _Requirements: 3.11, 3.14, 27.2, 33.1, 33.2, 26.2, 5.10, 25.10_

- [ ] 12. Build the server-rendered sections and the public page
  - [x] 12.1 Implement `Hero`, `TrustStrip`, `HowItWorks` and `FinalCta` in `components/sections/`
    - Copy, rating and badge values from `BUSINESS`/`SERVICES` (review count hidden while `null`), Hero H1 with "World" in `--brand-grad`, guarantee badge with shimmer, Ken Burns background with gradient fallback, "Get My Custom Quote" anchor to the quote section and `WhatsAppButton`; CSS Modules for each
    - _Requirements: 1.6, 1.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.11, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 22.1, 22.2, 22.3, 32.1, 33.5, 33.6_
  - [x] 12.2 Implement the `Services` section
    - H2 "Complete Travel Solutions Under One Roof", 8 glass cards with accent icon circles, title, subtitle, summary and bullets; 4+4 desktop, 2-col tablet, 1-col mobile
    - _Requirements: 7.3, 7.4, 24.1, 24.2_
  - [x] 12.3 Implement the `Expert` and `Reviews` sections
    - Expert from `BUSINESS.expert` (name H2 or "Meet Your Travel Expert", photo alt rules, Logo_Mark fallback, Call `tel:` and WhatsApp buttons, 5/7 split); Reviews with rating, badges and placeholder reviews, mobile carousel
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 20.1, 20.2, 20.3, 20.4, 24.3_
  - [x] 12.4 Implement the `Footer` section
    - Four columns with the 64px `LogoImage` and tagline, 8 service links, `tel:` phones in poster order, `mailto:`, website shown as "travelgururaipur.com", WhatsApp, `<address>`, motto, Terms links, current year and indicative-price notices; mobile stacking
    - _Requirements: 22.4, 22.5, 22.6, 22.7, 22.8, 33.1, 33.5, 33.6_
  - [x] 12.5 Implement the section shells for `Collections`, `Destinations`, `QuoteSection`, `Faq` and `Terms`
    - Ids, eyebrows and headings, the Collections pricing note, the Destinations headings, the Quote left panel (guarantee badge, benefits) with the `<noscript>` contact note, server-rendered INR content so the page reads without JavaScript; client components mount into them in task 13
    - _Requirements: 8.13, 32.3, 32.4, 35.1, 17.1, 27.1, 24.1, 24.3_
  - [x] 12.6 Implement `app/page.js` and place the Footer in the layout
    - `revalidate = 300`; `preload(BUSINESS.heroImage, { as: "image", fetchPriority: "high" })`; `loadPublicContent({ client: getPublicClient(), fallback, log })`; sections in the required order inside `<main>`; serialisable props only; `Footer` added to `app/layout.js`
    - _Requirements: 3.12, 5.9, 25.11, 27.3, 27.8, 40.1, 40.2, 40.3_

- [ ] 13. Build the client components
  - [x] 13.1 Implement `CurrencyProvider`, `useCurrency`, `Price` and `CurrencySwitcher`
    - Initial INR, then restore `tg.currency` from `localStorage` in `useEffect`; invalid value → INR and overwrite; storage errors swallowed; header select and segmented variants bound to one context; 150ms crossfade; wrap the body in `app/layout.js`
    - _Requirements: 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9, 26.3, 27.6_
  - [x] 13.2 Implement `ModalProvider`, `useModal` and `Modal`
    - Single open modal with `open`/`replace`/`close`, portal, `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape and backdrop close, scroll lock with offset restore, focus return, `inert` page root, mobile full-screen sheet; wrap in `app/layout.js`
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 24.1, 3.12_
  - [x] 13.3 Implement `Header`, `FloatingWhatsApp` and `MobileStickyBar`
    - Header with `LogoImage`, brand, tagline, nav links incl. Destinations and Terms, currency switcher, "Get Free Quote", scroll state at 40px, header-offset scrolling, drawer with `aria-expanded` and Escape; floating button with tooltip and pulsing ring; mobile bar with Get Quote and WhatsApp; mount all in `app/layout.js`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 33.2, 33.5_
  - [x] 13.4 Implement `QuoteIntentProvider`, `useQuoteIntent` and `EnquireButton`
    - `enquireService(option)` and `quoteDestination(name)` scroll to the quote section and set an intent consumed by the QuoteForm; wrap in `app/layout.js`; render `EnquireButton` on each Services card (accessible name includes the title)
    - _Requirements: 7.3, 7.5, 7.6, 7.7_
  - [x] 13.5 Implement `CategoryFilter` with package cards and mount it in `Collections`
    - Six tabs with `aria-selected` and keyboard support, `filterPackages`, cards with `SafeImage`, region label, N/D, rating, meal plan, highlights, `Price` from `fromPriceINR`, "land package", region extras note, sample chip, empty state linking to the quote section, segmented `CurrencySwitcher` with the indicative note
    - _Requirements: 8.1, 8.2, 8.3, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14, 10.7, 25.7, 24.1, 24.2, 24.3_
  - [x] 13.6 Implement `ItineraryModal` and open it from the package cards
    - Image strip, meta, tier comparison table, tier switcher, hotels per tier with "or similar", `priceNote`, `packageInclusions` chips, "Priced separately" box, day timeline with transfer chips, public `notes`, exclusions summary with "See all Terms"
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.12, 11.13, 11.14, 9.7_
  - [x] 13.7 Implement `CheckoutModal` (tabs, tier, travellers, Mode A and Mode B preview)
    - Opened by "Book Now" (Mode B, cheapest tier, 2 adults, 0 children) and by the Itinerary_Modal hand-off via `replace()` with the active tier; tabs keep values; steppers with disabled bounds; child stepper hidden without child price; travel date `min` from `localTodayISO()`; Mode A summary with `computeLandTotal`/`computeBookingBreakdown` and "Confirm on WhatsApp"; Mode B breakdown rows, policy note from `BUSINESS.paymentPolicy`, indicative conversion line, demo notice, no card fields, Terms link to `/#terms-cancellation` in a new tab
    - _Requirements: 11.10, 11.11, 12.1, 12.2, 12.3, 12.6, 12.7, 12.8, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 14.1, 14.2, 14.13, 9.8, 16.5, 26.4, 29.7, 29.8_
  - [x] 13.8 Implement the booking request submit and `VoucherModal`
    - `validateCheckout` inline errors with focus; POST to `/api/booking` with only the nine fields, "Sending…" and 10 s timeout; 201 → `VoucherModal` with server ref and breakdown, "Pending confirmation", "No payment has been taken", contacts, Terms link, Print; 400 → field errors; 429/5xx/network/timeout → message and "Confirm on WhatsApp"
    - _Requirements: 14.6, 14.7, 14.9, 14.10, 14.11, 14.12, 14.14, 27.8_
  - [x] 13.9 Implement `QuoteForm` (render, validation, WhatsApp mode) and mount it in `QuoteSection`
    - Three steps with service tiles, Raipur default, steppers, child ages toggle, selects from the option lists, date `min`, honeypot `website`; consumes the quote intent (tick service / set destination, clear errors); inline errors with `aria-describedby`, `aria-live` summary and focus; WhatsApp instant quote via `validateQuoteForm` (WhatsApp mode) + composer, no API call
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.19, 15.20, 16.5, 17.1, 18.1, 18.8, 18.9, 18.10, 19.6, 19.7, 7.5, 7.6, 7.7, 35.4, 25.6, 24.1, 24.2, 24.3_
  - [x] 13.10 Implement the quote submit and `TicketModal`
    - POST to `/api/quote` with all fields and `website`, "Sending…", 10 s timeout; 201 → `TicketModal` with server Ticket_ID and deadline, summary rows, copy with selection fallback, Continue on WhatsApp, Done resets the form; 400 → inline errors; 429 and other failures → messages with the WhatsApp button; no ticket counter
    - _Requirements: 17.2, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12, 17.13, 19.1, 19.2, 19.3, 19.4, 19.5, 27.8_
  - [x] 13.11 Implement `DestinationTiles` and mount them in `Destinations`
    - International and Domestic grids from `destinationsByRegion` on the loaded destinations, `SafeImage` tiles, "Get a Quote" via `quoteDestination`, "View Package" only when `packageId` resolves (opens `ItineraryModal`); responsive grids and mobile scroll-snap rows
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 24.1, 24.2, 24.3_
  - [x] 13.12 Implement `FaqAccordion` and mount it in `Faq`
    - All collapsed on load, `aria-expanded`/`aria-controls`, `+` → `×`, optional `link`
    - _Requirements: 21.1, 21.2, 21.3, 21.6_
  - [x] 13.13 Implement `TermsTabs` and mount it in `Terms`
    - Seven panels (tabs ≥ 1024px with `aria-selected`, accordion below with `aria-expanded`), international and domestic inclusions, payment panel generated from `BUSINESS.paymentPolicy`, cancellation `<table>` with caption and `th scope="col"` plus rules, `#terms-*` hash deep links
    - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.7, 31.8, 25.7, 25.12, 24.7_

- [ ] 14. Build the admin area
  - [x] 14.1 Implement `proxy.js`
    - `config.matcher = ["/admin/:path*"]`; `@supabase/ssr` client on request/response cookies, `auth.getUser()` refresh, redirect to `/admin/login` without a user (except on the login page), `X-Robots-Tag: noindex, nofollow`
    - _Requirements: 42.2, 42.8_
  - [x] 14.2 Implement sign-in and sign-out
    - `app/admin/actions.js` (`'use server'`) with `signIn` (login rate limiter, "Invalid email or password", "Too many attempts. Try again later.") and `signOut` (end session, redirect); `app/admin/login/page.js` with `components/admin/LoginForm`; noindex, dynamic, no sign-up anywhere
    - _Requirements: 42.1, 42.6, 42.7, 42.8, 39.1_
  - [x] 14.3 Implement `app/admin/layout.js`
    - `robots` noindex metadata, `dynamic = "force-dynamic"`, nav (Leads, Bookings, Packages, Destinations) and Sign out; "Not authorised" view with Sign out via `checkAdmin` with the session client; "Database not configured" when env vars are missing
    - Note: auth gate + nav live in `app/admin/(protected)/layout.js` (login stays outside). Authenticated admin pages go under `app/admin/(protected)/` (URLs unchanged), render no own `<main>`, and call `getAdminSession()` from `lib/server/admin-session.js` before reading data. Public chrome moved to `app/(site)/layout.js`; home page is `app/(site)/page.js`.
    - _Requirements: 42.3, 42.5, 42.8, 44.10_
  - [x] 14.4 Implement the leads page with status updates
    - `app/admin/(protected)/page.js` (replaces the placeholder) + `components/admin/LeadsTable` and `StatusSelect`: newest first, 50 per page, IST times, `tel:`/WhatsApp/`mailto:` links; `updateLeadStatus` through `runAdminMutation` validated against `LEAD_STATUSES`, success/failure feedback; no other edits or deletes
    - _Requirements: 43.1, 43.2, 43.5, 43.6, 42.4, 42.5_
  - [x] 14.5 Implement the bookings page with status updates
    - `app/admin/(protected)/bookings/page.js` + `BookingsTable`: columns of criterion 43.3 with INR amounts; `updateBookingStatus` validated against `BOOKING_STATUSES`
    - _Requirements: 43.3, 43.4, 43.5, 43.6, 42.4_
  - [x] 14.6 Implement package list and editor
    - `app/admin/(protected)/packages/page.js` (all rows, sort order, from price, published, updated) and `packages/[id]/page.js` with `PackageForm` (id editable on create only, categories checkboxes, JSON textarea for `data`); client `JSON.parse` + `validatePackage` errors by path; `savePackage` re-parses, validates, upserts `packageToRow`, `revalidatePath("/")`, "Saved"; `deletePackage` with confirm and the FK message "This package has bookings. Unpublish it instead."
    - _Requirements: 44.1, 44.2, 44.5, 44.6, 44.7, 44.8, 40.2, 42.4_
  - [x] 14.7 Implement destination list and editor
    - `app/admin/(protected)/destinations/page.js` and `destinations/[id]/page.js` with `DestinationForm` (package select of existing ids or none); `validateDestination` on client and in `saveDestination`; `deleteDestination` with confirm; `revalidatePath("/")` after every change
    - _Requirements: 44.8, 44.9, 40.2, 42.4_

- [ ] 15. Remove the vanilla build and add static scans
  - [x] 15.1 Delete the superseded root files
    - Delete root `index.html`, `styles.css` and `app.js`; remove their ESLint ignores; leave `prototype/index.html` untouched; `npm test`, `npm run lint` and `next build` pass
    - _Requirements: 46.6, 46.1_
  - [ ]* 15.2 Write claims and brand scans in `tests/claims.test.js`
    - Forbidden phrases (with the "refundable security deposit" exception) and removed service names / old tagline across `lib/data.js`, `app/**`, `components/**`; no `--gold-`/`--shadow-gold` in any `.css` file
    - _Requirements: 32.2, 33.7_
  - [ ]* 15.3 Write security scans in `tests/security.test.js`
    - Within `app/`, `components/`, `lib/`, `scripts/`, `proxy.js`: `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/service.js` and `scripts/seed.js` (plus `.env.local.example`), no `NEXT_PUBLIC_SUPABASE_SERVICE`, `service.js` starts with `import "server-only"`, no `dangerouslySetInnerHTML`, no card field names, `localStorage.setItem` only with the currency key, `lib/server/*` free of `next`/`react`/`@supabase` imports and loadable in Node without output; `.gitignore` covers `.env*.local`; `next.config.js` defines the required headers; no `.ts`/`.tsx` files or Tailwind config
    - _Requirements: 45.3, 45.4, 45.7, 26.1, 26.3, 2.4, 2.5, 3.15, 46.1_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, `npm run lint` is clean and `next build` succeeds; ask the user if questions arise.
  - USER ACTIONS (not coding tasks, done by the agency in their own accounts):
    - Create the Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`)
    - Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (never commit it); set the same variables on the host
    - Run `npm run seed` to load the 4 packages and 14 destinations
    - Create the admin user in the Supabase dashboard (Authentication → Users), then run `insert into public.admins (user_id) values ('<user uuid>');`
    - Place `public/assets/logo.png`, `public/assets/favicon.png`, `public/assets/og-image.jpg` (1200×630) and `public/assets/founder.jpg`; the "TG" mark fallback shows until they exist
    - Manual checks from the design: RLS with the anon key, end-to-end quote/booking/admin flows, headers and CSP in the browser, responsive and keyboard checks (full WCAG validation needs assistive-technology testing and expert review)

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; `[x]` items already exist in the vanilla build and are carried over by task 2.1
- Each task references specific requirements for traceability
- Properties 1–41 each get their own file under `tests/properties/` (instead of the design's grouped `logic.property.test.js` / `cms.property.test.js`) so property tasks never edit the same file and can run in parallel; shared helpers are `tests/helpers.js`, `tests/arbitraries.js` (task 4.13) and `tests/fakes.js` (task 6.7)
- Tests import only `lib/` with relative paths and need no Next.js build, Supabase project or network
- Between tasks 2.1 and 15.1 the legacy root `index.html`/`app.js` no longer work (their imports moved); they are reference only until deleted
- Open assumptions (payment-policy boundaries, Nepal grouping, founder details, ticket ID capacity, privacy notice) are listed in design.md "Open Items to Confirm"

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.4", "2.1"] },
    { "id": 1, "tasks": ["1.5", "2.2"] },
    { "id": 2, "tasks": ["1.3", "2.6", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14", "3.15", "3.16", "3.17", "3.18", "3.19", "3.20", "3.21", "4.1", "5.1", "5.3", "6.1", "6.3", "6.5"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.4", "6.2", "6.4", "6.6"] },
    { "id": 4, "tasks": ["4.6", "4.7", "4.8", "4.9"] },
    { "id": 5, "tasks": ["4.10", "4.11", "4.12", "4.13"] },
    { "id": 6, "tasks": ["4.14", "4.15", "4.16", "5.2", "6.7", "6.9", "6.13", "6.15"] },
    { "id": 7, "tasks": ["6.8", "6.10", "6.11", "6.12", "6.14", "6.16", "8.1", "8.3"] },
    { "id": 8, "tasks": ["8.2", "8.4", "8.5"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["11.1", "11.2"] },
    { "id": 11, "tasks": ["11.3", "11.4"] },
    { "id": 12, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5"] },
    { "id": 13, "tasks": ["12.6"] },
    { "id": 14, "tasks": ["13.1", "14.1", "14.2"] },
    { "id": 15, "tasks": ["13.2", "14.3"] },
    { "id": 16, "tasks": ["13.3", "14.4"] },
    { "id": 17, "tasks": ["13.4", "14.5"] },
    { "id": 18, "tasks": ["13.5", "13.9", "13.12", "13.13", "14.6"] },
    { "id": 19, "tasks": ["13.6", "13.10", "14.7"] },
    { "id": 20, "tasks": ["13.7", "13.11"] },
    { "id": 21, "tasks": ["13.8"] },
    { "id": 22, "tasks": ["15.1"] },
    { "id": 23, "tasks": ["15.2", "15.3"] }
  ]
}
```
