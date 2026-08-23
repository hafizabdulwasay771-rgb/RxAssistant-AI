-- Safe upgrade of the existing legacy Rx Assistant production schema.
-- Preserves public.medicines, public.sales, and public.sales_item unchanged
-- as legacy sources. Do not apply 202608150001_pharmacy_foundation.sql to
-- this database.

create extension if not exists pgcrypto;

-- Refuse to run if the actual legacy contract differs from the reviewed schema.
do $$
begin
  if to_regclass('public.medicines') is null
     or to_regclass('public.sales') is null
     or to_regclass('public.sales_item') is null then
    raise exception 'Expected legacy medicines, sales, and sales_item tables.';
  end if;
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'medicines' and column_name = 'id') <> 'uuid'
     or (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'sales' and column_name = 'id') <> 'bigint'
     or (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'sales_item' and column_name = 'sales_id') <> 'bigint'
     or (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'sales_item' and column_name = 'medicine_id') <> 'bigint' then
    raise exception 'Legacy identifier types differ from the reviewed schema; no coercion is safe.';
  end if;
  if exists (select 1 from public.medicines where id is null)
     or exists (select 1 from public.sales where id is null)
     or exists (select 1 from public.sales_item where id is null)
     or exists (select id from public.medicines group by id having count(*) > 1)
     or exists (select id from public.sales group by id having count(*) > 1)
     or exists (select id from public.sales_item group by id having count(*) > 1) then
    raise exception 'Legacy identifiers must be non-null and unique.';
  end if;
  if exists (
    select 1 from public.sales_item legacy_item
    where not exists (select 1 from public.sales legacy_sale where legacy_sale.id = legacy_item.sales_id)
  ) then
    raise exception 'Legacy sales_item contains an orphaned sales_id.';
  end if;
  if exists (
    select 1 from public.sales_item
    where medicine_id is null
       or quantity is null
       or quantity <= 0
       or selling_price is null
       or selling_price < 0
       or (subtotal is not null and subtotal < 0)
       or coalesce(subtotal, selling_price * quantity) < 0
  ) then
    raise exception 'Legacy sales_item contains unsafe values; no structural changes were made.';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('pharmacies', 'profiles', 'medicines', 'sales', 'sale_items', 'inventory_transactions', 'alerts', 'app_settings')
      and policyname not like 'rxassistant_%'
      and not (
        tablename = 'medicines'
        and policyname in (
          'Authenticated users can delete medicines',
          'Authenticated users can insert medicines',
          'Authenticated users can update medicines',
          'Authenticated users can view medicines'
        )
      )
  ) then
    raise exception 'Existing non-Rx Assistant policies need manual review before this migration.';
  end if;
end;
$$;

-- Existing newer tables must match the reviewed shape; incompatible objects abort.
do $$
declare
  required_columns text[];
  existing_table text;
