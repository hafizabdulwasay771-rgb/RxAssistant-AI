-- Phase C.1: pharmacy-scoped supplier master and receiving linkage.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null default public.current_pharmacy_id() references public.pharmacies(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_id_pharmacy_unique unique (id, pharmacy_id)
);

create unique index if not exists rxassistant_suppliers_pharmacy_name_unique
  on public.suppliers (pharmacy_id, lower(btrim(name)));

alter table public.medicines add column if not exists supplier_id uuid;

alter table public.medicines
  drop constraint if exists medicines_supplier_pharmacy_fkey;

alter table public.medicines
  add constraint medicines_supplier_pharmacy_fkey
  foreign key (supplier_id, pharmacy_id)
  references public.suppliers (id, pharmacy_id);

create index if not exists medicines_supplier_id_idx
  on public.medicines (pharmacy_id, supplier_id);

create or replace function public.rxassistant_set_supplier_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.rxassistant_set_supplier_updated_at();

alter table public.suppliers enable row level security;
grant select, insert, update on public.suppliers to authenticated;
revoke delete on public.suppliers from authenticated;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers
for select to authenticated
using (pharmacy_id = public.current_pharmacy_id());

drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers
for insert to authenticated
with check (
  pharmacy_id = public.current_pharmacy_id()
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and pharmacy_id = public.current_pharmacy_id()
      and role in ('owner', 'admin')
  )
);

drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers
for update to authenticated
using (
  pharmacy_id = public.current_pharmacy_id()
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and pharmacy_id = public.current_pharmacy_id()
      and role in ('owner', 'admin')
  )
)
with check (pharmacy_id = public.current_pharmacy_id());

revoke all on function public.rxassistant_set_supplier_updated_at() from public, anon, authenticated;
grant execute on function public.rxassistant_set_supplier_updated_at() to postgres, service_role;

drop function if exists public.receive_stock(text, text, text, text, text, text, text, date, numeric, numeric, integer, integer, text, date, text);

