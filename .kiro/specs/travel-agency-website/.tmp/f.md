### Property 31: Package and destination validation

For any generated well-formed package (random nights 1–10, matching days and itinerary, 2–3 unique tiers whose hotel nights sum to `nights`, prices in range, allowed image host), `validatePackage` returns `valid: true`, and the four packages in `lib/data.js` are valid; corrupting exactly one rule (days ≠ nights + 1, itinerary day out of sequence, region missing from categories, duplicate or unknown tier id, hotel nights sum ≠ nights, non-integer or out-of-range price, disallowed image host, a forbidden claim phrase in any string, an over-long string) makes it invalid with an error whose key is that field's path; for any non-object input it returns `valid: false` without throwing; `valid ⟺ errors is empty`. The same holds for `validateDestination` with its rules, including `packageId` membership when `packageIds` is supplied.

**Validates: Requirements 44.3, 44.4, 44.9**

### Property 32: Server price recomputation

For any published package from the generator, any tier id of that package, any adults and children counts, any server time `now` and any travel date at least one day after `todayISOInZone(now, "Asia/Kolkata")`, and any client-supplied values for price-like keys (`landTotal`, `total`, `advance`, `balance`, `advanceRate`, `adultPriceINR`, `childPriceINR`, `price`), a successful `handleBooking` call inserts exactly one row whose `land_total_inr`, `advance_inr`, `balance_inr`, `balance_due_date` and `rule` equal those of `computeBookingBreakdown({ tier: dbTier, adults, children }, travelDate, todayIST, BUSINESS.paymentPolicy)`, and the response `breakdown` carries the same values; changing only the price-like keys never changes the inserted row.

**Validates: Requirements 38.4, 38.5**

### Property 33: Payload whitelisting and no card data

For any request body that adds arbitrary extra keys (including `cardNumber`, `expiry`, `cvc`, `status`, `id`, `ticket_id`, `booking_ref`) to valid quote or booking data, the row passed to `insertLead` / `insertBooking` has exactly the documented column set, no value in it is derived from an extra key, and neither the row, the response nor any `log` call contains the extra values.

**Validates: Requirements 37.6, 38.6, 26.5**

### Property 34: Quote handler outcomes

For any request to `handleQuote` that passes the origin, rate and body checks: when the fields are valid in Submit_Mode for the IST business date and the honeypot is empty, exactly one `insertLead` call succeeds and the 201 response's `ticketId` satisfies `isValidTicketId`, has the IST year, equals the inserted `ticket_id`, and `callbackDeadline` equals `now + 24 h`; when the fields are invalid, the response is 400 with `errors` equal to `validateQuoteForm(...).errors` and no insert happens; when the honeypot is non-empty, the response is 201 with a valid-format ticket and no insert happens; when `db` is `null` the response is 503; when the insert fails with a non-unique error the response is 500 and its body contains no submitted value.

**Validates: Requirements 37.2, 37.4, 37.5, 37.7**

### Property 35: Unique ID retry

For any k in 0–4, when the fake database reports `unique_violation` for the first k inserts, `handleQuote` and `handleBooking` succeed on attempt k + 1 with an ID different from every rejected one (the stub `random` yields distinct values); when it reports `unique_violation` for 5 attempts, they respond 500 after exactly 5 insert attempts.

**Validates: Requirements 37.3, 38.7**

### Property 36: Rate limiter bound

For any `limit` in 1–10, `windowMs` in 1–10⁶, any sequence of non-decreasing timestamps and any assignment of those calls to a small set of keys, for every key and every half-open interval of length `windowMs` at most `limit` calls return `allowed: true`; a call made at least `windowMs` after the oldest of the last `limit` allowed calls for that key is allowed; calls for one key never change the results for another key (while the key count stays ≤ `maxKeys`); every denied call reports `retryAfterMs` in (0, `windowMs`].

**Validates: Requirements 39.1**

### Property 37: Row mapping round-trip

For any generated valid package p, `rowToPackage(packageToRow(p))` deep-equals p, and `packageToRow(p)` has `days = nights + 1`, `region ∈ categories` and a `data` object without column keys; for any destination d, `rowToDestination(destinationToRow(d))` deep-equals d; neither mapping mutates its input.

**Validates: Requirements 40.8**

### Property 38: Content fallback

