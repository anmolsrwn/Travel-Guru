# Requirements Document

## Introduction

This document derives the requirements for the Travel Guru Raipur website from the approved design (`design.md`). The Site is a single public marketing and lead-conversion page plus a small admin area for Travel Guru Raipur, an independent tours and travel agency at VIP Chowk, Telibandha, Raipur. Its brand (logo, blue/orange palette on a dark indigo canvas, tagline "Your Journey, Our Priority") and content follow the agency's real logo and marketing poster. It presents 8 services, a Popular Destinations section (international and domestic grids), a "Your Travel Expert" founder section, a filterable collections showcase built from the agency's real quotations (Bali, Dubai, Singapore, Kerala) with Deluxe / Superior / Premium hotel tiers, adult and child prices per person, separately priced flights and visas, INR base pricing with an indicative currency switcher, day-by-day itinerary modals, a dual-mode booking checkout (WhatsApp, or a booking request that follows Travel Guru's real payment policy without taking any payment), a Terms & Policies section, and a 24-hour call-back quotation engine with a WhatsApp instant-quote fallback.

Stack revision (approved): the Site is built with Next.js (App Router, React, plain JavaScript, no TypeScript), vanilla CSS with CSS Modules plus one global token stylesheet, Next.js Route Handlers on the Node.js runtime, and Supabase (PostgreSQL, Auth, Row Level Security). Configuration and static content live in `lib/data.js`; pure business logic lives in `lib/logic.js`; both remain framework-free ES modules testable with `node --test`. Quote requests and booking requests are stored in Supabase through two public API endpoints; packages and destinations are stored in Supabase, editable in a password-protected admin area, and fall back to the static content in `lib/data.js` when the database is not configured or unreachable. There is still no real payment processing; currency conversions are indicative.

Open assumptions are listed in the design's "Open Items to Confirm". Requirements 33–36 were added by the brand revision. Requirements 37–46 were added by the stack revision; Requirements 1, 2, 3, 5, 9, 12, 13, 14, 17, 19, 26, 27, 28, 32 and 33 were revised for it. The superseded vanilla files (root `index.html`, `styles.css`, `app.js`) are deleted after the port, and root `data.js` / `logic.js` move to `lib/` (Requirement 46).

Reading note: in rendering criteria (Requirements 8, 11, 12, 13, 35), `PACKAGES` and `DESTINATIONS` denote the Catalogue returned by the Content_Source (Requirement 40). In Data_Config criteria (Requirements 1, 28, 34) they denote the static constants in `lib/data.js`, which are also the seed and fallback content.

## Glossary

- **Site**: The complete Next.js application: the public page `/`, the API routes `/api/quote` and `/api/booking`, the admin area `/admin/*`, and the static files in `public/`.
- **Data_Config**: The `lib/data.js` module containing only configuration and content (`BUSINESS`, `CURRENCIES`, `CATEGORIES`, `TIER_IDS`, option lists, `LIMITS`, `LEAD_STATUSES`, `BOOKING_STATUSES`, `RATE_LIMITS`, `API_LIMITS`, `IMAGE_HOSTS`, `FORBIDDEN_CLAIMS`, `SERVICES`, `SERVICE_ACCENTS`, `DESTINATIONS`, `DESTINATION_QUOTE_SERVICE`, `PACKAGES`, `REVIEWS`, `FAQ`, `POLICIES`).
- **Logic_Module**: The `lib/logic.js` module exporting pure functions with no access to the DOM, `localStorage`, `window`, the system clock, random number generators, the network, Next.js, React or Supabase. The Logic_Module may import constants from the Data_Config.
- **App_Layer**: The client components and providers (files starting with `'use client'`) that run in the Visitor's browser; the only browser code that accesses the DOM, `localStorage`, `window.open`, the Visitor's local date and time, and `fetch`.
- **Server_Layer**: The Server Components, Route Handlers, Server Actions, `proxy.js`, `lib/server/*` and `lib/supabase/*` modules that run on the server.
- **Handler_Core**: A pure function in `lib/server/` (`handleQuote`, `handleBooking`, `loadPublicContent`, `runAdminMutation`, `createRateLimiter`, `parseJsonBody`, `clientIp`, `isSameOrigin`, `todayISOInZone`) that receives the database adapter, clock, random source and rate limiter as arguments and imports nothing from Next.js or Supabase.
- **Visitor**: A person using the public page in a web browser.
- **Admin**: A Supabase Auth user whose id is present in the `admins` table.
- **Admin_Area**: The pages under `/admin` other than `/admin/login`, and the Server Actions they use.
- **Database**: The Supabase PostgreSQL database with the tables `packages`, `destinations`, `leads`, `bookings` and `admins` created by `supabase/migrations/0001_init.sql`.
- **Anon_Client**: A Supabase client created with `NEXT_PUBLIC_SUPABASE_ANON_KEY` and no cookies, used for public reads.
- **Session_Client**: A Supabase client created with `@supabase/ssr` from the request cookies, carrying the signed-in user's session.
- **Service_Client**: A Supabase client created with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS; used only by the Route Handlers and the seed script.
- **Content_Source**: The function `loadPublicContent` that returns the published packages and destinations from the Database, or the Data_Config `PACKAGES` and `DESTINATIONS` as fallback.
- **Catalogue**: The packages and destinations returned by the Content_Source for one rendering of the public page.
- **Quote_API**: The Route Handler `POST /api/quote`.
- **Booking_API**: The Route Handler `POST /api/booking`.
- **Lead**: A row in the `leads` table created by the Quote_API.
- **Booking_Request**: A row in the `bookings` table created by the Booking_API, with status `pending` until an Admin changes it.
- **Rate_Limiter**: The in-memory sliding-window limiter returned by `createRateLimiter`, keyed by endpoint and client IP.
- **Honeypot**: The visually hidden quote form field named `website`, which humans leave empty.
- **Business_Date**: `todayISOInZone(now, BUSINESS.timeZone)`, the calendar date in Asia/Kolkata used by the Server_Layer as "today".
- **ISO_Date**: A string `YYYY-MM-DD` denoting a calendar date; `todayISO` in the App_Layer is the Visitor device's local calendar date.
- **Base_Currency**: `BUSINESS.baseCurrency`, set to "INR"; all prices are stored in whole Indian rupees in fields ending `PriceINR` or `INR` (columns ending `_inr`).
- **Supported_Currency**: One of INR, USD, EUR, GBP, AUD, AED, SGD as defined in `CURRENCIES`, each with a symbol, a static indicative rate in units per 1 INR, a locale and a decimals setting.
- **Brand_Logo**: The agency's logo image at `BUSINESS.logo.src` (`/assets/logo.png`, file `public/assets/logo.png` supplied by the user) with alt text `BUSINESS.logo.alt` ("Travel Guru Raipur logo").
- **Logo_Mark**: The CSS fallback mark: a circle with a `--brand-indigo` ring and white inner hairline containing `BUSINESS.logoInitials` ("TG") in `--brand-grad` text, shown when the Brand_Logo fails to load.
- **Header**: The sticky top navigation bar containing the Brand_Logo (or Logo_Mark), brand name, tagline, section links, currency selector and primary CTA.
- **Hero**: The first full-bleed section with headline, CTAs and the 24h guarantee badge.
- **Trust_Strip**: The band directly below the Hero showing four trust statements.
- **How_It_Works**: The four-step process section.
- **Services_Section**: The section rendering the 8 service cards from `SERVICES`.
- **Service_Accent**: One of the eight service accent tokens `--svc-blue`, `--svc-orange`, `--svc-purple`, `--svc-red`, `--svc-green`, `--svc-teal`, `--svc-violet` and `--svc-pink`, listed in `SERVICE_ACCENTS`, used as the fill of a service's icon circle.
- **Destination**: A destination record with `id`, `name`, `tagline`, `region` ("international" or "domestic"), `image` and `packageId` (a Package id or `null`).
- **Destinations_Section**: The Popular Destinations section rendering an International grid and a Domestic grid of Destination tiles.
- **Expert_Section**: The "Your Travel Expert" section rendered from `BUSINESS.expert` (`name` string or `null`, `role`, `bio`, `photo`).
- **Collections_Section**: The section rendering package cards from the Catalogue, with the Category_Filter and Currency_Switcher.
- **Category_Filter**: The segmented control with one tab per entry in `CATEGORIES` (`all`, `international`, `domestic`, `honeymoon`, `family`, `beach`).
- **Currency_Switcher**: The segmented control (and Header selector) used to select the Supported_Currency in which catalogue prices display.
- **Package**: A catalogue record with id, title, destination, region, categories, nights, days, image, highlights, hotel star rating, meal plan, transfer basis, tiers, extras, optional inclusions, itinerary, optional `isSample` flag and optional public `notes`.
- **Region**: A Package's `region`, either "international" or "domestic"; every Package has exactly one Region, which is also listed in its `categories`.
- **Tier**: A hotel option within a Package with id from `TIER_IDS` (`deluxe`, `superior`, `premium`), label, optional hotel label, `adultPriceINR`, `childPriceINR` (integer or `null` meaning "on request"), optional price note and per-location hotel stays.
- **Extras**: A Package's separately priced items: indicative flight fare per person and note, pre-arranged visa fee per person, and on-arrival charges paid by the traveller; Extras are never added to any package total.
- **From_Price**: The lowest `adultPriceINR` across a Package's Tiers, as returned by `fromPriceINR`.
- **Itinerary_Modal**: The modal showing a Package's tiers, hotels, prices, inclusions, Extras and day-by-day itinerary.
- **Checkout_Modal**: The booking modal with two modes: Mode A (WhatsApp Instant) and Mode B (Booking Request).
- **Payment_Policy**: `BUSINESS.paymentPolicy` with `thresholdPerPersonINR` 25000, `advanceRate` 0.5, `balanceDueDaysBefore` 21 and `fullPaymentWithinDays` 21.
- **Land_Total**: The object returned by `computeLandTotal` with `tierId`, `adults`, `children`, `adultPriceINR`, `childPriceINR`, `adultsSubtotal`, `childrenSubtotal`, `total` and `currency` "INR".
- **Advance_Result**: The object returned by `computeAdvance` with `advanceRate`, `advance`, `balance`, `balanceDueDate`, `rule` and `daysUntilDeparture`.
- **Booking_Breakdown**: The object returned by `computeBookingBreakdown`, combining a Land_Total with an Advance_Result.
- **Days_Until_Departure**: `daysBetween(bookingDate, departureDate)`, the number of calendar days from the booking date to the departure date.
- **Cancellation_Table**: `POLICIES.cancellation.table`, the five bands of cancellation charges by days prior to departure.
- **Voucher_Modal**: The booking request confirmation modal shown after the Booking_API stores a Booking_Request.
- **Booking_Reference**: An identifier matching `^BK-[A-HJ-NP-Z2-9]{6}$`.
- **Quote_Engine**: The 24h Quotation Engine section containing the quote form, the submit action and the WhatsApp instant-quote action.
- **Quote_Form_Data**: The object `{services, departureCity, destinations, departureDate, duration, tripType, adults, children, childAges, hotelCategory, mealPlan, budget, fullName, phone, email, callbackSlot, notes}`, where `childAges` is free text.
- **Validator**: The Logic_Module functions `validateQuoteForm`, `validateCheckout`, `validateEmail`, `validatePhone`, `isDateOnOrAfter`, `minDepartureDate`, `validatePackage` and `validateDestination`.
- **Submit_Mode**: Validation mode `"submit"` used by the 24h call-back submit action and the Quote_API.
- **WhatsApp_Mode**: Validation mode `"whatsapp"` used by the instant-quote action.
- **Ticket_ID**: A quotation identifier matching `^QT-\d{4}-\d{4}$`, generated only by the Quote_API.
- **Ticket_Modal**: The Quotation Ticket confirmation modal.
- **Callback_Deadline**: The date-time equal to submission time plus `BUSINESS.callbackHours` (24) hours, computed by the Quote_API.
- **WhatsApp_Composer**: The Logic_Module functions `composeQuoteWhatsAppMessage`, `composeBookingWhatsAppMessage` and `buildWhatsAppUrl`.
- **Reviews_Section**: The section with traveller review cards and trust badges.
- **FAQ_Accordion**: The Operations FAQ rendered from `FAQ` as an accordion.
- **Terms_Section**: The Terms & Policies section (`id="terms"`) rendered from `POLICIES` and the Payment_Policy.
- **Final_CTA**: The closing call-to-action band above the Footer.
- **Footer**: The page footer with brand, service links, company links, contact details and address.
- **Floating_WhatsApp**: The fixed circular WhatsApp button at the bottom-right of the viewport.
- **Mobile_Sticky_Bar**: The fixed bottom bar with "Get Quote" and "WhatsApp" buttons shown on mobile viewports.
- **Modal_Manager**: The `ModalProvider` context and the accessible `Modal` component that control every modal, allowing exactly one open modal at a time.
- **Design_System**: The color, typography, spacing, radius, elevation, component and motion tokens defined in the design's UI/UX Design System section.
- **Mobile_Viewport**: Viewport width below 640px.
- **Tablet_Viewport**: Viewport width from 640px to 1023px.
- **Desktop_Viewport**: Viewport width from 1024px to 1439px.
- **Wide_Viewport**: Viewport width of 1440px or more.
- **Test_Suite**: The Node tests in `tests/` run with `node --test "tests/**/*.test.js"` and fast-check, importing only `lib/` modules.

## Requirements

### Requirement 1: Centralised Business Configuration

**User Story:** As the agency owner, I want all brand, contact, policy and content data in one configuration file, so that I can update the Site by editing a single file.

#### Acceptance Criteria

1. THE Data_Config SHALL define `BUSINESS` with exactly the keys `brandName`, `shortName`, `logoInitials`, `logo`, `favicon`, `ogImage`, `heroImage`, `timeZone`, `tagline`, `motto`, `website`, `email`, `phones`, `whatsapp`, `expert`, `address`, `originCity`, `baseCurrency`, `paymentPolicy`, `quoteValidityHours`, `callbackHours`, `whatsappResponseMins`, `ticketPrefix`, `bookingPrefix`, `rating` and `badges` (no `leadEndpoint`), where `rating` holds a numeric `score` between 0 and 5 inclusive and a `count` that is either `null` or an integer of 0 or more.
2. THE Data_Config SHALL default `BUSINESS` to brand name "Travel Guru Raipur", short name "Travel Guru", logo initials "TG", logo `{ src: "/assets/logo.png", alt: "Travel Guru Raipur logo" }`, favicon "/assets/favicon.png", OG image "/assets/og-image.jpg", a hero image URL, time zone "Asia/Kolkata", tagline "Your Journey, Our Priority", motto "Fly | Stay | Explore | Experience", website "https://travelgururaipur.com/", email "travelguru008@gmail.com", phones "+91 91719 95559" (tel "+919171995559") and "+91 95842 97000" (tel "+919584297000") in that order, WhatsApp "919171995559", expert `{ name: null, role: "Founder, Travel Guru Raipur", bio: <placeholder text>, photo: "/assets/founder.jpg" }`, address "1st Floor, Currency Tower, Shop No 1087, 1088, VIP Chowk, Telibandha, Raipur, Chhattisgarh 492001", origin city "Raipur" (IATA "RPR"), base currency "INR", quote validity 24 hours, call-back hours 24, WhatsApp response minutes 10, ticket prefix "QT", booking prefix "BK", rating score 4.9 with count `null`, and badges "Verified" and "Trusted".
3. THE Data_Config SHALL store `BUSINESS.whatsapp` as a string of 8 to 15 digits only, in E.164 format without the leading "+", every `BUSINESS.phones[i].tel` as "+" followed by 8 to 15 digits, and `BUSINESS.email` as a string that passes `validateEmail`.
4. THE Data_Config SHALL define `CURRENCIES` with exactly the keys INR, USD, EUR, GBP, AUD, AED and SGD, each with a non-empty `symbol`, a finite `rate` greater than 0 expressed in units per 1 INR, a `locale` accepted by `Intl.NumberFormat` without throwing, and an integer `decimals` value from 0 to 2, with the INR rate equal to 1.
5. THE Data_Config SHALL define `SERVICES` (exactly 8 entries), `SERVICE_ACCENTS` (exactly 8 entries), `DESTINATIONS` (exactly 14 entries), `DESTINATION_QUOTE_SERVICE` (equal to "Holidays"), `PACKAGES` (4 to 9 entries), `CATEGORIES` (exactly 6 entries), `TIER_IDS` (exactly 3 entries), `DURATIONS` (exactly 5 entries), `TRIP_TYPES` (exactly 6 entries), `HOTEL_CATEGORIES` (exactly 7 entries), `MEAL_PLANS` (exactly 4 entries), `BUDGETS` (exactly 4 entries), `CALLBACK_SLOTS` (exactly 4 entries), `QUOTE_SERVICE_OPTIONS` (exactly the 8 entries "Flights", "Hotels", "Passport", "Visa", "Holidays", "Travel Insurance", "Train" and "Packages", in that order), `LIMITS` (including the text limits `fullName` [2, 80], `departureCityMax` 80, `destinationsMax` 200, `emailMax` 254, `phoneMax` 20 and `notesMax` 1000), `LEAD_STATUSES` (exactly "new", "contacted", "quoted", "closed"), `BOOKING_STATUSES` (exactly "pending", "confirmed", "cancelled"), `RATE_LIMITS` (quote 5 per 600,000 ms, booking 5 per 600,000 ms, login 10 per 900,000 ms), `API_LIMITS` (`maxBodyBytes` 16384, `maxIdAttempts` 5, `clientTimeoutMs` 10000), `IMAGE_HOSTS` (including "images.unsplash.com"), `FORBIDDEN_CLAIMS`, `REVIEWS` (at least 3 entries), `FAQ` (8 to 10 entries) and `POLICIES`, with no duplicate values within any option list.
6. THE Site SHALL render the brand name, logo, logo initials, tagline, motto, phone numbers, email address, website, address, expert details and WhatsApp number in the Header, Hero, Expert_Section, Final_CTA, Footer, Floating_WhatsApp, Mobile_Sticky_Bar, Voucher_Modal, Terms_Section and every WhatsApp message and the document head metadata exclusively from the values in `BUSINESS`, so that changing a single `BUSINESS` value changes every rendered occurrence of that value after the next build or revalidation.
7. THE Data_Config SHALL contain only exported constant data (strings, numbers, booleans, `null`, arrays and plain objects), with no function definitions, no DOM access and no import of any other Site module.
8. WHILE `BUSINESS.rating.count` is `null`, THE Site SHALL render no review count anywhere, and WHEN `BUSINESS.rating.count` is an integer, THE Site SHALL render the count with thousands separators next to the rating score.

### Requirement 2: Pure, Node-Testable Logic and Pinned Dependencies

**User Story:** As a developer, I want all business logic in pure, framework-free functions and a small pinned dependency set, so that I can unit and property test the logic and the API handlers in Node without a browser, Next.js or a database.

Note: revised by the stack revision. The former "zero runtime dependencies" criterion is replaced by criterion 2.7.

#### Acceptance Criteria

1. THE Logic_Module SHALL export exactly the named functions `convertPrice`, `formatPrice`, `filterPackages`, `getTier`, `fromPriceINR`, `packageInclusions`, `destinationsByRegion`, `addDays`, `daysBetween`, `minDepartureDate`, `isDateOnOrAfter`, `computeAdvance`, `computeLandTotal`, `computeBookingBreakdown`, `cancellationCharge`, `clampCount`, `generateTicketId`, `isValidTicketId`, `generateBookingRef`, `validateEmail`, `validatePhone`, `validateQuoteForm`, `validateCheckout`, `validatePackage`, `validateDestination`, `composeQuoteWhatsAppMessage`, `composeBookingWhatsAppMessage`, `buildWhatsAppUrl` and `computeCallbackDeadline`, each with `typeof` equal to "function".
2. THE Logic_Module and every Handler_Core SHALL receive the current date, the current time and random values as function arguments, so that two calls to any exported function with deep-equal inputs (and deep-equal fake dependencies) return deep-equal outputs (or throw the same error type).
3. WHEN any Logic_Module function is called, THE Logic_Module SHALL leave every input argument, including nested arrays, objects and Date values, deep-equal to its pre-call state.
4. WHEN the Logic_Module, the Data_Config, `lib/content-mapping.js`, `lib/seo.js` or any `lib/server/*` module is imported as an ES module in Node.js 20.9 or later with no `window`, `document` or `localStorage` globals defined and without a Next.js build, THE module SHALL load without throwing and without producing console output.
5. THE Logic_Module and Data_Config source SHALL contain zero code occurrences of `window.`, `document.`, `localStorage`, `Date.now(`, the argument-less `new Date()`, `Math.random(`, `crypto.`, `fetch(`, `process.env` and imports from `next`, `react` or `@supabase` (words inside strings and comments, such as "document checklist", are not code occurrences), and the `lib/server/*` modules SHALL contain zero imports from `next`, `react` or `@supabase`.
6. THE Test_Suite SHALL run example-based tests with the built-in `node:test` runner and property-based tests with fast-check pinned to an exact version (no `^` or `~` range), with at least 100 runs per property, and SHALL exit with code 0 when all tests pass and a non-zero code when any test fails.
7. THE project manifest SHALL declare exactly the runtime dependencies `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr` and `server-only` and the dev dependencies `fast-check`, `eslint` and `eslint-config-next`, each pinned to an exact version with no `^`, `~`, `*`, `latest` or range specifier.
8. THE Logic_Module SHALL perform every money calculation (totals, advance, balance) in whole Indian rupees, independent of the currency selected for display.
9. THE `lib/` modules SHALL import other `lib/` modules with relative paths only (no `@/` alias), so that `node --test` resolves them without a bundler.

### Requirement 3: UI Design System

**User Story:** As the agency owner, I want a consistent visual language that matches our logo and poster, so that the Site looks bold, recognisable and trustworthy.

Note: revised by the approved brand revision. Gold is replaced by the logo's indigo, blue, sky and orange on a dark indigo-tinted canvas, and headings switch from Playfair Display to Poppins.

#### Acceptance Criteria

1. THE Site SHALL define the Design_System color tokens as CSS custom properties on `:root` in `app/globals.css`: `--bg-0 #070a1a`, `--bg-1 #0c1230`, `--bg-2 #141b40`, `--glass rgba(255,255,255,0.04)`, `--glass-border rgba(41,169,245,0.16)`, `--brand-indigo #2410b5`, `--brand-blue #1e6fe0`, `--brand-sky #29a9f5`, `--brand-orange #f7931e`, `--brand-orange-deep #f26522`, `--brand-grad linear-gradient(135deg,#f7931e 0%,#29a9f5 100%)`, `--cta-grad linear-gradient(135deg,#f7931e 0%,#f26522 100%)`, `--blue-grad linear-gradient(135deg,#1e6fe0 0%,#2410b5 100%)`, `--emerald #10b981`, `--whatsapp #25D366`, `--text-hi #f5f1e8`, `--text-md #b8bfd0`, `--text-lo #8a93ab`, `--on-cta #070a1a`, `--danger #f87171`, and the Service_Accent tokens `--svc-blue #1e6fe0`, `--svc-orange #f7931e`, `--svc-purple #9333ea`, `--svc-red #ef4444`, `--svc-green #22c55e`, `--svc-teal #14b8a6`, `--svc-violet #7c3aed` and `--svc-pink #ec4899`.
2. THE Site SHALL use `--cta-grad` only as the fill of primary CTA buttons; `--brand-grad` only on headline accent words, prices, brand badges, the Logo_Mark letters and decorative hairlines; `--blue-grad` only on active segmented-control segments; `--brand-sky` for secondary buttons, focus rings and eyebrows; Service_Accent tokens only as service icon-circle fills; `--emerald` only on verified ticks, "included" chips and success indicators; and `--whatsapp` as the fill of every WhatsApp button.
3. THE Site SHALL render headings (H1 to H3) and prices in Poppins (weights 600, 700 and 800) and body, UI and form text in Plus Jakarta Sans (weights 400 to 700), loaded through `next/font/google` with `display: "swap"` so that the font files are served from the Site's own origin and the browser makes no request to a Google origin, with a generic `sans-serif` fallback for both fonts.
4. THE Site SHALL apply the type scale: hero H1 `clamp(2.5rem, 6vw, 4.75rem)` weight 800, H2 `clamp(2rem, 4vw, 3rem)` weight 700, H3 `1.375rem` weight 600, eyebrow `0.75rem` uppercase with `0.24em` letter-spacing in `--brand-sky`, body `1rem` with line-height 1.7, captions `0.8125rem`, buttons `0.9375rem` weight 600, and prices in Poppins `1.75rem` weight 700 with `--brand-grad` gradient text.
5. THE Site SHALL use only spacing values from the scale 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128px for margins, paddings and gaps, section vertical padding of 96px on Desktop_Viewport and Wide_Viewport, 64px on Tablet_Viewport and 48px on Mobile_Viewport, and a container of max-width 1200px with 24px side padding (16px on Mobile_Viewport).
6. THE Site SHALL use radius tokens `--r-sm 8px` (inputs, chips), `--r-md 16px` (cards), `--r-lg 24px` (modals, quote panel) and `--r-pill 999px` (buttons, badges), and shadow tokens `--shadow-card: 0 10px 30px -10px rgba(0,0,0,.6)` and `--shadow-brand: 0 8px 28px -8px rgba(247,147,30,.45)`, with no `--gold-*` or `--shadow-gold` token defined or referenced.
7. THE Site SHALL implement buttons as follows: primary button as a `--r-pill` pill with `--cta-grad` fill, `--on-cta` text, 14px vertical by 28px horizontal padding and hover state of `translateY(-2px)` with `--shadow-brand`; secondary button as a transparent pill with a 1px `--brand-sky` border, `--brand-sky` text and hover fill `rgba(41,169,245,.1)`; WhatsApp button as a pill with `--whatsapp` fill, `--on-cta` text and a WhatsApp icon.
8. IF the browser does not support `backdrop-filter`, THEN THE Site SHALL render glass cards with a solid `--bg-1` fill, keeping the 1px `--glass-border` and `--r-md` radius.
9. THE Site SHALL render `--text-hi`, `--text-md` and `--text-lo` on `--bg-0`, `--bg-1` and `--bg-2`, `--on-cta` text on every stop of `--cta-grad` and `--whatsapp`, `--brand-sky` text on `--bg-0` and `--bg-1`, and white text on every stop of `--blue-grad` at a contrast ratio of at least 4.5:1, SHALL never use white text on `--cta-grad` or `--whatsapp` buttons, and SHALL never use `--brand-indigo` as a text colour on the dark canvases (computed ratios are listed in the design; full WCAG validation requires manual testing with assistive technologies).
10. THE Site SHALL apply motion using easing `cubic-bezier(.2,.7,.2,1)` with durations of 200ms for hover, 350ms for modal open and close, 600ms for scroll reveals and 150ms for price and tier crossfades.
11. WHEN a section first has at least part of its area enter the viewport, THE App_Layer SHALL transition the section from opacity 0 and a 24px downward offset to opacity 1 and 0px offset over 600ms using `IntersectionObserver`, and SHALL not replay the transition when the section re-enters the viewport.
12. THE Site SHALL render page sections in the DOM order: Header, Hero, Trust_Strip, Services_Section, Collections_Section, Destinations_Section, How_It_Works, Quote_Engine, Expert_Section, Reviews_Section, FAQ_Accordion, Terms_Section, Final_CTA, Footer, followed by the Floating_WhatsApp and Mobile_Sticky_Bar overlays and the modal portal root, into which the Modal_Manager renders the open Itinerary_Modal, Checkout_Modal, Ticket_Modal or Voucher_Modal.
13. THE Site SHALL implement the remaining components as follows: glass card with `--glass` fill, `backdrop-filter: blur(14px) saturate(140%)`, 1px `--glass-border`, `--r-md` and hover lift of 6px with the border brightening to `rgba(41,169,245,.4)`; badge as a pill with 6px by 12px padding in brand, emerald or neutral variants; service icon circle as a 56px circle filled with the service's Service_Accent containing a white icon marked `aria-hidden="true"`; form field with `--bg-2` fill, 1px `rgba(255,255,255,.08)` border, `--r-sm` and 48px minimum height; stepper as `[−] n [+]` around a native number input; accordion rows separated by hairlines; modal with `--bg-1` fill, `--r-lg` and max-width 760px (920px for the Itinerary_Modal); Floating_WhatsApp as a 60px circle.
14. IF the browser does not support `IntersectionObserver`, THEN THE App_Layer SHALL display every section at opacity 1 with no offset and no reveal animation.
15. THE Site SHALL style components with vanilla CSS in CSS Modules (`*.module.css`) that consume the tokens of criterion 3.1, with `app/globals.css` as the only global stylesheet, and SHALL contain no Tailwind dependency, Tailwind configuration file or CSS-in-JS library.

### Requirement 4: Sticky Header and Navigation

**User Story:** As a Visitor, I want a persistent header, so that I can jump to any section and request a quote from anywhere on the page.

#### Acceptance Criteria

1. WHILE the viewport is a Tablet_Viewport, Desktop_Viewport or Wide_Viewport, THE Header SHALL display, inline, the Brand_Logo at 48px height (or the Logo_Mark as specified in criterion 33.2), the brand name, the tagline, links labelled Services, Collections, Destinations, How it Works, Reviews, FAQ and Terms in that order, a currency selector and a "Get Free Quote" primary button.
2. THE Header SHALL remain fixed at the top of the viewport at every scroll offset, with a height of 72px on every viewport, rendered above all page sections and below open modals.
3. WHILE the page scroll offset is 40px or less, THE Header SHALL render with a transparent background.
4. WHILE the page scroll offset is greater than 40px, THE Header SHALL render with a `--bg-0` background at 90% opacity and a backdrop blur radius greater than 0px, switching state within the same scroll event that crosses the 40px threshold.
5. WHEN a Visitor activates a Header navigation link, THE App_Layer SHALL scroll the page so that the top of the corresponding section (Services_Section, Collections_Section, Destinations_Section, How_It_Works, Reviews_Section, FAQ_Accordion or Terms_Section) sits at the bottom edge of the 72px Header, unobscured by the Header.
6. WHEN a Visitor activates the "Get Free Quote" button, THE App_Layer SHALL scroll the page so that the top of the Quote_Engine sits at the bottom edge of the 72px Header.
7. WHILE the viewport is a Mobile_Viewport, THE Header SHALL show the Brand_Logo (or Logo_Mark) and brand on the left and the currency selector and a hamburger button on the right, hide the inline navigation links, and place the navigation links and the "Get Free Quote" button inside a drawer that slides in from the right edge over 350ms.
8. WHEN a Visitor activates the hamburger button, THE Header SHALL toggle the navigation drawer between open and closed and set `aria-expanded` on the hamburger button to "true" when open and "false" when closed.
9. WHEN a Visitor activates a link or the "Get Free Quote" button inside the open navigation drawer, THE Header SHALL close the drawer, set `aria-expanded` on the hamburger button to "false", and THE App_Layer SHALL scroll to the target section.
10. WHEN a Visitor presses Escape while the navigation drawer is open, THE Header SHALL close the drawer, set `aria-expanded` on the hamburger button to "false" and move focus to the hamburger button.

### Requirement 5: Hero Section

**User Story:** As a Visitor, I want a clear value proposition on arrival, so that I immediately understand what the agency offers and how to start.

#### Acceptance Criteria

1. THE Hero SHALL render with a minimum height of 92vh over a full-bleed background image spanning 100% of the viewport width, with an indigo (`--bg-0` based) gradient overlay running from bottom to top.
2. THE Hero SHALL display an eyebrow equal to `BUSINESS.tagline` ("Your Journey, Our Priority"), an H1 headline "Explore the World With Us." in which only the word "World" is rendered in `--brand-grad` gradient text, a supporting paragraph that begins "Complete Travel Solutions Under One Roof" and names every `SERVICES` title (case-insensitively) in `SERVICES` order, with no mention of cruises, forex or rail passes, and a trust line showing "★ {BUSINESS.rating.score} rated", each entry of `BUSINESS.badges` with an emerald tick, and "VIP Chowk, Raipur".
3. THE Hero SHALL display a "Get My Custom Quote" primary button and a "WhatsApp Us" WhatsApp button side by side on Tablet_Viewport, Desktop_Viewport and Wide_Viewport.
4. THE Hero SHALL display a brand glass badge (with a `--brand-grad` border) reading "Guaranteed Call Back & Custom Quotation Within 24 Hours", with the hour value taken from `BUSINESS.callbackHours` and a shimmer sweep repeating every 6 seconds.
5. WHEN a Visitor activates "Get My Custom Quote", THE App_Layer SHALL scroll the page so that the top of the Quote_Engine sits at the bottom edge of the 72px Header.
6. WHEN a Visitor activates "WhatsApp Us", THE App_Layer SHALL open, in a new tab with `noopener`, the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and a greeting message containing `BUSINESS.brandName`.
7. THE Hero SHALL apply a Ken Burns zoom to the background image that scales between 1.0 and 1.1 over 20 seconds per direction, alternating direction and repeating indefinitely.
8. WHILE the viewport is a Mobile_Viewport, THE Hero SHALL left-align the text, stack the CTA buttons vertically at 100% of the container width, and place the guarantee badge below the buttons.
9. THE Site SHALL preload `BUSINESS.heroImage` from the public page Server Component (a `<link rel="preload" as="image">` with high fetch priority in the server-rendered head), so that the Hero image request starts before any other image request.
10. IF the browser blocks the new tab opened by "WhatsApp Us", THEN THE App_Layer SHALL navigate the current tab to the same WhatsApp URL.
11. IF the Hero image fails to load, THEN THE Hero SHALL display the indigo gradient overlay on a `--bg-0` background, keeping all Hero text and buttons visible.

### Requirement 6: Trust Strip and How It Works

**User Story:** As a Visitor, I want quick, accurate trust signals and a simple process overview, so that I feel confident engaging the agency.

#### Acceptance Criteria

1. THE Trust_Strip SHALL display, on a `--bg-1` background directly below the Hero, exactly four statements in this order: "★ {score} Rated · ✓ Verified", "{n} Services, 1 Expert", "24h Call Back Guarantee" and "Office at VIP Chowk, Telibandha, Raipur", where {score} equals `BUSINESS.rating.score`, {n} equals `SERVICES.length` (8) and the "24" equals `BUSINESS.callbackHours`.
2. WHILE the viewport is a Mobile_Viewport, THE Trust_Strip SHALL lay out the four statements in a 2×2 grid, in reading order left-to-right then top-to-bottom.
3. THE How_It_Works SHALL display exactly four steps numbered 1 to 4, in order: "Share your wishlist", "Consultant calls in <24h", "Receive your custom quote (valid 24 hrs)" and "Confirm with an advance payment", where the first "24" equals `BUSINESS.callbackHours` and the second equals `BUSINESS.quoteValidityHours`.
4. WHILE the viewport is a Desktop_Viewport or Wide_Viewport, THE How_It_Works SHALL arrange the four steps in a single horizontal row joined by a `--brand-grad` connector line running between consecutive step numbers.
5. WHILE the viewport is a Mobile_Viewport or Tablet_Viewport, THE How_It_Works SHALL arrange the four steps in a single vertical column in step order.
6. WHILE the viewport is a Tablet_Viewport, Desktop_Viewport or Wide_Viewport, THE Trust_Strip SHALL lay out the four statements in a single row.

### Requirement 7: Services Showcase with Enquire Pre-Selection

**User Story:** As a Visitor, I want to see all services and enquire about one directly, so that the quote form is already set up for my need.

#### Acceptance Criteria

1. THE Data_Config SHALL define exactly 8 services in this order, with these titles and subtitles: Flights ("Domestic & International"), Hotels ("Best Stays Worldwide"), Passport ("New / Renewal Assistance"), Visa ("Tourist / Business Visa Support"), Holidays ("Domestic & International Packages"), Travel Insurance ("Travel Safe Always"), Train ("IRCTC Ticket Booking & Assistance") and Packages ("Customized & Group Tour Packages"), with the Service_Accents `--svc-blue`, `--svc-orange`, `--svc-purple`, `--svc-red`, `--svc-green`, `--svc-teal`, `--svc-violet` and `--svc-pink` respectively.
2. THE Data_Config SHALL give every service a unique non-empty `id`, a non-empty `icon`, `title`, `subtitle` and `summary`, a `bullets` array of 1 to 3 non-empty strings, an `accent` that is a member of `SERVICE_ACCENTS`, and a `quoteOption` that is a member of `QUOTE_SERVICE_OPTIONS`, with no two services sharing the same `quoteOption` or the same `accent`, so that the 8 services map one-to-one onto the 8 `QUOTE_SERVICE_OPTIONS`.
3. THE Services_Section SHALL render, under the H2 "Complete Travel Solutions Under One Roof", one glass card per service in `SERVICES` order, showing the icon inside a circle filled with the service's `accent` token, the title, the subtitle, the summary, every bullet and an "Enquire" link whose accessible name includes the service title.
4. WHILE the viewport is a Desktop_Viewport or Wide_Viewport, THE Services_Section SHALL arrange the cards as two rows of 4 (services 1 to 4, then services 5 to 8).
5. WHEN a Visitor activates a service's "Enquire" link, THE App_Layer SHALL scroll the page so that the top of the Quote_Engine sits at the bottom edge of the 72px Header, set the Quote_Engine checkbox whose value equals that service's `quoteOption` to checked, and render the matching service checkbox tile in its checked visual state.
6. WHEN a Visitor activates a service's "Enquire" link, THE App_Layer SHALL keep every previously checked quote service checkbox checked and SHALL leave the matching checkbox checked if it was already checked, never toggling it to unchecked.
7. WHEN a Visitor activates a service's "Enquire" link while the Quote_Engine displays a `services` error, THE Quote_Engine SHALL clear the `services` error message and its `aria-invalid` state.

### Requirement 8: Curated Collections and Category Filter

**User Story:** As a Visitor, I want to browse packages by region and travel style, so that I can find journeys that match my interest and see an honest starting price.

#### Acceptance Criteria

1. THE Collections_Section SHALL render one card per Package returned by `filterPackages` for the active category, each card showing the Package image, Region label, nights/days in the form "{nights}N/{days}D", title, hotel star rating when non-null, meal plan, up to 2 highlights, a "from" price equal to `formatPrice(convertPrice(fromPriceINR(pkg), currency), currency)` followed by "/pp", the label "land package", an Extras note, a "View Itinerary" button and a "Book Now" button.
2. THE Collections_Section SHALL render the Extras note as "+ flights & visa priced separately" for Packages whose Region is "international" and as "+ flights priced separately" for Packages whose Region is "domestic".
3. THE Category_Filter SHALL render exactly six tabs in the order All, International, Domestic, Honeymoon, Family and Beach & Islands, mapped respectively to the `CATEGORIES` ids `all`, `international`, `domestic`, `honeymoon`, `family` and `beach`.
4. WHEN `filterPackages` is called with category "all", THE Logic_Module SHALL return a new array containing every input Package in input order.
5. WHEN `filterPackages` is called with a category other than "all", THE Logic_Module SHALL return exactly the Packages whose `categories` array contains that category, in input order, returning an empty array when no Package has that category.
6. THE Logic_Module SHALL produce results from `filterPackages` such that the results for "international" and "domestic" together contain every input Package exactly once.
7. WHEN `fromPriceINR` is called with a Package, THE Logic_Module SHALL return the minimum `adultPriceINR` across the Package's Tiers.
8. WHEN `getTier` is called with a Package and a tier id, THE Logic_Module SHALL return the Tier with that id when the Package has one, and the Tier with the lowest `adultPriceINR` otherwise.
9. WHEN a Visitor selects a Category_Filter tab, THE App_Layer SHALL set `aria-selected="true"` on that tab, set `aria-selected="false"` on every other tab, and render only the Packages returned by `filterPackages` for that category without reloading the page.
10. IF the selected category contains no Packages, THEN THE Collections_Section SHALL display "No journeys here yet. Ask us to craft one" with an in-page link that scrolls to the Quote_Engine when activated, and render no Package cards.
11. WHILE the viewport is a Mobile_Viewport, THE Category_Filter SHALL render all six tabs in a single non-wrapping row that scrolls horizontally without causing horizontal page overflow.
12. IF a Package image fails to load, THEN THE Collections_Section SHALL display a gradient placeholder background in the image area at the same dimensions as the image and keep the remaining card content and both buttons rendered and operable.
13. WHEN the Site loads, THE Collections_Section SHALL mark the "All" tab active and render every Package.
14. WHERE a Package has `isSample` set to true, THE Collections_Section and the Itinerary_Modal SHALL display a neutral "Sample itinerary" chip for that Package.

### Requirement 9: Currency Conversion and Formatting

**User Story:** As a Visitor from India or abroad, I want prices in rupees with an indicative conversion to my currency, so that I understand the cost without converting manually.

#### Acceptance Criteria

1. WHEN `convertPrice` is called with a non-negative finite INR amount and a Supported_Currency code, THE Logic_Module SHALL return the amount multiplied by that currency's rate, rounded to the nearest 0.01 with halves rounded up.
2. WHEN `convertPrice` is called with code "INR" and an amount with at most 2 decimal places, THE Logic_Module SHALL return the amount unchanged.
3. THE Logic_Module SHALL return `convertPrice(a, code)` less than or equal to `convertPrice(b, code)` for every Supported_Currency code and every pair of non-negative finite amounts where a is less than or equal to b.
4. IF `convertPrice` is called with a currency code absent from `CURRENCIES`, THEN THE Logic_Module SHALL throw a `RangeError` without returning a value.
5. WHEN `formatPrice` is called with a non-negative finite amount and a Supported_Currency code, THE Logic_Module SHALL return a string that starts with that currency's symbol followed by the amount formatted by `Intl.NumberFormat` with that currency's locale, digit grouping enabled and exactly the requested number of fraction digits (default: the currency's `decimals`), so that 390000 in INR yields "₹3,90,000" (Indian digit grouping).
6. IF `formatPrice` is called with a currency code absent from `CURRENCIES`, THEN THE Logic_Module SHALL throw a `RangeError` without returning a value.
7. THE App_Layer SHALL format package card prices, Itinerary_Modal prices and tier comparison prices in the selected Supported_Currency with that currency's `decimals` setting.
8. THE App_Layer SHALL format every Land_Total and Booking_Breakdown amount, the advance amount shown under the confirm button and every Voucher_Modal amount in INR with 0 fraction digits, and WHILE the selected currency is not INR, SHALL additionally display the total and advance converted to the selected currency, labelled "indicative".

### Requirement 10: Currency Switching and Persistence

**User Story:** As a Visitor, I want my currency choice applied everywhere and remembered, so that I see consistent prices on return visits.

#### Acceptance Criteria

1. THE Header currency selector and the Collections_Section Currency_Switcher SHALL each offer exactly seven options in the order INR (₹), USD ($), EUR (€), GBP (£), AUD (A$), AED and SGD (S$).
2. WHEN a Visitor selects a Supported_Currency, THE App_Layer SHALL re-render every price element carrying a `data-price-inr` attribute, including package cards, Itinerary_Modal prices, the tier comparison table and the indicative conversion line in the Checkout_Modal, in the selected currency without reloading the page, so that no such element shows the previous currency symbol after the 150ms price crossfade completes.
3. WHEN a Visitor selects a Supported_Currency in either control, THE App_Layer SHALL set the Header currency selector and the Collections_Section Currency_Switcher to show that same currency as the active option.
4. WHEN a Visitor selects a Supported_Currency, THE App_Layer SHALL store that currency code in `localStorage`, replacing any previously stored currency value.
5. WHEN the Site loads and `localStorage` holds a Supported_Currency code, THE App_Layer SHALL display every catalogue price in that currency and show that currency as the active option in both currency controls.
6. IF `localStorage` holds a value that is not a Supported_Currency code, THEN THE App_Layer SHALL display prices in the Base_Currency and overwrite the stored value with the Base_Currency.
7. THE Collections_Section SHALL display a visible text note adjacent to the Currency_Switcher stating that non-INR prices are indicative conversions based on static rates.
8. WHEN the Site loads and `localStorage` holds no currency value, THE App_Layer SHALL display every price in the Base_Currency (INR).
9. IF `localStorage` is unavailable or throws on read or write, THEN THE App_Layer SHALL display prices in the Base_Currency on load, apply currency selections for the remainder of the page session, and display no error to the Visitor.

### Requirement 11: Itinerary Modal with Hotel Tiers

**User Story:** As a Visitor, I want to compare hotel tiers and see the day-by-day plan, so that I can judge which option suits me before booking.

#### Acceptance Criteria

1. WHEN a Visitor activates "View Itinerary" on a Package card, THE Modal_Manager SHALL open the Itinerary_Modal populated with the data of that Package, with the modal title equal to the Package title shown on the card and the active Tier set to `getTier(pkg, null)` (the cheapest Tier).
2. THE Itinerary_Modal SHALL display the Package image strip, Region label, nights/days in the form "{nights}N/{days}D", the hotel star rating when non-null, the meal plan, the transfer basis and the title.
3. THE Itinerary_Modal SHALL display a tier comparison table with one row per Tier in `tiers` order, each row showing the Tier label, the adult price per person and the child price per person, or "On request" when `childPriceINR` is `null`.
4. THE Itinerary_Modal SHALL display a tier switcher with one option per Tier, and WHEN a Visitor selects a Tier, THE Itinerary_Modal SHALL update the active adult price, child price (or "Child price on request"), the Tier `priceNote` when present and the hotel list to that Tier without closing the modal.
5. THE Itinerary_Modal SHALL list, for the active Tier, one row per hotel stay showing the location, the nights, the hotel names joined by " / " followed by "or similar" when more than one name is listed, and the room type when non-null.
6. THE Itinerary_Modal SHALL display one emerald inclusion chip per entry returned by `packageInclusions(pkg, POLICIES)`.
7. THE Itinerary_Modal SHALL display a "Priced separately (not included)" box listing the indicative flight fare per person formatted in the selected currency with its `flightNote` when `flightFareINR` is non-null, the visa type and fee per person when `visa` is non-null, and each `onArrivalCharges` entry, and SHALL display "Flights quoted on request" when `flightFareINR` is `null`.
8. THE Itinerary_Modal SHALL display one timeline entry per itinerary entry, with the entry count equal to the Package's `days`, in ascending day order, each showing "Day {day}", the title, the description and a transfer chip ("Private", "Sharing" or "Private + Sharing") when `transferType` is present.
9. THE Itinerary_Modal SHALL display the first `POLICIES.exclusionsSummaryCount` entries of `POLICIES.exclusions` and a "See all Terms" link that scrolls to the Terms_Section exclusions panel.
10. WHEN a Visitor activates "Confirm via WhatsApp" in the Itinerary_Modal, THE Modal_Manager SHALL close the Itinerary_Modal and open the Checkout_Modal for the same Package and active Tier in Mode A, leaving exactly one modal open.
11. WHEN a Visitor activates "Book with Advance Payment" in the Itinerary_Modal, THE Modal_Manager SHALL close the Itinerary_Modal and open the Checkout_Modal for the same Package and active Tier in Mode B, leaving exactly one modal open.
12. WHILE the viewport is a Tablet_Viewport, Desktop_Viewport or Wide_Viewport, THE Itinerary_Modal SHALL render centered with a maximum width of 920px.
13. WHILE the viewport is a Mobile_Viewport, THE Itinerary_Modal SHALL render as a full-screen sheet covering 100% of the viewport width and height.
14. WHEN a Visitor activates the Itinerary_Modal close (×) button, THE Modal_Manager SHALL close the Itinerary_Modal.
15. WHEN `packageInclusions` is called, THE Logic_Module SHALL return the Package's `inclusions` when present, otherwise `POLICIES.inclusionsDomestic` for a domestic Region, otherwise `POLICIES.inclusions`.

### Requirement 12: Booking Checkout Mode A (WhatsApp Instant)

**User Story:** As a Visitor, I want to confirm a booking over WhatsApp, so that I can talk to a consultant without paying online.

#### Acceptance Criteria

1. WHEN a Visitor activates "Book Now" on a Package card, THE Modal_Manager SHALL open the Checkout_Modal titled "Book: {Package title}" with tabs "WhatsApp Instant" (Mode A) and "Booking Request" (Mode B), with Mode B active, the cheapest Tier selected, adults set to 2 and children set to 0.
2. WHILE the Checkout_Modal is in Mode A, THE Checkout_Modal SHALL display the tier selector, adults and children steppers and travel date input of Requirement 13, a summary showing the Package title, nights/days, Tier label, adults, children when greater than 0, the travel date when entered and the Land_Total `total` in INR, and a "Confirm on WhatsApp" button.
3. WHILE the Checkout_Modal is in Mode A and a valid travel date is entered, THE Checkout_Modal SHALL additionally display the advance and balance from the Booking_Breakdown, and WHILE no travel date is entered it SHALL display "Advance as per Travel Guru payment policy".
4. WHEN `composeBookingWhatsAppMessage` is called, THE WhatsApp_Composer SHALL return a message containing the brand name, Package title, Tier label, adult count, the child count when greater than 0, and the land package total formatted by `formatPrice(total, "INR")`, and ending with the line "Flights & visa to be quoted separately."
5. WHEN `composeBookingWhatsAppMessage` is called with a Booking_Breakdown (travel date provided), THE WhatsApp_Composer SHALL also include the travel date, `formatPrice(advance, "INR")` and, when `rule` is "standard", `formatPrice(balance, "INR")` and the `balanceDueDate`; WHEN called with a Land_Total only, THE WhatsApp_Composer SHALL include the line "Advance as per Travel Guru payment policy" and omit the travel date, advance and balance labels.
6. WHEN a Visitor activates "Confirm on WhatsApp", THE App_Layer SHALL open the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and the booking message in a new tab with `noopener`, without requiring lead guest name, email, phone or Terms acceptance, and without sending any request to the Booking_API.
7. WHEN a Visitor selects a Checkout_Modal tab, THE Checkout_Modal SHALL switch to that mode, set `aria-selected="true"` on the selected tab and `aria-selected="false"` on the other tab, and retain the Tier, adults, children, travel date, lead guest name, email and phone values already entered.
8. IF the browser blocks the new tab when "Confirm on WhatsApp" is activated, THEN THE App_Layer SHALL navigate the current tab to the WhatsApp URL.

### Requirement 13: Booking Checkout Mode B (Tier, Travellers and Land Total)

**User Story:** As a Visitor, I want to pick a hotel tier and traveller count and see the exact land package total, so that I know what I am paying for.

#### Acceptance Criteria

1. WHEN `clampCount` is called with a finite number n and integer bounds min ≤ max, THE Logic_Module SHALL truncate n toward zero to an integer and return min if the result is below min, max if the result is above max, and the result otherwise.
2. IF `clampCount` is called with NaN, ±Infinity or a value whose type is not number, THEN THE Logic_Module SHALL return min.
3. THE Logic_Module SHALL return the same result from `clampCount` when applied to its own output with the same bounds.
4. WHEN `computeLandTotal` is called with a Tier, an adults value and a children value, THE Logic_Module SHALL return `adults` equal to `clampCount(adults, 1, 12)`, `children` equal to 0 when the Tier's `childPriceINR` is `null` and `clampCount(children, 0, 8)` otherwise, `adultsSubtotal` equal to adults × `adultPriceINR`, `childrenSubtotal` equal to children × `childPriceINR` (0 when null), and `total` equal to `adultsSubtotal` plus `childrenSubtotal` (for example, the Bali Deluxe Tier with 2 adults and 1 child yields total 93000).
5. THE Logic_Module SHALL exclude every Extras amount (flight fare, visa fee, on-arrival charges) from `total`.
6. WHILE the Checkout_Modal is in Mode B, THE Checkout_Modal SHALL display a tier selector with one option per Package Tier, an adults stepper (default 2, range 1–12), a children stepper (default 0, range 0–8), a travel date input whose minimum is `minDepartureDate(todayISO)`, lead guest name, email and phone fields (and no card number, expiry or CVC field), and an "I agree to the Terms & Cancellation Policy" checkbox.
7. WHILE the selected Tier's `childPriceINR` is `null`, THE Checkout_Modal SHALL hide the children stepper, set children to 0 and display "Child pricing on request, ask us on WhatsApp" with a WhatsApp link.
8. WHEN a Visitor activates a stepper "+" or "−" button or selects a different Tier, THE App_Layer SHALL recompute the Land_Total (and the Booking_Breakdown when a valid travel date is entered) and update every breakdown row and the advance line under the confirm button without reloading the page.
9. WHILE adults equals 1, THE Checkout_Modal SHALL disable the adults "−" button, WHILE adults equals 12 it SHALL disable the adults "+" button, WHILE children equals 0 it SHALL disable the children "−" button, and WHILE children equals 8 it SHALL disable the children "+" button.
10. WHILE the Checkout_Modal is in Mode B, THE Checkout_Modal SHALL display the breakdown rows "Adults {n} × {adult price}", "Children {n} × {child price}" (only when children is greater than 0), "Land package total", "Advance due on confirmation ({advanceRate as %})", "Balance" with "due by {balanceDueDate}" or "Full payment due on confirmation", and the line "Flights & visa quoted separately", with the advance amount in `--brand-grad` gradient text.
11. WHEN the selected currency changes while the Checkout_Modal is open, THE App_Layer SHALL update the indicative conversion line and retain the Tier, adults, children and every entered field value, leaving the INR breakdown amounts unchanged.

### Requirement 14: Booking Request (Demo, No Payment) and Confirmation

**User Story:** As a Visitor, I want to send a booking request with the exact advance and balance and get a reference, so that the agency can confirm my trip, without being asked for card details on a demo checkout.

Note: revised by the stack revision. The simulated card payment is replaced by a stored Booking_Request; no payment is taken and the card fields are removed.

#### Acceptance Criteria

1. WHILE the Checkout_Modal is in Mode B, THE Checkout_Modal SHALL display the notice "Demo: no payment is taken. We'll confirm availability and send payment details." adjacent to the confirm button.
2. THE Checkout_Modal SHALL label the Mode B submit button "Confirm Booking Request" and display below it "Advance due on confirmation: {formatted advance}" when the Booking_Breakdown `rule` is "standard" and "Full payment due on confirmation: {formatted advance}" otherwise (for example, "Advance due on confirmation: ₹46,500").
3. WHEN `validateCheckout` is called with checkout data, `todayISO` and a Package, THE Validator SHALL require a `tierId` belonging to the Package, an integer adults count from 1 to 12, an integer children count from 0 to 8 that is 0 when the selected Tier's `childPriceINR` is `null`, a travel date in `YYYY-MM-DD` format on or after `minDepartureDate(todayISO)`, a lead guest name of 2–80 trimmed characters, an email of at most 254 characters passing `validateEmail`, a phone of at most 20 characters passing `validatePhone`, and `agreeTerms` equal to true, and SHALL perform no card number, expiry or CVC check.
4. WHEN `validateCheckout` is called, THE Validator SHALL return `valid` true if and only if the returned `errors` object is empty, and SHALL return the same result regardless of any additional keys present in the data.
5. IF `validateCheckout` finds one or more failing fields, THEN THE Validator SHALL return `valid` false with exactly one error entry for each failing field and no entry for any passing field, using the key `agreeTerms` with message "Please accept the Terms & Cancellation Policy" for an unticked Terms checkbox.
6. IF a Visitor activates the confirm button with checkout data that is invalid on the client, THEN THE Checkout_Modal SHALL display an inline error below each invalid field, set `aria-invalid="true"` on each invalid field, move focus to the first invalid field in display order, remain open with all entered values retained, and send no request.
7. WHEN a Visitor activates the confirm button with valid checkout data, THE App_Layer SHALL send one POST request to the Booking_API with the package id, tier id, adults, children, travel date, lead guest name, email, phone and `agreeTerms`, and no price, total, advance or balance value, disable the button and show "Sending…" until a response arrives or `API_LIMITS.clientTimeoutMs` (10 seconds) elapses.
8. WHEN `generateBookingRef` is called with an integer from 0 to 4,294,967,295, THE Logic_Module SHALL return a string matching `^BK-[A-HJ-NP-Z2-9]{6}$`, identical for identical inputs.
9. WHEN the Booking_API responds with status 201, THE Modal_Manager SHALL close the Checkout_Modal and open the Voucher_Modal showing the `bookingRef` from the response, the status "Pending confirmation", the Package title, Tier label, adults, children when greater than 0, travel date, and the land package total, advance due, and balance with its `balanceDueDate` (or "Full payment due on confirmation" when the balance is 0) taken from the response `breakdown`, the line "No payment has been taken", the line "Flights & visa quoted separately", the phone numbers and email from `BUSINESS`, a link to the Terms_Section cancellation panel and a "Print" button, with every amount in INR.
10. WHEN a Visitor activates "Print" in the Voucher_Modal, THE App_Layer SHALL invoke the browser print dialog.
11. IF the Booking_API responds with status 400, THEN THE Checkout_Modal SHALL display each returned error below its field (and a `packageId` error above the confirm button), keep every value, and open no Voucher_Modal.
12. IF the Booking_API responds with status 429 or 5xx, the request fails, or the timeout elapses, THEN THE Checkout_Modal SHALL stay open with every value retained and display "We couldn't send your booking request right now. Please try again or confirm on WhatsApp." with a "Confirm on WhatsApp" button that opens the Mode A message.
13. WHEN a Visitor activates the "Terms & Cancellation Policy" link in the Checkout_Modal, THE App_Layer SHALL open `/#terms-cancellation` in a new tab with `noopener`, leaving the Checkout_Modal open with every entered value retained.
14. THE Voucher_Modal SHALL display the amounts returned by the Booking_API even when they differ from the client preview (for example after a midnight date change), since the server values are authoritative.

### Requirement 15: Quotation Form and Validation

**User Story:** As a Visitor, I want a quote form that captures my group and preferences with clear feedback, so that I can submit correct details on the first try.

#### Acceptance Criteria

1. THE Quote_Engine SHALL render a form in three steps: Step 1 service checkbox tiles for each `QUOTE_SERVICE_OPTIONS` entry; Step 2 departure city, destinations, departure date, duration, trip type, adults stepper, children stepper, child ages, hotel category, meal plan and budget; Step 3 full name, phone/WhatsApp, email, call-back slot and special requests.
2. THE Quote_Engine SHALL prefill the departure city with `BUSINESS.originCity.name` ("Raipur") as an editable value, the adults stepper with 2 (range 1–12) and the children stepper with 0 (range 0–8).
3. WHILE the children count is greater than 0, THE Quote_Engine SHALL display an optional free-text "Child ages" field (maximum 100 characters), and WHILE the children count is 0 it SHALL hide that field.
4. THE Quote_Engine SHALL populate the duration, trip type, hotel category, meal plan, budget and call-back slot selects from `DURATIONS`, `TRIP_TYPES`, `HOTEL_CATEGORIES`, `MEAL_PLANS`, `BUDGETS` and `CALLBACK_SLOTS`, with each select starting on an empty no-selection option followed by one option per list entry in list order, and with call-back slot options showing each slot's `label` and submitting its `id`.
5. WHEN `validatePhone` is called, THE Validator SHALL return true if and only if the input is a string that, after removing spaces, dashes and parentheses, consists of an optional leading "+" followed by 8 to 15 digits, and SHALL return false without throwing for empty, missing or non-string input.
6. WHEN `validateEmail` is called, THE Validator SHALL return true if and only if the input is a string matching `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`, and SHALL return false without throwing for empty, missing or non-string input.
7. IF the services list is missing, empty or contains a value absent from `QUOTE_SERVICE_OPTIONS`, THEN THE Validator SHALL return an error under key `services` with message "Select at least one service".
8. IF the trimmed full name is shorter than 2 or longer than 80 characters, THEN THE Validator SHALL return an error under key `fullName` with a message indicating that a full name is required.
9. IF the phone is empty or fails `validatePhone`, THEN THE Validator SHALL return an error under key `phone` with a message indicating that a valid phone or WhatsApp number is required.
10. IF `adults` is not an integer from 1 to 12, THEN THE Validator SHALL return an error under key `adults`, and IF `children` is not an integer from 0 to 8, THEN THE Validator SHALL return an error under key `children`.
11. IF `childAges` is longer than 100 characters, THEN THE Validator SHALL return an error under key `childAges`, with exactly 100 characters accepted as valid.
12. WHILE validating in Submit_Mode, IF the email is empty or fails `validateEmail`, THEN THE Validator SHALL return an error under key `email`.
13. WHILE validating in Submit_Mode, IF the trimmed destinations value is empty, THEN THE Validator SHALL return an error under key `destinations`.
14. WHILE validating in Submit_Mode, IF the departure date is empty, malformed, or `isDateOnOrAfter(departureDate, minDepartureDate(todayISO))` returns false, THEN THE Validator SHALL return an error under key `departureDate` with a message indicating that a future date is required.
15. WHILE validating in WhatsApp_Mode, THE Validator SHALL return an error under key `email` only when the trimmed email is non-empty and fails `validateEmail`, an error under key `departureDate` only when the departure date is non-empty and `isDateOnOrAfter(departureDate, minDepartureDate(todayISO))` is false, and no error under key `destinations`.
16. IF `duration`, `tripType`, `hotelCategory`, `mealPlan`, `budget` or `callbackSlot` is non-empty and absent from its option list (for `callbackSlot`, the set of `id` values in `CALLBACK_SLOTS`), THEN THE Validator SHALL return an error under that field's key with message "Invalid choice".
17. IF `notes` is longer than 1000 characters, THEN THE Validator SHALL return an error under key `notes`, with exactly 1000 characters accepted as valid.
18. WHEN `validateQuoteForm` is called, THE Validator SHALL return `valid` true if and only if the returned `errors` object is empty, treating missing string fields as empty strings, a missing services list as an empty list, missing `adults` as 2 and missing `children` as 0, without throwing.
19. IF `validateQuoteForm` returns `valid` false in the App_Layer, THEN THE Quote_Engine SHALL display each error below its field linked via `aria-describedby`, set `aria-invalid="true"` on each invalid field, announce a summary stating the number of invalid fields in an `aria-live` region, move focus to the first invalid field in form order, and retain every entered value without generating a Ticket_ID or opening any modal.
20. WHEN a Visitor changes the value of a field that displays an error, THE Quote_Engine SHALL clear that field's error message and `aria-invalid` state, leaving the error state of every other field unchanged.

### Requirement 16: Date Helpers and Minimum Departure Date

**User Story:** As the agency, I want departure dates to be in the future and date arithmetic to be exact, so that every quote and payment schedule is correct.

#### Acceptance Criteria

1. WHEN `minDepartureDate` is called with an ISO_Date `todayISO`, THE Logic_Module SHALL return the ISO_Date exactly one calendar day after `todayISO`, including rollover from the last day of any month to the 1st of the next month, from 31 December to 1 January of the next year, and from 28 February to 29 February in leap years and to 1 March in non-leap years.
2. WHEN `addDays` is called with an ISO_Date and an integer n, THE Logic_Module SHALL return the ISO_Date n calendar days later (earlier for negative n), and WHEN `daysBetween` is called with two ISO_Dates, THE Logic_Module SHALL return the integer number of calendar days from the first to the second, so that `daysBetween(a, addDays(a, n))` equals n, unaffected by daylight-saving transitions.
3. WHEN `isDateOnOrAfter` is called with two well-formed date strings, THE Logic_Module SHALL return true if and only if the first date is the same as or later than the second date, where a well-formed date string matches `^\d{4}-\d{2}-\d{2}$` with a month from 01 to 12 and a day from 01 to the last day of that month.
4. IF `isDateOnOrAfter` is called with either argument malformed, including empty strings, non-existent dates such as "2026-02-30", non-`YYYY-MM-DD` formats, or non-string values such as `null` or `undefined`, THEN THE Logic_Module SHALL return false without throwing.
5. WHEN the Site loads, THE App_Layer SHALL set the `min` attribute of the quote departure date input and the checkout travel date input to `minDepartureDate(todayISO)`, where `todayISO` is the Visitor device's local date at page load.

### Requirement 17: 24h Call-Back Submission, Ticket ID and Deadline

**User Story:** As a Visitor, I want a ticket number and a call-back deadline, so that I know my request is logged and when to expect a call.

#### Acceptance Criteria

1. THE Quote_Engine SHALL display the 24h guarantee badge, the benefits "Free, no-obligation quote", "Real human consultant", "Deluxe / Superior / Premium hotel options" and "Quotes valid for 24 hours", and a primary button labelled "Submit & Guarantee 24h Call Back with Quotation".
2. WHEN a Visitor activates the submit button and `validateQuoteForm` in Submit_Mode returns `valid` true, THE App_Layer SHALL submit the form to the Quote_API as specified in Requirement 19 and SHALL use the Ticket_ID and Callback_Deadline returned by the Quote_API, generating no Ticket_ID in the browser.
3. WHEN `generateTicketId` is called with a 4-digit year from 2000 to 9999 and any integer `n`, THE Logic_Module SHALL return a string matching `^QT-\d{4}-\d{4}$` whose year segment equals the given year and whose last segment equals the non-negative value of `n` modulo 10000 zero-padded to 4 digits, identical for identical inputs.
4. WHEN `isValidTicketId` is called, THE Logic_Module SHALL return true if and only if the input is a string matching `^QT-\d{4}-\d{4}$`, returning false without throwing for non-string input.
5. WHEN `computeCallbackDeadline` is called with a Date, any slot id in `CALLBACK_SLOTS` and an hours value defaulting to `BUSINESS.callbackHours`, THE Logic_Module SHALL return a new Date exactly hours × 3,600,000 milliseconds after the given Date, independent of the slot id, leaving the input Date unchanged.
6. WHEN the Quote_API returns a Ticket_ID, THE Modal_Manager SHALL open the Ticket_Modal showing an emerald "Request received" indicator, the Ticket_ID in `--brand-orange` monospace, services, route (departure city to destinations), departure date, duration, travellers ("{adults} adults" plus "{children} child/children (ages: {childAges})" when children is greater than 0), hotel category, meal plan, trip type, budget, name, phone, email, the call-back slot label and the Callback_Deadline in the Visitor's local time zone with day, month, year, hour and minute, omitting the row of every optional field whose trimmed value is empty.
7. THE Ticket_Modal SHALL describe the guarantee as "within 24 hours, in your preferred window where possible" and display the note "Quoted prices are valid for 24 hours, subject to availability", with "24" taken from `BUSINESS.callbackHours` and `BUSINESS.quoteValidityHours` respectively.
8. WHEN a Visitor activates "Copy Ticket ID", THE App_Layer SHALL write the exact Ticket_ID string, without surrounding whitespace, to the clipboard.
9. IF the Clipboard API is unavailable or the clipboard write is rejected, THEN THE App_Layer SHALL select the full Ticket_ID text for manual copying.
10. WHEN a Visitor activates "Continue on WhatsApp" in the Ticket_Modal, THE App_Layer SHALL open the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and a message containing the Ticket_ID followed by the `composeQuoteWhatsAppMessage` output, in a new tab with `noopener`, falling back to the current tab as specified in criterion 18.9.
11. WHEN a Visitor activates "Done", THE Modal_Manager SHALL close the Ticket_Modal.
12. THE App_Layer SHALL keep no ticket counter and SHALL open the Ticket_Modal only after a 201 response from the Quote_API.
13. WHEN a Visitor activates "Done" in the Ticket_Modal, THE App_Layer SHALL reset the quote form so that every service checkbox is unchecked, the departure city is "Raipur", adults is 2, children is 0, every other text, date and select field is empty, and every field error message and `aria-invalid` state is cleared.

### Requirement 18: WhatsApp Instant Quote and URL Building

**User Story:** As a Visitor who prefers chat, I want to send my request on WhatsApp, so that I get a quote within minutes.

#### Acceptance Criteria

1. THE Quote_Engine SHALL display an "Instant Quote via WhatsApp (<10 min)" button below the submit button, separated by an "or" divider, with the minute value taken from `BUSINESS.whatsappResponseMins`.
2. WHEN a Visitor activates the WhatsApp instant-quote button, THE App_Layer SHALL validate the form in WhatsApp_Mode, requiring at least one service from `QUOTE_SERVICE_OPTIONS`, a trimmed full name of 2 to 80 characters, a phone passing `validatePhone` and valid adults and children counts, while accepting empty email, departure date and destinations.
3. WHEN `composeQuoteWhatsAppMessage` is called, THE WhatsApp_Composer SHALL return a message whose first line contains the brand name and whose second line is empty.
4. WHEN `composeQuoteWhatsAppMessage` is called, THE WhatsApp_Composer SHALL include each non-empty trimmed field exactly once on its own line, in the order Services, From, To, Departure, Duration, Trip type, Adults, Children, Hotel category, Meal plan, Budget, Name, Phone, Email, Call-back slot, Notes, prefixed by its label wrapped in asterisks for WhatsApp bold, with services comma-separated in input order, children shown as "{n} (ages: {childAges})" when child ages are given, and the call-back slot shown by its `CALLBACK_SLOTS` label rather than its id.
5. WHEN `composeQuoteWhatsAppMessage` is called, THE WhatsApp_Composer SHALL omit the line and label of every field whose trimmed value is empty, including an empty services list and a children count of 0.
6. WHEN `buildWhatsAppUrl` is called with a digits-only number and a message, THE WhatsApp_Composer SHALL return `https://wa.me/{number}?text={encodeURIComponent(message)}`.
7. THE WhatsApp_Composer SHALL produce URLs from which decoding the `text` parameter yields the original message exactly, including unicode, emoji, "₹", "&", "#" and newlines.
8. WHEN validation in WhatsApp_Mode returns `valid` true, THE App_Layer SHALL open the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and the `composeQuoteWhatsAppMessage` output in a new tab with `noopener`, without generating a Ticket_ID, opening the Ticket_Modal or resetting the form.
9. IF the browser blocks the new tab, such that opening the window returns no window reference, THEN THE App_Layer SHALL navigate the current tab to the same WhatsApp URL.
10. IF validation in WhatsApp_Mode returns `valid` false, THEN THE App_Layer SHALL display the errors as specified in criterion 15.19 and open no WhatsApp URL.

### Requirement 19: Quote Submission from the Browser

**User Story:** As a Visitor, I want my quote request to reach the agency reliably and to know when it did not, so that I never think a lost request was received.

Note: replaces the former optional Lead_Endpoint requirement. The server side is specified in Requirements 37 and 39.

#### Acceptance Criteria

1. WHEN a Visitor submits the quote form with data valid in Submit_Mode, THE App_Layer SHALL send exactly one POST request to `/api/quote` with a JSON body containing every Quote_Form_Data field and the Honeypot value under the key `website`, disable the submit button and show "Sending…" until a response arrives or `API_LIMITS.clientTimeoutMs` (10 seconds) elapses.
2. WHEN the Quote_API responds with status 201, THE App_Layer SHALL open the Ticket_Modal with the returned `ticketId` and `callbackDeadline` and the summary of the submitted values, as specified in criterion 17.6.
3. IF the Quote_API responds with status 400 and an `errors` object, THEN THE App_Layer SHALL display those errors as specified in criterion 15.19, keep every entered value and open no Ticket_Modal.
4. IF the Quote_API responds with status 429, THEN THE Quote_Engine SHALL display "Too many requests. Please try again in a few minutes, or continue on WhatsApp." with a WhatsApp button that opens the `composeQuoteWhatsAppMessage` message, keep every entered value and open no Ticket_Modal.
5. IF the Quote_API responds with any other non-201 status, the request fails, or the timeout elapses, THEN THE Quote_Engine SHALL display "We couldn't send your request right now. Please try again or continue on WhatsApp." with the same WhatsApp button, keep every entered value, re-enable the submit button and open no Ticket_Modal.
6. THE Quote_Engine SHALL include the Honeypot field named `website` that is visually hidden, marked `aria-hidden="true"`, excluded from the keyboard tab order (`tabindex="-1"`) and has `autocomplete="off"`.
7. WHEN a Visitor activates the WhatsApp instant-quote button, THE App_Layer SHALL send no request to the Quote_API.

### Requirement 20: Reviews and Trust Badges

**User Story:** As a Visitor, I want traveller stories and accurate trust signals, so that I can trust the agency.

#### Acceptance Criteria

1. THE Reviews_Section SHALL display `BUSINESS.rating.score` with 1 decimal place followed by "rated" and five star glyphs, and SHALL display the review count only as specified in criterion 1.8.
2. THE Reviews_Section SHALL render one card per entry in `REVIEWS`, in `REVIEWS` order, showing the quote, traveller name, city, a "Verified" emerald tick and the destination.
3. THE Reviews_Section SHALL display the trust badges "Verified", "{score} Rated", "Trusted" and "24h Call Back", in that order, with {score} equal to `BUSINESS.rating.score`.
4. WHILE the viewport is a Mobile_Viewport, THE Reviews_Section SHALL display review cards as a horizontal scroll-snap carousel in `REVIEWS` order, with each card snapping into alignment after scrolling and with horizontal scrolling confined to the carousel so the page has no horizontal overflow.
5. THE Data_Config SHALL define `REVIEWS` with at least 3 entries, each with a non-empty quote, traveller name, city and destination, and a `isPlaceholder` flag set to true until the agency supplies real reviews.

### Requirement 21: Operations FAQ

**User Story:** As a Visitor, I want answers on how the agency operates, so that I understand fares, payments and cancellations before I book.

#### Acceptance Criteria

1. THE FAQ_Accordion SHALL render one item per entry in `FAQ`, in `FAQ` order, within a max-width of 820px.
2. WHEN a Visitor activates an FAQ question, THE FAQ_Accordion SHALL toggle only that item's answer panel between expanded and collapsed, set `aria-expanded` on the question button to "true" when expanded and "false" when collapsed, and show the icon as "×" when expanded and "+" when collapsed, leaving every other item's state unchanged.
3. THE FAQ_Accordion SHALL render each question as a `<button>` linked to its answer panel via `aria-controls` and operable with the Enter and Space keys.
4. THE Data_Config SHALL define `FAQ` with 8 to 10 entries, each with a non-empty question and answer, including at least one entry for each of: how the agency gets good fares, passport (new / renewal) assistance, visa support, IRCTC train ticket booking, travel insurance, customized and group packages, how much is paid at booking (Payment_Policy), cancellation charges (linking to the Terms_Section) and accepted payment methods (entries may combine topics to stay within 10), and no entry about cruises or forex.
5. THE Data_Config SHALL phrase the FAQ payment answer to state the Payment_Policy rules (100% below ₹25,000 per person, 50% advance otherwise with the balance 21 days before departure, 100% when booking within 21 days of departure), with the amounts taken from the Payment_Policy values.
6. WHEN the Site loads, THE FAQ_Accordion SHALL render every item collapsed with `aria-expanded="false"` and the "+" icon.

### Requirement 22: Final CTA and Footer

**User Story:** As a Visitor at the end of the page, I want a last prompt and full contact details, so that I can act or reach the agency.

#### Acceptance Criteria

1. THE Final_CTA SHALL display, centered between `--brand-grad` hairline top and bottom borders, the headline "Book Your Next Adventure With {BUSINESS.brandName}" with the brand name in `--brand-grad` gradient text, a "Get My Free Quote" primary button and a "Chat on WhatsApp" button styled with `--whatsapp`.
2. WHEN a Visitor activates "Get My Free Quote" in the Final_CTA, THE App_Layer SHALL scroll to the Quote_Engine.
3. WHEN a Visitor activates "Chat on WhatsApp" in the Final_CTA, THE App_Layer SHALL open, in a new tab with `noopener`, the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and a greeting message containing `BUSINESS.brandName`.
4. THE Footer SHALL display four columns in left-to-right order: (a) the Brand_Logo at 64px height (or the Logo_Mark as specified in criterion 33.2), `BUSINESS.brandName`, `BUSINESS.tagline` and the rating with badges; (b) one service link per entry in `SERVICES` (8 links), each scrolling to the Services_Section; (c) company links "About", "FAQ" and "Terms & Policies", scrolling to the FAQ_Accordion and Terms_Section respectively; (d) contact details.
5. THE Footer SHALL render the contact details column with each `BUSINESS.phones` entry as a `tel:` link to its `tel` value showing its `display` value, `BUSINESS.email` as a `mailto:` link, `BUSINESS.website` as a link to `BUSINESS.website` opened with `noopener` and displayed without the protocol and trailing slash ("travelgururaipur.com"), and a "WhatsApp" link to the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp`.
6. THE Footer SHALL display `BUSINESS.address` in an `<address>` element below the columns, followed by `BUSINESS.motto` ("Fly | Stay | Explore | Experience") in `--brand-grad` gradient text, and SHALL display no QR code.
7. THE Footer SHALL display a bottom line containing "©", the 4-digit current local calendar year as read by the App_Layer at page load, `BUSINESS.brandName`, the notices "Prices indicative, subject to availability" and "Non-INR prices are indicative conversions", and links labelled "Privacy" and "Terms", with "Terms" scrolling to the Terms_Section.
8. WHILE the viewport is a Mobile_Viewport, THE Footer SHALL stack the four columns in a single column in the order brand, services, company, contact, with no horizontal page overflow at a viewport width of 375px.

### Requirement 23: Floating WhatsApp and Mobile Sticky Bar

**User Story:** As a Visitor, I want WhatsApp and quote actions always within reach, so that I can contact the agency at any moment.

#### Acceptance Criteria

1. THE Floating_WhatsApp SHALL render as a 60px-diameter circle filled with `--whatsapp`, fixed 24px from the bottom and right edges of the viewport and visible at every scroll position, with a pulsing ring animation that repeats every 2 seconds.
2. WHEN a Visitor hovers over or moves keyboard focus to the Floating_WhatsApp, THE Floating_WhatsApp SHALL show the tooltip "Typically replies in under {N} mins", where {N} equals `BUSINESS.whatsappResponseMins`, and SHALL hide the tooltip once the Floating_WhatsApp is neither hovered nor focused.
3. WHEN a Visitor activates the Floating_WhatsApp, THE App_Layer SHALL open, in a new tab with `noopener`, the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and a greeting message containing `BUSINESS.brandName`.
4. WHILE the viewport is a Mobile_Viewport, THE Mobile_Sticky_Bar SHALL be fixed to the bottom edge of the viewport at full viewport width, displaying a "Get Quote" primary button and a "WhatsApp" button styled with `--whatsapp` side by side, each occupying half of the bar width.
5. WHILE the viewport is a Mobile_Viewport, THE Site SHALL position the Floating_WhatsApp so that its bottom edge sits at least 16px above the top edge of the Mobile_Sticky_Bar with no overlap, and SHALL reserve bottom page padding at least equal to the Mobile_Sticky_Bar height so that no Footer content is hidden behind the bar when scrolled to the end of the page.
6. WHILE the viewport is a Tablet_Viewport, Desktop_Viewport or Wide_Viewport, THE Site SHALL hide the Mobile_Sticky_Bar.
7. WHEN a Visitor activates "Get Quote" on the Mobile_Sticky_Bar, THE App_Layer SHALL scroll to the Quote_Engine.
8. WHEN a Visitor activates "WhatsApp" on the Mobile_Sticky_Bar, THE App_Layer SHALL open the same WhatsApp URL as the Floating_WhatsApp, in a new tab with `noopener`.

### Requirement 24: Responsive Layout

**User Story:** As a Visitor on any device, I want the layout to adapt, so that the Site is usable on phones, tablets and desktops.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, THE Site SHALL render the Services_Section and Collections_Section cards in 1 column, each Destinations_Section grid as a single horizontal scroll-snap row confined to the grid (no horizontal page overflow), the Expert_Section with the photo stacked above the text, the quote form fields in 1 column, the Quote_Engine left panel reduced to only the guarantee badge placed above the form, and every modal as a full-screen sheet covering 100% of viewport width and height that slides up from the bottom edge over 350ms.
2. WHILE the viewport is a Tablet_Viewport, THE Site SHALL render the Services_Section cards, Collections_Section cards and Destinations_Section tiles in 2 columns, the Expert_Section with the photo beside the text, and the quote form fields in 2 columns.
3. WHILE the viewport is a Desktop_Viewport, THE Site SHALL render the Collections_Section cards in 3 columns, the Services_Section cards as specified in criterion 7.4, the International destinations grid in 3 columns (two rows of 3), the Domestic destinations grid in 4 columns (two rows of 4), the Expert_Section as two side-by-side columns (photo 5/12, text 7/12), and the Quote_Engine as two side-by-side columns with the left panel occupying 5/12 and the form occupying 7/12 of the container width.
4. WHILE the viewport is a Wide_Viewport, THE Site SHALL apply the Desktop_Viewport layout with the container width capped at 1200px and centered horizontally with equal left and right margins.
5. THE Site SHALL switch layouts at exactly 640px and 1024px, so that viewport widths of 639px render the Mobile_Viewport layout, 640px and 1023px render the Tablet_Viewport layout, and 1024px renders the Desktop_Viewport layout.
6. THE Site SHALL render with a document scroll width no greater than the viewport width (no horizontal page overflow) at viewport widths of 375, 639, 640, 768, 1023, 1024, 1280 and 1440px.
7. WHILE the viewport is below 640px, THE Terms_Section cancellation table SHALL render each band as stacked label and value rows.

### Requirement 25: Accessibility

**User Story:** As a Visitor using a keyboard or assistive technology, I want every feature to be operable and announced, so that I can use the Site fully.

#### Acceptance Criteria

1. WHEN the Modal_Manager opens a modal, THE Modal_Manager SHALL set `role="dialog"` and `aria-modal="true"` on the modal, set `aria-labelledby` to the id of the modal's heading, prevent the page behind the modal from scrolling, and move focus to the first focusable element inside the modal.
2. WHILE a modal is open, THE Modal_Manager SHALL move focus from the last focusable element to the first on Tab and from the first focusable element to the last on Shift+Tab, so that focus never reaches an element outside the modal.
3. WHEN a Visitor presses Escape while a modal is open, THE Modal_Manager SHALL close the topmost open modal.
4. WHEN the Modal_Manager closes a modal, THE Modal_Manager SHALL restore page scrolling at the scroll offset held before the modal opened and return focus to the element that opened the modal.
5. WHEN a Visitor clicks the modal backdrop outside the modal content area, THE Modal_Manager SHALL close the modal, and clicks inside the modal content area SHALL leave the modal open.
6. THE Site SHALL implement service checkbox tiles with native `<input type="checkbox">` elements, steppers with native `<input type="number">` elements carrying `min` and `max`, and give every form field a visible `<label>` positioned above the field and associated with it so that the label text is the field's accessible name.
7. THE Site SHALL implement the Category_Filter, Currency_Switcher, tier switchers and Terms_Section tabs so that every option is reachable with Tab or arrow keys and activated with Enter or Space, with exactly one option exposing `aria-selected="true"` or `aria-pressed="true"` and every other option exposing `"false"`.
8. WHEN an interactive element receives keyboard focus, THE Site SHALL display a 2px solid outline in `--brand-sky` around that element with a contrast ratio of at least 3:1 against the adjacent background.
9. WHILE the user preference `prefers-reduced-motion: reduce` is active, THE Site SHALL disable scroll reveals, Ken Burns zoom, pulsing ring, shimmer, card lift and price crossfade animations, and SHALL display content that would otherwise be scroll-revealed at full opacity in its final position on load.
10. THE Site SHALL give every informative image a non-empty `alt` describing its content, every decorative image an empty `alt=""`, and every icon-only button (including the Floating_WhatsApp, hamburger button, modal close buttons and stepper buttons) a non-empty accessible name describing its action.
11. THE Site SHALL contain exactly one `header`, one `main` and one `footer` landmark, a `nav` landmark inside the Header, and exactly one H1 located in the Hero.
12. THE Terms_Section cancellation table SHALL use a native `<table>` with a `<caption>` and column headers (`<th scope="col">`) on viewports of 640px and wider.

### Requirement 26: Security and Safe Input Handling

**User Story:** As the agency owner, I want visitor input handled safely, so that the Site is not open to injection or data leakage.

Note: revised by the stack revision; server-side protections are in Requirements 37–45.

#### Acceptance Criteria

1. WHEN the Site renders Visitor-provided values, Database content or Data_Config content into any section, modal or Admin_Area page, THE Site SHALL render them as React text children or attribute values, never through `dangerouslySetInnerHTML`, so that a value containing HTML markup (for example `<img src=x onerror=alert(1)>`) is displayed as literal text and creates no new DOM elements and executes no script.
2. WHEN the App_Layer opens any WhatsApp URL, external website link or Terms link in a new tab, THE App_Layer SHALL pass `noopener`, so that the opened tab has no reference to the opening window.
3. THE App_Layer SHALL write to `localStorage` only the currency preference (a Supported_Currency code), and SHALL write no Quote_Form_Data values or checkout field values to `localStorage`, `sessionStorage` or cookies.
4. WHILE the Checkout_Modal is in Mode B, THE Checkout_Modal SHALL display the notice that no payment is taken, as specified in criterion 14.1, and SHALL render no card number, expiry or CVC input.
5. THE Site SHALL never collect, transmit, store or log a card number, card expiry or CVC: the App_Layer has no such fields, the Booking_API ignores any such keys in a request body, and no Database column holds such data.

### Requirement 27: Resilience and Fallbacks

**User Story:** As a Visitor in a constrained browser, I want the Site to still let me reach the agency, so that I am never stuck.

Note: revised by the stack revision (server rendering, self-hosted fonts, content fallback in Requirement 40).

#### Acceptance Criteria

1. IF JavaScript is disabled, THEN THE Site SHALL still display every section from the server-rendered HTML with prices in INR and working `tel:`, `mailto:`, WhatsApp and in-page links, and SHALL display inside the Quote_Engine and the Checkout_Modal triggers a `<noscript>` note stating that the forms need JavaScript and listing a `tel:` link for each phone, a `mailto:` email link, a WhatsApp link and the office address, whose values match `BUSINESS.phones`, `BUSINESS.email`, `BUSINESS.whatsapp` and `BUSINESS.address`.
2. THE Site SHALL load every `<img>` except the Hero image and the Header Brand_Logo with `loading="lazy"`, load the Hero image and the Header Brand_Logo without lazy loading, and give every `<img>` explicit positive integer `width` and `height` attributes.
3. THE Site SHALL render the static sections (Hero, Trust_Strip, Services_Section, How_It_Works, Expert_Section, Reviews_Section, Final_CTA, Footer) as Server Components that ship no client JavaScript of their own, and SHALL keep the compressed JavaScript transferred on first load of `/` at or below 250 KB, measured in the browser network panel on a production build.
4. THE Site SHALL load no script from any origin other than the Site's own, SHALL serve its font files from its own origin, and SHALL load no third-party resource other than images from `IMAGE_HOSTS` and the Supabase Storage host of `NEXT_PUBLIC_SUPABASE_URL`.
5. IF a font file fails to load, THEN THE Site SHALL render all text in the fallback fonts with every section, button and form field still visible and operable.
6. IF `localStorage` is unavailable or throws on access, THEN THE App_Layer SHALL display prices in the Base_Currency, keep currency switching working for the current page session without persistence, and display no error to the Visitor.
7. IF a Package Tier id requested by the App_Layer is absent from the Package, THEN THE App_Layer SHALL use the Tier returned by `getTier` (the cheapest Tier) without displaying an error.
8. WHILE the Database is not configured or unreachable, THE Site SHALL render the public page from the Data_Config content as specified in Requirement 40, and the Quote_Engine and Checkout_Modal SHALL offer the WhatsApp fallback of criteria 19.5 and 14.12 when the APIs return 503.

### Requirement 28: Package Data Integrity

**User Story:** As a developer, I want package data validated by tests, so that content edits cannot break itineraries, tiers or pricing.

#### Acceptance Criteria

1. THE Data_Config SHALL give every Package a non-empty `id` that is unique across all entries in `PACKAGES`, an integer `nights` of at least 1, `days` equal to `nights` plus 1, and an itinerary whose length equals `days` with the entry at zero-based index `i` having `day` equal to `i + 1`.
2. THE Data_Config SHALL give every Package a `region` of "international" or "domestic" that is also listed in its `categories`, and `categories` that are a subset of the `CATEGORIES` ids other than "all".
3. THE Data_Config SHALL give every Package 2 or 3 Tiers with unique ids from `TIER_IDS`, where every Tier has a positive integer `adultPriceINR`, a `childPriceINR` that is `null` or a positive integer, and hotel stays whose `nights` sum to the Package's `nights`.
4. THE Data_Config SHALL give every Package `extras` whose `flightFareINR` is `null` or a positive integer, whose `visa` is `null` or has a positive integer `feeINR` and non-empty `type`, and whose `onArrivalCharges` is an array of non-empty strings.
5. THE Data_Config SHALL include the four real Packages `bali-6n7d`, `dubai-4n5d`, `singapore-4n5d` and `kerala-5n6d` with the Tier prices: Bali Deluxe adult 39000 / child 15000 and Premium adult 48000 / child 16000; Dubai Deluxe 36000, Superior 38000 and Premium 41000 with child price `null`; Singapore Deluxe 56250 and Premium 62750 with child price `null`; Kerala Deluxe 28500 and Premium 38500 with child price `null`.
6. THE Data_Config SHALL include for the real Packages the Extras: Bali flight 60000 with on-arrival visa (IDR 500,000) and tourism levy (IDR 150,000) charges; Dubai flight 45500 with a UAE e-visa fee of 8000; Singapore flight 51125 with a visa fee of 5000; Kerala flight 20500 with no visa.
7. THE Data_Config SHALL give each Singapore Tier a `priceNote` stating that the per-person price is derived from the group total divided by 4 travellers (3 adults + 1 child sharing a family room) and that the price for the exact group is on request.
8. THE Data_Config SHALL include at least one Package for every `CATEGORIES` id other than "all", SHALL set `isSample` to true on every Package that is not one of the four real Packages, and SHALL ship exactly the four real Packages (no `maldives-sample` or `goa-sample`), so that every category tab is covered by real Packages.
9. THE Test_Suite SHALL verify criteria 28.1–28.8, criterion 7.1, criterion 7.2, criterion 1.4, criterion 30.3 and criteria 34.1–34.2 against the shipped Data_Config, failing with a message that identifies the offending Package `id` (or service or Destination `id`) and the violated rule whenever any check does not hold.
10. THE Data_Config `PACKAGES` and `DESTINATIONS` SHALL each pass `validatePackage` and `validateDestination` (with `packageIds` equal to the `PACKAGES` ids), so that the seed and fallback content always satisfies the same rules as content edited in the Admin_Area.

### Requirement 29: Payment Policy (Advance and Balance)

**User Story:** As the agency owner, I want the checkout to apply our real payment policy, so that Visitors see exactly what they pay at booking and when the balance is due.

#### Acceptance Criteria

1. WHEN `computeAdvance` is called with a positive integer `totalINR`, a positive integer `perPersonINR`, a booking ISO_Date and a departure ISO_Date with Days_Until_Departure less than `fullPaymentWithinDays` (21), THE Logic_Module SHALL return `advanceRate` 1, `advance` equal to `totalINR`, `balance` 0, `balanceDueDate` `null` and `rule` "within-window".
2. WHEN `computeAdvance` is called with Days_Until_Departure of 21 or more and `perPersonINR` less than `thresholdPerPersonINR` (25000), THE Logic_Module SHALL return `advanceRate` 1, `advance` equal to `totalINR`, `balance` 0, `balanceDueDate` `null` and `rule` "below-threshold".
3. WHEN `computeAdvance` is called with Days_Until_Departure of 21 or more and `perPersonINR` of 25000 or more, THE Logic_Module SHALL return `advanceRate` 0.5, `advance` equal to `totalINR` × 0.5 rounded up to a whole rupee, `balance` equal to `totalINR` minus `advance`, `balanceDueDate` equal to `addDays(departureDate, -21)` and `rule` "standard".
4. THE Logic_Module SHALL return from `computeAdvance` integer `advance` and `balance` values with `advance` plus `balance` equal to `totalINR` and `advance` greater than 0 and at most `totalINR`.
5. THE Logic_Module SHALL return from `computeAdvance` a `balanceDueDate` that is on or after the booking date whenever `rule` is "standard", and a `daysUntilDeparture` equal to `daysBetween(bookingDate, departureDate)`.
6. WHEN `computeBookingBreakdown` is called with a Tier, adults, children, a departure ISO_Date, a booking ISO_Date and the Payment_Policy, THE Logic_Module SHALL return the `computeLandTotal` fields together with the result of `computeAdvance(total, tier.adultPriceINR, bookingDate, departureDate, policy)`, using the selected Tier's adult price as the per-person package cost.
7. WHILE the Checkout_Modal displays a Booking_Breakdown, THE Checkout_Modal SHALL display exactly one policy note: "50% advance, balance {balanceDueDays} days before departure" for rule "standard", "Full payment required: departure is within 21 days" for rule "within-window", or "Full payment required: package is below ₹25,000 per person" for rule "below-threshold", with the numbers taken from the Payment_Policy.
8. THE Site SHALL take the threshold, advance rate and day values used in every payment-related text (Checkout_Modal, FAQ, Terms_Section payment panel) from the Payment_Policy in `BUSINESS`.

### Requirement 30: Cancellation Charges

**User Story:** As a Visitor, I want to know the cancellation charges in advance, so that I can book with a clear understanding of the risk.

#### Acceptance Criteria

1. WHEN `cancellationCharge` is called with a non-negative integer `daysPrior`, THE Logic_Module SHALL return 1.00 for 0 to 7 days (including no show), 0.75 for 8 to 15 days, 0.50 for 16 to 30 days, 0.35 for 31 to 45 days and 0.10 for 46 days or more, as a fraction of the total package cost per person.
2. THE Logic_Module SHALL return `cancellationCharge(a)` greater than or equal to `cancellationCharge(b)` for every pair of non-negative integers a ≤ b.
3. THE Data_Config SHALL define the Cancellation_Table as five contiguous bands starting at 0 days with no gaps or overlaps and an open upper bound (`maxDays` `null`) on the 46-day band.
4. IF `cancellationCharge` is called with a negative number, a non-integer number or a non-number value, THEN THE Logic_Module SHALL throw a `RangeError` without returning a value.

### Requirement 31: Terms and Policies Section

**User Story:** As a Visitor, I want the inclusions, exclusions, payment, cancellation and other terms in one place, so that I know exactly what I am agreeing to before I book.

#### Acceptance Criteria

1. THE Terms_Section SHALL render seven panels in the order Package Inclusions, Package Exclusions, Important Terms & Conditions, Payment Policy, Cancellation Policy, General Remarks and Disclaimer & Safety, as tabs WHILE the viewport is a Desktop_Viewport or Wide_Viewport and as an accordion WHILE the viewport is a Mobile_Viewport or Tablet_Viewport.
2. THE Terms_Section Package Inclusions panel SHALL list every entry of `POLICIES.inclusions` under "International tours" and every entry of `POLICIES.inclusionsDomestic` under "Domestic tours".
3. THE Terms_Section SHALL list every entry of `POLICIES.exclusions`, `POLICIES.importantTerms`, `POLICIES.generalRemarks` and `POLICIES.disclaimer` in their respective panels, in array order.
4. THE Terms_Section Payment Policy panel SHALL state the three Payment_Policy rules generated from `BUSINESS.paymentPolicy`: full payment at booking below ₹25,000 per person; 50% advance at booking and the balance 21 days prior to departure at ₹25,000 per person or more; full payment at booking when the booking is made within 21 days of departure.
5. THE Terms_Section Cancellation Policy panel SHALL render one row per Cancellation_Table band, in table order, showing the band label and the charge as a whole percentage, followed by every entry of `POLICIES.cancellation.rules`.
6. THE Data_Config SHALL define `POLICIES` with the content approved by the agency: inclusions, domestic inclusions, exclusions (including GST currently 5% and TCS per Government of India rules for international tours), important terms (including 24-hour quote validity, 6-month passport validity, check-in and check-out times, no amendments within 72 hours of departure, mandatory local charges not included and 48–72 hour confirmations), cancellation rules, general remarks and the disclaimer that Travel Guru acts only as a booking and tour facilitator and strongly advises comprehensive travel insurance.
7. WHEN the Site loads with a URL hash of `#terms-inclusions`, `#terms-exclusions`, `#terms-conditions`, `#terms-payment`, `#terms-cancellation`, `#terms-remarks` or `#terms-disclaimer`, THE App_Layer SHALL scroll to the Terms_Section and open the matching panel.
8. WHEN a Visitor activates a Terms_Section tab or accordion header, THE Terms_Section SHALL show that panel's content, set `aria-selected` (tabs) or `aria-expanded` (accordion) to "true" on its control and to "false" on every other control.

### Requirement 32: Accurate Trust and Policy Claims

**User Story:** As the agency owner, I want every claim on the Site to match our real policies, so that Visitors are never misled.

#### Acceptance Criteria

1. THE Site SHALL describe booking payments only in terms of the Payment_Policy (for example "Pay 50% to confirm" and "Transparent cancellation policy") in the Hero, Trust_Strip, How_It_Works, Quote_Engine, Checkout_Modal, Reviews_Section, FAQ_Accordion and Terms_Section.
2. THE Test_Suite SHALL verify that `lib/data.js` and every file under `app/` and `components/` contain no occurrence of "100% refundable", "refundable deposit" outside the phrase "refundable security deposit", "25% deposit", "450+ Airlines" or "IATA-style", case-insensitively.
3. THE Site SHALL label every non-INR price as indicative, every flight fare as "indicative, dynamic fare, subject to change", and every Extras amount as excluded from the land package price.
4. THE Collections_Section SHALL display, directly below the package grid, the note "Prices per person, land package only, subject to availability. Quotes are valid for {N} hours.", where {N} equals `BUSINESS.quoteValidityHours`.
5. THE `validatePackage` and `validateDestination` Validators SHALL reject any string field containing a `FORBIDDEN_CLAIMS` phrase (case-insensitive), so that Database content edited in the Admin_Area cannot reintroduce the claims of criterion 32.2.

### Requirement 33: Brand Identity, Logo and Brand Assets

**User Story:** As the agency owner, I want the Site to use our real logo, tagline and motto everywhere, so that visitors recognise the same brand they see on our poster.

#### Acceptance Criteria

1. THE Header and Footer SHALL render the Brand_Logo as an `<img>` with `src` equal to `BUSINESS.logo.src`, `alt` equal to `BUSINESS.logo.alt` ("Travel Guru Raipur logo") and explicit positive integer `width` and `height` attributes.
2. IF the Brand_Logo fails to load, THEN THE App_Layer SHALL replace that `<img>` with the Logo_Mark, which SHALL expose `role="img"` and an accessible name equal to `BUSINESS.logo.alt`, keeping the Header height at 72px and the remaining Header and Footer content visible and operable.
3. THE Site SHALL export `metadata = buildMetadata(BUSINESS)` and `viewport = buildViewport()` from `app/layout.js`, so that the server-rendered document head contains a `<link rel="icon">` and a `<link rel="apple-touch-icon">` pointing to `BUSINESS.favicon` ("/assets/favicon.png"), a `<meta property="og:image">` with the absolute URL of `BUSINESS.ogImage` on `BUSINESS.website` ("https://travelgururaipur.com/assets/og-image.jpg"), `og:title` and `<title>` equal to "{BUSINESS.brandName} · {BUSINESS.tagline}", `og:url` equal to `BUSINESS.website`, `twitter:card` equal to "summary_large_image" and `<meta name="theme-color" content="#070a1a">`.
4. THE Test_Suite SHALL verify that the `buildMetadata(BUSINESS)` and `buildViewport()` values of criterion 33.3 equal the corresponding `BUSINESS` values, failing with a message naming the mismatched field.
5. THE Site SHALL render `BUSINESS.tagline` ("Your Journey, Our Priority") as the Header tagline, the Hero eyebrow and the Footer brand-column tagline, and SHALL contain no occurrence of the former tagline "Your Trusted Travel Partner from Raipur".
6. THE Site SHALL use the poster phrases "Complete Travel Solutions Under One Roof" (Services_Section H2 and Hero paragraph), "Explore the World With Us" (Hero H1), "Plan Your Next Getaway Today" (Destinations_Section H2), "Your Travel Expert" (Expert_Section eyebrow), "Book Your Next Adventure With Travel Guru Raipur" (Final_CTA headline) and `BUSINESS.motto` (Footer).
7. THE Test_Suite SHALL verify that no `.css` file under `app/` or `components/` contains a `--gold-` or `--shadow-gold` token and that `lib/data.js` and the files under `app/` and `components/` contain no case-sensitive occurrence of "Cruises", "Forex", "Scenic Rail" or "Your Trusted Travel Partner from Raipur".
8. THE Site SHALL treat `public/assets/logo.png`, `public/assets/favicon.png`, `public/assets/og-image.jpg` and `public/assets/founder.jpg` (served as `/assets/...`) as files supplied by the agency, rendering the fallbacks of criterion 33.2 and criterion 36.5 while they are absent.

### Requirement 34: Destinations Data and Region Grouping

**User Story:** As the agency owner, I want our poster's popular destinations kept as data with tested grouping, so that I can edit destinations without breaking the grids or package links.

#### Acceptance Criteria

1. THE Data_Config SHALL define `DESTINATIONS` with exactly 14 entries in poster order: International Thailand ("Beaches | Culture | Nightlife"), Singapore ("Modern | Fun | Unforgettable"), Malaysia ("City Life | Shopping | Nature"), Europe ("History | Culture | Adventure"), Dubai ("Luxury | Shopping | Modernity") and Vietnam ("Nature | Heritage | Food"); Domestic Kashmir ("Heaven on Earth"), Shimla-Manali ("Hills & Adventure"), Kerala ("Backwaters & Beaches"), Andaman ("Blue Waters & Islands"), Char Dham ("Spiritual Journey"), Vaishno Devi ("Divine Blessings"), Udaipur-Jaisalmer ("Royal Heritage") and Nepal ("Nature & Culture"), with Nepal's `region` set to "domestic" as on the poster pending the agency's confirmation.
2. THE Data_Config SHALL give every Destination a non-empty `id` unique across `DESTINATIONS`, a non-empty `name`, `tagline` and `image`, a `region` of "international" or "domestic", and a `packageId` that is either `null` or the `id` of an entry in `PACKAGES`, with `packageId` equal to "singapore-4n5d" for Singapore, "dubai-4n5d" for Dubai, "kerala-5n6d" for Kerala and `null` for every other Destination.
3. WHEN `destinationsByRegion` is called with an array of Destinations and a region value, THE Logic_Module SHALL return a new array containing exactly the Destinations whose `region` equals that value, in input order, returning an empty array for any region value with no matching Destination, and leaving the input array unchanged.
4. THE Logic_Module SHALL produce results from `destinationsByRegion` such that, for any array whose every Destination has region "international" or "domestic", the results for "international" and "domestic" together contain every input Destination exactly once and their lengths sum to the input length.
5. THE Data_Config SHALL define `DESTINATION_QUOTE_SERVICE` as "Holidays", a member of `QUOTE_SERVICE_OPTIONS`.

### Requirement 35: Popular Destinations Section

**User Story:** As a Visitor, I want to browse popular international and domestic destinations and ask for a quote in one click, so that I can start planning a trip that is not in the package list.

#### Acceptance Criteria

1. THE Destinations_Section SHALL display the eyebrow "Popular Destinations", the H2 "Plan Your Next Getaway Today", an "International" grid rendering `destinationsByRegion(DESTINATIONS, "international")` and a "Domestic" grid rendering `destinationsByRegion(DESTINATIONS, "domestic")`, each in the returned order, with a heading for each grid.
2. THE Destinations_Section SHALL render each Destination tile with its image (`alt` equal to the Destination `name`), the `name` as an H3, the `tagline` and a "Get a Quote" button whose accessible name includes the Destination name.
3. WHERE a Destination's `packageId` refers to an entry in `PACKAGES`, THE Destinations_Section SHALL additionally render a "View Package" button on that tile, and WHERE `packageId` is `null` or refers to no Package, THE Destinations_Section SHALL render no "View Package" button.
4. WHEN a Visitor activates "Get a Quote" on a Destination tile, THE App_Layer SHALL scroll the page so that the top of the Quote_Engine sits at the bottom edge of the 72px Header, set the Quote_Engine destinations field to the Destination `name` (replacing its previous value), set the service checkbox whose value equals `DESTINATION_QUOTE_SERVICE` to checked while keeping every other checked service checked, and clear any displayed `services` and `destinations` errors.
5. WHEN a Visitor activates "View Package" on a Destination tile, THE Modal_Manager SHALL open the Itinerary_Modal for the Package whose `id` equals the Destination's `packageId`, as specified in criterion 11.1.
6. IF a Destination image fails to load, THEN THE Destinations_Section SHALL display a gradient placeholder in the image area at the same dimensions and keep the name, tagline and buttons rendered and operable.
7. THE Destinations_Section SHALL be reachable from the Header "Destinations" link as specified in criterion 4.5.

### Requirement 36: Your Travel Expert Section

**User Story:** As a Visitor, I want to see the person who will plan my trip and reach them directly, so that I trust the agency and can talk to a real expert.

#### Acceptance Criteria

1. THE Expert_Section SHALL display the eyebrow "Your Travel Expert", the photo from `BUSINESS.expert.photo`, `BUSINESS.expert.role`, `BUSINESS.expert.bio`, a "Call" button and a "WhatsApp" button styled with `--whatsapp`.
2. WHILE `BUSINESS.expert.name` is a non-empty string, THE Expert_Section SHALL display the name as the section H2 and set the photo `alt` to "{name}, {role}".
3. WHILE `BUSINESS.expert.name` is `null`, THE Expert_Section SHALL render no name element, use "Meet Your Travel Expert" as the section H2 and set the photo `alt` to `BUSINESS.expert.role`.
4. WHEN a Visitor activates the Expert_Section "Call" button, THE Site SHALL follow a `tel:` link to `BUSINESS.phones[0].tel`, with the button label including `BUSINESS.phones[0].display`, and WHEN a Visitor activates the Expert_Section "WhatsApp" button, THE App_Layer SHALL open, in a new tab with `noopener`, the URL produced by `buildWhatsAppUrl` with `BUSINESS.whatsapp` and a greeting message containing `BUSINESS.brandName`, falling back to the current tab when the new tab is blocked.
5. IF the expert photo fails to load, THEN THE Expert_Section SHALL display the Logo_Mark in the photo frame at the same dimensions, keeping the role, bio and both buttons rendered and operable.
6. THE Expert_Section SHALL be placed directly after the Quote_Engine and directly before the Reviews_Section, as specified in criterion 3.12.

### Requirement 37: Quote Submission API

**User Story:** As the agency owner, I want every quote request stored with a ticket number on the server, so that no lead is lost and the ticket the Visitor sees matches our records.

#### Acceptance Criteria

1. THE Quote_API SHALL accept `POST /api/quote` on the Node.js runtime with a JSON body containing Quote_Form_Data fields and the Honeypot key `website`, SHALL respond with JSON and `Cache-Control: no-store`, and SHALL delegate all request logic to the `handleQuote` Handler_Core.
2. WHEN a request passes the checks of Requirement 39, has an empty Honeypot and its fields are valid for `validateQuoteForm(fields, Business_Date, { mode: "submit" })`, THE Quote_API SHALL insert exactly one Lead with status "new", a server-generated Ticket_ID and `callback_deadline` equal to `computeCallbackDeadline(now, callbackSlot, BUSINESS.callbackHours)`, and SHALL respond 201 with `{ ok: true, ticketId, callbackDeadline }` where `callbackDeadline` is an ISO 8601 UTC string.
3. THE Quote_API SHALL generate each Ticket_ID as `generateTicketId(year, n)`, where `year` is the year of the Business_Date and `n` is a cryptographic random integer from 0 to 9999, and IF the insert fails because the Ticket_ID already exists, THEN THE Quote_API SHALL retry with a new `n`, making at most `API_LIMITS.maxIdAttempts` (5) insert attempts in total and responding 500 `{ ok: false, error: "server_error" }` when all attempts collide.
4. IF the fields fail `validateQuoteForm` in Submit_Mode or a string field holds a non-string value, THEN THE Quote_API SHALL respond 400 `{ ok: false, error: "validation", errors }` with the same error keys and messages as the Validator and SHALL insert no Lead.
5. IF the Honeypot value is a non-empty string after trimming, THEN THE Quote_API SHALL respond 201 with a well-formed Ticket_ID and Callback_Deadline and SHALL insert no Lead.
6. THE Quote_API SHALL store only the whitelisted Quote_Form_Data fields mapped to the `leads` columns, ignoring every other key in the body (including `id`, `ticket_id`, `status` and `created_at`).
7. IF the Supabase server environment variables are missing, THEN THE Quote_API SHALL respond 503 `{ ok: false, error: "unavailable" }`, and IF the Database reports any error other than a duplicate Ticket_ID, THEN THE Quote_API SHALL respond 500 `{ ok: false, error: "server_error" }`; neither response nor any server log entry SHALL contain Database error text or submitted values.
8. THE Quote_API SHALL compute "today" as the Business_Date in `BUSINESS.timeZone` ("Asia/Kolkata") from the server clock, independent of the server's own time zone.

### Requirement 38: Booking Request API with Server-Side Pricing

**User Story:** As the agency owner, I want booking requests priced by the server from our own package data, so that a tampered browser can never record a wrong price.

#### Acceptance Criteria

1. THE Booking_API SHALL accept `POST /api/booking` on the Node.js runtime with a JSON body containing `packageId`, `tierId`, `adults`, `children`, `travelDate`, `leadName`, `email`, `phone` and `agreeTerms`, SHALL respond with JSON and `Cache-Control: no-store`, and SHALL delegate all request logic to the `handleBooking` Handler_Core.
2. WHEN a request passes the checks of Requirement 39, THE Booking_API SHALL load the Package with id `packageId` from the Database restricted to published rows, and IF no published Package has that id, THEN THE Booking_API SHALL respond 400 with `errors.packageId` "This package is not available" and insert nothing.
3. IF `validateCheckout(fields, Business_Date, dbPackage)` returns `valid` false, THEN THE Booking_API SHALL respond 400 `{ ok: false, error: "validation", errors }` and insert nothing.
4. WHEN the fields are valid, THE Booking_API SHALL compute the amounts as `computeBookingBreakdown({ tier, adults, children }, travelDate, Business_Date, BUSINESS.paymentPolicy)` using the Tier of the Database Package, and SHALL store `land_total_inr`, `advance_inr`, `balance_inr`, `balance_due_date` and `rule` exactly equal to that result.
5. THE Booking_API SHALL ignore every price-like value in the request body (for example `total`, `landTotal`, `advance`, `balance`, `advanceRate`, `adultPriceINR`, `childPriceINR`), so that changing only those values never changes the stored Booking_Request.
6. THE Booking_API SHALL read only the fields of criterion 38.1 from the body, SHALL never read, store, log or echo a card number, expiry or CVC, and SHALL store no column derived from any other key.
7. THE Booking_API SHALL generate each Booking_Reference as `generateBookingRef(n)` with `n` a cryptographic random integer from 0 to 4,294,967,295, retrying with a new `n` on a duplicate reference for at most `API_LIMITS.maxIdAttempts` (5) insert attempts in total and responding 500 when all attempts collide.
8. WHEN the insert succeeds, THE Booking_API SHALL respond 201 with `{ ok: true, bookingRef, breakdown: { total, advanceRate, advance, balance, balanceDueDate, rule } }` taken from the stored values.
9. IF the Supabase server environment variables are missing, THEN THE Booking_API SHALL respond 503 `{ ok: false, error: "unavailable" }`, and IF the Database reports any other error, THEN THE Booking_API SHALL respond 500 `{ ok: false, error: "server_error" }`, without Database error text or submitted values in the response or logs.
10. THE Booking_API SHALL store every new Booking_Request with status "pending" and SHALL take no payment.

### Requirement 39: API Abuse Protection and Input Limits

**User Story:** As the agency owner, I want the public endpoints protected against spam and oversized input, so that the database stays clean and the Site stays available.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL allow, per client IP, at most `RATE_LIMITS.quote` (5 requests per 10 minutes) to the Quote_API, `RATE_LIMITS.booking` (5 per 10 minutes) to the Booking_API and `RATE_LIMITS.login` (10 per 15 minutes) to the Admin sign-in action within any sliding window of that length, and IF a request exceeds its limit, THEN THE Server_Layer SHALL respond 429 `{ ok: false, error: "rate_limited" }` with a `Retry-After` header in whole seconds (or, for sign-in, the message "Too many attempts. Try again later.").
2. THE Rate_Limiter SHALL keep its state in memory per server instance with at most 10,000 tracked keys, and THE design documentation SHALL state that the limit is best-effort: it resets on restart or cold start, is not shared between instances, and relies on the `x-forwarded-for` header set by the hosting proxy.
3. IF a request body exceeds `API_LIMITS.maxBodyBytes` (16,384 bytes, by declared `Content-Length` or actual UTF-8 length), THEN THE Server_Layer SHALL respond 413; IF its `Content-Type` does not start with `application/json`, THEN 415; IF it is not valid JSON or not a JSON object, THEN 400 `{ ok: false, error: "bad_json" }`; in each case without throwing and without touching the Database.
4. THE Validator SHALL enforce, on the client and in the Handler_Cores alike, `departureCity` at most 80 characters, `destinations` at most 200, trimmed `fullName` and `leadName` 2–80, `email` at most 254, raw `phone` at most 20, `childAges` at most 100, `notes` at most 1000 and `services` at most 8 entries, returning an error under the field's key for each violation.
5. IF a request to the Quote_API or Booking_API carries an `Origin` header whose host differs from the `Host` header, or a malformed `Origin`, THEN THE Server_Layer SHALL respond 403 `{ ok: false, error: "forbidden" }` without touching the Database.
6. THE Quote_API and Booking_API SHALL count a request against the rate limit before validating it, so that invalid and Honeypot requests also consume the client's allowance.

### Requirement 40: Content Source, Incremental Regeneration and Static Fallback

**User Story:** As the agency owner, I want the public page to show the packages and destinations I edit in the admin, and still work when the database is unavailable, so that the Site never goes blank.

#### Acceptance Criteria

1. THE public page SHALL read published packages and destinations in Server Components through the Content_Source using the Anon_Client without cookies, ordered by `sort_order` then `id`, and SHALL pass them to client components as serialisable props.
2. THE public page SHALL export `revalidate = 300`, and WHEN an Admin saves, publishes, unpublishes or deletes a package or destination, THE Server_Layer SHALL call `revalidatePath("/")` so that the next request renders the change.
3. IF `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, THEN THE Content_Source SHALL return the Data_Config `PACKAGES` and `DESTINATIONS` without attempting a network request, so that the Site renders locally without a database.
4. IF fetching packages or destinations throws or returns an error, THEN THE Content_Source SHALL use the Data_Config list for that collection only, log the collection name and error code without personal data, and never throw.
5. WHEN rows are returned, THE Content_Source SHALL map them with `rowToPackage` / `rowToDestination` and exclude every row that fails `validatePackage` / `validateDestination`, logging its id.
6. THE Content_Source SHALL set to `null` the `packageId` of every returned Destination that refers to no returned Package, so that no "View Package" button points to a missing or unpublished Package.
7. WHEN the Database returns an empty list without error, THE Content_Source SHALL return the empty list (no fallback), so that the Collections_Section shows its empty state as specified in criterion 8.10.
8. THE `lib/content-mapping.js` functions SHALL satisfy `rowToPackage(packageToRow(p))` deep-equal to `p` for every valid Package and `rowToDestination(destinationToRow(d))` deep-equal to `d` for every Destination, storing `id`, `title`, `region`, `categories`, `nights`, `days` and `image` as columns and every other Package field in `data`.
9. THE Data_Config SHALL remain the only source of `BUSINESS`, `CURRENCIES`, `SERVICES`, `REVIEWS`, `FAQ`, `POLICIES` and the option lists, which are changed in code, not in the Database.
10. THE Test_Suite SHALL verify criteria 40.3–40.8 with injected fake clients, without network access.

### Requirement 41: Database Schema and Row Level Security

**User Story:** As the agency owner, I want our data stored with strict access rules, so that visitors can read only published content and only admins can see leads and bookings.

#### Acceptance Criteria

1. THE migration `supabase/migrations/0001_init.sql` SHALL create the enums `lead_status` (new, contacted, quoted, closed) and `booking_status` (pending, confirmed, cancelled) and the tables `admins`, `packages`, `destinations`, `leads` and `bookings` with the columns, keys, defaults and check constraints listed in the design section 6.4.
2. THE migration SHALL enable Row Level Security on all five tables.
3. THE Database SHALL allow the `anon` role to SELECT only rows of `packages` and `destinations` whose `is_published` is true, and SHALL give `anon` no SELECT, INSERT, UPDATE or DELETE access to `leads`, `bookings` or `admins`.
4. THE Database SHALL define no INSERT policy on `leads` or `bookings` for `anon` or `authenticated`, so that Leads and Booking_Requests are inserted only by the Route Handlers through the Service_Client.
5. THE Database SHALL allow an Admin (an authenticated user whose id is in `admins`, checked by the `security definer` function `public.is_admin()`) to SELECT all `leads` and `bookings` and UPDATE only their `status` column, and to SELECT, INSERT, UPDATE and DELETE all `packages` and `destinations`.
6. THE Database SHALL give an authenticated user who is not an Admin the same access as `anon`, plus SELECT on their own `admins` row only.
7. THE migration SHALL enforce with check constraints: `days = nights + 1`, `region` in `categories`, id slugs, Ticket_ID and Booking_Reference formats, adults 1–12, children 0–8, the text lengths of criterion 39.4, `advance_inr + balance_inr = land_total_inr`, `0 < advance_inr ≤ land_total_inr`, and for rules other than "standard" a zero balance with no due date.
8. THE migration SHALL reference `bookings.package_id` to `packages.id` with `on delete restrict` and `destinations.package_id` with `on delete set null`, and SHALL maintain `updated_at` with a trigger on every table that has it.
9. THE seed script `scripts/seed.js` SHALL validate and insert the four Data_Config Packages and the 14 Destinations as published rows in poster order through the Service_Client, SHALL skip rows whose id already exists unless run with `--force`, SHALL never touch `leads`, `bookings` or `admins`, and SHALL exit with a clear message when the required environment variables are missing.
10. THE Test_Suite SHALL statically verify the migration file: RLS enabled on all five tables, the read policies limited to `is_published`, no policy granting `anon` access to `leads`, `bookings` or `admins`, no INSERT policy on `leads` or `bookings`, and the column-level `grant update (status)`.

### Requirement 42: Admin Authentication and Access Control

**User Story:** As the agency owner, I want the admin area locked to our staff accounts, so that nobody else can read leads or change packages.

#### Acceptance Criteria

1. THE Site SHALL provide `/admin/login` with an email and password form that signs in through Supabase Auth with `@supabase/ssr` cookie sessions, and SHALL provide no sign-up page, route, action or link.
2. THE `proxy.js` file SHALL match `/admin/:path*`, refresh the Supabase session cookies, and WHEN a request to any `/admin` path other than `/admin/login` has no signed-in user, SHALL redirect it to `/admin/login`.
3. WHEN an Admin_Area page renders, THE Server_Layer SHALL verify the user with `auth.getUser()` and the `admins` membership before reading any data, and WHEN the user is signed in but not an Admin, SHALL render only a "Not authorised" message with a Sign out button.
4. WHEN any Admin_Area Server Action that changes data runs, THE Server_Layer SHALL re-verify that the user is signed in and an Admin through `runAdminMutation` before validating input and performing the change, and SHALL perform no change and return a failure result when either check fails.
5. THE Admin_Area SHALL read and write data only through the Session_Client, so that RLS applies to every Admin operation, and SHALL never use the Service_Client.
6. IF sign-in fails, THEN THE login page SHALL display "Invalid email or password" without revealing whether the email exists, and sign-in attempts SHALL be rate limited as specified in criterion 39.1.
7. WHEN an Admin activates "Sign out", THE Server_Layer SHALL end the Supabase session, clear its cookies and redirect to `/admin/login`.
8. THE Admin_Area and `/admin/login` SHALL carry `robots: { index: false, follow: false }` metadata and an `X-Robots-Tag: noindex, nofollow` response header, render dynamically and never be cached by ISR.

### Requirement 43: Admin Leads and Bookings Management

**User Story:** As an Admin, I want to see new leads and booking requests and track their status, so that every call-back happens within 24 hours.

#### Acceptance Criteria

1. THE `/admin` page SHALL list Leads newest first, 50 per page with next and previous page links, showing created time (IST), Ticket_ID, name, phone as a `tel:` link and a WhatsApp link, email as a `mailto:` link, services, destinations, departure date, adults and children with child ages, call-back slot, Callback_Deadline and status.
2. THE `/admin` page SHALL let an Admin change a Lead's status to one of `LEAD_STATUSES` through a select and a Save control, and WHEN the update succeeds, SHALL show the new status, and IF it fails, SHALL show an error message and keep the previous status.
3. THE `/admin/bookings` page SHALL list Booking_Requests newest first, 50 per page, showing Booking_Reference, created time, package title (or id), Tier, adults, children, travel date, lead name, email, phone, land total, advance, balance, balance due date, rule and status, with amounts formatted in INR.
4. THE `/admin/bookings` page SHALL let an Admin change a Booking_Request's status to one of `BOOKING_STATUSES` with the same success and failure behaviour as criterion 43.2.
5. IF a status update receives a value outside `LEAD_STATUSES` or `BOOKING_STATUSES`, THEN THE Server_Layer SHALL reject it without changing the row.
6. THE Admin_Area SHALL offer no way to edit any Lead or Booking_Request field other than `status`, and no way to delete Leads or Booking_Requests.

### Requirement 44: Admin Content Management for Packages and Destinations

**User Story:** As an Admin, I want to edit packages and destinations without code changes, with validation that stops broken itineraries or prices, so that the public page stays correct.

#### Acceptance Criteria

1. THE `/admin/packages` page SHALL list every package row, published or not, in `sort_order` then `id` order, showing id, title, region, nights/days, From_Price, published state, sort order and last update, with a "New package" link and an edit link per row.
2. THE package edit page SHALL provide fields for `id` (editable only when creating), title, region, categories (checkboxes of the `CATEGORIES` ids other than "all"), nights, days, image, sort order and a published toggle, plus a JSON editor (textarea) for the `data` fields `destination`, `highlights`, `hotelStarRating`, `mealPlan`, `transferBasis`, `tiers`, `extras`, `inclusions`, `itinerary`, `isSample` and `notes`.
3. WHEN `validatePackage` is called, THE Validator SHALL check the rules of the design section 7.18 (id slug; title and destination 2–120 characters; Region; categories; nights 1–60 and days = nights + 1; image under `/assets/` or an `https:` URL on an allowed host; highlights; star rating; 2–3 unique Tiers with integer prices from 1 to 10,000,000, child price `null` or in range, hotel stays whose nights sum to the Package nights; Extras; inclusions; itinerary length, numbering and lengths; transfer types; notes; no `FORBIDDEN_CLAIMS` phrase) and SHALL return an error keyed by the path of each failing field (for example `tiers[1].hotels`).
4. WHEN `validatePackage` is called with any value, THE Validator SHALL return `valid` true if and only if `errors` is empty, SHALL never throw (returning an error under key `root` for a non-object), and SHALL return `valid` true for each of the four Data_Config Packages.
5. WHEN an Admin submits the package form, THE App_Layer SHALL parse the JSON and run `validatePackage` before sending, displaying a JSON syntax error or the errors by path without sending, and THE `savePackage` Server Action SHALL parse and validate again and reject invalid input without writing.
6. WHEN `savePackage` succeeds, THE Server_Layer SHALL upsert the row produced by `packageToRow`, call `revalidatePath("/")` and show "Saved".
7. WHILE a package row has `is_published` false, THE Site SHALL exclude it from the public page and THE Booking_API SHALL reject bookings for it as specified in criterion 38.2.
8. WHEN an Admin deletes a package that is referenced by any Booking_Request, THE Admin_Area SHALL keep the package and display "This package has bookings. Unpublish it instead."; deleting a destination SHALL remove it after a confirmation.
9. THE `/admin/destinations` pages SHALL list and edit destinations (name, tagline, region, image, linked package chosen from the existing package ids or none, sort order, published), validated on the client and in the Server Action by `validateDestination`, which SHALL return `valid` true if and only if `errors` is empty, never throw, and reject a `packageId` that is not among the supplied package ids.
10. THE Admin_Area SHALL show a Sign out control on every page, as specified in criterion 42.7.

### Requirement 45: Security Headers and Secrets Handling

**User Story:** As the agency owner, I want standard browser protections and strict handling of keys, so that the Site resists clickjacking, injection and credential leaks.

#### Acceptance Criteria

1. THE `next.config.js` SHALL send on every route a `Content-Security-Policy` with `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (adding `'unsafe-eval'` only in development), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:` plus the `IMAGE_HOSTS` and the Supabase host of `NEXT_PUBLIC_SUPABASE_URL`, `font-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` and `object-src 'none'`.
2. THE `next.config.js` SHALL also send `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff` and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` on every route, `Strict-Transport-Security: max-age=63072000; includeSubDomains` in production, and SHALL set `poweredByHeader: false`.
3. THE Site SHALL read `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/service.js`, which starts with `import "server-only"`, and in `scripts/seed.js`; SHALL never prefix it with `NEXT_PUBLIC_`; and SHALL never pass it, or any value derived from it, to a client component, a response body or a log.
4. THE repository SHALL contain `.env.local.example` listing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` with placeholder values only, and `.gitignore` SHALL exclude `.env.local` and every `.env*.local` file.
5. THE Server_Layer SHALL log only error codes, collection names and record ids, never names, phone numbers, emails, request bodies, keys or cookies.
6. THE design documentation SHALL list every network-exposed endpoint with its authentication: `POST /api/quote` and `POST /api/booking` public without authentication (protected by Requirement 39), and every Admin_Area page and Server Action requiring an Admin session (Requirement 42).
7. THE Test_Suite SHALL statically verify criteria 45.3 and 45.4, the absence of `dangerouslySetInnerHTML` and of card field names in `app/`, `components/` and `lib/`, and the presence of the headers of criteria 45.1 and 45.2 in `next.config.js`.

### Requirement 46: Project Structure, Tooling and Migration from the Vanilla Build

**User Story:** As a developer, I want a conventional Next.js project that keeps the tested core, so that the port does not lose the work already done.

#### Acceptance Criteria

1. THE Site SHALL use the Next.js App Router with React and plain JavaScript only, containing no `.ts` or `.tsx` source file and no TypeScript configuration other than `jsconfig.json`.
2. THE `jsconfig.json` SHALL map the alias `@/*` to the project root, used by files under `app/`, `components/` and `proxy.js`, while `lib/` modules use relative imports as specified in criterion 2.9.
3. THE project manifest SHALL keep `"type": "module"`, declare the scripts `dev` (`next dev`), `build` (`next build`), `start` (`next start`), `lint` (`eslint .`), `test` (`node --test "tests/**/*.test.js"`) and `seed` (`node --env-file=.env.local scripts/seed.js`), and declare `engines.node` as `>=20.9`.
4. THE project SHALL configure ESLint with a flat config (`eslint.config.mjs`) based on `eslint-config-next`, and `npm run lint` SHALL report no errors.
5. THE migration SHALL move `data.js` to `lib/data.js` and `logic.js` to `lib/logic.js` keeping their content and exports (except the Data_Config changes of Requirement 1), move `assets/` to `public/assets/`, and update every test import to `../lib/`, with the existing tests passing after the move.
6. WHEN the port of every section is complete, THE migration SHALL delete the superseded root files `index.html`, `styles.css` and `app.js` (the agreed migration), leaving `prototype/index.html` untouched as a visual reference.
7. THE Test_Suite SHALL run with `npm test` without a Next.js build, a Supabase project, environment variables or network access.
