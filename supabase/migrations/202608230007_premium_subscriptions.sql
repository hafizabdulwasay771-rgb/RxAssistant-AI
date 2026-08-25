-- Premium SaaS billing foundation.
-- Payment providers remain manual until verified merchant credentials are configured.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  plan text not null check (plan in ('trial', 'monthly', 'six_months', 'year')),
  billing_period text not null check (billing_period in ('trial', 'monthly', '6_months', 'year')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  status text not null default 'trial' check (status in ('trial', 'pending_payment', 'active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  trial_ends_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_current_per_pharmacy
  on public.subscriptions(pharmacy_id)
  where status in ('trial', 'pending_payment', 'active');

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  pharmacy_id uuid not null references public.pharmacies(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('JazzCash', 'Meezan Bank')),
  transaction_reference text not null check (char_length(trim(transaction_reference)) between 4 and 120),
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed', 'expired')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_transactions_pharmacy_created_idx
  on public.payment_transactions(pharmacy_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;

drop policy if exists rxassistant_subscriptions_select on public.subscriptions;
create policy rxassistant_subscriptions_select on public.subscriptions
  for select to authenticated using (pharmacy_id = public.current_pharmacy_id());

drop policy if exists rxassistant_payment_transactions_select on public.payment_transactions;
create policy rxassistant_payment_transactions_select on public.payment_transactions
  for select to authenticated using (pharmacy_id = public.current_pharmacy_id());

drop policy if exists rxassistant_payment_transactions_insert on public.payment_transactions;
create policy rxassistant_payment_transactions_insert on public.payment_transactions
  for insert to authenticated
  with check (
    pharmacy_id = public.current_pharmacy_id()
    and exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.pharmacy_id = public.current_pharmacy_id()
    )
  );

create or replace function public.rxassistant_set_subscription_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists rxassistant_subscriptions_updated_at on public.subscriptions;
create trigger rxassistant_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.rxassistant_set_subscription_updated_at();

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
  insert into public.subscriptions(pharmacy_id, plan, billing_period, amount, status, starts_at, trial_ends_at)
  values (v_pharmacy_id, 'trial', 'trial', 0, 'trial', now(), now() + interval '7 days')
  on conflict do nothing;
  return new;
end;
$$;

insert into public.subscriptions(pharmacy_id, plan, billing_period, amount, status, starts_at, trial_ends_at)
select p.id, 'trial', 'trial', 0, 'trial', now(), now() + interval '7 days'
from public.pharmacies p
where not exists (select 1 from public.subscriptions s where s.pharmacy_id = p.id);

grant select on public.subscriptions to authenticated;
grant select, insert on public.payment_transactions to authenticated;