For any fallback lists and any fake client behaviour per list (null client, `{ error }`, thrown error, rows that are all valid, rows mixing valid and invalid), `loadPublicContent` never throws and returns: the fallback list with source "fallback" when the client is null, errors or throws for that list; otherwise exactly the valid mapped rows in input order with source "database" (an empty row array yields an empty list, not the fallback); and every destination `packageId` is either `null` or the id of a returned package.

**Validates: Requirements 40.3, 40.4, 40.5, 40.6, 40.7**

### Property 39: Admin authorization gate

For any user value (null, a non-admin user, an admin user), any `isAdminUser` result and any validation result, `runAdminMutation` calls `mutate` exactly once if and only if the user is non-null, `isAdminUser(user)` is true and validation is valid; otherwise it returns `ok: false` with reason "unauthenticated", "forbidden" or "invalid" respectively and `mutate` is never called; status values outside `LEAD_STATUSES` / `BOOKING_STATUSES` are always "invalid".

**Validates: Requirements 42.4, 43.5**

### Property 40: Request parsing limits

For any string body and content type, `parseJsonBody` never throws; it returns 415 for content types not starting with `application/json`, 413 for bodies longer than `maxBytes` UTF-8 bytes (multi-byte characters counted by bytes), 400 for non-JSON text or JSON that is not a plain object (arrays, `null`, numbers, strings), and `ok: true` with the parsed object otherwise; for any Origin/Host pair, `isSameOrigin` is true when Origin is absent and otherwise true iff the Origin URL's host equals Host, false for malformed Origin values.

**Validates: Requirements 39.3, 39.5**

### Property 41: Business-timezone date

For any `Date` between 2000-01-01 and 2100-12-31, `todayISOInZone(date, "Asia/Kolkata")` is a well-formed ISO date equal to the UTC calendar date of `date + 5 h 30 min`, so the server's "today" (used for `minDepartureDate`, the payment rules and the ticket year) is the Raipur calendar date regardless of the server's own time zone.

**Validates: Requirements 37.8**

## Error Handling

| Scenario | Response | Recovery |
|---|---|---|
| Invalid form input (client) | Inline field messages (`aria-invalid`, `aria-describedby`), summary in an `aria-live` region, focus first invalid field | User corrects; errors clear on input |
| Server validation 400 (quote or booking) | Same inline display using the server `errors` keys (they match the client validators) | User corrects; possible only when client and server dates differ near midnight or the client was bypassed |
| 429 rate limited | "Too many requests. Please try again in a few minutes, or continue on WhatsApp." plus a WhatsApp button with the composed message; values retained | Retry later or WhatsApp |
| 503 (database not configured) / 500 / network error / 10 s timeout | "We couldn't send your request right now. Please try again or continue on WhatsApp." with the WhatsApp button; no Ticket_Modal or voucher; values retained | WhatsApp or retry |
| Honeypot filled (bot) | Server answers 201 with a well-formed, unstored Ticket_ID | Bot sees success; nothing stored |
| Booking for an unpublished / unknown package | 400 `packageId` "This package is not available"; checkout shows it above the button | Pick another package or WhatsApp |
| Unique ID collision | Up to 5 retries with fresh random IDs, then 500 | Transparent to the visitor except in the extreme case |
| Supabase env vars missing at build/runtime | Public page renders from `lib/data.js`; APIs return 503; admin shows "Database not configured" | Set env vars (USER ACTION) |
| Supabase fetch error on the public page | Affected list falls back to `lib/data.js`; server log `content:fallback packages <code>` | Next revalidation retries |
| Invalid row in the database (edited outside the admin) | Row dropped from the public page, id logged | Fix in admin; the form shows the validation errors |
| Destination links to an unpublished package | "View Package" hidden | Publish the package or change the link |
| Admin not signed in | `proxy.js` redirects to `/admin/login`; server actions return `unauthenticated` | Sign in |
| Signed in but not in `admins` | "Not authorised" page with Sign out; actions return `forbidden`; RLS returns no rows anyway | Add the user to `admins` (USER ACTION) |
| Admin JSON syntax error / validation error | Message with the parse error position or errors by path; nothing saved | Fix and resubmit |
| Delete package with bookings | FK `restrict` error mapped to "This package has bookings. Unpublish it instead." | Unpublish |
| Terms not accepted at checkout | Error under checkbox; submit blocked | User ticks checkbox |
| Tier has no child price | Children stepper hidden, children forced to 0, note "Child pricing on request, ask us on WhatsApp" | WhatsApp link |
| Departure within 21 days or below ₹25,000 pp | Breakdown switches to full payment with the reason shown | Informational |
| Unknown tier id (stale link/state) | `getTier` falls back to cheapest tier on the client; the server rejects it with a `tierId` error | Silent on the client |
| Missing extras (null flight / visa) | Line omitted; if all null, box shows "Flights quoted on request" | Informational |
| WhatsApp popup blocked | Fallback: set `location.href` to the wa.me URL | Opens in same tab |
| Unknown currency / corrupt or unavailable localStorage | Fall back to `BUSINESS.baseCurrency` (INR) | Overwrite stored value when possible |
| `cancellationCharge` invalid input | Throws `RangeError` (only reachable from tests; UI renders the static table) | n/a |
| `backdrop-filter` unsupported | `@supports` fallback to solid `--bg-1` | Visual only |
| Image fails to load | `SafeImage` shows a gradient placeholder at the same size | Visual only |
| `/assets/logo.png` or `/assets/founder.jpg` missing | CSS "TG" Logo_Mark with the same accessible name | Visual only; user supplies the files |
| `BUSINESS.expert.name` is null | Name row omitted; heading "Meet Your Travel Expert" | Informational |
| Clipboard API unavailable | Select ticket text for manual copy | — |
| JS disabled | Server-rendered sections, prices (INR), links, phones and Terms remain readable; forms show a `<noscript>` note with both phones, email, WhatsApp link and address | Contact via links |

