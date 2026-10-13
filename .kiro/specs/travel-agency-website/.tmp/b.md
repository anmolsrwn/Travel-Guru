### 3.10 Brand assets and meta tags

| Asset | Path | Source | Used by |
|---|---|---|---|
| Logo | `public/assets/logo.png` (URL `/assets/logo.png`) | USER-SUPPLIED (transparent or black-background PNG) | Header (48px), footer (64px), quote-section `<noscript>` note |
| Favicon | `public/assets/favicon.png` | USER-SUPPLIED or generated from the logo (≥ 192×192, square crop of the ring) | `metadata.icons.icon` and `metadata.icons.apple` |
| OG image | `public/assets/og-image.jpg` | USER-SUPPLIED or generated (1200×630, logo on `--bg-0` with tagline) | `metadata.openGraph.images` as absolute URL `https://travelgururaipur.com/assets/og-image.jpg`, `twitter.card` `summary_large_image` |
| Founder photo | `public/assets/founder.jpg` | USER-SUPPLIED | Your Travel Expert section |

The existing `assets/` folder moves to `public/assets/`, and the `BUSINESS` paths become root-relative (`/assets/logo.png` and so on). `app/layout.js` exports `metadata = buildMetadata(BUSINESS)` and `viewport = buildViewport()` from `lib/seo.js`: `<title>` and `og:title` "Travel Guru Raipur · Your Journey, Our Priority", `metadataBase` and `og:url` = `BUSINESS.website`, `themeColor` `#070a1a`. Next.js renders these into the server HTML, so crawlers see them without running JS, and they can no longer drift from `BUSINESS`. A unit test checks `buildMetadata` output against `BUSINESS`.

## Sequence Diagrams

### 4.1 Quotation submit (primary pathway)

```mermaid
sequenceDiagram
    actor U as Visitor
    participant F as QuoteForm (client)
    participant L as lib/logic.js
    participant R as POST /api/quote (route.js)
    participant C as handleQuote (lib/server/quote.js)
    participant D as Supabase leads (service role)
    participant M as TicketModal
    U->>F: Click "Submit & Guarantee 24h Call Back"
    F->>L: validateQuoteForm(data, localTodayISO, {mode:"submit"})
    alt invalid on client
        L-->>F: {valid:false, errors}
        F-->>U: Inline errors, focus first invalid field
    else valid
        F->>R: fetch POST JSON {fields..., website: honeypot} (10 s timeout)
        R->>C: handleQuote({body, ip, origin, host, now, random, db, limiter})
        C->>C: same-origin check, rate limit (5 / 10 min per IP), body parse (≤ 16 KB)
        alt honeypot filled
            C-->>R: 201 {ticketId (well-formed, not stored), callbackDeadline}
        else
            C->>L: validateQuoteForm(fields, todayISOInZone(now, "Asia/Kolkata"), submit)
            alt invalid
                C-->>R: 400 {error:"validation", errors}
            else valid
                loop up to 5 attempts
                    C->>L: generateTicketId(istYear, crypto n ∈ [0, 9999])
                    C->>D: insertLead(row)
                    D-->>C: ok | unique_violation | error
                end
                C-->>R: 201 {ok:true, ticketId, callbackDeadline}
            end
        end
        R-->>F: JSON + Cache-Control: no-store
        alt 201
            F->>M: open(ticketId, summary from form data, deadline)
        else 400
            F-->>U: Server field errors shown inline
        else 429 / 5xx / network / timeout
            F-->>U: Error message + "Continue on WhatsApp" (form kept)
        end
    end
```

### 4.2 WhatsApp instant quote / booking (secondary pathway, client only)

```mermaid
sequenceDiagram
    actor U as Visitor
    participant F as QuoteForm / CheckoutModal (client)
    participant L as lib/logic.js
    participant W as wa.me
    U->>F: Click "Instant Quote via WhatsApp"
    F->>L: validateQuoteForm(formData, localTodayISO, {mode:"whatsapp"})
    L-->>F: result (name + phone + ≥1 service required)
    F->>L: composeQuoteWhatsAppMessage(formData, BUSINESS)
    F->>L: buildWhatsAppUrl(BUSINESS.whatsapp, message)
    F->>W: window.open(url, "_blank", "noopener") (fallback: location.href)
    Note over F,W: No request reaches /api/quote or the database
```

### 4.3 Booking request (Mode B, server price recomputation)