begin
  foreach existing_table in array array['pharmacies','profiles','sale_items','inventory_transactions','alerts','app_settings'] loop
    if to_regclass(format('public.%I', existing_table)) is not null then
      required_columns := case existing_table
        when 'pharmacies' then array['id','name','legacy_key','created_at','updated_at']
        when 'profiles' then array['id','pharmacy_id','full_name','email','role','pharmacy_name','phone','created_at','updated_at']
        when 'sale_items' then array['id','sale_id','medicine_id','batch_number','quantity','unit_price','total_price','legacy_source_table','legacy_source_id','legacy_medicine_id','created_at']
        when 'inventory_transactions' then array['id','pharmacy_id','medicine_id','transaction_type','quantity','reference_id','notes','created_by','created_at']
        when 'alerts' then array['id','pharmacy_id','type','title','message','medicine_id','priority','status','created_at','resolved_at']
        when 'app_settings' then array['id','pharmacy_id','currency','low_stock_threshold','expiry_warning_days','timezone','expiry_alerts','low_stock_alerts','daily_sales_summary','weekly_business_summary','critical_alerts','created_at','updated_at']
      end;
      if (select count(*) from information_schema.columns where table_schema='public' and table_name=existing_table and column_name=any(required_columns)) <> cardinality(required_columns) then
        raise exception 'Existing public.% has an incompatible Rx Assistant schema; review it before upgrading.', existing_table;
      end if;
      if (existing_table = 'pharmacies' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and column_name='id' and data_type <> 'uuid'))
         or (existing_table = 'profiles' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and column_name in ('id','pharmacy_id') and data_type <> 'uuid'))
         or (existing_table = 'sale_items' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and ((column_name in ('id','medicine_id') and data_type <> 'uuid') or (column_name = 'sale_id' and data_type <> 'bigint') or (column_name = 'quantity' and data_type <> 'integer'))))
         or (existing_table = 'inventory_transactions' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and column_name in ('id','pharmacy_id','medicine_id','created_by') and data_type <> 'uuid'))
         or (existing_table = 'alerts' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and column_name in ('id','pharmacy_id','medicine_id') and data_type <> 'uuid'))
         or (existing_table = 'app_settings' and exists (select 1 from information_schema.columns where table_schema='public' and table_name=existing_table and column_name in ('id','pharmacy_id') and data_type <> 'uuid')) then
        raise exception 'Existing public.% has incompatible identifier or relationship types; review it before upgrading.', existing_table;
      end if;
      if (existing_table in ('pharmacies','profiles','sale_items','inventory_transactions','alerts','app_settings')
          and not exists (select 1 from pg_constraint where conrelid = format('public.%I', existing_table)::regclass and contype = 'p'))
         or (existing_table = 'profiles' and not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'f' and pg_get_constraintdef(oid) like '%pharmacies%'))
         or (existing_table = 'sale_items' and not exists (select 1 from pg_constraint where conrelid = 'public.sale_items'::regclass and contype = 'f' and pg_get_constraintdef(oid) like '%sales%'))
         or (existing_table = 'sale_items' and not exists (select 1 from pg_constraint where conrelid = 'public.sale_items'::regclass and contype = 'f' and pg_get_constraintdef(oid) like '%medicines%')) then
        raise exception 'Existing public.% is missing a required primary or foreign key; review it before upgrading.', existing_table;
      end if;
    end if;
  end loop;
end;
$$;
create unique index if not exists rxassistant_medicines_id_unique on public.medicines(id);
create unique index if not exists rxassistant_sales_id_unique on public.sales(id);

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Pharmacy',
  legacy_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists rxassistant_pharmacies_legacy_key_unique
  on public.pharmacies(legacy_key) where legacy_key is not null;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies(id) on delete restrict,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  pharmacy_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deterministic key: no rerun can create another legacy pharmacy.
insert into public.pharmacies(name, legacy_key)
values ('Legacy Pharmacy', 'rxassistant_legacy_default')
on conflict (legacy_key) where legacy_key is not null do nothing;

create or replace function public.current_pharmacy_id()
returns uuid language sql stable security definer set search_path = public as $$
  select pharmacy_id from public.profiles where id = auth.uid()
$$;

create or replace function public.rxassistant_is_pharmacy_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and pharmacy_id = public.current_pharmacy_id()
      and role in ('owner', 'admin')
  )
$$;

-- Upgrade medicines in place. No legacy column or UUID is renamed or dropped.
alter table public.medicines
  add column if not exists pharmacy_id uuid,
  add column if not exists generic_name text,
  add column if not exists strength text,
  add column if not exists supplier text,
  add column if not exists status text default 'active',
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now();

with legacy_pharmacy as (
  select id from public.pharmacies where legacy_key = 'rxassistant_legacy_default'
)
update public.medicines
set pharmacy_id = legacy_pharmacy.id
from legacy_pharmacy
where public.medicines.pharmacy_id is null;

update public.medicines
set status = case
  when expiry_date is not null and expiry_date < current_date then 'expired'
  when coalesce(quantity, 0) <= 0 then 'out_of_stock'
  when coalesce(quantity, 0) <= coalesce(minimum_stock, 0) then 'low_stock'
  else 'active'
end
where status is null or status = 'active';

