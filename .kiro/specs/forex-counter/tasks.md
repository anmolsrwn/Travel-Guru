# Implementation Plan: Forex Counter

## Overview

Add a forex counter to the Travel Guru Raipur site: config in `lib/data.js`, pure rate/quote/validation functions in `lib/logic.js`, a `ForexCalculator` client component inside a `ForexSection` on the home page, a Forex card in the Services section, forex fields in the quote form, forex validation and storage in the quote API, a Supabase migration, and a forex display in the admin leads table.

Work is ordered so every step builds on the last and nothing is left unwired:

1. Data config (`lib/data.js`, service glyph, existing test fixes)
2. Logic functions (`lib/logic.js`)
3. Tests with fast-check (`tests/forex.test.js`)
4. `ForexCalculator`
5. `ForexSection`
6. Page integration and Services card
7. `QuoteForm` extension (state, shared validation, UI)
8. Quote API extension (`lib/server/quote.js`)
9. DB migration (`supabase/migrations/0002_forex_details.sql`)
10. Admin leads display

## Before You Write Any Code (applies to every task)

- **Next.js docs first.** `AGENTS.md` says this Next.js version (16.x, React 19) has breaking changes. Before writing or editing any Next.js-facing code (pages, route handlers, server vs client components, `next/link`, metadata, caching or `revalidate`), read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. The design doc says "Next.js 14 / React 18"; that is out of date.
- **Match existing code.** Read these before touching them and follow their conventions: `lib/data.js`, `lib/logic.js`, `components/client/QuoteForm.jsx`, `components/client/quoteFormState.js`, `components/client/quoteSubmit.js`, `components/client/QuoteIntentProvider.jsx`, `app/api/quote/route.js`, `lib/server/quote.js`, `components/admin/LeadsTable.jsx`. Also skim a sibling section (`components/sections/SeasonalSection.jsx`, `Services.jsx`) for markup, `Reveal` usage and CSS Module naming.
- Plain JavaScript (ESM), no TypeScript, CSS Modules only. `lib/` modules and anything imported by `node --test` use relative imports; components use the `@/` alias.
- Tests run with `npm test` (`node --test "tests/**/*.test.js"`). `fast-check` 4.10.2 is already a devDependency, so install nothing.

## Notes

### Spec and codebase discrepancies the implementer must handle

These were found while mapping the design onto the real code. Follow the resolution given here.

1. **Rate direction.** `CURRENCIES[x].rate` is *units of foreign currency per 1 INR* (USD = 0.012). The design's `targetAmount = sourceAmount / rate` with `buyRate = base*(1+margin)` makes buying cheaper than the mid rate and makes a round trip (Property 7) gain money. Resolution:
   - `calculateForexBuyRate` / `calculateForexSellRate` return exactly what Requirements 2.2, 2.4 and 9.2 state (`base*(1+buy%)`, `base*(1-sell%)`). Do not change them.
   - Quote *amounts* use the customer-unfavourable direction: buy gives `foreign = inr * base / (1 + buy%/100)`; sell gives `inr = foreign / base * (1 - sell%/100)`. Round trip is then `X * (1 - sell%) / (1 + buy%) < X`.
   - The calculator shows the effective rate computed from the quote amounts (INR per 1 foreign unit), not `quote.rate`.
   - Flag this decision in the PR/summary so the owner can confirm the margin semantics.
