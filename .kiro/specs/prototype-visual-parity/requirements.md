# Requirements Document

## Introduction

The Travel Guru Raipur site currently uses the logo-based theme: blue, orange and indigo accents on an indigo canvas with Poppins headings. The design reference `prototype/index.html` uses a different look: a gold palette on a navy canvas with Playfair Display serif headings. The site owner judged the prototype to look better in every aspect and asked for a full visual match.

This feature restyles the whole Next.js site (public page, overlays and admin area) so that it matches the prototype's visual design. The change is visual only. Section order, copy, content, features, data, API routes and the pure logic in `lib/` stay as they are today. The only markup and configuration changes allowed are the Permitted_Exceptions listed after the Out of Scope list.

### Decision Record

**Decision D1 (deliberate reversal):** The approved brand revision in `.kiro/specs/travel-agency-website/design.md` sections 3.1 (style direction), 3.2 (color tokens) and 3.3 (typography) is superseded for the visual layer. The site returns to the prototype's gold palette and serif heading font, and the blue, orange and indigo logo-based theme and Poppins are retired. The site owner approved this reversal explicitly. Requirement 1 captures the token values; Requirement 16 captures the documentation update.

**Decision D2 (service accent tokens):** The `--svc-*` token names stay defined because `lib/data.js` references them by name and `tests/data.services.test.js` asserts those names. The values are remapped to the gold treatment, so no multi-colour service icons remain.

**Decision D3 (service count):** The prototype shows 7 services in a 4+3 centered layout. The current site has 8 services, and the content stays as is, so the grid shows 8 services in a 4+4 layout on desktop.

**Decision D4 (`--text-lo` value):** `--text-lo` stays `#8a93ab`. The prototype's `#7a849c` has a contrast ratio of 4.47:1 on `--bg-2` and fails the 4.5:1 minimum of Requirement 17.1. `#8a93ab` measures 6.41:1 on `--bg-0`, 5.99:1 on `--bg-1` and 5.46:1 on `--bg-2`. Requirement 1.4 does not list `--text-lo`, so the decision does not conflict with it. Requirement 1.7 captures the value.

**Decision D5 (WhatsApp button text colour):** Requirement 4.5 originally asked for white text on the `--whatsapp` fill, which measures 1.98:1 and conflicts with Requirement 17.1. WhatsApp buttons keep the dark `--on-cta` text colour on the `--whatsapp` fill, which measures 9.92:1. Requirement 4.5 and Requirement 17.7 capture the decision. The floating WhatsApp control keeps its existing icon-only white glyph.

**Decision D6 (trust strip numerals):** The `TrustStrip` component renders each item as free text (for example "8 Services, 1 Expert") with no separate numeral element, and Requirement 18.3 forbids copy and markup changes. The Heading_Font and Gold_Gradient numeral styling therefore applies only where a trust strip item exposes a numeral as a separate element. The strip itself still receives the `--bg-1` fill, the borders, the four-column grid and the gold stars. Requirement 7.9 and Requirement 7.11 capture the decision.

**Decision D7 (review quote mark exception):** `components/sections/Reviews.jsx` currently prints literal curly quotes inside the review paragraph, which would double the decorative gold quote mark that the prototype draws. Permitted_Exception PE1 removes the literal curly quotes from that paragraph, and the stylesheet draws the gold quote mark with generated content. The review words stay unchanged. Requirement 12.1 and Requirement 12.10 capture the decision.

**Decision D8 (service icon shape):** The prototype draws the service icon as a 52px rounded square with a 14px radius, not as a circle. Visual parity with the prototype takes precedence over the word "circle" in the original Requirement 2.5. The colours stay as Requirement 2.5 specifies. Requirement 2.5 and Requirement 8.1 capture the decision.

**Decision D9 (theme colour override):** `lib/seo.js` is frozen (Requirement 18.2) and exports the theme colour `#070a1a`, which an existing test asserts. `app/layout.js` overrides the viewport `themeColor` with `#070b14` so that it matches `--bg-0`. Permitted_Exception PE2 and Requirement 1.8 capture the decision.

