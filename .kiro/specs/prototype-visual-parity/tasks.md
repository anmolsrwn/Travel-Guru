# Implementation Plan: prototype-visual-parity

## Overview

Restyle the whole site (public page, overlays, admin) to the prototype's gold-on-navy look with Playfair Display headings. The change is visual only and almost entirely CSS (JavaScript, Next.js App Router, CSS Modules). Work follows the Implementation Order in `design.md`: tokens and fonts, shared UI modules, sections, client overlays, admin, the `Reviews.jsx` exception (PE1), documentation notes, then tests and final verification.

Rules that apply to every task:

- No edits to `prototype/index.html`, `lib/**` or `app/api/**` (Req 18.1, 18.2).
- No `.js` or `.jsx` change except `app/layout.js` (PE2) and `components/sections/Reviews.jsx` (PE1).
- Modules use `var(--token)` only. No palette hex literals, no Legacy_Tokens (Req 2.1 to 2.3).
- Overrides of shared-module rules use doubled or element-qualified selectors (DD3).
- Every module that declares a keyframe animation or hover transform also neutralises it under `prefers-reduced-motion: reduce` (Req 17.5).
- Read the Next.js font guide in `node_modules/next/dist/docs/` before editing `app/layout.js` (see `AGENTS.md`).

## Tasks

- [x] 1. Tokens and fonts
  - [x] 1.1 Replace the token layer and global rules in `app/globals.css`
    - Replace `:root` with the Gold_Palette catalogue from the design (canvas, glass, hairline, gold alpha tokens, status, text incl. `--text-lo: #8a93ab` and `--on-cta`, `--shadow-card`, `--shadow-gold`, `--focus-ring`)
    - Remap all eight `--svc-*` tokens to `#d4af37`; keep their names
    - Remove every Legacy_Token (`--brand-*`, `--cta-grad`, `--blue-grad`, `--shadow-brand`)
    - Add `--font-heading-stack` and `--font-body-stack`
    - Update global rules: headings (weight 600, line-height 1.15), `.display`, `.eyebrow` (gold-2 and 32px x 1px hairline), `.section-head` (56px bottom margin, 620px centred lead), `.gradient-text` and `.price` (gold gradient with solid gold-2 fallback, italic accent in `h1/h2/h3`), `a`, `::selection`, `.glass` transition
    - Keep the `body.no-scroll` print rules and the global reduced-motion rule untouched
    - Rewrite the header comment to list Gold_Palette tokens, Heading_Font, Body_Font and no Legacy_Tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.4, 3.4, 3.5, 3.6, 3.7, 5.4, 6.1, 6.2, 6.3, 6.4, 16.1, 17.4, 17.5, 17.6_

  - [x] 1.2 Swap fonts and override `themeColor` in `app/layout.js`
    - Replace Poppins with `Playfair_Display({ subsets: ["latin"], style: ["normal","italic"], display: "swap", variable: "--font-heading" })` (variable font, no `weight`)
    - Keep `Plus_Jakarta_Sans` with weights 400, 500, 600, 700 and `--font-body`
    - Export `viewport = { ...buildViewport(), themeColor: "#070b14" }`; leave `lib/seo.js` untouched
    - Keep `<html className={`${playfair.variable} ${jakarta.variable}`}>`
    - Fallback if the build rejects the variable form: `weight: ["400","600","700"]` with the same `style` array
    - _Requirements: 1.8, 3.1, 3.2, 3.3, 18.2_