2. **Which currency is "amount".** Requirement 2.8/2.9 (and the 9.2 examples) use INR as the source for buy and foreign as the source for sell, while Requirements 3 and 5 and the admin display treat the amount as a *foreign* amount in both directions. Resolution: the UI, form, API payload and `forex_details.amount` always hold a **foreign-currency amount**. Add one helper (task 2.1), `calculateForexQuoteForForeignAmount`, that converts a foreign amount into the INR source for buy and delegates to `calculateForexQuote`.
3. **Range check.** `minTransactionINR` / `maxTransactionINR` apply to the INR equivalent. Use `foreignAmount / base rate` (mid-market) for foreign amounts and the INR amount directly when the source is INR. `validateForexQuoteRequest` does **not** range-check (Property 8a accepts any positive amount up to 1,000,000); range is enforced by a separate exported helper `isForexAmountInRange` that the form validation and the API both call.
4. **Backend is Supabase, handler core is `lib/server/quote.js`.** The design's "Postgres + route.js edits" maps to: pure `handleQuote` in `lib/server/quote.js` (whitelists fields via `pickQuoteFields`, maps rows via `toLeadRow`), `app/api/quote/route.js` stays a thin wrapper and needs no change, migrations live in `supabase/migrations/`, and `tests/server.quote.test.js` asserts the exact key set of the stored row.
5. **Existing tests will break and must be updated** (task 1.2, 7.x, 8.x, 9.2): `tests/data.test.js` (`QUOTE_SERVICE_OPTIONS` length 8), `tests/data.services.test.js` (8 services, 8 unique accents, `doesNotMatch(/cruise|forex|scenic rail/i)` on SERVICES), `tests/server.quote.test.js` (exact `Object.keys(row)`), `tests/quote-form-state.test.js` (initial form shape / field order).
6. **CSS/markup names.** There is no `--brand-grad` class. Use the existing `gradient-text` span pattern and the `eyebrow`, `lead`, `section`, `section--alt`, `section-head`, `container` classes as in `SeasonalSection.jsx`. `--svc-teal` already exists in `app/globals.css` and `ServiceGlyph.jsx`/`Service.module.css`; only the `currency` glyph is missing.
7. **fast-check 4 floats.** `fc.float` bounds must be 32-bit floats. For the design's property snippets use `fc.double({ min, max, noNaN: true })` (or wrap bounds in `Math.fround`). Also fix the design's Property 4c snippet so the source currency matches the direction (see note 2).
8. **No lead detail view exists** in the admin (only `LeadsTable`). Requirement 5.6's "detail view" is satisfied by showing the forex details in the Services cell of the row.
9. **Section order.** Requirement 4.1 puts the Forex section between Services and Destinations. In `app/(site)/page.js` that means directly after `<Services />` (before `<Collections />`).
10. The Services heading currently says "Seven services" while there are already 8 cards. Leave the copy alone unless the owner asks; just make sure the grid still lays out 9 cards.

### General

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP. Remove the `*` if you want them required. Task 1.2 is not optional because it keeps the existing suite green.
- Each task lists the requirement clauses it covers (forex-counter spec numbering, not the main spec).
- Property tests live in the single file `tests/forex.test.js` (Requirement 9.1), run at least 100 iterations (`{ numRuns: 100 }`), and are tagged `Feature: forex-counter, Property N: ...`.

## Tasks

- [x] 1. Data configuration
  - [x] 1.1 Add forex config, service entry and glyph
    - In `lib/data.js` export `FOREX_CURRENCIES = ["USD","EUR","GBP","AUD","AED","SGD"]` and `FOREX_CONFIG = { buyMarginPercent: 2.5, sellMarginPercent: 3.0, minTransactionINR: 5000, maxTransactionINR: 500000, serviceFeePercent: 0 }`. Confirm all six codes exist in `CURRENCIES` (add any that are missing, with indicative rates and the same shape as existing entries).
    - Append `"Forex"` to `QUOTE_SERVICE_OPTIONS`.
    - Append a SERVICES entry `{ id: "forex", icon: "currency", title: "Forex", subtitle: "Currency Exchange Services", quoteOption: "Forex", accent: "--svc-teal", summary: "Competitive exchange rates for international travel", bullets: ["USD, EUR, GBP, AUD, AED, SGD", "Buy and sell foreign currency", "Formal quotes within 24 hours"] }`. Make sure `--svc-teal` is present in `SERVICE_ACCENTS` (add it if the list does not contain it).
    - In `components/ui/ServiceGlyph.jsx` add a `currency` entry to the glyph path map (a simple coin/₹ style SVG path, same 24x24 viewBox as the others).
    - Keep `lib/data.js` pure data (no functions, no imports).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 6.1, 6.2, 6.3, 6.5_

  - [x] 1.2 Update existing tests that assert the old service counts
    - `tests/data.test.js`: `QUOTE_SERVICE_OPTIONS` now has 9 unique entries.
    - `tests/data.services.test.js`: 9 services, 9 unique ids/accents, `SERVICE_ACCENTS` unique count matches, drop `forex` from the `doesNotMatch` regex on `SERVICES` (keep `cruise|scenic rail`), and add the forex row to the title/subtitle/accent expectation.
    - Run `npm test` and fix any other count-based assertion this change breaks (do not weaken unrelated assertions).
    - _Requirements: 1.8, 1.9_