**Decision D10 (Playfair loading):** Playfair Display loads as a variable font with normal and italic styles. The variable font covers weights 400, 600 and 700 and italic 600 with two font files instead of six static files. Requirement 3.1 captures the decision.

### Out of Scope

- Changes to `prototype/index.html`.
- Booking checkout logic, quote engine, currency switcher logic, itinerary data, admin CMS behaviour, Supabase schema and data, API routes, and every file in `lib/`.
- Section order, copy, links and content, except for the Permitted_Exceptions.
- The prototype's "Design prototype · not final" note and its placeholder sample content (for example "Sample Couple", "Sample Family", the example phone error text, sample package data).
- Replacing the logo image asset `public/assets/logo.png`.
- Edits to `lib/seo.js`, including its `THEME_COLOR` constant.

### Permitted Exceptions

The following changes sit outside the visual-only rule and are allowed:

- **PE1:** In `components/sections/Reviews.jsx`, the literal curly quote characters are removed from the review paragraph so that the stylesheet can draw the gold quote mark. The review words stay unchanged (Decision D7).
- **PE2:** In `app/layout.js`, the heading font changes from Poppins to Playfair Display (Decision D10), and the exported `viewport` overrides `themeColor` with `#070b14` (Decision D9).

## Glossary

- **Site**: The Travel Guru Raipur Next.js application (public page, overlays and admin area).
- **Prototype**: The single-file design reference `prototype/index.html`. It is read-only for this feature.
- **Design_System**: The global stylesheet `app/globals.css` plus the font setup in `app/layout.js`.
- **Component_Styles**: The per-component CSS Modules under `components/**/*.module.css`, including admin modules.
- **Gold_Palette**: The prototype colour tokens: `--bg-0 #070b14`, `--bg-1 #0d1424`, `--bg-2 #141d33`, `--gold-1 #fce59c`, `--gold-2 #d4af37`, glass border `rgba(252,229,156,.14)` and `--shadow-gold`.
- **Gold_Gradient**: `linear-gradient(135deg, #fce59c 0%, #d4af37 100%)`.
- **Heading_Font**: Playfair Display, the serif font used for headings, prices, numerals and review quotes.
- **Body_Font**: Plus Jakarta Sans, the sans-serif font used for body text, forms and buttons.
- **Glass_Card**: A surface with a translucent fill, a gold-tinted 1px border, 16px radius and a backdrop blur, with a solid `--bg-1` fallback when backdrop-filter is unsupported.
- **Gold_Button**: The primary button: pill shape, Gold_Gradient fill, `--bg-0` text.
- **Outline_Button**: The secondary button: pill shape, transparent fill, 1px `--gold-2` border, `--gold-1` text.
- **Segmented_Control**: A pill group used for category filters and the currency switcher.
- **Legacy_Tokens**: The tokens `--brand-indigo`, `--brand-blue`, `--brand-sky`, `--brand-orange`, `--brand-orange-deep`, `--brand-grad`, `--cta-grad`, `--blue-grad` and `--shadow-brand`.
- **Service_Tokens**: The tokens `--svc-blue`, `--svc-orange`, `--svc-purple`, `--svc-red`, `--svc-green`, `--svc-teal`, `--svc-violet` and `--svc-pink`.
- **Verification_Suite**: The commands `npm test`, `npm run lint` and `next build`.
- **Reduced_Motion**: The `prefers-reduced-motion: reduce` user preference.
- **On_CTA_Color**: The token `--on-cta`, the dark text colour used on Gold_Gradient and `--whatsapp` fills. Its value equals `--bg-0`.
- **Permitted_Exceptions**: The two changes PE1 and PE2 listed in the Permitted Exceptions section of this document.
- **Service_Icon**: The 52px rounded-square icon container in each service card.
- **Trust_Strip**: The strip of trust items rendered by `TrustStrip.jsx` below the hero.

## Requirements

### Requirement 1: Gold palette tokens

