-- 0003_leads_is_read.sql: inbox-style flags on quotations. Safely re-runnable, run it once in the
-- Supabase SQL editor (before or right after deploying the admin change).
--   is_read: false = new (shown bold); becomes true when an admin opens the row.
--   is_done: false = still to be handled (tick box empty); admin ticks it once the query is solved.
-- Existing leads are marked read (so the inbox does not start all bold) but NOT done, so every
-- tick box starts empty.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'is_read'
  ) then
    alter table public.leads add column is_read boolean not null default false;
    update public.leads set is_read = true;
  end if;
end $$;

alter table public.leads add column if not exists is_done boolean not null default false;

-- Admins may update only status, is_read and is_done (RLS leads_admin_update still requires is_admin()).
grant update (status, is_read, is_done) on public.leads to authenticated;