### 7.18 `validatePackage(pkg, opts)`

```javascript
export function validatePackage(pkg, {
  categories = CATEGORIES.map(c => c.id).filter(id => id !== "all"),
  tierIds = TIER_IDS, imageHosts = IMAGE_HOSTS, forbidden = FORBIDDEN_CLAIMS,
} = {}) {}   // → { valid, errors: Record<path, message> }
```

Rules (error key = path of the first offending field; at most one error per path):

| Path | Rule |
|---|---|
| `root` | `pkg` is a plain object (otherwise only this error) |
| `id` | `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 64 chars |
| `title`, `destination` | trimmed 2–120 chars |
| `region` | "international" or "domestic" |
| `categories` | non-empty array of unique ids from `categories`, contains `region` |
| `nights`, `days` | integer 1–60; `days = nights + 1` (error on `days`) |
| `image` | root-relative path starting with `/assets/`, or `https:` URL whose host is in `imageHosts`; ≤ 500 chars |
| `highlights` | array of 0–6 strings, each 1–80 chars |
| `hotelStarRating` | `null` or integer 1–5 |
| `mealPlan`, `transferBasis` | strings ≤ 200 chars |
| `tiers` | 2–3 entries with unique `id` from `tierIds` |
| `tiers[i].label` / `.hotelLabel` / `.priceNote` | 1–40 / optional 1–40 / optional ≤ 300 chars |
| `tiers[i].adultPriceINR` | integer 1–10,000,000 |
| `tiers[i].childPriceINR` | `null` or integer 1–10,000,000 |
| `tiers[i].hotels` | 1–10 stays, each `location` 1–80, `nights` integer ≥ 1, `names` 1–6 strings of 1–80, `roomType` null or ≤ 120; Σ nights = `nights` (error on `tiers[i].hotels`) |
| `extras.flightFareINR` | `null` or integer 1–10,000,000; `flightNote` null or ≤ 300 |
| `extras.visa` | `null` or `{ feeINR: integer 1–10,000,000, type: 1–80 chars }` |
| `extras.onArrivalCharges` | array of 0–10 strings, 1–200 chars |
| `inclusions` | absent, or array of 1–20 strings of 1–200 chars |
| `itinerary` | length = `days`; `itinerary[i].day = i + 1`; `title` 1–120, `description` 1–1000; `transferType` absent or one of "private", "sharing", "mixed" |
| `isSample` | absent or boolean |
| `notes` | absent, or array of 0–5 strings of 1–300 chars (public footnotes) |
| any string field | contains no `FORBIDDEN_CLAIMS` phrase (case-insensitive) |

- Post: `valid ⟺ errors = {}`; never throws (non-object input, missing nested objects and wrong types become errors); pure; the four packages in `lib/data.js` are valid.
- Used by: `PackageForm` (client feedback), `savePackage` (server action, authoritative), `loadPublicContent` (drops invalid rows), `scripts/seed.js` (aborts on invalid content) and the data tests.

### 7.19 `validateDestination(dest, opts)`

```javascript
export function validateDestination(dest, { packageIds = null, imageHosts = IMAGE_HOSTS } = {}) {}
```

- Rules: `id` slug as above; `name` 1–80; `tagline` 1–120; `region` "international" or "domestic"; `image` as in 7.18; `packageId` `null` or a string, and when `packageIds` is given, a member of it; no forbidden claim phrase.
- Post: `valid ⟺ errors = {}`; never throws; pure.

### 7.20 `loadPublicContent({ client, fallback, log })`

```javascript
export async function loadPublicContent({ client, fallback, log = () => {} }) {
  if (!client) return { ...fallback, source: { packages: "fallback", destinations: "fallback" } };
  const packages = await loadList(() => client.fetchPackages(), rowToPackage, validatePackage, fallback.packages, "packages", log);
  const ids = packages.list.map(p => p.id);
  const destinations = await loadList(() => client.fetchDestinations(), rowToDestination,
                                      d => validateDestination(d, {}), fallback.destinations, "destinations", log);
  const known = new Set(ids);
  return {
    packages: packages.list,
    destinations: destinations.list.map(d => (d.packageId && !known.has(d.packageId) ? { ...d, packageId: null } : d)),
    source: { packages: packages.source, destinations: destinations.source },
  };
}
// loadList: try { const { data, error } = await fetch(); if (error) → fallback (log code);
//   map rows; drop rows whose validation fails (log id); return { list, source: "database" } }
//   catch (e) → fallback (log e.name). An empty array from the database is respected (no fallback).
```

- Pre: `client` is `null` or an object whose fetchers return `{ data, error }` with rows already filtered to `is_published` and ordered by `sort_order, id` (the anon client + RLS do this).
- Post: never throws; each list falls back independently; dangling `packageId` values become `null`; `source` reports which path was used; logs contain ids and error codes only.

### 7.21 `handleQuote({ rawBody, headers, now, random, db, limiter })`

```pascal
ALGORITHM handleQuote
BEGIN
  IF NOT isSameOrigin(headers.origin, headers.host) THEN RETURN 403 {error:"forbidden"}
  rl ← limiter.check("quote:" + clientIp(headers), now.getTime())
  IF NOT rl.allowed THEN RETURN 429 {error:"rate_limited"} with Retry-After = ⌈rl.retryAfterMs / 1000⌉
  parsed ← parseJsonBody(rawBody, {maxBytes: 16384, contentType: headers["content-type"]})
  IF NOT parsed.ok THEN RETURN parsed.status {error: parsed.error}
  body ← parsed.value
  today ← todayISOInZone(now, BUSINESS.timeZone); year ← integer(today[0..3])
  data ← pickQuoteFields(body)                       // whitelist of Quote_Form_Data keys, defaults applied
  deadline ← computeCallbackDeadline(now, data.callbackSlot, BUSINESS.callbackHours)
  IF isString(body.website) AND trim(body.website) ≠ "" THEN      // honeypot: silently drop
    RETURN 201 {ok:true, ticketId: generateTicketId(year, random(10000)), callbackDeadline: iso(deadline)}
  v ← validateQuoteForm(data, today, {mode:"submit"}) + server type checks
  IF NOT v.valid THEN RETURN 400 {error:"validation", errors: v.errors}
  IF db = null THEN RETURN 503 {error:"unavailable"}
  FOR attempt ← 1 TO API_LIMITS.maxIdAttempts DO
    ticketId ← generateTicketId(year, random(10000))
    res ← await db.insertLead(toLeadRow(data, ticketId, deadline))   // try/catch: throw → code "error"
    IF res.ok THEN RETURN 201 {ok:true, ticketId, callbackDeadline: iso(deadline)}
    IF res.code ≠ "unique_violation" THEN RETURN 500 {error:"server_error"}
  END FOR
  RETURN 500 {error:"server_error"}