**User Story:** As a visitor, I want the site to use the prototype's gold-on-navy palette, so that the live site looks like the approved prototype.

#### Acceptance Criteria

1. THE Design_System SHALL define `--bg-0` as `#070b14`, `--bg-1` as `#0d1424` and `--bg-2` as `#141d33`.
2. THE Design_System SHALL define `--gold-1` as `#fce59c`, `--gold-2` as `#d4af37` and `--gold-grad` as the Gold_Gradient.
3. THE Design_System SHALL define `--glass-border` as `rgba(252,229,156,.14)` and `--shadow-gold` as `0 8px 28px -8px rgba(212,175,55,.45)`.
4. THE Design_System SHALL keep `--emerald`, `--whatsapp`, `--danger`, `--text-hi` and `--text-md` at the values the Prototype defines.
5. THE Design_System SHALL set the focus ring colour to `--gold-2`.
6. THE Design_System SHALL set the text selection background to a translucent gold tint.
7. THE Design_System SHALL define `--text-lo` as `#8a93ab` and `--on-cta` as `#070b14`.
8. THE Design_System SHALL override the viewport `themeColor` in `app/layout.js` with `#070b14` and leave `lib/seo.js` unchanged.

### Requirement 2: Retired legacy theme

**User Story:** As a site owner, I want the blue, orange and indigo theme fully retired, so that no old brand colours remain next to the gold look.

#### Acceptance Criteria

1. THE Design_System SHALL NOT define any of the Legacy_Tokens.
2. THE Component_Styles SHALL NOT reference any of the Legacy_Tokens.
3. THE Component_Styles SHALL NOT contain the literal colour values `#2410b5`, `#1e6fe0`, `#29a9f5`, `#f7931e` or `#f26522`.
4. THE Design_System SHALL keep every Service_Token defined, with each value set to a gold-treatment colour from the Gold_Palette.
5. WHEN the Services section renders a Service_Icon, THE Site SHALL render the Service_Icon as a 52px square with a 14px border radius, fill the Service_Icon with `rgba(212,175,55,.1)`, give the Service_Icon a 1px `rgba(212,175,55,.3)` border, and render the glyph in `--gold-1`.

### Requirement 3: Typography

**User Story:** As a visitor, I want serif headings with a clean sans body, so that the typography matches the prototype.

#### Acceptance Criteria

1. THE Design_System SHALL load Playfair Display as a variable font in normal and italic styles, covering weights 400, 600 and 700 and italic 600, as the Heading_Font through `next/font/google` in `app/layout.js`.
2. THE Design_System SHALL load Plus Jakarta Sans (weights 400, 500, 600 and 700) as the Body_Font through `next/font/google` in `app/layout.js`.
3. THE Site SHALL NOT load Poppins.
4. THE Design_System SHALL apply the Heading_Font to `h1`, `h2`, `h3`, prices, step numerals, review quotes and FAQ summaries.
5. THE Design_System SHALL apply the Body_Font to body text, buttons, form fields, eyebrows, captions and footer column titles.
6. THE Design_System SHALL set heading weight to 600 and keep the sizes `clamp(2.5rem, 6vw, 4.75rem)` for the hero H1, `clamp(2rem, 4vw, 3rem)` for H2 and `1.375rem` for H3.
7. WHEN a heading contains an emphasised accent word, THE Site SHALL render the accent word in italic Heading_Font with Gold_Gradient text.

### Requirement 4: Buttons and chips

**User Story:** As a visitor, I want the same gold buttons and chips as the prototype, so that calls to action look consistent.

#### Acceptance Criteria

