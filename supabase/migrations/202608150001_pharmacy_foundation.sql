-- Rx Assistant AI: secure multi-pharmacy foundation.
-- Run through the Supabase CLI/dashboard before using the application against a new project.
create extension if not exists pgcrypto;

create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Pharmacy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
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

create or replace function public.current_pharmacy_id()
returns uuid language sql stable security definer set search_path = public as $$
  select pharmacy_id from public.profiles where id = auth.uid()
$$;

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null default public.current_pharmacy_id() references public.pharmacies(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  generic_name text,
  dosage_form text not null check (char_length(trim(dosage_form)) > 0),
  strength text,
  therapeutic_class text not null check (char_length(trim(therapeutic_class)) > 0),
  manufacturer text not null check (char_length(trim(manufacturer)) > 0),
  batch_number text not null check (char_length(trim(batch_number)) > 0),
  expiry_date date not null,
  purchase_price numeric(12,2) not null check (purchase_price >= 0),
  selling_price numeric(12,2) not null check (selling_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  supplier text,
  status text not null default 'active' check (status in ('active', 'low_stock', 'out_of_stock', 'expired', 'archived')),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, batch_number)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null default public.current_pharmacy_id() references public.pharmacies(id) on delete restrict,
  invoice_number text not null,
  sold_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  customer_name text,
  customer_phone text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text not null check (payment_method in ('Cash', 'Card', 'Bank Transfer', 'Other')),
  status text not null default 'completed' check (status in ('completed', 'voided', 'refunded')),
  created_at timestamptz not null default now(),
  unique (pharmacy_id, invoice_number)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  batch_number text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null default public.current_pharmacy_id() references public.pharmacies(id) on delete restrict,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('purchase', 'sale', 'adjustment', 'return', 'damaged', 'expired', 'restock')),
  quantity integer not null check (quantity <> 0),
  reference_id uuid,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null default public.current_pharmacy_id() references public.pharmacies(id) on delete restrict,
  type text not null check (type in ('expiry', 'inventory', 'sales', 'system', 'ai_recommendation')),
  title text not null,
  message text not null,
  medicine_id uuid references public.medicines(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null unique default public.current_pharmacy_id() references public.pharmacies(id) on delete cascade,
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

create index medicines_pharmacy_status_idx on public.medicines(pharmacy_id, status);
create index medicines_pharmacy_expiry_idx on public.medicines(pharmacy_id, expiry_date);
create index sales_pharmacy_created_idx on public.sales(pharmacy_id, created_at desc);
create index sale_items_sale_idx on public.sale_items(sale_id);
create index transactions_pharmacy_created_idx on public.inventory_transactions(pharmacy_id, created_at desc);
create index alerts_pharmacy_status_idx on public.alerts(pharmacy_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger pharmacies_updated_at before update on public.pharmacies for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger medicines_updated_at before update on public.medicines for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare pharmacy uuid;
begin
  insert into public.pharmacies(name) values (coalesce(nullif(new.raw_user_meta_data->>'pharmacy_name', ''), 'My Pharmacy')) returning id into pharmacy;
  insert into public.profiles(id, pharmacy_id, full_name, email, pharmacy_name)
    values (new.id, pharmacy, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''), (select name from public.pharmacies where id = pharmacy));
  insert into public.app_settings(pharmacy_id) values (pharmacy);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.pharmacies enable row level security;
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.alerts enable row level security;
alter table public.app_settings enable row level security;

create policy "pharmacy members can view pharmacy" on public.pharmacies for select using (id = public.current_pharmacy_id());
create policy "owners can update pharmacy" on public.pharmacies for update using (id = public.current_pharmacy_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin')));
create policy "members can view profiles" on public.profiles for select using (pharmacy_id = public.current_pharmacy_id());
create policy "users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and pharmacy_id = public.current_pharmacy_id());

create policy "members manage medicines" on public.medicines for all using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy "members manage sales" on public.sales for all using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy "members manage sale items" on public.sale_items for all using (exists (select 1 from public.sales s where s.id = sale_id and s.pharmacy_id = public.current_pharmacy_id())) with check (exists (select 1 from public.sales s where s.id = sale_id and s.pharmacy_id = public.current_pharmacy_id()));
create policy "members manage inventory transactions" on public.inventory_transactions for all using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy "members manage alerts" on public.alerts for all using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());
create policy "members manage settings" on public.app_settings for all using (pharmacy_id = public.current_pharmacy_id()) with check (pharmacy_id = public.current_pharmacy_id());

create or replace function public.complete_sale(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_discount numeric,
  p_tax numeric,
  p_items jsonb
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_pharmacy uuid := public.current_pharmacy_id();
  v_sale_id uuid;
  v_invoice text := 'RX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item jsonb;
  v_medicine public.medicines%rowtype;
  v_quantity integer;
  v_unit_price numeric(12,2);
begin
  if v_pharmacy is null then raise exception 'No pharmacy profile exists for this user'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'A sale needs at least one item'; end if;
  if p_payment_method not in ('Cash', 'Card', 'Bank Transfer', 'Other') then raise exception 'Invalid payment method'; end if;
  if coalesce(p_discount, 0) < 0 or coalesce(p_tax, 0) < 0 then raise exception 'Discount and tax cannot be negative'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    select * into v_medicine from public.medicines
      where id = (v_item->>'medicine_id')::uuid and pharmacy_id = v_pharmacy and status <> 'archived' for update;
    if not found then raise exception 'A selected medicine is no longer available'; end if;
    if v_quantity <= 0 or v_unit_price < 0 then raise exception 'Invalid sale item quantity or price'; end if;
    if v_medicine.expiry_date < current_date then raise exception '% is expired and cannot be sold', v_medicine.name; end if;
    if v_medicine.quantity < v_quantity then raise exception 'Insufficient stock for %', v_medicine.name; end if;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;
  v_total := greatest(0, v_subtotal - coalesce(p_discount, 0) + coalesce(p_tax, 0));
  insert into public.sales(pharmacy_id, invoice_number, customer_name, customer_phone, subtotal, discount, tax, total, payment_method)
    values (v_pharmacy, v_invoice, nullif(trim(p_customer_name), ''), nullif(trim(p_customer_phone), ''), v_subtotal, coalesce(p_discount, 0), coalesce(p_tax, 0), v_total, p_payment_method)
    returning id into v_sale_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    select * into v_medicine from public.medicines where id = (v_item->>'medicine_id')::uuid for update;
    insert into public.sale_items(sale_id, medicine_id, batch_number, quantity, unit_price, total_price)
      values (v_sale_id, v_medicine.id, v_medicine.batch_number, v_quantity, v_unit_price, v_unit_price * v_quantity);
    update public.medicines set quantity = quantity - v_quantity, status = case when quantity - v_quantity <= 0 then 'out_of_stock' when quantity - v_quantity <= minimum_stock then 'low_stock' else 'active' end where id = v_medicine.id;
    insert into public.inventory_transactions(pharmacy_id, medicine_id, transaction_type, quantity, reference_id, notes)
      values (v_pharmacy, v_medicine.id, 'sale', -v_quantity, v_sale_id, 'Sale ' || v_invoice);
  end loop;
  return jsonb_build_object('id', v_sale_id, 'invoice_number', v_invoice, 'total', v_total);
end $$;
-- Harden client access after the initial table definitions. The sale function is
-- the only client-accessible write path for a completed sale.
create or replace function public.is_pharmacy_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and pharmacy_id = public.current_pharmacy_id()
      and role in ('owner', 'admin')
  )
$$;

create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' and (
    new.id is distinct from old.id
    or new.pharmacy_id is distinct from old.pharmacy_id
    or new.role is distinct from old.role
    or new.email is distinct from old.email
  ) then
    raise exception 'Profile identity, pharmacy, role, and email cannot be changed from the client';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

