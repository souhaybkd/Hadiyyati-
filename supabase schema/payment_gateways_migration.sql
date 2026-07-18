-- =============================================================================
-- Payment Gateway Management Migration
-- Run this in the Supabase SQL editor (or via the CLI) once.
-- =============================================================================

-- 1) payment_gateways: stores which gateways are enabled and their credentials.
--    `config` holds gateway-specific fields (secrets included) as JSON.
--    This table is only ever read/written server-side (service role / admin),
--    never exposed directly to the browser.
create table if not exists public.payment_gateways (
  id          uuid primary key default gen_random_uuid(),
  gateway     text unique not null,          -- 'stripe' | 'whish'
  is_enabled  boolean not null default false,
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed the two supported gateways (no-op if they already exist).
insert into public.payment_gateways (gateway, is_enabled, config)
values
  ('stripe', false, '{"secretKey":"","publishableKey":"","webhookSecret":""}'::jsonb),
  ('whish',  false, '{"channel":"","secret":"","websiteUrl":"","environment":"sandbox"}'::jsonb)
on conflict (gateway) do nothing;

-- 2) whish_payments: pending Whish transactions.
--    A row is created before redirecting the buyer to Whish, then finalized
--    (an order is created) once Whish confirms the collect status is "success".
create table if not exists public.whish_payments (
  id                 uuid primary key default gen_random_uuid(),
  external_id        bigint unique not null,   -- numeric reference sent to Whish
  user_id            uuid,                     -- buyer (references auth.users)
  customer_email     text,
  amount             numeric not null,
  currency           text not null default 'USD',
  custom_message     text,
  is_gift            boolean not null default false,
  wishlist_owner_ids text,
  items              jsonb not null default '[]'::jsonb,
  status             text not null default 'pending', -- pending | success | failed
  collect_url        text,
  order_id           uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists whish_payments_external_id_idx
  on public.whish_payments (external_id);

-- 3) Row Level Security
--    Both tables are managed exclusively by server-side code using the service
--    role key (which bypasses RLS). We still enable RLS and add an admin-only
--    read policy so nothing leaks if a client ever queries with the anon key.
alter table public.payment_gateways enable row level security;
alter table public.whish_payments enable row level security;

drop policy if exists "payment_gateways admin read" on public.payment_gateways;
create policy "payment_gateways admin read"
  on public.payment_gateways for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "whish_payments admin read" on public.whish_payments;
create policy "whish_payments admin read"
  on public.whish_payments for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
