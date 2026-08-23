-- FEFO checkout upgrade. It preserves the existing one-row-per-batch medicines
-- model and replaces only the client-accessible sale completion function.
-- No tables, columns, policies, legacy data, or historical sale rows are changed.

create or replace function public.complete_sale(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_discount numeric,
  p_tax numeric,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pharmacy_id uuid := public.current_pharmacy_id();
  v_sale_id bigint;
  v_invoice_number text := 'RX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item jsonb;
  v_target public.medicines%rowtype;
  v_batch public.medicines%rowtype;
  v_quantity integer;
  v_remaining integer;
  v_take integer;
  v_allocations jsonb := '[]'::jsonb;
  v_allocation jsonb;
begin
  if auth.uid() is null or v_pharmacy_id is null then
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

  -- A requested medicine id identifies the product. Its non-expired batch rows
  -- are locked and consumed in expiry/id order. Any error aborts this database
  -- function's transaction, so an insufficient request cannot leave a partial
  -- deduction behind.
  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_quantity := (v_item->>'quantity')::integer;
    exception when invalid_text_representation then
      raise exception 'Invalid sale item quantity';
    end;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid sale item quantity';
    end if;

    select * into v_target
    from public.medicines
    where id = (v_item->>'medicine_id')::uuid
      and pharmacy_id = v_pharmacy_id
      and status <> 'archived';
    if not found then
      raise exception 'A selected medicine is no longer available';
    end if;

    v_remaining := v_quantity;
    for v_batch in
      select *
      from public.medicines
      where pharmacy_id = v_pharmacy_id
        and status <> 'archived'
        and quantity > 0
        and expiry_date >= current_date
        and lower(btrim(name)) = lower(btrim(v_target.name))
        and coalesce(nullif(lower(btrim(generic_name)), ''), '') = coalesce(nullif(lower(btrim(v_target.generic_name)), ''), '')
        and coalesce(nullif(lower(btrim(dosage_form)), ''), '') = coalesce(nullif(lower(btrim(v_target.dosage_form)), ''), '')
        and coalesce(nullif(lower(btrim(strength)), ''), '') = coalesce(nullif(lower(btrim(v_target.strength)), ''), '')
      order by expiry_date asc, id asc
      for update
    loop
      if v_batch.selling_price is null or v_batch.selling_price < 0 then
        raise exception '% batch % has no valid stored price', v_batch.name, v_batch.batch_number;
      end if;
      v_take := least(v_remaining, v_batch.quantity);
      if v_take <= 0 then
        continue;
      end if;

      update public.medicines
      set quantity = quantity - v_take,
          status = case
            when quantity - v_take <= 0 then 'out_of_stock'
            when quantity - v_take <= minimum_stock then 'low_stock'
            else 'active'
          end
      where id = v_batch.id;

      v_allocations := v_allocations || jsonb_build_array(jsonb_build_object(
        'medicine_id', v_batch.id,
        'batch_number', v_batch.batch_number,
        'quantity', v_take,
        'unit_price', v_batch.selling_price
      ));
      v_subtotal := v_subtotal + (v_batch.selling_price * v_take);
      v_remaining := v_remaining - v_take;
      exit when v_remaining = 0;
    end loop;

    if v_remaining > 0 then
      raise exception 'Insufficient eligible stock for %', v_target.name;
    end if;
  end loop;

  if coalesce(p_discount, 0) > v_subtotal then
    raise exception 'Discount cannot exceed the subtotal';
  end if;
  v_total := v_subtotal - coalesce(p_discount, 0) + coalesce(p_tax, 0);

  insert into public.sales(
    pharmacy_id, sold_by, invoice_number, customer_name, customer_phone,
    subtotal, discount, tax, total, total_amount, payment_method, status, is_legacy
  ) values (
    v_pharmacy_id, auth.uid(), v_invoice_number, nullif(trim(p_customer_name), ''), nullif(trim(p_customer_phone), ''),
    v_subtotal, coalesce(p_discount, 0), coalesce(p_tax, 0), v_total, v_total, p_payment_method, 'completed', false
  ) returning id into v_sale_id;

  for v_allocation in select * from jsonb_array_elements(v_allocations) loop
    insert into public.sale_items(sale_id, medicine_id, batch_number, quantity, unit_price, total_price)
    values (
      v_sale_id,
      (v_allocation->>'medicine_id')::uuid,
      v_allocation->>'batch_number',
      (v_allocation->>'quantity')::integer,
      (v_allocation->>'unit_price')::numeric,
      (v_allocation->>'quantity')::integer * (v_allocation->>'unit_price')::numeric
    );
    insert into public.inventory_transactions(pharmacy_id, medicine_id, transaction_type, quantity, reference_id, notes, created_by)
    values (
      v_pharmacy_id,
      (v_allocation->>'medicine_id')::uuid,
      'sale',
      -(v_allocation->>'quantity')::integer,
      v_sale_id::text,
      'Sale ' || v_invoice_number || ' / batch ' || (v_allocation->>'batch_number'),
      auth.uid()
    );
  end loop;

  return jsonb_build_object(
    'id', v_sale_id,
    'invoice_number', v_invoice_number,
    'subtotal', v_subtotal,
    'total', v_total,
    'allocations', v_allocations
  );
end;
$$;

revoke all on function public.complete_sale(text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.complete_sale(text, text, text, numeric, numeric, jsonb) to authenticated;
