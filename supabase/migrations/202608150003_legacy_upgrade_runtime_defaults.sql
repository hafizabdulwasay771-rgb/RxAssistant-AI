-- Follow-up to 202608150002_upgrade_legacy_pharmacy_schema.sql.
-- Adds defaults required by the current frontend; it does not modify legacy data.

do $$
begin
  if to_regclass('public.medicines') is null
     or to_regclass('public.sales') is null
     or to_regclass('public.profiles') is null then
    raise exception 'Run 202608150002_upgrade_legacy_pharmacy_schema.sql first.';
  end if;
end;
$$;

alter table public.medicines
  alter column pharmacy_id set default public.current_pharmacy_id(),
  alter column created_by set default auth.uid(),
  alter column created_at set default now();

alter table public.sales
  alter column created_at set default now();
