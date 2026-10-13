### 5.3 Routes and rendering

| Route | Kind | Rendering | Auth |
|---|---|---|---|
| `/` | `app/page.js` Server Component | ISR, `export const revalidate = 300`; regenerated after `revalidatePath("/")` | Public |
| `POST /api/quote` | Route Handler, `export const runtime = "nodejs"`, `export const dynamic = "force-dynamic"` | Dynamic, `Cache-Control: no-store` | Public, unauthenticated by design (rate limited, honeypot, same-origin check) |
| `POST /api/booking` | Route Handler, Node.js runtime | Dynamic, `no-store` | Public, unauthenticated by design (rate limited, same-origin check) |
| `/admin/login` | Server Component + `LoginForm` | Dynamic, noindex | Public (sign-in only, no sign-up) |
| `/admin`, `/admin/bookings`, `/admin/packages`, `/admin/packages/[id]`, `/admin/destinations`, `/admin/destinations/[id]` | Server Components + admin client forms | Dynamic (`export const dynamic = "force-dynamic"`), noindex, `no-store` | Supabase session + admin row, checked in `proxy.js`, in every page and in every server action |

`app/page.js` (sketch):

```javascript
import { preload } from "react-dom";
import { BUSINESS, PACKAGES, DESTINATIONS } from "@/lib/data";
import { loadPublicContent } from "@/lib/server/content";
import { getPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;

export default async function Home() {
  preload(BUSINESS.heroImage, { as: "image", fetchPriority: "high" });
  const { packages, destinations } = await loadPublicContent({
    client: getPublicClient(),                    // null when env vars are missing
    fallback: { packages: PACKAGES, destinations: DESTINATIONS },
    log: (msg) => console.warn(msg),             // ids and error codes only, no PII
  });
  return (
    <main>
      <Hero /> <TrustStrip /> <Services />
      <Collections packages={packages} />
      <Destinations destinations={destinations} packages={packages} />
      <HowItWorks /> <QuoteSection /> <Expert /> <Reviews /> <Faq /> <Terms /> <FinalCta />
    </main>
  );
}
```

`app/layout.js` renders `<html lang="en" className={`${poppins.variable} ${jakarta.variable}`}>`, then `<body>` with `CurrencyProvider` → `ModalProvider` → `QuoteIntentProvider` around `<Header />`, `{children}`, `<Footer />`, `<FloatingWhatsApp />` and `<MobileStickyBar />`. The modal root is a portal at the end of `<body>`.

### 5.4 Client components (`'use client'`)

Static sections (Hero, TrustStrip, Services, HowItWorks, Expert, Reviews, FinalCta, Footer, section shells of Collections, Destinations, Quote, FAQ and Terms) are Server Components with CSS Modules. Only these pieces ship client JS:

