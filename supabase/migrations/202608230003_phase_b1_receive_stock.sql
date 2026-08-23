-- Phase B.1: atomic receiving workflow and auditable stock receipts.

alter table public.medicines
  add column if not exists received_at date;

update public.medicines
set received_at = coalesce(received_at, created_at::date)
where received_at is null;

alter table public.medicines
  alter column received_at set default current_date,
  alter column received_at set not null;

create unique index if not exists rxassistant_medicines_pharmacy_batch_unique
  on public.medicines (pharmacy_id, lower(btrim(batch_number)))
  where batch_number is not null and btrim(batch_number) <> '';

create or replace function public.receive_stock(
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
  p_notes text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_pharmacy uuid;
  v_role text;
  v_medicine public.medicines%rowtype;
  v_transaction public.inventory_transactions%rowtype;
  v_batch text := nullif(btrim(p_batch_number), '');
begin
  if v_user is null then
    raise exception 'You must be signed in to receive stock';
  end if;

  select pharmacy_id, role into v_pharmacy, v_role
  from public.profiles
  where id = v_user;

  if v_pharmacy is null then
    raise exception 'No pharmacy profile exists for this user';
  end if;
  if v_role not in ('owner', 'admin', 'staff') then
    raise exception 'Your role cannot receive stock';
  end if;

  if nullif(btrim(p_name), '') is null
     or nullif(btrim(p_dosage_form), '') is null
     or nullif(btrim(p_manufacturer), '') is null
     or v_batch is null
     or p_expiry_date is null
     or p_purchase_price is null
     or p_selling_price is null
     or p_quantity is null then
    raise exception 'Required receiving fields are missing';
  end if;
  if p_quantity <= 0 then
    raise exception 'Quantity received must be positive';
  end if;
  if p_minimum_stock is null or p_minimum_stock < 0 then
    raise exception 'Minimum stock must be non-negative';
  end if;
  if p_purchase_price < 0 or p_selling_price < 0 then
    raise exception 'Prices cannot be negative';
  end if;
  if p_selling_price < p_purchase_price then
    raise exception 'Selling price cannot be lower than purchase price';
  end if;
  if p_expiry_date < current_date then
    raise exception 'Expiry date must be today or later';
  end if;
  if p_received_at is null or p_received_at > current_date then
    raise exception 'Received date must be today or earlier';
  end if;
  if exists (
    select 1
    from public.medicines
    where pharmacy_id = v_pharmacy
      and lower(btrim(batch_number)) = lower(v_batch)
  ) then
    raise exception 'Batch % already exists in this pharmacy', v_batch;
  end if;

  insert into public.medicines (
    pharmacy_id, name, generic_name, dosage_form, strength, therapeutic_class,
    manufacturer, batch_number, expiry_date, purchase_price, selling_price,
    quantity, minimum_stock, supplier, received_at, status, created_by
  ) values (
    v_pharmacy, btrim(p_name), nullif(btrim(p_generic_name), ''),
    btrim(p_dosage_form), nullif(btrim(p_strength), ''),
    nullif(btrim(p_therapeutic_class), ''), btrim(p_manufacturer), v_batch,
    p_expiry_date, p_purchase_price, p_selling_price, p_quantity,
    p_minimum_stock, nullif(btrim(p_supplier), ''), p_received_at,
    case when p_quantity <= p_minimum_stock then 'low_stock' else 'active' end,
    v_user
  )
  returning * into v_medicine;

  insert into public.inventory_transactions (
    pharmacy_id, medicine_id, transaction_type, quantity, reference_id,
    notes, created_by, created_at
  ) values (
    v_pharmacy, v_medicine.id, 'purchase', p_quantity,
    'receive:' || v_medicine.id::text,
    nullif(btrim(p_notes), ''), v_user,
    p_received_at::timestamp with time zone
  )
  returning * into v_transaction;

  return jsonb_build_object(
    'id', v_medicine.id,
    'batch_number', v_medicine.batch_number,
    'quantity', v_medicine.quantity,
    'status', v_medicine.status,
    'received_at', v_medicine.received_at,
    'transaction_id', v_transaction.id
  );
end;
$$;

revoke all on function public.receive_stock(text, text, text, text, text, text, text, date, numeric, numeric, integer, integer, text, date, text)
  from public, anon;
grant execute on function public.receive_stock(text, text, text, text, text, text, text, date, numeric, numeric, integer, integer, text, date, text)
  to authenticated;