```mermaid
sequenceDiagram
    actor U as Visitor
    participant C as CheckoutModal (client)
    participant L as lib/logic.js
    participant R as POST /api/booking
    participant H as handleBooking (lib/server/booking.js)
    participant P as packages (anon read, RLS: published)
    participant B as bookings (service role insert)
    participant V as VoucherModal
    U->>C: Book Now (packageId, tierId from modal or cheapest)
    U->>C: Tier, adults, children, travel date, name, email, phone, agree terms
    C->>L: computeBookingBreakdown(selection, date, localTodayISO, policy)
    L-->>C: preview (indicative; server is authoritative)
    U->>C: Confirm Booking Request
    C->>L: validateCheckout(form, localTodayISO, pkg)
    C->>R: POST {packageId, tierId, adults, children, travelDate, leadName, email, phone, agreeTerms}
    R->>H: handleBooking({body, ip, origin, host, now, random, db, limiter})
    H->>H: same-origin, rate limit, body parse, whitelist fields (prices / card keys ignored)
    H->>P: getPublishedPackage(packageId)
    alt missing or unpublished
        H-->>R: 400 {errors:{packageId}}
    else found
        H->>L: validateCheckout(fields, todayIST, dbPkg)
        H->>L: computeBookingBreakdown({tier: dbTier, adults, children}, travelDate, todayIST, BUSINESS.paymentPolicy)
        loop up to 5 attempts
            H->>L: generateBookingRef(crypto n ∈ [0, 2^32))
            H->>B: insertBooking(row with server amounts, status "pending")
        end
        H-->>R: 201 {bookingRef, breakdown}
    end
    R-->>C: JSON (no-store)
    C->>V: open(bookingRef, server breakdown, "No payment has been taken")
```

### 4.4 Public page render (ISR + fallback)

```mermaid
sequenceDiagram
    participant N as Next.js (app/page.js, revalidate = 300)
    participant S as loadPublicContent (lib/server/content.js)
    participant A as Anon client (no cookies)
    participant D as Supabase (RLS: is_published)
    participant F as lib/data.js
    N->>S: loadPublicContent({ client: publicClientOrNull(), fallback })
    alt env vars missing (client = null)
        S->>F: PACKAGES, DESTINATIONS
        S-->>N: {packages, destinations, source:"fallback"}
    else
        S->>A: select packages, destinations order by sort_order, id
        A->>D: REST query
        alt error / throw / timeout
            S->>F: static lists (per list)
            S-->>N: source "fallback" for that list (server log, no PII)
        else rows
            S->>S: rowToPackage / rowToDestination, drop rows failing validatePackage / validateDestination, null dangling packageId
            S-->>N: {packages, destinations, source:"database"}
        end
    end
    N-->>N: render Server Components, pass serialisable props to client components
    Note over N: Cached for 300 s; revalidatePath("/") after an admin save regenerates it on the next request
```

### 4.5 Admin sign-in and protected request

```mermaid
sequenceDiagram
    actor A as Admin
    participant P as proxy.js (matcher /admin/:path*)
    participant L as /admin/login + signIn action
    participant G as Supabase Auth
    participant S as Admin page (Server Component)
    participant D as Supabase (session client, RLS)
    A->>P: GET /admin
    P->>G: auth.getUser() (refresh cookies)
    alt no session
        P-->>A: 307 redirect /admin/login
        A->>L: email + password (form → server action)
        L->>L: rate limit (10 / 15 min per IP)
        L->>G: signInWithPassword
        alt bad credentials
            L-->>A: "Invalid email or password"
        else ok
            G-->>L: session cookies set
            L-->>A: redirect /admin
        end
    else session
        P-->>S: continue
        S->>D: checkAdmin: getUser() + select own row from admins
        alt not an admin
            S-->>A: "Not authorised" + Sign out (no data)
        else admin
            S->>D: select leads order by created_at desc (RLS: is_admin())
            S-->>A: Leads table (noindex, no-store)
        end
    end
```

### 4.6 Admin edits a package

```mermaid
sequenceDiagram
    actor A as Admin
    participant F as PackageForm (client)
    participant L as lib/logic.js
    participant X as savePackage (server action)
    participant D as Supabase packages (session client, RLS)
    A->>F: Edit fields + JSON for data (tiers, hotels, itinerary, extras, notes)
    F->>F: JSON.parse(data) (syntax error → message, no submit)
    F->>L: validatePackage(rowToPackage(merged), {imageHosts})
    alt invalid
        F-->>A: errors by path (e.g. tiers[1].hotels nights ≠ 6)
    else valid
        F->>X: submit FormData
        X->>X: runAdminMutation: getUser + is admin? (else reject)
        X->>L: validatePackage again (never trust the client)
        X->>D: upsert packageToRow(pkg) (RLS: is_admin())
        X->>X: revalidatePath("/")
        X-->>F: {ok:true} → "Saved"
    end
```