## Testing Strategy

The Test_Suite stays on `node:test` + fast-check (pinned), run by `npm test` (`node --test "tests/**/*.test.js"`). Tests import only `lib/` modules with relative paths, so they need no Next.js build, Supabase project or network.

| File | Covers |
|---|---|
| `tests/helpers.js`, `tests/helpers.test.js` | Existing fast-check config (≥ 100 runs, tag `Feature: travel-agency-website, Property {n}: {title}`); kept |
| `tests/logic.core.test.js` | Existing example tests, imports switched to `../lib/` |
| `tests/data.services.test.js` | Existing services / reviews / FAQ tests, imports switched |
| `tests/data.test.js` | Package, destination, `BUSINESS`, `CURRENCIES`, cancellation table integrity (Requirement 28.9) and that every `lib/data.js` package passes `validatePackage` |
| `tests/logic.property.test.js` | Properties 1–30 |
| `tests/logic.validation.test.js` | Example tests for IDs, validators, WhatsApp messages |
| `tests/cms.property.test.js` | Properties 31 and 37 (+ examples for `validatePackage` error paths) |
| `tests/content.test.js` | Property 38 with fake clients |
| `tests/server.request.test.js`, `tests/server.rate-limit.test.js`, `tests/server.time.test.js` | Properties 40, 36, 41 |
| `tests/server.quote.test.js`, `tests/server.booking.test.js` | Properties 32–35 with in-memory fake `db` (`tests/fakes.js`), stub `random`, fixed `now` |
| `tests/server.admin.test.js` | Property 39 |
| `tests/seo.test.js` | `buildMetadata` / `buildViewport` equal the `BUSINESS` values (Requirement 33.4) |
| `tests/migration.test.js` | Static scan of `supabase/migrations/0001_init.sql`: RLS enabled for all five tables, the named policies exist, no policy grants `anon` access to `leads` / `bookings` / `admins`, no INSERT policy on `leads` / `bookings`, the `revoke` / `grant update (status)` statements are present |
| `tests/security.test.js` | Static scans: `SUPABASE_SERVICE_ROLE_KEY` appears only in `lib/supabase/service.js`, `scripts/seed.js` and `.env.local.example`; no `NEXT_PUBLIC_SUPABASE_SERVICE` anywhere; `service.js` starts with `import "server-only"`; no file under `app/`, `components/` or `lib/` contains `dangerouslySetInnerHTML`, `cardNumber`, `cvc` or `localStorage.setItem` with a key other than the currency key; `.gitignore` lists `.env*.local`; `next.config.js` defines the required headers; no `.ts` / `.tsx` file and no `tailwind` dependency or config exist |
| `tests/claims.test.js` | Forbidden phrases and removed service names across `lib/data.js`, `app/**`, `components/**`; no `--gold-` / `--shadow-gold` in any `.css` file (Requirements 32.2, 33.7) |
| `tests/manifest.test.js` | `package.json`: exact versions only (no `^` / `~`), the dependency set of Requirement 2.7, scripts, `engines.node` |

Manual checks (not automatable here, recorded as USER ACTION / checkpoint steps):