END
```

- Post: at most one successful `insertLead` per call; the stored row contains only whitelisted columns; the response never echoes submitted values or database error text; `status` defaults to `new` in the database.

### 7.22 `handleBooking({ rawBody, headers, now, random, db, limiter })`

```pascal
ALGORITHM handleBooking
BEGIN
  same-origin, rate limit ("booking:" + ip) and body parsing exactly as handleQuote
  req ← pickBookingFields(body)   // packageId, tierId, adults, children, travelDate, leadName, email, phone, agreeTerms
                                  // every other key (prices, totals, advance, card fields) is ignored
  IF db = null THEN RETURN 503 {error:"unavailable"}
  pkg ← await db.getPublishedPackage(req.packageId)        // null if missing, unpublished or invalid
  IF pkg = null THEN RETURN 400 {error:"validation", errors:{packageId:"This package is not available"}}
  today ← todayISOInZone(now, BUSINESS.timeZone)
  v ← validateCheckout(req, today, pkg)
  IF NOT v.valid THEN RETURN 400 {error:"validation", errors: v.errors}
  tier ← pkg.tiers.find(t => t.id = req.tierId)
  b ← computeBookingBreakdown({tier, adults: req.adults, children: req.children}, req.travelDate, today, BUSINESS.paymentPolicy)
  FOR attempt ← 1 TO API_LIMITS.maxIdAttempts DO
    ref ← generateBookingRef(random(2^32))
    res ← await db.insertBooking({ booking_ref: ref, package_id: pkg.id, tier_id: tier.id,
            adults: b.adults, children: b.children, travel_date: req.travelDate,
            lead_name: trim(req.leadName), email: trim(req.email), phone: trim(req.phone),
            land_total_inr: b.total, advance_inr: b.advance, balance_inr: b.balance,
            balance_due_date: b.balanceDueDate, rule: b.rule })          // status defaults to 'pending'
    IF res.ok THEN RETURN 201 {ok:true, bookingRef: ref, breakdown: pick(b, total, advanceRate, advance, balance, balanceDueDate, rule)}
    IF res.code ≠ "unique_violation" THEN RETURN 500 {error:"server_error"}
  END FOR
  RETURN 500 {error:"server_error"}
