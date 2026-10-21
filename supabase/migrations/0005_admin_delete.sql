-- 0005_admin_delete.sql: let admins delete quotations (leads) and bookings.
-- Run once in the Supabase SQL editor (safely re-runnable).
-- Deletes are permanent. RLS still requires is_admin() for every row.

grant delete on public.leads, public.bookings to authenticated;

drop policy if exists leads_admin_delete on public.leads;
create policy leads_admin_delete on public.leads
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists bookings_admin_delete on public.bookings;
create policy bookings_admin_delete on public.bookings
  for delete to authenticated using ((select public.is_admin()));
