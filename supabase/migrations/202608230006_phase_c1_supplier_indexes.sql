-- Phase C.1 follow-up: cover the composite supplier foreign key and keep RLS init plans stable.

create index if not exists medicines_supplier_fk_idx
  on public.medicines (supplier_id, pharmacy_id);

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers
for select to authenticated
using (pharmacy_id = (select public.current_pharmacy_id()));

drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers
for insert to authenticated
with check (
  pharmacy_id = (select public.current_pharmacy_id())
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and pharmacy_id = (select public.current_pharmacy_id())
      and role in ('owner', 'admin')
  )
);

drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers
for update to authenticated
using (
  pharmacy_id = (select public.current_pharmacy_id())
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and pharmacy_id = (select public.current_pharmacy_id())
      and role in ('owner', 'admin')
  )
)
with check (pharmacy_id = (select public.current_pharmacy_id()));