do $$
begin
  if exists (select 1 from public.medicines where pharmacy_id is null) then
    raise exception 'Legacy medicines could not be assigned to a pharmacy.';
  end if;
  alter table public.medicines alter column pharmacy_id set not null;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_medicines_pharmacy_fkey') then
    alter table public.medicines add constraint rxassistant_medicines_pharmacy_fkey
      foreign key (pharmacy_id) references public.pharmacies(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_medicines_created_by_fkey') then
    alter table public.medicines add constraint rxassistant_medicines_created_by_fkey
      foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_medicines_status_check') then
    alter table public.medicines add constraint rxassistant_medicines_status_check
      check (status in ('active', 'low_stock', 'out_of_stock', 'expired', 'archived')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_medicines_nonnegative_check') then
    alter table public.medicines add constraint rxassistant_medicines_nonnegative_check
      check (
        (quantity is null or quantity >= 0)
        and (minimum_stock is null or minimum_stock >= 0)
        and (purchase_price is null or purchase_price >= 0)
        and (selling_price is null or selling_price >= 0)
      ) not valid;
  end if;
end;
$$;
create index if not exists rxassistant_medicines_pharmacy_status_idx on public.medicines(pharmacy_id, status);
create index if not exists rxassistant_medicines_pharmacy_expiry_idx on public.medicines(pharmacy_id, expiry_date);

-- Upgrade the legacy bigint sales headers in place. total_amount remains intact.
alter table public.sales
  add column if not exists pharmacy_id uuid,
  add column if not exists sold_by uuid,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists subtotal numeric(12,2),
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists tax numeric(12,2) not null default 0,
  add column if not exists total numeric(12,2),
  add column if not exists status text default 'completed',
  add column if not exists is_legacy boolean not null default false;

update public.sales set is_legacy = true where pharmacy_id is null;
with legacy_pharmacy as (
  select id from public.pharmacies where legacy_key = 'rxassistant_legacy_default'
)
update public.sales
set pharmacy_id = legacy_pharmacy.id
from legacy_pharmacy
where public.sales.pharmacy_id is null;
update public.sales set total = coalesce(total_amount, 0) where total is null;
update public.sales set subtotal = total where subtotal is null;
update public.sales set status = 'completed' where status is null;

do $$
begin
  if exists (select 1 from public.sales where pharmacy_id is null) then
    raise exception 'Legacy sales could not be assigned to a pharmacy.';
  end if;
  alter table public.sales alter column pharmacy_id set not null;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_sales_pharmacy_fkey') then
    alter table public.sales add constraint rxassistant_sales_pharmacy_fkey
      foreign key (pharmacy_id) references public.pharmacies(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sales_sold_by_fkey') then
    alter table public.sales add constraint sales_sold_by_fkey
      foreign key (sold_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rxassistant_sales_status_check') then
    alter table public.sales add constraint rxassistant_sales_status_check
      check (status in ('completed', 'voided', 'refunded')) not valid;
  end if;
  -- Keep legacy payment_method values unconstrained; complete_sale validates new input.

end;
$$;

-- Keep an existing serial/identity default. Add one only when legacy sales has none.
do $$
begin
  if exists (select 1 from pg_attribute where attrelid = 'public.sales'::regclass and attname = 'id' and attidentity = '') and not exists (
    select 1
    from pg_attrdef defaults
    join pg_attribute attributes on attributes.attrelid = defaults.adrelid and attributes.attnum = defaults.adnum
    where defaults.adrelid = 'public.sales'::regclass and attributes.attname = 'id'
  ) then
    create sequence if not exists public.rxassistant_sales_id_seq;
    perform setval('public.rxassistant_sales_id_seq', coalesce((select max(id) + 1 from public.sales), 1), false);
    alter table public.sales alter column id set default nextval('public.rxassistant_sales_id_seq');
  end if;
end;
$$;
create index if not exists rxassistant_sales_pharmacy_created_idx on public.sales(pharmacy_id, created_at desc);
create unique index if not exists rxassistant_sales_modern_invoice_unique
  on public.sales(pharmacy_id, invoice_number)
  where is_legacy = false and invoice_number is not null;

-- Legacy sales_item is deliberately retained. New sale_items holds historical
-- copies without inventing a UUID medicine relationship, plus all new sales.
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id bigint not null references public.sales(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete restrict,
  batch_number text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  legacy_source_table text,
  legacy_source_id bigint,
  legacy_medicine_id bigint,
  created_at timestamptz not null default now(),
  constraint rxassistant_sale_items_identity_check
    check (medicine_id is not null or legacy_medicine_id is not null)
);
create unique index if not exists rxassistant_sale_items_legacy_source_unique
  on public.sale_items(legacy_source_table, legacy_source_id)
  where legacy_source_table is not null and legacy_source_id is not null;
create index if not exists rxassistant_sale_items_sale_idx on public.sale_items(sale_id);


insert into public.sale_items(
  sale_id, medicine_id, batch_number, quantity, unit_price, total_price,
  legacy_source_table, legacy_source_id, legacy_medicine_id, created_at
)
select
  legacy_item.sales_id, null, null, legacy_item.quantity, legacy_item.selling_price,
  coalesce(legacy_item.subtotal, legacy_item.selling_price * legacy_item.quantity),
  'sales_item', legacy_item.id, legacy_item.medicine_id, coalesce(legacy_item.created_at, now())
from public.sales_item legacy_item
left join public.sale_items copied_item
  on copied_item.legacy_source_table = 'sales_item'
 and copied_item.legacy_source_id = legacy_item.id
where copied_item.id is null;

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete restrict,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('purchase', 'sale', 'adjustment', 'return', 'damaged', 'expired', 'restock')),
  quantity integer not null check (quantity <> 0),
  reference_id text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete restrict,
  type text not null check (type in ('expiry', 'inventory', 'sales', 'system', 'ai_recommendation')),
  title text not null,
  message text not null,
  medicine_id uuid references public.medicines(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null unique references public.pharmacies(id) on delete cascade,
  currency text not null default 'PKR',
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  expiry_warning_days integer not null default 30 check (expiry_warning_days between 1 and 365),
  timezone text not null default 'Asia/Karachi',
  expiry_alerts boolean not null default true,
  low_stock_alerts boolean not null default true,
  daily_sales_summary boolean not null default false,
  weekly_business_summary boolean not null default false,
  critical_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.app_settings(pharmacy_id)
select id from public.pharmacies where legacy_key = 'rxassistant_legacy_default'
on conflict (pharmacy_id) do nothing;

create index if not exists rxassistant_transactions_pharmacy_created_idx
  on public.inventory_transactions(pharmacy_id, created_at desc);
create index if not exists rxassistant_alerts_pharmacy_status_idx
  on public.alerts(pharmacy_id, status, created_at desc);

-- Backfill pre-existing auth users. This cannot create a duplicate profile or
-- duplicate legacy pharmacy. The first unprofiled user becomes owner; others
-- become staff and should be reviewed manually after deployment.
with legacy_pharmacy as (
  select id from public.pharmacies where legacy_key = 'rxassistant_legacy_default'
),
unprofiled_users as (
  select user_record.id,
         coalesce(user_record.raw_user_meta_data->>'full_name', '') as full_name,
         coalesce(user_record.email, '') as email,
         row_number() over (order by user_record.created_at, user_record.id) as position
  from auth.users user_record
  where not exists (select 1 from public.profiles profile where profile.id = user_record.id)
),
owner_state as (
  select exists (
    select 1 from public.profiles profile
    join legacy_pharmacy pharmacy on pharmacy.id = profile.pharmacy_id
    where profile.role in ('owner', 'admin')
  ) as has_owner
)
insert into public.profiles(id, pharmacy_id, full_name, email, role, pharmacy_name)
select user_record.id, pharmacy.id, user_record.full_name, user_record.email,
       case when user_record.position = 1 and not owner_state.has_owner then 'owner' else 'staff' end,
       'Legacy Pharmacy'
from unprofiled_users user_record
cross join legacy_pharmacy pharmacy
cross join owner_state
on conflict (id) do nothing;

create or replace function public.rxassistant_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.rxassistant_protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' and (
    new.id is distinct from old.id or new.pharmacy_id is distinct from old.pharmacy_id
    or new.role is distinct from old.role or new.email is distinct from old.email
  ) then raise exception 'Protected profile fields cannot be changed from the client'; end if;
  return new;
end;
$$;

create or replace function public.rxassistant_protect_alert_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' and (
    new.pharmacy_id is distinct from old.pharmacy_id or new.type is distinct from old.type
    or new.title is distinct from old.title or new.message is distinct from old.message
    or new.medicine_id is distinct from old.medicine_id or new.priority is distinct from old.priority
    or new.created_at is distinct from old.created_at
  ) then raise exception 'Only alert status and resolved_at may be changed from the client'; end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid = 'public.pharmacies'::regclass and tgname = 'rxassistant_pharmacies_updated_at') then
    create trigger rxassistant_pharmacies_updated_at before update on public.pharmacies for each row execute function public.rxassistant_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'rxassistant_profiles_updated_at') then
    create trigger rxassistant_profiles_updated_at before update on public.profiles for each row execute function public.rxassistant_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.medicines'::regclass and tgname = 'rxassistant_medicines_updated_at') then
    create trigger rxassistant_medicines_updated_at before update on public.medicines for each row execute function public.rxassistant_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.app_settings'::regclass and tgname = 'rxassistant_settings_updated_at') then
    create trigger rxassistant_settings_updated_at before update on public.app_settings for each row execute function public.rxassistant_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'rxassistant_protect_profile_fields') then
    create trigger rxassistant_protect_profile_fields before update on public.profiles for each row execute function public.rxassistant_protect_profile_fields();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.alerts'::regclass and tgname = 'rxassistant_protect_alert_fields') then
    create trigger rxassistant_protect_alert_fields before update on public.alerts for each row execute function public.rxassistant_protect_alert_fields();
  end if;