- [x] 2. Forex logic functions in `lib/logic.js`
  - [x] 2.1 Implement rate, quote and range functions
    - Read the existing helpers in `lib/logic.js` (`convertPrice`, `formatPrice`, rounding helper, `currencyOf`, `assertAmount`) and reuse them; use the existing 2-decimal half-up rounding helper for money values.
    - Export `calculateForexBuyRate(baseCurrency, targetCurrency, currencies, forexConfig)` and `calculateForexSellRate(...)`. Throw `Error("Base currency must be INR")` when base is not `"INR"` and `Error("Unsupported currency")` when `targetCurrency` is missing from `currencies` (or is `"INR"`). Check base first, then target, so each message is reachable. Results: `base*(1+buy%/100)` and `base*(1-sell%/100)`.
    - Export `calculateForexQuote(direction, sourceCurrency, targetCurrency, amount, currencies, forexConfig)` returning `{ direction, sourceCurrency, targetCurrency, sourceAmount, targetAmount, rate, serviceFee, totalINR }`:
      - buy (source INR, target foreign): `targetAmount = sourceAmount * base / (1 + buy%/100)`, `rate` = buy rate fn, `serviceFee = sourceAmount * fee%/100`, `totalINR = sourceAmount + serviceFee`.
      - sell (source foreign, target INR): `targetAmount = sourceAmount / base * (1 - sell%/100)`, `rate` = sell rate fn, `serviceFee = targetAmount * fee%/100`, `totalINR = targetAmount - serviceFee`.
      - Reject an invalid `direction` and a source/target pair that does not match the direction. Throw `Error("Amount outside allowed range")` when the INR equivalent is below `minTransactionINR` or above `maxTransactionINR` (boundaries inclusive). See Notes 1 and 3.
    - Export `isForexAmountInRange(currency, foreignAmount, currencies, forexConfig)` (mid-market INR equivalent `foreignAmount / base`, inclusive bounds, returns boolean, never throws on bad input).
    - Export `calculateForexQuoteForForeignAmount(direction, currency, foreignAmount, currencies, forexConfig)`: for buy, derive the INR source so the customer receives `foreignAmount`, for sell pass it straight through. Use `isForexAmountInRange` for the range check so a foreign amount exactly at a limit is accepted, and build the quote without a second, margin-shifted range check.
    - Add JSDoc matching the design signatures. Pure functions only, no Next/React imports.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [x] 2.2 Implement validators
    - Export `validateForexConfig(config)`: every property must be a finite number; margins in `[0, 20]` (error key `margins`); `minTransactionINR >= 1000` and `< maxTransactionINR` (error key `transactionLimits`); `serviceFeePercent >= 0` (error key `serviceFee`). Always return `{ valid, errors }` (`errors: {}` when valid) so `validateForexConfig(FOREX_CONFIG)` returns `{ valid: true, errors: {} }`.
    - Export `validateForexQuoteRequest(request, forexConfig, forexCurrencies)` returning `{ valid, errors }` with keys `direction` (not exactly `"buy"`/`"sell"`), `currency` (not in `forexCurrencies`), `amount` (not a finite number greater than 0; reject NaN, Infinity, strings). Handle a non-object `request` without throwing. No range check here (Note 3).
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Forex tests (`tests/forex.test.js`)
  - [ ]* 4.1 Write example-based unit tests
    - Create `tests/forex.test.js` using `node:test`, `node:assert/strict`, relative imports from `../lib/logic.js` and `../lib/data.js`.
    - Config: `FOREX_CURRENCIES` and `FOREX_CONFIG` values, forex entry in `SERVICES`, `"Forex"` in `QUOTE_SERVICE_OPTIONS`.
    - Rates: USD buy rate equals `base*1.025`, sell rate equals `base*0.97` (tolerance `1e-7`).
    - Quotes: `calculateForexQuote("buy","INR","USD",10000,...)` and `calculateForexQuote("sell","USD","INR",100,...)` have correct `sourceAmount`, `targetAmount`, `rate`, `serviceFee`, `totalINR`; non-zero `serviceFeePercent` case; `calculateForexQuoteForForeignAmount` for both directions.
    - Errors: `"Unsupported currency"`, `"Base currency must be INR"`, `"Amount outside allowed range"` below min and above max; boundary amounts exactly 5000 and 500000 INR are accepted.
    - Validators: `validateForexConfig(FOREX_CONFIG)`, `validateForexQuoteRequest({ direction:"buy", currency:"USD", amount:10000 }, ...)`, plus invalid examples; `isForexAmountInRange` edges.
    - _Requirements: 9.1, 9.2, 9.4, 1.1-1.9, 2.1-2.11, 7.1-7.9_

  - [ ]* 4.2 Write property test for buy rate formula and invariant
    - **Property 1: Buy Rate Formula and Invariant**
    - **Validates: Requirements 2.2, 9.P1**

  - [ ]* 4.3 Write property test for sell rate formula and invariant
    - **Property 2: Sell Rate Formula and Invariant**
    - **Validates: Requirements 2.4, 9.P2**

  - [ ]* 4.4 Write property test for positive buy-sell spread
    - **Property 3: Buy-Sell Spread is Positive**
    - **Validates: Requirements 9.P3**

  - [ ]* 4.5 Write property tests for error handling
    - **Property 4: Error Handling for Invalid Inputs** (4a unsupported currency, 4b non-INR base, 4c out-of-range amount with a source currency that matches the direction)
    - **Validates: Requirements 2.5, 2.6, 2.11**

  - [ ]* 4.6 Write property test for quote calculation correctness
    - **Property 5: Quote Calculation Correctness** (structure, `rate` matches the rate functions, `totalINR` = target +/- fee, amounts use the Note 1 formulas, amounts range-valid for each direction)
    - **Validates: Requirements 2.8, 2.9, 2.10**

  - [ ]* 4.7 Write property test for proportional quote amounts
    - **Property 6: Quote Amounts are Proportional** (doubling within range, tolerance 0.01)
    - **Validates: Requirements 9.P4**

  - [ ]* 4.8 Write property test for round-trip value loss
    - **Property 7: Round-Trip Loses Value** (buy with INR, sell back the foreign amount received, INR returned is less than INR spent)
    - **Validates: Requirements 9.P5**

  - [ ]* 4.9 Write property tests for quote request validation
    - **Property 8: Validation Logic Correctness** (8a valid passes, 8b bad direction, 8c bad currency, 8d non-positive/NaN/Infinity amount)
    - **Validates: Requirements 5.2, 5.4, 7.5, 7.6, 7.7, 7.8**

  - [ ]* 4.10 Write property tests for config validation
    - **Property 9: Config Validation Correctness** (9a valid passes, 9b bad margins, 9c bad limits including `min >= max`)
    - **Validates: Requirements 7.2, 7.3**