1. THE Site SHALL render primary actions as Gold_Buttons with 14px 28px padding, 0.9375rem weight-600 text and a 200% background size.
2. WHEN a visitor hovers a Gold_Button, THE Site SHALL raise the button by 2px, apply `--shadow-gold` and shift the background position.
3. THE Site SHALL render secondary actions as Outline_Buttons.
4. WHEN a visitor hovers an Outline_Button, THE Site SHALL fill the button with `rgba(212,175,55,.1)`.
5. THE Site SHALL render WhatsApp actions with the `--whatsapp` fill and On_CTA_Color text, and raise the button by 2px on hover.
6. WHILE an element has keyboard focus, THE Site SHALL draw a 2px `--gold-2` outline with a 3px offset on buttons and a 2px offset on other interactive elements.
7. THE Site SHALL render gold chips with a `rgba(212,175,55,.12)` fill, a `rgba(212,175,55,.3)` border and `--gold-1` text, and emerald chips with a `rgba(16,185,129,.12)` fill and a `#6ee7b7` text colour.

### Requirement 5: Glass cards

**User Story:** As a visitor, I want glass cards that lift on hover, so that card surfaces feel like the prototype.

#### Acceptance Criteria

1. THE Site SHALL render card surfaces as Glass_Cards.
2. WHEN a visitor hovers a liftable Glass_Card, THE Site SHALL raise the card by 6px, brighten the border to `rgba(252,229,156,.35)` and apply `--shadow-card`.
3. WHERE a browser does not support backdrop-filter, THE Site SHALL fill Glass_Cards with solid `--bg-1`.
4. THE Site SHALL animate Glass_Card transform, border-color and box-shadow over 300ms with the `--ease` curve.

### Requirement 6: Section heads and eyebrows

**User Story:** As a visitor, I want the section headings to carry the gold eyebrow and accent treatment, so that each section opens like the prototype.

#### Acceptance Criteria

1. THE Site SHALL render each eyebrow in uppercase Body_Font, 0.75rem, 0.24em letter spacing, weight 600, `--gold-2` colour.
2. THE Site SHALL draw a 32px by 1px `--gold-2` hairline before each eyebrow.
3. THE Site SHALL centre section heads and place 56px of space below them.
4. THE Site SHALL render the section lead paragraph with a maximum width of 620px, centred.

### Requirement 7: Header, hero and trust strip

**User Story:** As a visitor, I want the header, hero and trust strip to match the prototype, so that the first screen makes the same impression.

#### Acceptance Criteria

1. THE Site SHALL render the header as a fixed 72px bar that is transparent at the top of the page.
2. WHEN the page is scrolled beyond 40px, THE Site SHALL fill the header with `rgba(7,11,20,.9)`, apply a 12px backdrop blur and draw a 1px bottom border in `--glass-border`.
3. WHEN a visitor hovers a primary navigation link, THE Site SHALL change the link colour to `--gold-1`.
4. THE Site SHALL render the hero background image with a 20-second alternating Ken Burns zoom from scale 1 to 1.12.
5. THE Site SHALL overlay the hero image with a 90-degree gradient from `rgba(7,11,20,.95)` through `rgba(7,11,20,.7)` at 50% to `rgba(7,11,20,.35)`, plus a bottom fade to `--bg-0`.
6. THE Site SHALL render the hero H1 in Heading_Font at a maximum width of 780px.
7. THE Site SHALL render the guarantee badge with a `rgba(212,175,55,.08)` fill, a 1px `rgba(212,175,55,.4)` border, a `--gold-1` title and a shimmer sweep that repeats every 6 seconds.
8. THE Site SHALL render hero proof stars in `--gold-2` and hero proof ticks in `--emerald`.
9. THE Site SHALL render the Trust_Strip on `--bg-1` with 1px top and bottom `--glass-border` borders, a four-column grid and stars in `--gold-2`.
10. WHILE the viewport is narrower than 640px, THE Site SHALL arrange the Trust_Strip in two columns and stack hero buttons at full width.
11. WHERE a Trust_Strip item exposes a numeral as a separate element, THE Site SHALL render the numeral in Heading_Font with Gold_Gradient text and render the item caption in `--text-lo`.

### Requirement 8: Services grid

**User Story:** As a visitor, I want the services grid styled like the prototype, so that the offering reads as a premium set of cards.

#### Acceptance Criteria