end;
$$;

-- Future users receive an isolated pharmacy; existing profiles are ignored.
create or replace function public.rxassistant_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pharmacy_id uuid;
  v_pharmacy_name text := coalesce(nullif(new.raw_user_meta_data->>'pharmacy_name', ''), 'My Pharmacy');
begin
  if exists (select 1 from public.profiles where id = new.id) then return new; end if;
  insert into public.pharmacies(name) values (v_pharmacy_name) returning id into v_pharmacy_id;
  insert into public.profiles(id, pharmacy_id, full_name, email, role, pharmacy_name)
  values (new.id, v_pharmacy_id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''), 'owner', v_pharmacy_name);
  insert into public.app_settings(pharmacy_id) values (v_pharmacy_id) on conflict (pharmacy_id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'rxassistant_on_auth_user_created') then
    create trigger rxassistant_on_auth_user_created
      after insert on auth.users for each row execute function public.rxassistant_handle_new_user();
  end if;
end;
$$;

alter table public.pharmacies enable row level security;
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.alerts enable row level security;
alter table public.app_settings enable row level security;

-- These are the four explicitly reviewed broad legacy medicine policies.
-- They are replaced only after pharmacy ownership infrastructure is ready.
drop policy if exists "Authenticated users can delete medicines" on public.medicines;
drop policy if exists "Authenticated users can insert medicines" on public.medicines;
drop policy if exists "Authenticated users can update medicines" on public.medicines;
drop policy if exists "Authenticated users can view medicines" on public.medicines;
drop policy if exists rxassistant_pharmacies_select on public.pharmacies;
drop policy if exists rxassistant_pharmacies_update on public.pharmacies;
drop policy if exists rxassistant_profiles_select on public.profiles;
drop policy if exists rxassistant_profiles_update_own on public.profiles;
drop policy if exists rxassistant_medicines_select on public.medicines;
drop policy if exists rxassistant_medicines_insert on public.medicines;
drop policy if exists rxassistant_medicines_update on public.medicines;
drop policy if exists rxassistant_sales_select on public.sales;
drop policy if exists rxassistant_sale_items_select on public.sale_items;
drop policy if exists rxassistant_transactions_select on public.inventory_transactions;
drop policy if exists rxassistant_alerts_select on public.alerts;
drop policy if exists rxassistant_alerts_update_status on public.alerts;
drop policy if exists rxassistant_settings_select on public.app_settings;
drop policy if exists rxassistant_settings_insert on public.app_settings;
drop policy if exists rxassistant_settings_update on public.app_settings;