```javascript
// components/client/CurrencyProvider.jsx
// Context { currency, setCurrency }. Initial render "INR" (matches server HTML), then reads
// localStorage "tg.currency" in useEffect; invalid or unavailable storage → INR, overwritten.
export function CurrencyProvider({ children }) {}
export function useCurrency() {}                      // → { currency, setCurrency(code) }
export function Price({ inr, decimals }) {}           // formatPrice(convertPrice(inr, currency), currency)
export function CurrencySwitcher({ variant }) {}      // "header" select | "segmented" radios; both bound to context

// components/client/ModalProvider.jsx + Modal.jsx
// Single open modal: { open(id, props, triggerEl), replace(id, props), close() }.
// replace() swaps content (itinerary → checkout) and keeps the original trigger for focus return.
export function ModalProvider({ children }) {}
export function useModal() {}
export function Modal({ titleId, onClose, size = "md" | "lg", children }) {}
// role="dialog", aria-modal="true", aria-labelledby={titleId}; portal into document.body;
// focus first focusable on open; Tab / Shift+Tab wrap inside; Escape and backdrop click close;
// body scroll lock that restores the prior scroll offset; focus returns to the trigger;
// `inert` on the page root while open; mobile: full-screen sheet.

// components/client/Header.jsx: logo (LogoImage), nav links, CurrencySwitcher, drawer with
// aria-expanded, Escape closes and focuses the hamburger, scroll state at 40px, header-offset scrolling.
export function Header() {}

// components/client/QuoteIntentProvider.jsx: cross-section prefill without a global DOM query.
export function QuoteIntentProvider({ children }) {}
export function useQuoteIntent() {}                   // → { intent, enquireService(option), quoteDestination(name) }
export function EnquireButton({ quoteOption, label }) {} // used inside the Services Server Component

export function CategoryFilter({ packages }) {}       // tabs + cards; filterPackages; opens ItineraryModal / CheckoutModal
export function DestinationTiles({ destinations, packages }) {} // destinationsByRegion grids; Get a Quote; View Package
export function ItineraryModal({ pkg, initialTierId }) {} // tier switcher, hotels, inclusions, extras, timeline
export function CheckoutModal({ pkg, tierId, mode }) {}   // Mode A WhatsApp, Mode B booking request → /api/booking
export function VoucherModal({ booking }) {}          // server bookingRef + breakdown, Print
export function QuoteForm() {}                        // 3 steps, honeypot "website", → /api/quote, WhatsApp mode
export function TicketModal({ ticket, data }) {}      // ticketId + deadline from the API
export function FaqAccordion({ items }) {}
export function TermsTabs({ policies, paymentPolicy }) {} // tabs ≥ 1024px, accordion below; #terms-* deep links
export function WhatsAppButton({ message, children }) {}  // buildWhatsAppUrl + window.open(noopener), fallback location.href
export function FloatingWhatsApp() {}
export function MobileStickyBar() {}
export function SafeImage({ src, alt, width, height, priority }) {} // <img>, lazy unless priority, onError → placeholder
export function LogoImage({ size }) {}                // BUSINESS.logo, onError → CSS "TG" Logo_Mark (role="img")
export function Reveal({ children }) {}               // IntersectionObserver once; no-op under reduced motion or no IO
```

Client-side access rules: client components are the only browser code touching the DOM, `localStorage` (currency only), `window.open`, the local date (`localTodayISO()` built from `new Date()` local fields) and `fetch`. They never import `lib/server/*` or `lib/supabase/*`. Every value is rendered through React (auto-escaped); `dangerouslySetInnerHTML` is not used anywhere. The checkout "Terms & Cancellation Policy" link opens `/#terms-cancellation` in a new tab (`target="_blank" rel="noopener noreferrer"`), so the open checkout keeps its values.

### 5.5 Server handler cores (`lib/server/*`, pure, injected dependencies)

```javascript
// lib/server/request.js
export function parseJsonBody(text, { maxBytes, contentType, contentLength }) {}
// → { ok:true, value:object } | { ok:false, status:413|415|400, error:"too_large"|"unsupported_media_type"|"bad_json" }
export function clientIp(headers) {}          // first x-forwarded-for entry, else x-real-ip, else "unknown"
export function isSameOrigin(originHeader, hostHeader) {} // true when Origin absent, or Origin host === Host

// lib/server/rate-limit.js  (sliding-window log, in-memory, per server instance)
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {}
// → { check(key, nowMs) → { allowed:boolean, remaining:number, retryAfterMs:number } }

// lib/server/time.js
export function todayISOInZone(date, timeZone) {} // Intl.DateTimeFormat("en-CA", { timeZone }) → "YYYY-MM-DD"

// lib/server/quote.js
export async function handleQuote({ rawBody, headers, now, random, db, limiter }) {}
// → { status, headers, body }  db: { insertLead(row) → {ok:true} | {ok:false, code:"unique_violation"|"error"} } | null

// lib/server/booking.js
export async function handleBooking({ rawBody, headers, now, random, db, limiter }) {}
// db: { getPublishedPackage(id) → Package|null, insertBooking(row) → {ok}|{ok:false, code} } | null

// lib/server/content.js
export async function loadPublicContent({ client, fallback, log }) {}
// client: { fetchPackages() → {data, error}, fetchDestinations() → {data, error} } | null

// lib/server/admin.js
export async function checkAdmin({ getUser, isAdminUser }) {}   // → { ok:true, user } | { ok:false, reason:"unauthenticated"|"forbidden" }
export async function runAdminMutation({ getUser, isAdminUser, validate, mutate }) {}
// → { ok:true, value } | { ok:false, reason, errors? }; mutate runs only for admins with valid input
```

`random` is a function `(maxExclusive) → integer` (`crypto.randomInt` in production, a seeded stub in tests); `now` is a `Date`.

### 5.6 Supabase wiring (`lib/supabase/*`, not imported by tests)