1. THE Site SHALL render each service as a Glass_Card with 32px 28px padding, a Service_Icon, an H3 title, a summary, a check-marked feature list with `--emerald` ticks, and an enquire link in `--gold-1`.
2. WHEN a visitor hovers an enquire link, THE Site SHALL change the link colour to `--gold-2`.
3. WHILE the viewport is 1024px or wider, THE Site SHALL arrange the 8 services in two rows of four cards.
4. WHILE the viewport is between 640px and 1023px, THE Site SHALL arrange services in two columns.
5. WHILE the viewport is narrower than 640px, THE Site SHALL arrange services in one column.

### Requirement 9: Collections and package cards

**User Story:** As a visitor, I want the collections section, filters and package cards styled like the prototype, so that browsing packages feels consistent.

#### Acceptance Criteria

1. THE Site SHALL render Segmented_Controls with a `--bg-2` track, a 1px `rgba(255,255,255,.06)` border, 4px padding and pill-shaped buttons in `--text-md`.
2. WHEN a Segmented_Control option is active, THE Site SHALL fill the option with the Gold_Gradient and render its text in `--bg-0`.
3. WHEN a visitor hovers an inactive Segmented_Control option, THE Site SHALL change the text colour to `--text-hi`.
4. WHILE the viewport is narrower than 640px, THE Site SHALL keep Segmented_Controls on one line with horizontal scrolling.
5. THE Site SHALL render package cards as liftable Glass_Cards with a 4:3 image, a 24px padded body, a `--gold-2` uppercase meta line, included-item chips and a price in Heading_Font with Gold_Gradient text.
6. WHEN a visitor hovers a package card, THE Site SHALL scale the card image to 1.05 over 600ms.
7. WHILE the viewport is 1024px or wider, THE Site SHALL arrange package cards in three columns; WHILE the viewport is between 640px and 1023px, THE Site SHALL use two columns; WHILE the viewport is narrower than 640px, THE Site SHALL use one column.
8. THE Site SHALL apply the same card, chip and tile styling to the Destinations section and its tiles.

### Requirement 10: How It Works steps

**User Story:** As a visitor, I want the How It Works steps styled like the prototype, so that the process reads as a clear sequence.

#### Acceptance Criteria

1. THE Site SHALL render each step number in a 56px circle with Gold_Gradient fill, `--bg-0` numeral in Heading_Font and an 8px `--bg-0` outer ring.
2. WHILE the viewport is 640px or wider, THE Site SHALL draw a 1px horizontal connecting line at the circle centre line, fading from transparent through `--gold-2` back to transparent, spanning from 12% to 88% of the row width.
3. WHILE the viewport is narrower than 640px, THE Site SHALL stack steps in one column and hide the connecting line.

### Requirement 11: Quote section and form

**User Story:** As a visitor, I want the quote section and form to match the prototype, so that the main conversion surface looks the same.

#### Acceptance Criteria

1. THE Site SHALL render the quote section as a two-column layout with 5fr and 7fr tracks and a 48px gap while the viewport is 1024px or wider, and as one column below 1024px.
2. THE Site SHALL render the quote form as a Glass_Card with a 24px radius and 36px padding (24px below 640px).
3. THE Site SHALL render each form step label in uppercase Body_Font, 0.75rem, 0.18em letter spacing, weight 700, `--gold-2` colour.
4. THE Site SHALL render service checkbox tiles with a `--bg-2` fill, a 1px `rgba(255,255,255,.08)` border and an empty 16px square checkbox mark.
5. WHEN a service checkbox tile is checked, THE Site SHALL change the tile border to `--gold-2`, fill it with `rgba(212,175,55,.1)`, and show a Gold_Gradient check mark in `--bg-0`.
6. WHEN a form field receives focus, THE Site SHALL set the field border to `--gold-2` and draw a `0 0 0 2px rgba(212,175,55,.35)` ring.
7. THE Site SHALL render form fields with a `--bg-2` fill, a 1px `rgba(255,255,255,.08)` border, 8px radius and a 48px minimum height, and select fields with a gold chevron.
8. IF a form field is in an error state, THEN THE Site SHALL set the field border to `--danger` and show the error message below the field in `--danger` at 0.75rem.
9. THE Site SHALL render the perk list with `--emerald` check circles.
10. WHILE the viewport is narrower than 640px, THE Site SHALL arrange form fields in one column.