- [x] 2. Shared UI modules (`components/ui/*.module.css`)
  - [x] 2.1 Restyle `Button`, `Card` and `Badge`
    - `Button`: gold-gradient primary (200% size, `--on-cta` text, hover lift 2px + `--shadow-gold` + position shift), gold outline secondary (hover `--gold-a10`), WhatsApp keeps `--on-cta` text with 2px lift on hover (OI-1), gold-2 focus outline (3px offset on buttons)
    - `Card`: no resting shadow, 300ms transition on transform, border-color and box-shadow, interactive hover lift 6px with `--glass-border-hi` and `--shadow-card`, solid `--bg-1` fallback without backdrop-filter, keep the reduced-motion block
    - `Badge`: `.brand` becomes the gold chip (remove gradient text and mask), `.emerald` and `.neutral` per design, `.75rem`
    - Use doubled selectors for overrides (DD3)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 17.5, 17.7_

  - [x] 2.2 Restyle `Segmented`, `Field`, `Stepper` and `CategoryFilter`
    - `Segmented` and `CategoryFilter`: `--bg-2` track, `rgba(255,255,255,.06)` border, 4px padding, checked segment `--gold-grad` with `--bg-0` text, hover text `--text-hi`, single-line horizontal scroll below 640px, 40px+ touch height
    - `Field`: `--bg-2` fill, `--hairline` border, 8px radius, 48px min height, gold chevron, `.required` gold-2, focus border gold-2 + `0 0 0 2px var(--gold-a35)` ring with transparent outline for forced-colors, error border and message in `--danger` at `.75rem`, font size stays `1rem` (DD5)
    - `Stepper`: gold-2 border, gold-1 text, hover `--gold-a10`, gold focus outline
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 11.6, 11.7, 11.8, 14.3, 4.6_

  - [x] 2.3 Restyle `Service`, `Accordion` and `DataTable`
    - `Service`: 52px rounded-square icon (radius 14px, `--gold-a10` fill, `--gold-a30` border, `--gold-1` glyph); accent classes set `--svc-accent` only (DD8, DD9); checkbox tile with 16px square mark, checked state (gold-2 border, `--gold-a10` fill, gold-grad mark with `--bg-0` tick), hover and focus per design
    - `Accordion`: heading stack `1.1875rem`, weight 400, `22px 0` padding, gold-2 icon rotating 45deg over 300ms, remove `.list` top border, hover gold-1
    - `DataTable`: `th` gold-2 `.75rem` uppercase `.1em`, `td.num` gold-1 700, separators `--glass-border`, body `--text-md`, active row `--gold-a08`
    - _Requirements: 2.4, 2.5, 8.1, 11.4, 11.5, 12.3, 12.4, 14.2_

- [~] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Section modules (`components/sections/*.module.css`)
  - [x] 4.1 Restyle `Hero`, `TrustStrip` and `Services`
    - `Hero`: 90-degree overlay plus bottom fade (raised stops below 1024px, DD4), Ken Burns `scale(1)` to `scale(1.12)` over 20s alternate, title `max-width: 780px`, copy `max-width: 560px`, gold badge (remove mask pseudo-element) with 6s shimmer, gold stars, emerald ticks, full-width stacked buttons below 640px, reduced-motion `animation: none`
    - `TrustStrip`: gold-2 star, four columns, two columns below 640px (numeral and caption styling not possible, OI-2)
    - `Services`: card padding `32px 28px`, subtitle gold-2, emerald check bullets, enquire link gold-1 with gold-2 hover, grid 1 / 2 / 4 columns
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 8.1, 8.2, 8.3, 8.4, 8.5, 17.5_

  - [x] 4.2 Restyle `Collections`, `Destinations` and `HowItWorks`
    - `Collections` and `Destinations`: `.media` navy gradient, gold-2 meta line, 28px grid gap from 1024px, image zoom `scale(1.05)` over 600ms (reduced-motion `none`), `.empty a` gold-1, three / two / one column grid
    - `HowItWorks`: four columns from 640px, `.steps::before` horizontal line (left/right 12%, transparent to gold-2 to transparent), 56px gold-grad number circle with 8px `--bg-0` ring in heading stack, remove per-step connectors, one centred column and no line below 640px
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 17.5_

  - [x] 4.3 Restyle `QuoteSection` and `QuoteForm`
    - `QuoteSection`: 5fr / 7fr two-column layout with 48px gap from 1024px, emerald check-circle perks, gold-1 links, `p.guarantee` gold box with shimmer (doubled selector, DD3, reduced-motion `animation: none`)
    - `QuoteForm`: Glass_Card form with 24px radius, padding 24px then 36px from 640px, step label uppercase `.75rem` `.18em` weight 700 gold-2, `.or` and `.privacy` per design, one-column fields below 640px, gold focus outlines
    - _Requirements: 7.7, 11.1, 11.2, 11.3, 11.9, 11.10, 17.5_

  - [x] 4.4 Restyle `Reviews`, `Faq` and `FinalCta`
    - `Reviews` (CSS only): 32px card padding, italic heading-stack quote `1.0625rem` in `--text-hi`, `.figure::before` gold quote mark drawn with `content: "\201C" / ""`, 44px gold-grad avatar with `--bg-0` initials, gold-2 stars
    - `Faq` (fallback `<details>`): no top border, heading-stack summary `1.1875rem`, gold-2 plus rotating 45deg over 300ms, gold-1 links
    - `FinalCta`: remove hairline pseudo-elements, band with `--gold-a35` block borders and radial gold glow, title `max-width: 700px`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 4.5 Restyle `Footer`, `Expert` and `Terms`
    - `Footer`: grid `2fr 1fr 1fr 1.4fr` from 1024px, two columns 640 to 1023px, one below; gold-2 uppercase `.75rem` `.2em` column titles in body font; gold-1 link hover; bottom bar with `--glass-border` top border and `--text-lo` text; gold-2 rating star; remove top border
    - `Expert`: gold-a30 border, `0 0 0 6px var(--gold-a08)` halo, gold radial, gold-2 role
    - `Terms`: hover border gold-2 and text gold-1, gold focus outline
    - _Requirements: 12.6, 12.7, 12.8, 12.9, 14.3_