- [x] 5. ForexCalculator
  - [x] 5.1 Let `enquireService` carry forex details
    - Read the whole of `components/client/QuoteIntentProvider.jsx` and keep its scroll/focus/nonce behaviour unchanged.
    - Change `enquireService(quoteOption, forexDetails)` so an optional second argument `{ direction, currency, amount }` is published on the intent: `{ type: "service", value, forex?: {...}, nonce }`. Ignore `forexDetails` when it is not an object. Existing callers (`EnquireButton`) must keep working with one argument.
    - Update the header comment's consumer contract to describe the `forex` field.
    - _Requirements: 3.10, 5.1_

  - [x] 5.2 Build `ForexCalculator.jsx` and its CSS Module
    - Create `components/client/ForexCalculator.jsx` (`"use client"`) and `ForexCalculator.module.css`. Follow how `QuoteForm.jsx` / `CategoryFilter.jsx` import (`@/lib/data`, `@/lib/logic`, `useQuoteIntent` from `./QuoteIntentProvider`). Export both a named and default export, matching sibling components.
    - State: `direction` (default `"buy"`), `currency` (default `"USD"`), `amount` string. Compute the result with a 300 ms debounce (`setTimeout` cleanup in `useEffect`) using `calculateForexQuoteForForeignAmount`. Empty input shows no error and no result.
    - Direction toggle: `role="radiogroup"` with two `role="radio"` options ("Buy Foreign Currency" / "Sell Foreign Currency"), `aria-checked`, roving `tabIndex`, arrow-key navigation, labelled via `useId`. Currency: native `<select>` with `<label htmlFor>` over `FOREX_CURRENCIES`. Amount: `<input type="number" inputMode="decimal" min="0" step="0.01">` with visible label, `aria-invalid`, `aria-describedby` to the error element.
    - Validation: numeric, non-negative, in range; error text exactly "Amount must be between ₹5,000 and ₹5,00,000 equivalent" (build it from `FOREX_CONFIG` with `formatPrice` so the text stays correct if limits change, and check it renders as the required string for the defaults). Error element uses `role="alert"`.
    - Result: INR equivalent, effective rate (1 unit of foreign = INR, derived from quote amounts), service fee only when non-zero, and total payable (buy) or receivable (sell), all formatted with `formatPrice`. Wrap the result in an `aria-live="polite"` region. Show the disclaimer "Rates are indicative and subject to change. Final rates will be confirmed in your quote."
    - Button: "Get formal quote to {buy|sell} {CODE}" calls `enquireService("Forex", { direction, currency, amount })` with a parsed number (disabled or no-amount fallback: still calls `enquireService("Forex")` with no details if the amount is empty/invalid).
    - CSS: single column, full-width controls on mobile; direction toggle wraps; result font-size at least 16px; two-column layout (inputs left, results right) from the desktop breakpoint used elsewhere in the repo's CSS Modules; follow existing tokens in `app/globals.css`. Keep tab order toggle → select → input → button. Keep the selected `<option>` visible (native select; do not replace it with a custom listbox).
    - _Requirements: 3.1-3.10, 8.1-8.7, 10.1-10.5_