### Requirement 12: Reviews, FAQ, final call-to-action and footer

**User Story:** As a visitor, I want reviews, FAQ, the final call-to-action band and the footer to match the prototype, so that the lower page keeps the same look.

#### Acceptance Criteria

1. THE Site SHALL render each review as a liftable Glass_Card with a 32px padding, a `--gold-2` quote mark in Heading_Font that the stylesheet draws, an italic Heading_Font quote at 1.0625rem in `--text-hi`, and a 44px Gold_Gradient avatar circle with `--bg-0` initials.
2. THE Site SHALL render rating stars in `--gold-2`.
3. THE Site SHALL render FAQ items as hairline-separated rows with `--glass-border` bottom borders, summaries in Heading_Font at 1.1875rem and a `--gold-2` plus icon on the right.
4. WHEN a FAQ item is open, THE Site SHALL rotate the plus icon by 45 degrees over 300ms.
5. THE Site SHALL render the final call-to-action band with 1px top and bottom borders in `rgba(212,175,55,.35)` and a radial gold glow `radial-gradient(ellipse at center, rgba(212,175,55,.08), transparent 70%)`.
6. THE Site SHALL render the footer as a four-column grid with column ratio 2fr 1fr 1fr 1.4fr while the viewport is 1024px or wider, two columns between 640px and 1023px, and one column below 640px.
7. THE Site SHALL render footer column titles in uppercase Body_Font, 0.75rem, 0.2em letter spacing, `--gold-2` colour.
8. WHEN a visitor hovers a footer link, THE Site SHALL change the link colour to `--gold-1`.
9. THE Site SHALL render the footer bottom bar with a 1px top border in `--glass-border` and `--text-lo` text.
10. THE Site SHALL omit the literal curly quote characters from the review paragraph in `components/sections/Reviews.jsx` (Permitted_Exception PE1) and keep the review words unchanged.

### Requirement 13: Overlays and floating controls

**User Story:** As a visitor, I want the overlays and floating controls to match the prototype, so that modals and shortcuts feel like part of the same design.

#### Acceptance Criteria

1. THE Site SHALL render the floating WhatsApp control as a 60px circle in `--whatsapp` with a pulsing ring that repeats every 2 seconds.
2. WHEN a visitor hovers the floating WhatsApp control, THE Site SHALL reveal its tooltip with a `--bg-1` fill and a `--glass-border` border.
3. WHILE the viewport is narrower than 640px, THE Site SHALL render the mobile sticky bar with a `rgba(7,11,20,.95)` fill, a 1px top `--glass-border` border and a two-column button layout, and hide the floating tooltip.
4. THE Site SHALL render modal backdrops with `rgba(7,11,20,.75)` and a 6px backdrop blur.
5. THE Site SHALL render modal boxes with a `--bg-1` fill, a 1px `--glass-border` border, 24px radius and 36px padding.
6. WHILE the viewport is narrower than 640px, THE Site SHALL render modals as bottom sheets with top corners rounded to 24px and a maximum height of 92vh.
7. THE Site SHALL render the modal close control as a 36px circle with a `--glass-border` border.
8. THE Site SHALL render the quotation ticket code in a dashed `--gold-2` box with a `rgba(212,175,55,.06)` fill and a monospace face.
9. THE Site SHALL render the success icon in a circle with a `rgba(16,185,129,.15)` fill and an `--emerald` glyph.
10. THE Site SHALL render summary lists in a two-column definition grid with labels in `--text-lo` and values in `--text-hi`.

### Requirement 14: Itinerary, checkout, voucher and terms views

**User Story:** As a visitor, I want the itinerary, checkout, voucher and terms views to carry the gold look, so that every overlay is consistent.

#### Acceptance Criteria

