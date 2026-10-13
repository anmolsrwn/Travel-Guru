-- 0001_init.sql: Travel Guru Raipur schema, RLS and grants.
-- Run in the Supabase SQL editor or with `supabase db push`. Written to be safely re-runnable:
-- types are created only when missing, tables/indexes use IF NOT EXISTS, and triggers/policies
-- are dropped and recreated. Re-running does not alter columns of tables that already exist.
-- Requirements 41.1–41.8; design section 6.4.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.lead_status as enum ('new', 'contacted', 'quoted', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- admins: one row per Supabase Auth user allowed into /admin. Inserted manually (no sign-up).
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Security definer so RLS policies can check admin membership without exposing public.admins.
-- Fixed empty search_path: every reference is schema-qualified.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------
create table if not exists public.packages (
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 64),
  title        text not null check (char_length(title) between 2 and 120),
  region       text not null check (region in ('international', 'domestic')),
  categories   text[] not null check (
                 categories <@ array['international','domestic','honeymoon','family','beach']::text[]
                 and region = any (categories)),
  nights       integer not null check (nights between 1 and 60),
  days         integer not null check (days = nights + 1),
  image        text not null check (char_length(image) between 1 and 500),
  data         jsonb not null check (jsonb_typeof(data) = 'object'),
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);
create index if not exists packages_published_sort on public.packages (is_published, sort_order, id);
drop trigger if exists packages_set_updated_at on public.packages;
create trigger packages_set_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- destinations
-- ---------------------------------------------------------------------------
create table if not exists public.destinations (
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 64),
  name         text not null check (char_length(name) between 1 and 80),
  tagline      text not null check (char_length(tagline) between 1 and 120),
  region       text not null check (region in ('international', 'domestic')),
  image        text not null check (char_length(image) between 1 and 500),
  package_id   text references public.packages (id) on update cascade on delete set null,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  updated_at   timestamptz not null default now()
);
create index if not exists destinations_published_sort on public.destinations (is_published, sort_order, id);
create index if not exists destinations_package_id on public.destinations (package_id);
drop trigger if exists destinations_set_updated_at on public.destinations;
create trigger destinations_set_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- leads (quotation requests; inserted only by POST /api/quote via the service role)
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         text not null unique check (ticket_id ~ '^QT-[0-9]{4}-[0-9]{4}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  services          text[] not null check (
                      cardinality(services) between 1 and 8
                      and services <@ array['Flights','Hotels','Passport','Visa','Holidays',
                                            'Travel Insurance','Train','Packages']::text[]),
  departure_city    text not null default '' check (char_length(departure_city) <= 80),
  destinations      text not null default '' check (char_length(destinations) <= 200),
  departure_date    date,
  duration          text not null default '' check (char_length(duration) <= 40),
  trip_type         text not null default '' check (char_length(trip_type) <= 40),
  adults            integer not null check (adults between 1 and 12),
  children          integer not null default 0 check (children between 0 and 8),
  child_ages        text not null default '' check (char_length(child_ages) <= 100),
  hotel_category    text not null default '' check (char_length(hotel_category) <= 40),
  meal_plan         text not null default '' check (char_length(meal_plan) <= 40),
  budget            text not null default '' check (char_length(budget) <= 40),
  full_name         text not null check (char_length(full_name) between 2 and 80),
  phone             text not null check (char_length(phone) between 1 and 20),
  email             text not null default '' check (char_length(email) <= 254),
  callback_slot     text not null default '' check (char_length(callback_slot) <= 20),
  callback_deadline timestamptz not null,
  notes             text not null default '' check (char_length(notes) <= 1000),
  status            public.lead_status not null default 'new'
);
create index if not exists leads_created_at on public.leads (created_at desc);
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings (booking requests; inserted only by POST /api/booking via the service role)
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  booking_ref      text not null unique check (booking_ref ~ '^BK-[A-HJ-NP-Z2-9]{6}$'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  package_id       text not null references public.packages (id) on update cascade on delete restrict,
  tier_id          text not null check (tier_id in ('deluxe', 'superior', 'premium')),
  adults           integer not null check (adults between 1 and 12),
  children         integer not null default 0 check (children between 0 and 8),
  travel_date      date not null,
  lead_name        text not null check (char_length(lead_name) between 2 and 80),
  email            text not null check (char_length(email) between 3 and 254),
  phone            text not null check (char_length(phone) between 1 and 20),
  land_total_inr   integer not null check (land_total_inr > 0),
  advance_inr      integer not null check (advance_inr > 0 and advance_inr <= land_total_inr),
  balance_inr      integer not null check (balance_inr >= 0),
  balance_due_date date,
  rule             text not null check (rule in ('within-window', 'below-threshold', 'standard')),
  status           public.booking_status not null default 'pending',
  constraint bookings_amounts_conserved check (advance_inr + balance_inr = land_total_inr),
  constraint bookings_full_payment_shape check (
    rule = 'standard' or (balance_inr = 0 and balance_due_date is null))
);
create index if not exists bookings_created_at on public.bookings (created_at desc);
create index if not exists bookings_package_id on public.bookings (package_id);
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: enabled on every table. The service role (route handlers, seed) bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.admins       enable row level security;
alter table public.packages     enable row level security;
alter table public.destinations enable row level security;
alter table public.leads        enable row level security;
alter table public.bookings     enable row level security;

-- admins: a signed-in user can see only their own row (used by checkAdmin); no writes via the API.
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- packages / destinations: anyone reads published rows; admins have full CRUD.
drop policy if exists packages_public_read on public.packages;
create policy packages_public_read on public.packages
  for select to anon, authenticated using (is_published);
drop policy if exists packages_admin_all on public.packages;
create policy packages_admin_all on public.packages
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists destinations_public_read on public.destinations;
create policy destinations_public_read on public.destinations
  for select to anon, authenticated using (is_published);
drop policy if exists destinations_admin_all on public.destinations;
create policy destinations_admin_all on public.destinations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- leads / bookings: no anon policy at all; admins read and update (status column only, see grants).
-- There is deliberately no INSERT policy: inserts happen only with the service role key.
drop policy if exists leads_admin_select on public.leads;
create policy leads_admin_select on public.leads
  for select to authenticated using ((select public.is_admin()));
drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists bookings_admin_select on public.bookings;
create policy bookings_admin_select on public.bookings
  for select to authenticated using ((select public.is_admin()));
drop policy if exists bookings_admin_update on public.bookings;
create policy bookings_admin_update on public.bookings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Grants: defence in depth on top of RLS (Supabase grants all table privileges to anon and
-- authenticated by default). Revoking table-level UPDATE also clears column privileges, so the
-- column-level grant below is re-applied on every run.
-- ---------------------------------------------------------------------------
revoke all on public.leads, public.bookings, public.admins from anon;
revoke insert, update, delete, truncate on public.packages, public.destinations from anon;
revoke insert, update, delete, truncate on public.leads, public.bookings, public.admins from authenticated;
grant select on public.leads, public.bookings, public.admins to authenticated;
grant update (status) on public.leads, public.bookings to authenticated;