- [x] 5. Client overlays and floating controls (`components/client/*.module.css`)
  - [x] 5.1 Restyle `Modal`
    - Backdrop `rgba(7,11,20,.75)` with 6px blur, dialog `--bg-1`, `--glass-border`, 24px radius, 36px padding, `.md` 760px, `.lg` 860px (DD6)
    - Close button 36px circle with `--glass-border`, gold-2 hover and focus, keep `--bg-2` fill
    - Below 640px: bottom sheet (`align-items: flex-end`, `max-height: 92dvh`, top corners 24px, safe-area padding, `sheetIn/sheetOut`)
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 17.5, 17.6_

  - [x] 5.2 Restyle `ItineraryModal`
    - Timeline: per-day `::after` line `1px` in `--gold-a40`, 11px gold-grad dot with `0 0 0 4px var(--bg-1)` ring (centre x 10.5), day label gold-2 `.75rem` uppercase `.12em`, day title heading stack `1.0625rem` weight 600
    - Hotel list and tier table use token colours only; `.priceLine .price` gets the gold gradient from the global rule
    - Replace `var(--font-heading), sans-serif` with `var(--font-heading-stack)`; remove all Legacy_Token and retired literal references
    - _Requirements: 14.1, 14.2, 14.5, 3.4, 2.2_

  - [x] 5.3 Restyle `CheckoutModal`
    - `.tab` becomes the Segmented gold-grad checked state with `--bg-0` text
    - `.summary` and `.amounts` equivalents: `--glass` fill, `--glass-border`, `--r-md`, 20px padding; `.advance` gold-grad heading text `1.25rem` weight 700
    - `.inlineLink`, `.termsLink` gold-1, checkbox `accent-color` gold-2, `.demo` fill `--gold-a08`, gold-2 section labels
    - _Requirements: 13.10, 14.3, 14.4, 14.5_

  - [x] 5.4 Restyle `TicketModal` and `VoucherModal`
    - `.ticketBox` and `.refBox`: dashed `--gold-2` border, `--gold-a06` fill, monospace gold-grad id text; `.status` pill gold-2; `.advance` and `.link` gold-1; success icon keeps emerald on `rgba(16,185,129,.15)`
    - `VoucherModal` print block: `.voucher, .voucher *` reset `-webkit-text-fill-color: #000 !important; background-image: none !important;`
    - _Requirements: 13.8, 13.9, 13.10, 14.4, 14.5, 17.6_

  - [x] 5.5 Restyle `Header`, `FloatingWhatsApp` and `MobileStickyBar`
    - `Header`: 72px fixed transparent bar, scrolled fill `rgba(7,11,20,.9)` with 12px blur and `--glass-border` bottom border, brand in heading stack weight 600 (`1.25rem` / `.12em` from 1024px), tagline `--text-lo` uppercase `.6875rem` `.2em`, link hover gold-1, mobile scrim `rgba(7,11,20,.6)`
    - `FloatingWhatsApp`: 60px `--whatsapp` circle, 2s pulse ring (`scale(1)` to `scale(1.6)`), `--bg-1` tooltip with `--glass-border` revealed with a 250ms translate, hidden below 640px, gold-2 focus ring, reduced-motion `animation: none`
    - `MobileStickyBar`: fill `rgba(7,11,20,.95)`, 10px gap, `--glass-border` top border, two-column buttons, keep `--sticky-bar-h` rule
    - _Requirements: 7.1, 7.2, 7.3, 13.1, 13.2, 13.3, 17.5_

  - [x] 5.6 Restyle `TermsTabs`, `LogoImage`, `SafeImage` and check `CurrencyProvider`
    - `TermsTabs`: selected tab gold-grad fill with `--bg-0` text, gold focus outline on panel
    - `LogoImage`: `2px solid var(--gold-2)` ring, inner `inset 0 0 0 1px var(--gold-1)`, gold-grad initials in `var(--font-heading-stack)` weight 600
    - `SafeImage`: fallback radials `rgba(212,175,55,.18)` and `rgba(252,229,156,.10)`
    - `CurrencyProvider.module.css`: confirm it has no legacy references; it follows the Segmented styling
    - _Requirements: 14.3, 9.1, 9.2, 2.2, 2.3_

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Admin styling and legacy sweep
  - [x] 7.1 Restyle admin modules (`components/admin/*.module.css`)
    - `AdminShell`, `LoginForm`, `LeadsTable`, `PackageForm`, `StatusSelect`: `.link` colours to `--gold-1`, `accent-color` to `--gold-2`, focus outlines gold-2, `font-family` to `var(--font-heading-stack)` or `var(--font-body-stack)`, weights 700 to 600
    - No JSX or JS change; every route, field name, Server Action and column stays as is
    - _Requirements: 15.1, 15.2, 15.3, 2.2, 2.3_

  - [x] 7.2 Sweep for remaining legacy references
    - Search `app/globals.css` and `components/**/*.module.css` for Legacy_Tokens, `#2410b5`, `#1e6fe0`, `#29a9f5`, `#f7931e`, `#f26522`, their `rgb()`/`rgba()` forms, `Poppins`, and `var(--font-heading), sans-serif`; fix every hit with a Gold_Palette token
    - Confirm every fallback-less `var(--name)` resolves to a `:root` or same-file declaration
    - _Requirements: 2.1, 2.2, 2.3, 3.3, 18.7_