- RLS: with the anon key, `select * from leads` and an insert into `leads` / `bookings` must fail or return no rows; `select` on unpublished packages returns no rows; signed in as a non-admin user, admin pages show "Not authorised".
- End-to-end on a Supabase project: quote submit creates a lead and the Ticket_Modal shows the stored ID; booking stores server amounts; admin status changes persist; a package edit appears on `/` after save.
- `next build` succeeds; `npm run lint` is clean; response headers checked with the browser dev tools on the deployed URL (CSP violations: none in the console).
- Browsers: Chrome, Safari, Firefox at 375 / 768 / 1280 / 1440 px; keyboard-only navigation of modals, tier switcher, steppers, Terms tabs, destination tiles and the admin forms; logo and founder-photo fallbacks; contrast spot-checks; Lighthouse. Full WCAG compliance needs manual testing with assistive technologies and expert review.

## Performance Considerations

- Static sections are Server Components and ship no client JS; client JS is limited to the interactive pieces listed in 5.4. Target: ≤ 250 KB compressed JavaScript transferred for `/` on first load, checked in the browser network panel (Next.js 16 no longer prints first-load sizes in `next build`).
- ISR: the public page is served from cache and regenerated at most every 300 s or on admin save, so database load is a handful of reads per revalidation, independent of traffic.
- Fonts are self-hosted by `next/font` with `display: swap` and size-adjusted fallbacks (no layout shift, no third-party connection).
- Hero image preloaded with `fetchPriority: "high"`; all other images (`SafeImage`) `loading="lazy"` with width/height. Keep `logo.png` under ~30 KB.
- Animations use `transform` / `opacity` only. Route handlers do one read (booking) and one insert; the rate limiter is O(limit) per check.

## Security Considerations