create function public.receive_stock(
  p_name text,
  p_generic_name text,
  p_dosage_form text,
  p_strength text,
  p_therapeutic_class text,
  p_manufacturer text,
  p_batch_number text,
  p_expiry_date date,
  p_purchase_price numeric,
  p_selling_price numeric,
  p_quantity integer,
  p_minimum_stock integer,
  p_supplier text,
  p_received_at date,
  p_notes text,
  p_supplier_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_pharmacy uuid;
  v_role text;
  v_supplier_name text;
  v_medicine public.medicines%rowtype;
  v_transaction public.inventory_transactions%rowtype;
  v_batch text := nullif(btrim(p_batch_number), '');
begin
  if v_user is null then raise exception 'You must be signed in to receive stock'; end if;
  select pharmacy_id, role into v_pharmacy, v_role from public.profiles where id = v_user;
  if v_pharmacy is null then raise exception 'No pharmacy profile exists for this user'; end if;
  if v_role not in ('owner', 'admin', 'staff') then raise exception 'Your role cannot receive stock'; end if;
  if nullif(btrim(p_name), '') is null or nullif(btrim(p_dosage_form), '') is null
     or nullif(btrim(p_manufacturer), '') is null or v_batch is null
     or p_expiry_date is null or p_purchase_price is null or p_selling_price is null
     or p_quantity is null then raise exception 'Required receiving fields are missing'; end if;
  if p_quantity <= 0 then raise exception 'Quantity received must be positive'; end if;
  if p_minimum_stock is null or p_minimum_stock < 0 then raise exception 'Minimum stock must be non-negative'; end if;
  if p_purchase_price < 0 or p_selling_price < 0 then raise exception 'Prices cannot be negative'; end if;
  if p_selling_price < p_purchase_price then raise exception 'Selling price cannot be lower than purchase price'; end if;
  if p_expiry_date < current_date then raise exception 'Expiry date must be today or later'; end if;
  if p_received_at is null or p_received_at > current_date then raise exception 'Received date must be today or earlier'; end if;
  if exists (select 1 from public.medicines where pharmacy_id = v_pharmacy and lower(btrim(batch_number)) = lower(v_batch)) then
    raise exception 'Batch % already exists in this pharmacy', v_batch;
  end if;
  if p_supplier_id is not null then
    select name into v_supplier_name from public.suppliers
    where id = p_supplier_id and pharmacy_id = v_pharmacy and active;
    if v_supplier_name is null then raise exception 'Supplier is invalid or inactive'; end if;
  end if;

  insert into public.medicines (
    pharmacy_id, name, generic_name, dosage_form, strength, therapeutic_class,
    manufacturer, batch_number, expiry_date, purchase_price, selling_price,
    quantity, minimum_stock, supplier, supplier_id, received_at, status, created_by
  ) values (
    v_pharmacy, btrim(p_name), nullif(btrim(p_generic_name), ''), btrim(p_dosage_form),
    nullif(btrim(p_strength), ''), nullif(btrim(p_therapeutic_class), ''), btrim(p_manufacturer),
    v_batch, p_expiry_date, p_purchase_price, p_selling_price, p_quantity, p_minimum_stock,
    coalesce(v_supplier_name, nullif(btrim(p_supplier), '')), p_supplier_id, p_received_at,
    case when p_quantity <= p_minimum_stock then 'low_stock' else 'active' end, v_user
  ) returning * into v_medicine;

  insert into public.inventory_transactions (
    pharmacy_id, medicine_id, transaction_type, quantity, reference_id, notes, created_by, created_at
  ) values (
    v_pharmacy, v_medicine.id, 'purchase', p_quantity, 'receive:' || v_medicine.id::text,
    nullif(btrim(p_notes), ''), v_user, p_received_at::timestamptz
  ) returning * into v_transaction;

  return jsonb_build_object('id', v_medicine.id, 'batch_number', v_medicine.batch_number,
    'quantity', v_medicine.quantity, 'status', v_medicine.status,
    'received_at', v_medicine.received_at, 'transaction_id', v_transaction.id,
    'supplier_id', v_medicine.supplier_id);
end;
$$;

revoke all on function public.receive_stock(text, text, text, text, text, text, text, date, numeric, numeric, integer, integer, text, date, text, uuid) from public, anon;
grant execute on function public.receive_stock(text, text, text, text, text, text, text, date, numeric, numeric, integer, integer, text, date, text, uuid) to authenticated;

create or replace function public.receive_stock_bulk(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb; v_index integer; v_receipt jsonb; v_imported integer := 0; v_batches jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'You must be signed in to import stock'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'The CSV import contains no rows'; end if;
  if jsonb_array_length(p_rows) > 1000 then raise exception 'CSV imports are limited to 1000 rows'; end if;
  for v_row, v_index in select value, ordinality::integer from jsonb_array_elements(p_rows) with ordinality loop
    if jsonb_typeof(v_row) <> 'object' then raise exception 'CSV row % is not an object', v_index; end if;
    begin
      v_receipt := public.receive_stock(v_row->>'name', nullif(v_row->>'generic_name',''), v_row->>'dosage_form', nullif(v_row->>'strength',''), nullif(v_row->>'therapeutic_class',''), v_row->>'manufacturer', v_row->>'batch_number', (v_row->>'expiry_date')::date, (v_row->>'purchase_price')::numeric, (v_row->>'selling_price')::numeric, (v_row->>'quantity')::integer, coalesce(nullif(v_row->>'minimum_stock','')::integer,0), nullif(v_row->>'supplier',''), (v_row->>'received_at')::date, nullif(v_row->>'notes',''), nullif(v_row->>'supplier_id','')::uuid);
    exception when others then raise exception 'CSV row %: %', v_index, sqlerrm; end;
    v_imported := v_imported + 1; v_batches := v_batches || jsonb_build_array(v_receipt);
  end loop;
  return jsonb_build_object('imported_count',v_imported,'transaction_count',v_imported,'batches',v_batches);
end;
$$;

revoke all on function public.receive_stock_bulk(jsonb) from public, anon;
grant execute on function public.receive_stock_bulk(jsonb) to authenticated;