create or replace function public.protect_alert_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' and (
    new.pharmacy_id is distinct from old.pharmacy_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.medicine_id is distinct from old.medicine_id
    or new.priority is distinct from old.priority
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Only alert status may be changed from the client';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_alert_fields on public.alerts;
create trigger protect_alert_fields
before update on public.alerts
for each row execute function public.protect_alert_fields();

drop policy if exists "pharmacy members can view pharmacy" on public.pharmacies;
drop policy if exists "owners can update pharmacy" on public.pharmacies;
drop policy if exists "members can view profiles" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "members manage medicines" on public.medicines;
drop policy if exists "members manage sales" on public.sales;
drop policy if exists "members manage sale items" on public.sale_items;
drop policy if exists "members manage inventory transactions" on public.inventory_transactions;
drop policy if exists "members manage alerts" on public.alerts;
drop policy if exists "members manage settings" on public.app_settings;

create policy "pharmacy members can view pharmacy"
on public.pharmacies for select
using (id = public.current_pharmacy_id());

create policy "owners can update pharmacy"
on public.pharmacies for update
using (id = public.current_pharmacy_id() and public.is_pharmacy_admin())
with check (id = public.current_pharmacy_id() and public.is_pharmacy_admin());

create policy "members can view profiles"
on public.profiles for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and pharmacy_id = public.current_pharmacy_id());