- **Network-exposed endpoints and their auth:** `POST /api/quote` and `POST /api/booking` are intentionally public and unauthenticated (anyone can request a quote or booking). They are protected by server-side validation with the same pure validators, a field whitelist, a 16 KB body limit, length limits, a same-origin check, a honeypot (quote) and per-IP rate limits. All `/admin/*` pages and every admin server action require an authenticated Supabase session **and** membership in `admins`, checked on the server for every request and mutation, with RLS as a second layer.
- **Rate limiting is best-effort.** The limiter is in memory per server instance: it resets on deploys and cold starts, is not shared between serverless instances, and relies on `x-forwarded-for` (trustworthy on Vercel, spoofable on hosts that do not overwrite it). For stronger protection later: a shared store (e.g. Upstash Redis or a Postgres table), Vercel Firewall rules or Cloudflare Turnstile on the quote form (open item).
- **RLS on every table**; anon can read only published packages and destinations; there is no anon access to `leads`, `bookings` or `admins`, and no INSERT policy on `leads` / `bookings`, so only the service role can insert them.
- **Service role key on the server only:** `SUPABASE_SERVICE_ROLE_KEY` is read only in `lib/supabase/service.js` (guarded by `import "server-only"`) and `scripts/seed.js`; it is never prefixed `NEXT_PUBLIC_`, never serialised into props or responses, and never logged. Admin pages use the user's session client so RLS applies to admin actions too. `.env.local` is gitignored; `.env.local.example` contains placeholders only. Supabase's newer publishable / secret API keys can be used in the same variables.
- **No card data:** the card fields are removed; the booking handler whitelists fields, so card-like keys are dropped before validation and never stored, logged or echoed. Real payments later must use a hosted payment page.
- **PII:** leads and bookings hold names, phones, emails and travel plans. They are readable only by admins; server logs contain error codes and ids only. A privacy notice describing what is stored and why is needed before launch (open item; not legal advice).
- **XSS:** React escapes all rendered values; `dangerouslySetInnerHTML` is banned (test scan). Admin-entered content is plain text rendered by React; image URLs are restricted to allowed hosts or `/assets/` paths.
- **CSRF:** route handlers use no cookies, and reject cross-origin `Origin` headers; server actions are protected by Next.js's built-in Origin/Host check; admin cookies are `SameSite=Lax` and `Secure` in production (set by `@supabase/ssr`).
- **Security headers** (`next.config.js` `headers()`, all routes; `poweredByHeader: false`):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in development only)`; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://<project>.supabase.co; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests` |
| `X-Frame-Options` | `DENY` (legacy companion to `frame-ancestors 'none'`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (production only) |
| `X-Robots-Tag` | `noindex, nofollow` on `/admin/:path*` |

  Notes: `script-src 'unsafe-inline'` is required because Next.js emits inline bootstrap scripts and a nonce-based CSP would force dynamic rendering, which defeats ISR; this is a documented trade-off, mitigated by React escaping and the absence of `dangerouslySetInnerHTML`. Fonts are self-hosted by `next/font`, so no Google origin is listed. The browser never talks to Supabase directly (all reads and writes are server-side), so `connect-src 'self'` is enough; the Supabase host appears only in `img-src` for Storage images and is derived from `NEXT_PUBLIC_SUPABASE_URL` at build time. `wa.me` links are top-level navigations / new tabs, which CSP does not restrict.

## Dependencies

Pinned exact versions (looked up on the npm registry while writing this revision; re-check before installing):

| Package | Version | Kind | Purpose |
|---|---|---|---|
| `next` | 16.4.0 | runtime | App Router, Route Handlers, Server Actions, `proxy.js`, `next/font` |
| `react`, `react-dom` | 19.3.0 | runtime | UI |
| `@supabase/supabase-js` | 2.117.3 | runtime | Database client (anon + service role) |
| `@supabase/ssr` | 0.12.7 | runtime | Cookie-based auth sessions for admin pages, actions and `proxy.js` |
| `server-only` | 0.0.1 | runtime | Build-time guard for `lib/supabase/service.js` |
| `fast-check` | 4.10.2 | dev | Property tests (unchanged) |
| `eslint` | 9.39.5 | dev | Lint (9.x because `eslint-plugin-react`, used by `eslint-config-next`, does not yet support ESLint 10) |
| `eslint-config-next` | 16.4.0 | dev | Next.js flat config (`next lint` was removed in Next.js 16, so the script is `eslint .`) |

- Node.js ≥ 20.9 (required by Next.js 16; also provides `node --env-file` for the seed script and `node:test`).
- Services: Supabase project (Postgres, Auth); hosting on Vercel or any Node host that runs `next start`.
- User-supplied assets: `public/assets/logo.png`, `favicon.png`, `og-image.jpg`, `founder.jpg`.
- Removed: the "zero runtime dependencies" constraint (Requirement 2.7 and 27 revised), Google Fonts CDN, `leadEndpoint`.

## Open Items to Confirm

Closed earlier: WhatsApp number (`919171995559`), tagline, sample packages (dropped), brand visuals. Closed by the stack revision: real lead capture (now `POST /api/quote` + Supabase) and package editing (admin CMS).

1. Review count: `BUSINESS.rating.count` is `null`, so no count is shown. Supply the real count and real review texts.
2. Founder details: `BUSINESS.expert.name` (null, hidden), role and bio are placeholders; `public/assets/founder.jpg` must be supplied.
3. Brand asset files: `public/assets/logo.png`, `favicon.png` and `og-image.jpg` must be supplied or generated. The CSS "TG" mark shows until the logo exists.
4. Nepal grouping: listed under Domestic as on the poster. Now editable in `/admin/destinations` without code changes.
5. Destination and package images are Unsplash placeholders; replace with licensed or own photos (upload to Supabase Storage or `public/assets/`).
6. Singapore per-person prices are derived (₹2,25,000 ÷ 4 = ₹56,250; ₹2,51,000 ÷ 4 = ₹62,750; flights ₹2,04,500 ÷ 4 = ₹51,125) and labelled indicative.
7. Child-price age bands (Bali) and child pricing for Dubai, Singapore and Kerala (currently "on request").
8. Indicative currency rates in `CURRENCIES` (code-managed in `lib/data.js`).
9. "No booking fees" claim and the remaining FAQ answers.
10. Ticket ID capacity: random `QT-YYYY-NNNN` gives 10,000 IDs per year; widen the numeric part if yearly leads approach a few thousand.
11. Stronger abuse protection (shared rate-limit store, Turnstile/CAPTCHA) if spam appears; the in-memory limiter is best-effort.
12. Privacy notice for stored personal data (names, phones, emails) and a retention period for leads; the footer "Privacy" link needs real content. Get professional advice on the applicable law.
13. How the advance is collected after a booking request (payment link, UPI, bank transfer) and who confirms it; the site only records `pending` requests.
14. Server "today" uses Asia/Kolkata; visitors in time zones behind IST may occasionally have tomorrow's date rejected near midnight (they see the server error inline).

Carried over unchanged (still assumptions in the formal specs): payment-policy interpretation ("per person" = chosen tier's adult price; "within 21 days" = fewer than 21 days to departure), and Dubai hotel star rating and room types.