- [x] 6. ForexSection
  - [x] 6.1 Build `ForexSection.jsx` and its CSS Module
    - Create `components/sections/ForexSection.jsx` as a Server Component (no `"use client"`) plus `ForexSection.module.css`, modelled on `SeasonalSection.jsx` (same `Reveal` import style, `section section--alt` alternating background, `container`, `section-head`).
    - `<section id="forex-counter" aria-labelledby="forex-title">`, eyebrow "Forex Counter", H2 `Exchange Foreign Currency with <em><span className="gradient-text">Confidence</span></em>` (match how other headings style the gradient word), the exact lead paragraph from Requirement 4.4, `<ForexCalculator />` as a child, and a "Supported currencies" list from `FOREX_CURRENCIES` showing the code and `CURRENCIES[code].symbol`.
    - Pass only serialisable props across the server/client boundary (the calculator takes none). Make the currency list a responsive grid for Mobile/Tablet/Desktop/Wide.
    - Choose the `--alt` vs plain background so it alternates correctly with the neighbouring sections after insertion (check `Services` is plain and `Collections` follows).
    - _Requirements: 4.1-4.8, 10.6_

- [x] 7. Page integration and Services card
  - [x] 7.1 Render the section on the home page
    - In `app/(site)/page.js` import `ForexSection` and render `<ForexSection />` immediately after `<Services />`. Do not change data loading, `revalidate`, or other sections.
    - _Requirements: 4.1_

  - [x] 7.2 Link the forex Services card to the calculator
    - In `components/sections/Services.jsx` keep the generic card rendering, and for the card whose `id === "forex"` render a link to `#forex-counter` ("Open the forex calculator", styled like `styles.enquire`) in addition to the Enquire button. Use a plain `<a href="#forex-counter">` (or `next/link` after checking the docs in `node_modules/next/dist/docs/`).
    - Check `Services.module.css` and `Service.module.css` so the grid still reads well with 9 cards (4+4 layout comment in `Services.jsx` is stale) and `currency` glyph + teal accent render.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Quote form extension
  - [x] 8.1 Extend `quoteFormState.js`
    - Add `forexDirection: "buy"`, `forexCurrency: ""`, `forexAmount: ""` to `initialQuoteForm()` and add `"forexDirection"`, `"forexCurrency"`, `"forexAmount"` to `QUOTE_FIELD_ORDER` right after `"services"`.
    - `applyQuoteIntent`: when a `service` intent has `forex`, set the three form fields (amount as a string), also set `notes` to a line such as `Forex: buy 1000 USD` only when the existing notes are empty (do not overwrite user text), and clear forex errors. Intents without `forex` behave exactly as before.
    - `quotePayload(form)`: add `forexDetails: { direction, currency, amount: Number(amount) }` only when `services` includes `"Forex"`, and strip the three flat `forex*` keys from the payload; when Forex is not selected, no `forexDetails` key at all.
    - Keep the file DOM-free and relatively imported.
    - _Requirements: 3.10, 5.1, 5.3_

  - [x] 8.2 Add forex rules to the shared `validateQuoteForm`
    - In `lib/logic.js`, when `data.services` includes `"Forex"` validate `data.forexDetails` with `validateForexQuoteRequest(..., FOREX_CONFIG, FOREX_CURRENCIES)` plus `isForexAmountInRange`. Report errors under `forexDirection`, `forexCurrency`, `forexAmount` (amount messages: "Enter a valid amount" and the range message from task 5.2). Missing/non-object `forexDetails` is an error on all three keys. Do nothing when Forex is not selected.
    - Respect the existing `mode` option (`"submit"` vs `"whatsapp"`): follow how other required fields are treated in whatsapp mode.
    - Only import `FOREX_CONFIG` / `FOREX_CURRENCIES` the same way `logic.js` already imports from `data.js`.
    - _Requirements: 5.2, 5.4_

  - [x] 8.3 Add forex fields to `QuoteForm.jsx`
    - Read `QuoteForm.jsx` and `QuoteForm.module.css` fully first. When `form.services.includes("Forex")`, render (inside the existing layout and field-error pattern, including `aria-invalid`, `aria-describedby`, error ids, and focus-first-invalid via `firstInvalidField`) a direction radiogroup (Buy/Sell), a Currency `<select>` over `FOREX_CURRENCIES` showing symbols, and an Amount `<input type="number" inputMode="decimal">` labelled with the chosen currency.
    - Show the Forex service tile with the same icon/teal accent as the Services card if the form renders tiles via `ServiceGlyph` and `SERVICES`.
    - Make sure the submit path sends `quotePayload(form)` (so `forexDetails` goes to `/api/quote`), and that `quoteOutcome` 400 errors for `forex*` keys appear on the right fields (extend any key-to-field mapping if one exists).
    - Add the matching styles to `QuoteForm.module.css`; single column on mobile.
    - _Requirements: 5.1, 5.2, 5.3, 6.5_

  - [ ]* 8.4 Write tests for form state and shared validation
    - `tests/quote-form-state.test.js`: update the initial form / field-order expectations; add cases for forex intent (fields set, notes only when empty, errors cleared), `quotePayload` with and without Forex.
    - `tests/logic.validators.test.js`: add `validateQuoteForm` cases for Forex selected with valid details, missing details, bad direction/currency, zero/negative/NaN amount, below-min and above-max amounts, and Forex not selected.
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Quote API extension
  - [x] 9.1 Validate and persist forex details in the handler core
    - In `lib/server/quote.js`: add `forexDetails` to `pickQuoteFields` (default `undefined`, copied as-is so the validator can reject wrong types), add a server type check (when present it must be a plain object; non-Forex requests drop it), let `validateQuoteForm` do the forex validation (task 8.2) so a bad request returns `400 { ok:false, error:"validation", errors }`, and make `toLeadRow` add `forex_details` as `{ direction, currency, amount }` (only those three keys, taken from validated data) when Forex is selected and `null` otherwise.
    - Do not edit `app/api/quote/route.js` unless the Next.js docs in `node_modules/next/dist/docs/` require it; it only wires `handleQuote`.
    - Check `lib/supabase/db.js` `insertRow` passes arbitrary row keys straight to Supabase so `forex_details` is stored as JSONB without further changes (adjust only if it whitelists columns).
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 9.2 Update and extend the server quote tests
    - `tests/server.quote.test.js`: update the exact key list assertion for the stored row to include `forex_details` (null for non-forex).
    - Add cases: valid forex buy/sell request stores `forex_details` with the three keys; invalid direction, unsupported currency, out-of-range amount, non-numeric amount and missing `forexDetails` each return 400 with the matching `errors` key and store nothing; extra keys inside `forexDetails` are dropped; `forexDetails` sent without the Forex service is ignored and stored as null.
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 10. Database migration
  - [x] 10.1 Add the `forex_details` column
    - Create `supabase/migrations/0002_forex_details.sql`, idempotent like `0001_init.sql`: `alter table public.leads add column if not exists forex_details jsonb;` with a comment on the column. Optionally add a check that the value is null or a JSON object (`jsonb_typeof(forex_details) = 'object'`).
    - Do not touch RLS or grants: `0001_init.sql` already grants table-level `select` to authenticated admins and no insert policy exists (inserts use the service role). Do not add an index (no query filters on it).
    - Note in the file header that the migration must be applied to the Supabase project before deploying the API change.
    - _Requirements: 5.5_

