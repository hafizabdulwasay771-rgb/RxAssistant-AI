-- Phase B.2: atomic CSV inventory import through the Phase B.1 receiving path.

create or replace function public.receive_stock_bulk(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_index integer;
  v_receipt jsonb;
  v_imported integer := 0;
  v_batches jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to import stock';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The CSV import contains no rows';
  end if;
  if jsonb_array_length(p_rows) > 1000 then
    raise exception 'CSV imports are limited to 1000 rows';
  end if;

  for v_row, v_index in
    select value, ordinality::integer
    from jsonb_array_elements(p_rows) with ordinality
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception 'CSV row % is not an object', v_index;
    end if;

    begin
      v_receipt := public.receive_stock(
        v_row->>'name',
        nullif(v_row->>'generic_name', ''),
        v_row->>'dosage_form',
        nullif(v_row->>'strength', ''),
        nullif(v_row->>'therapeutic_class', ''),
        v_row->>'manufacturer',
        v_row->>'batch_number',
        (v_row->>'expiry_date')::date,
        (v_row->>'purchase_price')::numeric,
        (v_row->>'selling_price')::numeric,
        (v_row->>'quantity')::integer,
        coalesce(nullif(v_row->>'minimum_stock', '')::integer, 0),
        nullif(v_row->>'supplier', ''),
        (v_row->>'received_at')::date,
        nullif(v_row->>'notes', '')
      );
    exception
      when others then
        raise exception 'CSV row %: %', v_index, sqlerrm;
    end;

    v_imported := v_imported + 1;
    v_batches := v_batches || jsonb_build_array(v_receipt);
  end loop;

  return jsonb_build_object(
    'imported_count', v_imported,
    'transaction_count', v_imported,
    'batches', v_batches
  );
end;
$$;

revoke all on function public.receive_stock_bulk(jsonb) from public, anon;
grant execute on function public.receive_stock_bulk(jsonb) to authenticated;