END
```

- Post: stored amounts equal `computeBookingBreakdown` of the database tier with the server's IST date, independent of any price-like value in the request; no card data is read, stored, logged or returned.

### 7.23 `createRateLimiter({ limit, windowMs, maxKeys })`

```javascript
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {
  const hits = new Map();                              // key → ascending timestamps within the window
  return {
    check(key, nowMs) {
      const log = (hits.get(key) ?? []).filter(t => nowMs - t < windowMs);
      if (log.length >= limit) { hits.set(key, log); return { allowed: false, remaining: 0, retryAfterMs: windowMs - (nowMs - log[0]) }; }
      log.push(nowMs); hits.delete(key); hits.set(key, log);   // re-insert = most recently used
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value); // evict least recently used key
      return { allowed: true, remaining: limit - log.length, retryAfterMs: 0 };
    },
  };
}
```

- Post: for any key and any time interval of length `windowMs`, at most `limit` calls return `allowed: true`; keys are independent; memory is bounded by `maxKeys × limit` timestamps. Best-effort only: state lives in one server instance and resets on restart or cold start.

### 7.24 `parseJsonBody`, `clientIp`, `isSameOrigin`, `todayISOInZone`

- `parseJsonBody(text, { maxBytes, contentType })`: `contentType` must start with `application/json` (else 415); UTF-8 byte length of `text` ≤ `maxBytes` (else 413); `JSON.parse` must succeed (else 400 `bad_json`) and yield a plain object (else 400 `bad_json`). Never throws.
- `clientIp(headers)`: first comma-separated entry of `x-forwarded-for`, trimmed, else `x-real-ip`, else `"unknown"`. Trusted only behind a proxy that sets the header (Vercel does); on other hosts it can be spoofed, which weakens rate limiting but nothing else.
- `isSameOrigin(origin, host)`: true when `origin` is absent; otherwise true iff `new URL(origin).host === host`; malformed origin → false.
- `todayISOInZone(date, timeZone)`: `new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date)`; for "Asia/Kolkata" (UTC+05:30, no DST) this equals the UTC date of `date + 330 minutes`.

### 7.25 `checkAdmin` / `runAdminMutation`

```javascript
export async function runAdminMutation({ getUser, isAdminUser, validate = () => ({ valid: true, errors: {} }), mutate }) {
  const auth = await checkAdmin({ getUser, isAdminUser });     // getUser → user | null (auth.getUser())
  if (!auth.ok) return { ok: false, reason: auth.reason };      // "unauthenticated" | "forbidden"
  const v = validate();
  if (!v.valid) return { ok: false, reason: "invalid", errors: v.errors };
  return { ok: true, value: await mutate(auth.user) };
}
```

- Post: `mutate` is called exactly once iff the user exists, `isAdminUser(user)` is true and validation passes; otherwise it is never called. Status updates validate against `LEAD_STATUSES` / `BOOKING_STATUSES`; package and destination saves validate with 7.18 / 7.19.

### 7.26 `buildMetadata(business)` / `buildViewport()`

- `buildMetadata(BUSINESS)` → `{ metadataBase: new URL(website), title: "{brandName} · {tagline}", description, openGraph: { title, url: website, images: [{ url: ogImage, width: 1200, height: 630 }] }, twitter: { card: "summary_large_image" }, icons: { icon: favicon, apple: favicon } }`; `buildViewport()` → `{ themeColor: "#070a1a" }`. Pure.

