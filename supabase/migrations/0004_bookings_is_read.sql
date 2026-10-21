-- 0004_bookings_is_read.sql: same inbox-style flags as quotations (0003), for bookings.
-- Run once in the Supabase SQL editor (safely re-runnable).
--   is_read: false = new (shown bold); becomes true when an admin opens the row.
--   is_done: false = still to be handled (tick box empty); admin ticks it once it is dealt with.
-- Existing bookings are marked read (so the list does not start all bold) but NOT done.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'is_read'
  ) then
    alter table public.bookings add column is_read boolean not null default false;
    update public.bookings set is_read = true;
  end if;
end $$;

alter table public.bookings add column if not exists is_done boolean not null default false;

-- Admins may update only status, is_read and is_done (RLS still requires is_admin()).
grant update (status, is_read, is_done) on public.bookings to authenticated;  