create policy rxassistant_pharmacies_select on public.pharmacies for select using (id = public.current_pharmacy_id());
create policy rxassistant_pharmacies_update on public.pharmacies for update
  using (id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin())
  with check (id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin());
create policy rxassistant_profiles_select on public.profiles for select using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_medicines_select on public.medicines for select to authenticated using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_medicines_insert on public.medicines for insert to authenticated with check (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_medicines_update on public.medicines for update to authenticated
  using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_medicines_delete on public.medicines for delete to authenticated
  using (pharmacy_id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin());
create policy rxassistant_sales_select on public.sales for select using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_sale_items_select on public.sale_items for select using (
  exists (select 1 from public.sales sale_record where sale_record.id = sale_id and sale_record.pharmacy_id = public.current_pharmacy_id())
);
create policy rxassistant_transactions_select on public.inventory_transactions for select using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_alerts_select on public.alerts for select using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_alerts_update_status on public.alerts for update
  using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_settings_select on public.app_settings for select using (pharmacy_id = public.current_pharmacy_id());
create policy rxassistant_settings_insert on public.app_settings for insert
  with check (pharmacy_id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin());
create policy rxassistant_settings_update on public.app_settings for update
  using (pharmacy_id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin())
  with check (pharmacy_id = public.current_pharmacy_id() and public.rxassistant_is_pharmacy_admin());

-- Atomic checkout: retains bigint sales IDs, locks stock, blocks expired stock,
-- and uses only the stored medicines.selling_price.
create or replace function public.complete_sale(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_discount numeric,
  p_tax numeric,
  p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pharmacy_id uuid := public.current_pharmacy_id();
  v_sale_id bigint;
  v_invoice_number text := 'RX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item jsonb;
  v_medicine public.medicines%rowtype;
  v_quantity integer;
  v_requested integer;
  v_unit_price numeric(12,2);
begin
  if auth.uid() is null or v_pharmacy_id is null then raise exception 'No pharmacy profile exists for this user'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'A sale needs at least one item'; end if;
  if p_payment_method not in ('Cash', 'Card', 'Bank Transfer', 'Other') then raise exception 'Invalid payment method'; end if;
  if coalesce(p_discount, 0) < 0 or coalesce(p_tax, 0) < 0 then raise exception 'Discount and tax cannot be negative'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Invalid sale item quantity'; end if;
    select * into v_medicine from public.medicines
      where id = (v_item->>'medicine_id')::uuid
        and pharmacy_id = v_pharmacy_id
        and status <> 'archived'
      for update;
    if not found then raise exception 'A selected medicine is no longer available'; end if;
    if v_medicine.expiry_date is null or v_medicine.expiry_date < current_date then raise exception '% is expired or has no expiry date', v_medicine.name; end if;
    if v_medicine.selling_price is null or v_medicine.selling_price < 0 then raise exception '% has no valid stored price', v_medicine.name; end if;
    select coalesce(sum((requested_item->>'quantity')::integer), 0) into v_requested
      from jsonb_array_elements(p_items) requested_item
      where requested_item->>'medicine_id' = v_medicine.id::text;
    if v_medicine.quantity is null or v_medicine.quantity < v_requested then raise exception 'Insufficient stock for %', v_medicine.name; end if;
    v_subtotal := v_subtotal + (v_medicine.selling_price * v_quantity);
  end loop;

  if coalesce(p_discount, 0) > v_subtotal then raise exception 'Discount cannot exceed the subtotal'; end if;
  v_total := v_subtotal - coalesce(p_discount, 0) + coalesce(p_tax, 0);
  insert into public.sales(pharmacy_id, sold_by, invoice_number, customer_name, customer_phone, subtotal, discount, tax, total, total_amount, payment_method, status, is_legacy)
  values (v_pharmacy_id, auth.uid(), v_invoice_number, nullif(trim(p_customer_name), ''), nullif(trim(p_customer_phone), ''), v_subtotal, coalesce(p_discount, 0), coalesce(p_tax, 0), v_total, v_total, p_payment_method, 'completed', false)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_medicine from public.medicines
      where id = (v_item->>'medicine_id')::uuid and pharmacy_id = v_pharmacy_id
      for update;
    v_unit_price := v_medicine.selling_price;
    insert into public.sale_items(sale_id, medicine_id, batch_number, quantity, unit_price, total_price)
    values (v_sale_id, v_medicine.id, v_medicine.batch_number, v_quantity, v_unit_price, v_unit_price * v_quantity);
    update public.medicines
    set quantity = quantity - v_quantity,
        status = case when quantity - v_quantity <= 0 then 'out_of_stock' when quantity - v_quantity <= minimum_stock then 'low_stock' else 'active' end
    where id = v_medicine.id;
    insert into public.inventory_transactions(pharmacy_id, medicine_id, transaction_type, quantity, reference_id, notes, created_by)
    values (v_pharmacy_id, v_medicine.id, 'sale', -v_quantity, v_sale_id::text, 'Sale ' || v_invoice_number, auth.uid());
  end loop;
  return jsonb_build_object('id', v_sale_id, 'invoice_number', v_invoice_number, 'total', v_total);
end;
$$;
revoke all on function public.complete_sale(text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.complete_sale(text, text, text, numeric, numeric, jsonb) to authenticated;
