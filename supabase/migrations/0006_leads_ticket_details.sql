-- 0006_leads_ticket_details.sql: flight / train details on quotations.
-- Run once in the Supabase SQL editor, BEFORE people start using the new quote form
-- (round trips and ticket classes are stored here). Safely re-runnable.
-- ticket_details (tickets): { journey: 'One way'|'Round trip', returnDate?, flightClass?, trainClass? }.
-- ticket_details (trips):   { transport: 'Flight'|'Train'|'Any', flightClass?, trainClass? }. NULL when there is nothing to store.
-- RLS and grants are unchanged (admins already have select; inserts use the service role).

alter table public.leads add column if not exists ticket_details jsonb;

comment on column public.leads.ticket_details is
  'Flight / train ticket details {journey, returnDate, flightClass, trainClass} or trip transport {transport, flightClass, trainClass}; NULL when nothing to store.';

alter table public.leads drop constraint if exists leads_ticket_details_object;
alter table public.leads add constraint leads_ticket_details_object
  check (ticket_details is null or jsonb_typeof(ticket_details) = 'object');