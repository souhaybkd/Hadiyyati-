-- =============================================================================
-- Schema catch-up migration
-- The restored database backup predates several features that the current
-- application code depends on. This migration re-creates the missing objects:
--   * platform_settings  (platform fee configuration)
--   * payout_settings     (per-user payout method)
--   * orders.admin_notes  (admin order notes)
--   * wishlist_items.expected_payout (+ auto-calc trigger)
--   * calculate_expected_payout() / recalculate_all_expected_payouts()
-- Safe to run multiple times.
-- =============================================================================

-- 1) platform_settings ---------------------------------------------------------
create table if not exists public.platform_settings (
  id            uuid primary key default gen_random_uuid(),
  setting_key   text unique not null,
  setting_value jsonb not null,
  description   text,
  created_at    timestamptz default timezone('utc'::text, now()),
  updated_at    timestamptz default timezone('utc'::text, now())
);

insert into public.platform_settings (setting_key, setting_value, description)
values (
  'platform_fee_percentage',
  '{"value": 10}'::jsonb,
  'Percentage of each gift purchase retained by the platform'
)
on conflict (setting_key) do nothing;

-- 2) payout_settings -----------------------------------------------------------
create table if not exists public.payout_settings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  payout_method  text not null check (payout_method in ('bank', 'western_union', 'taptap', 'whish')),
  payout_details jsonb not null default '{}'::jsonb,
  is_active      boolean not null default true,
  created_at     timestamptz default timezone('utc'::text, now()),
  updated_at     timestamptz default timezone('utc'::text, now())
);

create index if not exists payout_settings_user_id_idx on public.payout_settings (user_id);

-- 3) Missing columns -----------------------------------------------------------
alter table public.orders          add column if not exists admin_notes text;
alter table public.wishlist_items  add column if not exists expected_payout numeric;

-- 4) Expected payout functions -------------------------------------------------
create or replace function public.calculate_expected_payout(price numeric)
returns numeric
language plpgsql
stable
as $$
declare
  fee numeric;
begin
  select coalesce((setting_value->>'value')::numeric, 10)
    into fee
    from public.platform_settings
   where setting_key = 'platform_fee_percentage';

  if fee is null then
    fee := 10;
  end if;

  return round(price * (1 - fee / 100.0), 2);
end;
$$;

create or replace function public.recalculate_all_expected_payouts()
returns void
language plpgsql
as $$
begin
  update public.wishlist_items
     set expected_payout = public.calculate_expected_payout(price);
end;
$$;

-- Keep expected_payout populated automatically on insert / price change.
create or replace function public.set_expected_payout()
returns trigger
language plpgsql
as $$
begin
  new.expected_payout := public.calculate_expected_payout(new.price);
  return new;
end;
$$;

drop trigger if exists wishlist_items_set_expected_payout on public.wishlist_items;
create trigger wishlist_items_set_expected_payout
  before insert or update of price on public.wishlist_items
  for each row execute function public.set_expected_payout();

-- Backfill existing rows.
select public.recalculate_all_expected_payouts();

-- 5) Row Level Security --------------------------------------------------------
alter table public.platform_settings enable row level security;
alter table public.payout_settings   enable row level security;

-- platform_settings: readable by everyone, writable only by admins.
drop policy if exists "platform_settings read" on public.platform_settings;
create policy "platform_settings read"
  on public.platform_settings for select
  using (true);

drop policy if exists "platform_settings admin write" on public.platform_settings;
create policy "platform_settings admin write"
  on public.platform_settings for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- payout_settings: each user manages their own; admins can read all.
drop policy if exists "payout_settings owner all" on public.payout_settings;
create policy "payout_settings owner all"
  on public.payout_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "payout_settings admin read" on public.payout_settings;
create policy "payout_settings admin read"
  on public.payout_settings for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
