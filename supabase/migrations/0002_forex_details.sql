-- 0002_forex_details.sql: store forex quote details on leads and allow the 'Forex' service.
-- APPLY THIS MIGRATION TO THE SUPABASE PROJECT BEFORE DEPLOYING THE API CHANGE. Once the API
-- writes `forex_details` and the 'Forex' service, inserts fail if the column / constraint are missing.
-- Run in the Supabase SQL editor or with `supabase db push`. Safely re-runnable: the column uses
-- IF NOT EXISTS and the constraints are dropped and recreated. RLS and grants are unchanged
-- (0001_init.sql already grants table-level select on leads to authenticated admins; inserts use
-- the service role). No index: nothing filters on this column.
-- Requirement 5.5 (forex-counter spec).

-- ---------------------------------------------------------------------------
-- forex_details: { direction: 'buy'|'sell', currency: 'USD'|..., amount: number } or NULL
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists forex_details jsonb;

comment on column public.leads.forex_details is
  'Forex quote details {direction, currency, amount} (foreign-currency amount); NULL unless the lead selected the Forex service.';

alter table public.leads drop constraint if exists leads_forex_details_object;
alter table public.leads add constraint leads_forex_details_object
  check (forex_details is null or jsonb_typeof(forex_details) = 'object');

-- ---------------------------------------------------------------------------
-- services: 0001 restricts the allowed values to 8 services (max 8 entries). Replace that check so
-- 'Forex' is accepted (9 services). Any existing check on leads that mentions `services` is
-- dropped by definition lookup (not by name), then recreated under its default name.
-- ---------------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.leads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%services%'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.leads add constraint leads_services_check check (
  cardinality(services) between 1 and 9
  and services <@ array['Flights','Hotels','Passport','Visa','Holidays',
                        'Travel Insurance','Train','Packages','Forex']::text[]);
