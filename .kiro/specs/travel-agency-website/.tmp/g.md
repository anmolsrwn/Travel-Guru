# Requirements Document

## Introduction

This document derives the requirements for the Travel Guru Raipur website from the approved design (`design.md`). The Site is a single public marketing and lead-conversion page plus a small admin area for Travel Guru Raipur, an independent tours and travel agency at VIP Chowk, Telibandha, Raipur. Its brand (logo, blue/orange palette on a dark indigo canvas, tagline "Your Journey, Our Priority") and content follow the agency's real logo and marketing poster. It presents 8 services, a Popular Destinations section (international and domestic grids), a "Your Travel Expert" founder section, a filterable collections showcase built from the agency's real quotations (Bali, Dubai, Singapore, Kerala) with Deluxe / Superior / Premium hotel tiers, adult and child prices per person, separately priced flights and visas, INR base pricing with an indicative currency switcher, day-by-day itinerary modals, a dual-mode booking checkout (WhatsApp, or a booking request that follows Travel Guru's real payment policy without taking any payment), a Terms & Policies section, and a 24-hour call-back quotation engine with a WhatsApp instant-quote fallback.

Stack revision (approved): the Site is built with Next.js (App Router, React, plain JavaScript, no TypeScript), vanilla CSS with CSS Modules plus one global token stylesheet, Next.js Route Handlers on the Node.js runtime, and Supabase (PostgreSQL, Auth, Row Level Security). Configuration and static content live in `lib/data.js`; pure business logic lives in `lib/logic.js`; both remain framework-free ES modules testable with `node --test`. Quote requests and booking requests are stored in Supabase through two public API endpoints; packages and destinations are stored in Supabase, editable in a password-protected admin area, and fall back to the static content in `lib/data.js` when the database is not configured or unreachable. There is still no real payment processing; currency conversions are indicative.

Open assumptions are listed in the design's "Open Items to Confirm". Requirements 33–36 were added by the brand revision. Requirements 37–46 were added by the stack revision; Requirements 1, 2, 3, 5, 12, 13, 14, 17, 19, 25, 26, 27, 28, 32 and 33 were revised for it. The superseded vanilla files (root `index.html`, `styles.css`, `app.js`) are deleted after the port, and root `data.js` / `logic.js` move to `lib/` (Requirement 46).

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

