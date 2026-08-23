-- Phase A follow-up: keep the alert dedupe trigger internal to the database.
revoke all on function public.rxassistant_skip_duplicate_active_alert() from public, anon, authenticated;
grant execute on function public.rxassistant_skip_duplicate_active_alert() to postgres, service_role;
alter function public.rxassistant_skip_duplicate_active_alert() set search_path = public;