1. THE Site SHALL render itinerary timeline dots and connecting lines in `--gold-2`.
2. THE Site SHALL render the itinerary hotel table with `--glass-border` row separators, header text in `--gold-2`, and body text in `--text-md`.
3. THE Site SHALL render tier switches, steppers and terms tabs as Segmented_Controls or Gold_Button variants defined in this document.
4. THE Site SHALL render checkout and voucher panels using Glass_Card surfaces, `--gold-2` section labels and Gold_Buttons for primary actions.
5. THE Site SHALL render prices, totals and percentages that previously used orange or sky accents in Gold_Gradient text or `--gold-1`.

### Requirement 15: Admin area styling

**User Story:** As an admin user, I want the admin area to use the same palette and fonts, so that the whole site feels like one product.

#### Acceptance Criteria

1. THE Site SHALL render the admin shell, login form, leads table, bookings table, status selects and package and destination forms using the Gold_Palette, Heading_Font and Body_Font.
2. THE Site SHALL render admin primary actions as Gold_Buttons and admin form fields with the same focus ring as the public quote form.
3. THE Site SHALL keep every admin route, form field name, Server Action and table column unchanged.

### Requirement 16: Design documentation

**User Story:** As a maintainer, I want the design documentation to match the code, so that future work does not restore the retired theme by mistake.

#### Acceptance Criteria

1. THE Design_System SHALL update its header comment in `app/globals.css` to list the Gold_Palette tokens, the Heading_Font and the Body_Font, and to remove the Legacy_Tokens.
2. WHEN the restyle is complete, THE Site SHALL add a "Superseded by prototype-visual-parity" note at the top of sections 3.1, 3.2 and 3.3 of `.kiro/specs/travel-agency-website/design.md` that points to Decision D1 in this document.
3. THE Site SHALL keep the original text of those three sections below the note for history.

### Requirement 17: Accessibility and motion

**User Story:** As a visitor with accessibility needs, I want the new palette to remain readable and the motion to respect my settings, so that the restyle does not reduce accessibility.

#### Acceptance Criteria

1. THE Site SHALL render body text, labels and placeholders with a contrast ratio of at least 4.5:1 against their background, including `--text-lo` on `--bg-1` and on `--bg-2`.
2. THE Site SHALL render `--gold-2`, `--gold-1` and Gold_Gradient text on `--bg-0`, `--bg-1` and `--bg-2` with a contrast ratio of at least 4.5:1.
3. THE Site SHALL render `--bg-0` text on the Gold_Gradient with a contrast ratio of at least 4.5:1 across the full gradient.
4. THE Site SHALL render the focus indicator with a contrast ratio of at least 3:1 against adjacent colours.
5. WHILE Reduced_Motion is active, THE Site SHALL disable the Ken Burns zoom, the shimmer sweep, the WhatsApp pulse, card lift transitions and scroll reveals.
6. THE Site SHALL keep the print rules that show only modal content while a modal is open.
7. THE Site SHALL render On_CTA_Color text on the `--whatsapp` fill with a contrast ratio of at least 4.5:1.

### Requirement 18: Visual-only verification

**User Story:** As a maintainer, I want the restyle to be verifiably visual-only, so that no behaviour changes slip in.

#### Acceptance Criteria

1. THE Site SHALL keep `prototype/index.html` byte-for-byte unchanged.
2. THE Site SHALL keep every file under `lib/` and `app/api/` unchanged, including `lib/seo.js`.
3. THE Site SHALL keep the section order, copy, links and data content unchanged, except for the Permitted_Exceptions PE1 and PE2.
4. THE Site SHALL NOT render the Prototype's "Design prototype · not final" note, its sample reviewer names, its example error message or its sample package data.
5. WHEN the Verification_Suite runs, THE Site SHALL pass `npm test`, `npm run lint` and `next build` with no new failures.
6. IF an existing test scans for a brand token, colour or font that this feature retires, THEN THE Site SHALL update that test to assert the Gold_Palette equivalent, and leave tests that assert Service_Token names unchanged.
7. WHEN `next build` runs, THE Site SHALL produce no CSS Module reference to an undefined custom property.
