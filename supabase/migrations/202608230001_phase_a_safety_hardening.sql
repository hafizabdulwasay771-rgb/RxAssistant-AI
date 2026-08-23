-- Phase A safety hardening: alerts, Realtime, legacy table isolation, and grants.
-- This migration does not modify FEFO or historical alert data.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table public.alerts;
  end if;
end
$$;

create or replace function public.rxassistant_skip_duplicate_active_alert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('unread', 'read')
     and exists (
       select 1
       from public.alerts existing_alert
       where existing_alert.pharmacy_id = new.pharmacy_id
         and existing_alert.type = new.type
         and existing_alert.title = new.title
         and existing_alert.message = new.message
         and existing_alert.medicine_id is not distinct from new.medicine_id
         and existing_alert.status in ('unread', 'read')
     ) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists rxassistant_alerts_dedupe_insert on public.alerts;
create trigger rxassistant_alerts_dedupe_insert
before insert on public.alerts
for each row execute function public.rxassistant_skip_duplicate_active_alert();

create unique index if not exists rxassistant_alerts_active_dedupe_idx
on public.alerts (
  pharmacy_id,
  type,
  title,
  message,
  coalesce(medicine_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where status in ('unread', 'read');

-- The legacy table is retained for compatibility but is not a client API.
drop policy if exists rxassistant_legacy_sales_item_deny_all on public.sales_item;
create policy rxassistant_legacy_sales_item_deny_all
on public.sales_item
for all
to public
using (false)
with check (false);
revoke all on table public.sales_item from public, anon, authenticated;

-- Internal trigger functions do not need direct Data API execution.
revoke all on function public.rxassistant_set_updated_at() from public, anon, authenticated;
revoke all on function public.rxassistant_protect_profile_fields() from public, anon, authenticated;
revoke all on function public.rxassistant_protect_alert_fields() from public, anon, authenticated;
revoke all on function public.rxassistant_handle_new_user() from public, anon, authenticated;
grant execute on function public.rxassistant_set_updated_at() to postgres, service_role;
grant execute on function public.rxassistant_protect_profile_fields() to postgres, service_role;
grant execute on function public.rxassistant_protect_alert_fields() to postgres, service_role;
grant execute on function public.rxassistant_handle_new_user() to postgres, service_role;

-- These helpers are required by authenticated RLS policy evaluation, but not by anon.
revoke all on function public.current_pharmacy_id() from public, anon;
revoke all on function public.rxassistant_is_pharmacy_admin() from public, anon;
grant execute on function public.current_pharmacy_id() to authenticated, service_role;
grant execute on function public.rxassistant_is_pharmacy_admin() to authenticated, service_role;

-- POS is intentionally callable by authenticated users; it is the only client
-- checkout path and already validates auth, pharmacy, stock, and FEFO conditions.
revoke all on function public.complete_sale(text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.complete_sale(text, text, text, numeric, numeric, jsonb) to authenticated, service_role;

alter function public.rxassistant_set_updated_at() set search_path = public;
alter function public.rxassistant_protect_profile_fields() set search_path = public;
alter function public.rxassistant_protect_alert_fields() set search_path = public;
alter function public.rxassistant_handle_new_user() set search_path = public;
alter function public.current_pharmacy_id() set search_path = public;
alter function public.rxassistant_is_pharmacy_admin() set search_path = public;
alter function public.complete_sale(text, text, text, numeric, numeric, jsonb) set search_path = public;