- [x] 8. Permitted exception PE1
  - [x] 8.1 Remove literal curly quotes from the review paragraph in `components/sections/Reviews.jsx`
    - Remove only the quote characters inside the `<p>`; the review words, markup structure and props stay unchanged
    - Confirm the CSS-drawn gold quote mark from task 4.4 renders instead
    - If PE1 is rejected, leave `Reviews.jsx` untouched and drop the decorative mark in `Reviews.module.css`
    - _Requirements: 12.1, 12.10, 18.3_

- [x] 9. Documentation notes
  - [x] 9.1 Add "Superseded by prototype-visual-parity" notes to `.kiro/specs/travel-agency-website/design.md`
    - Add a note above `### 3.1 Style direction`, `### 3.2 Color tokens` and `### 3.3 Typography` that points to Decision D1 in `.kiro/specs/prototype-visual-parity/requirements.md`
    - Add the same pointer to the intro line (about line 144) that describes the retired theme
    - Keep the original text of all three sections below the notes
    - _Requirements: 16.2, 16.3_

- [x] 10. Tests (node:test + fast-check 4.10.2)
  - [x] 10.1 Create `tests/css-helpers.js`
    - Export `listCssFiles()`, `readRootTokens()`, `varRefs(css)`, `stripComments(css)`, colour parsing, `channel`, `luminance`, `contrast`, `over`, `lerp` (gamma-encoded blending, as in the design sketch)
    - Support module for the property tests below; it is not optional because several test files import it
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 18.7_

  - [ ]* 10.2 Write property test for palette and service tokens in `tests/visual-parity.tokens.test.js`
    - **Property 1: Palette and service tokens match the specification**
    - Enumerate every Gold_Palette token in `:root` against its specified value and every `SERVICES` accent token against the Gold_Palette
    - Tag: `Feature: prototype-visual-parity, Property 1`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.4**

  - [ ]* 10.3 Write property test for the retired theme in `tests/visual-parity.tokens.test.js`
    - **Property 2: The retired theme does not appear anywhere**
    - Scan `app/globals.css` and `components/**/*.module.css` for Legacy_Tokens, retired colour literals (any case, hex and `rgb()/rgba()`), `Poppins`; check every `font-family` uses only the heading, body or monospace stack
    - Detector self-check with fast-check: append a retired literal in random letter case to a clean stylesheet, assert it is flagged (at least 100 runs)
    - **Validates: Requirements 2.1, 2.2, 2.3, 3.3, 3.6, 14.5, 15.1**

  - [ ]* 10.4 Write property test for custom property resolution in `tests/visual-parity.tokens.test.js`
    - **Property 3: Every custom property reference resolves**
    - Every fallback-less `var(--name)` is declared in `:root` or in the same stylesheet
    - **Validates: Requirements 18.7**

  - [ ]* 10.5 Write property test for contrast thresholds in `tests/visual-parity.a11y.test.js`
    - **Property 4: Text, focus and composite colours meet contrast thresholds**
    - Enumerate the pair table (text tokens on three surfaces, chip and tile composites via `over`, `--bg-0` on `--whatsapp`; focus pairs at 3.0)
    - **Validates: Requirements 1.6, 4.5, 4.6, 4.7, 11.5, 17.1, 17.2, 17.4**

  - [ ]* 10.6 Write property test for the gold gradient in `tests/visual-parity.a11y.test.js`
    - **Property 5: Dark text on the gold gradient, and gradient text on the canvases, stay readable at every point**
    - fast-check over `t` in `[0, 1]` (at least 100 runs): `--bg-0` on `c(t)` and `c(t)` on each surface are at least 4.5
    - **Validates: Requirements 9.2, 17.2, 17.3**

  - [ ]* 10.7 Write property test for Reduced_Motion in `tests/visual-parity.a11y.test.js`
    - **Property 6: Motion is neutralised under Reduced_Motion**
    - For each module that declares `animation` or a hover/focus `transform`, assert a `@media (prefers-reduced-motion: reduce)` block neutralises it, or the global rule covers it
    - **Validates: Requirements 5.4, 7.4, 7.7, 9.6, 13.1, 17.5**

  - [ ]* 10.8 Write property test for printing in `tests/visual-parity.a11y.test.js`
    - **Property 7: Gradient text survives printing**
    - Gradient-text rules in `VoucherModal.module.css` have a print reset for `.voucher` and descendants; the `body.no-scroll` print rules in `app/globals.css` are unchanged
    - **Validates: Requirements 17.6**

  - [ ]* 10.9 Write property test for the contrast helpers in `tests/visual-parity.a11y.test.js`
    - **Property 8: Contrast helpers obey the WCAG laws**
    - fast-check (at least 100 runs): `contrast` is symmetric, equals 1 for equal colours, stays within `[1, 21]`; `over(c, 0, s) = s` and `over(c, 1, s) = c`
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4**

  - [ ]* 10.10 Write rule-level example tests in `tests/visual-parity.rules.test.js`
    - Table-driven checks: eyebrow hairline and colour, section-head spacing, Ken Burns keyframe end `1.12`, modal padding 36px and close size 36px, mobile sheet `max-height: 92dvh`, step line `left/right: 12%`, footer grid template, FAB tooltip fill, `layout.js` loads Playfair and Jakarta and not Poppins, `themeColor` override `#070b14`
    - Leave `tests/data.services.test.js` and `tests/seo.basic.test.js` unchanged
    - _Requirements: 1.8, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 7.4, 10.2, 12.6, 13.2, 13.5, 13.6, 13.7_