| Module | Key | Used by | Notes |
|---|---|---|---|
| `public.js` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `app/page.js` via `loadPublicContent` | `createClient(url, anon, { auth: { persistSession: false } })`; returns `null` when either env var is missing; no cookies, so ISR stays static |
| `server.js` | anon key + user session cookies | admin pages, server actions, `proxy.js` | `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers` (`getAll` / `setAll`) |
| `service.js` | `SUPABASE_SERVICE_ROLE_KEY` | `app/api/*/route.js`, `scripts/seed.js` (own copy) | First line `import "server-only"`; bypasses RLS; never imported by client components; variable never prefixed `NEXT_PUBLIC_` |
| `db.js` | n/a | route handlers | Adapters over the clients: `insertLead`, `insertBooking` (service client), `getPublishedPackage` (anon client, `.eq("is_published", true)`, mapped with `rowToPackage`); maps Postgres `23505` → `unique_violation` and every other error → `error` without leaking details |

Route handler wiring (sketch):

```javascript
// app/api/quote/route.js
import { randomInt } from "node:crypto";
import { handleQuote } from "@/lib/server/quote";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { RATE_LIMITS } from "@/lib/data";
import { getLeadDb } from "@/lib/supabase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const limiter = createRateLimiter(RATE_LIMITS.quote);   // module scope: per server instance

export async function POST(request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 16384) return Response.json({ ok: false, error: "too_large" }, { status: 413 });
  const rawBody = await request.text();
  const res = await handleQuote({
    rawBody, headers: Object.fromEntries(request.headers), now: new Date(),
    random: (max) => randomInt(0, max), db: getLeadDb(), limiter,
  });
  return Response.json(res.body, { status: res.status, headers: { "Cache-Control": "no-store", ...res.headers } });
}
```

### 5.7 Admin area

- `proxy.js` (Next.js 16 file convention; same role as the former `middleware.js`): `export const config = { matcher: ["/admin/:path*"] }`. Creates a `@supabase/ssr` server client bound to the request/response cookies, calls `auth.getUser()` to refresh the session, redirects to `/admin/login` when there is no user (except on `/admin/login` itself), and sets `X-Robots-Tag: noindex, nofollow`. It is an optimistic gate only; authorisation is enforced again below.
- `app/admin/layout.js`: `export const metadata = { robots: { index: false, follow: false } }`, `export const dynamic = "force-dynamic"`; renders the admin nav (Leads, Bookings, Packages, Destinations) and a Sign out button. Pages call `checkAdmin` and render "Not authorised" (with Sign out) for signed-in non-admins.
- `app/admin/actions.js` (`'use server'`): `signIn(formData)`, `signOut()`, `updateLeadStatus(id, status)`, `updateBookingStatus(id, status)`, `savePackage(formData)`, `deletePackage(id)`, `saveDestination(formData)`, `deleteDestination(id)`. Every mutation goes through `runAdminMutation` with the session client (RLS still applies), validates input with the pure validators or the status enums, and calls `revalidatePath("/")` after package or destination changes. Next.js checks the `Origin` of server action posts against the host.
- Leads table (`/admin`): newest first, 50 per page (`?page=`), columns created, ticket, name, phone (`tel:` and WhatsApp link), email, services, destinations, departure, travellers, slot, deadline, status `StatusSelect`.
- Bookings table (`/admin/bookings`): ref, created, package, tier, travellers, travel date, lead, contacts, total, advance, balance, due date, rule, status `StatusSelect`.
- Packages (`/admin/packages`): all rows including unpublished, sort order, from price, published toggle, updated. Edit form: `id` (editable only on create), title, region, categories, nights, days (must equal nights + 1), image, sort order, published, and a JSON textarea for `data` (destination, highlights, hotelStarRating, mealPlan, transferBasis, tiers, extras, inclusions, itinerary, isSample, notes). Client-side `JSON.parse` + `validatePackage` give immediate feedback by path; the server action repeats both. Delete is offered with a confirm; a package referenced by bookings cannot be deleted (FK `restrict`), the UI says "Unpublish instead".
- Destinations (`/admin/destinations`): list + edit form (name, tagline, region, image, package select of existing ids or none, sort order, published), validated by `validateDestination`.
- No sign-up page or action exists. Admin users are created in the Supabase dashboard and granted the role with one SQL insert (see the USER ACTIONS task).

