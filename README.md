# Travel Guru Raipur website

Next.js (App Router) site with a Supabase database, deployed on Vercel at https://www.travelgururaipur.com.

The folders stay where Next.js expects them (`app/`, `components/`, `lib/`), so the files are not physically split into "frontend" and "backend" folders. This page maps every folder to its layer instead.

## Layers at a glance

| Layer | What it does | Where it lives |
|---|---|---|
| Frontend | What visitors and admins see in the browser | `app/**/page.js`, `components/`, `public/`, `app/globals.css` |
| Backend | Server code: forms, emails, admin actions, API | `app/api/`, `app/admin/**/actions.js`, `lib/server/`, `proxy.js` |
| Database | Supabase (Postgres) tables, security rules, data loading | `supabase/migrations/`, `lib/supabase/`, `scripts/seed.js` |
| Shared | Business data and pure logic used by both sides | `lib/data.js`, `lib/logic.js`, `lib/seo.js` and other `lib/*.js` |

## Frontend

**Public pages** (`app/(site)/`)
- `page.js` Home page
- `trips/` Handcrafted trips
- `forex/` Forex counter
- `quote/` Trip quotation form
- `layout.js` Header, footer, floating buttons

**Admin pages** (`app/admin/`)
- `login/` Sign-in page
- `(protected)/page.js` Quotations inbox
- `(protected)/bookings/` Bookings inbox
- `(protected)/packages/` and `destinations/` Content editing

**Components** (`components/`)
- `sections/` Page sections (Hero, Services, Destinations, Reviews, FAQ, Footer...). Server components.
- `client/` Interactive parts (forms, modals, header, season rail, destination tabs). Run in the browser.
- `ui/` Shared styles (buttons, cards, fields, tables)
- `admin/` Admin tables and forms (LeadsTable, BookingsTable, LeadRow...)

**Static files and look**
- `public/assets/` Logo, favicon, founder photo, social image
- `app/globals.css` Global styles and colours
- `app/robots.js`, `app/sitemap.js`, `app/favicon.ico`, `lib/seo.js` Search engine setup

## Backend

**API routes** (`app/api/`)
- `quote/` Receives quotation requests
- `booking/` Receives booking requests
- `forex-quote/` Receives forex quote requests
- `forex-rates/` Serves live forex rates

**Server actions** (admin changes)
- `app/admin/actions.js` Sign in and sign out
- `app/admin/(protected)/leads-actions.js` Quotation status, read and solved ticks
- `app/admin/(protected)/bookings/actions.js` Booking status, read and done ticks
- `app/admin/(protected)/packages/actions.js`, `destinations/actions.js` Content edits

**Server helpers** (`lib/server/`)
- `quote.js`, `booking.js`, `forex-quote.js` Validate and save requests
- `notify.js` and `components/client/web3Notify.js` Email alerts
- `admin.js`, `admin-session.js` Admin access checks
- `content.js`, `siteContent.js` Load packages and destinations
- `rate-limit.js`, `request.js`, `time.js`, `forexRates.js`, `googleReviews.js` Support code

**Security gate:** `proxy.js` sends signed-out visitors away from `/admin`. `next.config.js` sets security headers.

## Database (Supabase)

- `supabase/migrations/` Run these in order in the Supabase SQL editor:
  - `0001_init.sql` Tables, security rules (RLS), admins list
  - `0002_forex_details.sql` Forex fields on quotations
  - `0003_leads_is_read.sql` Unread and solved flags on quotations
  - `0004_bookings_is_read.sql` Unread and done flags on bookings
- `lib/supabase/` Database connections (`public.js` public reads of published content, `server.js` signed-in admin session, `service.js` server-only full-access key used by the API routes, `db.js` query helpers for the API routes)
- `lib/content-mapping.js` Converts between database rows and site objects
- `scripts/seed.js` Loads the starting packages and destinations (`npm run seed`)

**Main tables:** `packages`, `destinations`, `leads` (quotations), `bookings`, `admins`.

Admins are Supabase Auth users that also have a row in `public.admins`. Add a user in Authentication, then run `insert into public.admins (user_id) values ('<user id>');`.

## Shared logic and content

- `lib/data.js` Business details, services, packages, destinations, terms, settings
- `lib/logic.js` Pure rules: pricing, dates, validation, season filtering, region selection
- `lib/package-form.js`, `lib/destination-form.js`, `lib/admin-export.js` Admin form and export helpers
- `tests/` Automated tests (`npm test`)

## Configuration

- `.env.local` Secrets and keys (never committed). Template: `.env.local.example`
- `package.json` Scripts and dependencies
- `next.config.js`, `eslint.config.mjs`, `jsconfig.json` Tool settings
- `AGENTS.md`, `.kiro/` Notes and specs for the Kiro assistant

## Commands

| Command | Use |
|---|---|
| `npm run dev` | Run locally |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run seed` | Load starting content into Supabase |

## Deploying

Pushing to `main` on GitHub starts a Vercel production deploy. Set the same environment variables in Vercel (Supabase keys, `NEXT_PUBLIC_WEB3FORMS_KEY`, email settings). Run any new `supabase/migrations/*.sql` file in Supabase before relying on the code that needs it.

## Loose files in the project root

`convert-logo.html`, `convert-svg.js`, `convert-svg.mjs` and `prototype/index.html` are one-off helpers and the original design prototype. They are not used by the site.