- [~] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Final verification
  - [x] 12.1 Run the Verification_Suite
    - Run `npm test` (single execution, `node --test`), `npm run lint` and `next build` (needs network access to Google Fonts at build time); fix any failure
    - Confirm the build reports no undefined custom property in any CSS Module
    - _Requirements: 18.5, 18.6, 18.7_

  - [x] 12.2 Diff check for frozen files
    - Run `git diff --stat -- prototype/index.html lib app/api` and confirm it is empty
    - Run `git diff --name-only -- "*.js" "*.jsx"` and confirm only `app/layout.js` and `components/sections/Reviews.jsx` appear (plus new files under `tests/`)
    - _Requirements: 18.1, 18.2, 18.3_

  - [~] 12.3 Manual visual pass at 375, 768 and 1280px
    - Needs a human to look at the running site (start `npm run dev` manually); the agent prepares the checklist and records results
    - Check: header over hero, hero overlay legibility on mobile (DD4), trust strip, services grid, collections and filters, how-it-works line at 640 to 1023px, quote form focus and error states, reviews, FAQ, CTA band, footer, modals (desktop dialog and mobile bottom sheet), itinerary timeline, voucher print preview, admin login and tables
    - Confirm the prototype's "Design prototype · not final" note and sample content do not appear
    - _Requirements: 7.5, 7.10, 8.3, 8.4, 8.5, 10.2, 10.3, 13.6, 17.6, 18.4_

## Notes

- Tasks marked with `*` are optional property and example tests and can be skipped for a faster MVP. `tests/css-helpers.js` (10.1) is not optional.
- Properties 1, 2, 3, 4, 6 and 7 enumerate a finite set; Properties 5 and 8 and the Property 2 detector self-check use generated inputs.
- Task 12.3 is a manual check that the design's Testing Strategy requires. It cannot be fully automated.
- Each task lists the requirements it covers; checkpoints validate incrementally.
- Open decisions that affect tasks: PE1 (task 8.1) and design recommendations D4, OI-2 (reword Req 7.9) in `design.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "10.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 4, "tasks": ["7.1", "8.1", "9.1"] },
    { "id": 5, "tasks": ["7.2"] },
    { "id": 6, "tasks": ["10.2", "10.5", "10.10"] },
    { "id": 7, "tasks": ["10.3", "10.6"] },
    { "id": 8, "tasks": ["10.4", "10.7"] },
    { "id": 9, "tasks": ["10.8"] },
    { "id": 10, "tasks": ["10.9"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3"] }
  ]
}
```