- [x] 11. Admin leads display
  - [x] 11.1 Select the new column
    - In `app/admin/(protected)/page.js` add `forex_details` to `LEAD_COLUMNS`. No other change.
    - _Requirements: 5.6_

  - [x] 11.2 Show the Forex badge and details in `LeadsTable.jsx`
    - In the Services cell render each service as a small badge; the `Forex` badge gets a distinct class (`badgeForex`). Keep the plain-text fallback "—" for no services.
    - Under the badges render `Forex: Buy|Sell {amount} {CODE}` from `lead.forex_details` (tolerate null, missing keys, non-numeric amount, and unknown direction without throwing); format the amount with `formatPrice(amount, currency)` when the currency is in `CURRENCIES`, otherwise show the raw number.
    - Add `.badge`, `.badgeForex`, `.forexDetails` to `LeadsTable.module.css`. Keep `LeadsTable` a Server Component and keep the existing mobile `data-label` pattern.
    - _Requirements: 5.6_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Run `npm test`, `npm run lint` and `npm run build`; ensure all pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1", "10.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["4.1", "5.2", "8.1", "8.2", "11.1"] },
    { "id": 4, "tasks": ["4.2", "6.1", "8.3", "9.1", "11.2"] },
    { "id": 5, "tasks": ["4.3", "7.1", "7.2", "8.4", "9.2"] },
    { "id": 6, "tasks": ["4.4"] },
    { "id": 7, "tasks": ["4.5"] },
    { "id": 8, "tasks": ["4.6"] },
    { "id": 9, "tasks": ["4.7"] },
    { "id": 10, "tasks": ["4.8"] },
    { "id": 11, "tasks": ["4.9"] },
    { "id": 12, "tasks": ["4.10"] }
  ]
}
```