create policy "members can view medicines"
on public.medicines for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "members can add medicines"
on public.medicines for insert
with check (pharmacy_id = public.current_pharmacy_id());

create policy "members can update medicines"
on public.medicines for update
using (pharmacy_id = public.current_pharmacy_id())
with check (pharmacy_id = public.current_pharmacy_id());

create policy "members can view sales"
on public.sales for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "members can view sale items"
on public.sale_items for select
using (exists (
  select 1 from public.sales sale
  where sale.id = sale_id and sale.pharmacy_id = public.current_pharmacy_id()
));

create policy "members can view inventory transactions"
on public.inventory_transactions for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "members can view alerts"
on public.alerts for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "members can update alert status"
on public.alerts for update
using (pharmacy_id = public.current_pharmacy_id())
with check (pharmacy_id = public.current_pharmacy_id());

create policy "members can view settings"
on public.app_settings for select
using (pharmacy_id = public.current_pharmacy_id());

create policy "admins can create settings"
on public.app_settings for insert
with check (pharmacy_id = public.current_pharmacy_id() and public.is_pharmacy_admin());

create policy "admins can update settings"
on public.app_settings for update
using (pharmacy_id = public.current_pharmacy_id() and public.is_pharmacy_admin())
with check (pharmacy_id = public.current_pharmacy_id() and public.is_pharmacy_admin());

create or replace function public.complete_sale(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_discount numeric,
  p_tax numeric,
  p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pharmacy uuid := public.current_pharmacy_id();
  v_sale_id uuid;
  v_invoice text := 'RX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item jsonb;
  v_medicine public.medicines%rowtype;
  v_quantity integer;
  v_requested integer;
  v_unit_price numeric(12,2);
begin
  if auth.uid() is null or v_pharmacy is null then
    raise exception 'No pharmacy profile exists for this user';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale needs at least one item';
  end if;
  if p_payment_method not in ('Cash', 'Card', 'Bank Transfer', 'Other') then
    raise exception 'Invalid payment method';
  end if;
  if coalesce(p_discount, 0) < 0 or coalesce(p_tax, 0) < 0 then
    raise exception 'Discount and tax cannot be negative';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_medicine
      from public.medicines
      where id = (v_item->>'medicine_id')::uuid
        and pharmacy_id = v_pharmacy
        and status <> 'archived'
      for update;
    if not found then raise exception 'A selected medicine is no longer available'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Invalid sale item quantity'; end if;
    select coalesce(sum((item->>'quantity')::integer), 0) into v_requested
      from jsonb_array_elements(p_items) item
      where item->>'medicine_id' = v_medicine.id::text;
    if v_medicine.expiry_date < current_date then raise exception '% is expired and cannot be sold', v_medicine.name; end if;
    if v_medicine.quantity < v_requested then raise exception 'Insufficient stock for %', v_medicine.name; end if;
    v_unit_price := v_medicine.selling_price;
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  if coalesce(p_discount, 0) > v_subtotal then
    raise exception 'Discount cannot exceed the subtotal';
  end if;
  v_total := v_subtotal - coalesce(p_discount, 0) + coalesce(p_tax, 0);

  insert into public.sales(
    pharmacy_id, invoice_number, customer_name, customer_phone, subtotal,
    discount, tax, total, payment_method
  ) values (
    v_pharmacy, v_invoice, nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_phone), ''), v_subtotal, coalesce(p_discount, 0),
    coalesce(p_tax, 0), v_total, p_payment_method
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_medicine
      from public.medicines
      where id = (v_item->>'medicine_id')::uuid
        and pharmacy_id = v_pharmacy
      for update;
    v_unit_price := v_medicine.selling_price;
    insert into public.sale_items(sale_id, medicine_id, batch_number, quantity, unit_price, total_price)
      values (v_sale_id, v_medicine.id, v_medicine.batch_number, v_quantity, v_unit_price, v_unit_price * v_quantity);
    update public.medicines
      set quantity = quantity - v_quantity,
          status = case
            when quantity - v_quantity <= 0 then 'out_of_stock'
            when quantity - v_quantity <= minimum_stock then 'low_stock'
            else 'active'
          end
      where id = v_medicine.id;
    insert into public.inventory_transactions(pharmacy_id, medicine_id, transaction_type, quantity, reference_id, notes)
      values (v_pharmacy, v_medicine.id, 'sale', -v_quantity, v_sale_id, 'Sale ' || v_invoice);
  end loop;

  return jsonb_build_object('id', v_sale_id, 'invoice_number', v_invoice, 'total', v_total);
end;
$$;

revoke all on function public.complete_sale(text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.complete_sale(text, text, text, numeric, numeric, jsonb) to authenticated;