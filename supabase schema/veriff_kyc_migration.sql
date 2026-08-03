-- =============================================================================
-- Veriff KYC Migration
-- Run this in the Supabase SQL editor (or via the CLI) once.
-- Gates receiver payouts behind identity verification.
-- =============================================================================

-- 1) profiles: quick-read KYC status for payout gating
alter table public.profiles
  add column if not exists kyc_status text not null default 'unverified',
  add column if not exists kyc_verified_at timestamptz,
  add column if not exists kyc_session_id text;

comment on column public.profiles.kyc_status is
  'unverified | pending | approved | declined | resubmission_requested';

-- 2) kyc_verifications: one row per Veriff session
create table if not exists public.kyc_verifications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  veriff_session_id  text not null unique,
  status             text not null default 'created',
  decision_code      integer,
  vendor_data        text not null,
  raw_decision       jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint kyc_verifications_status_check check (
    status in (
      'created',
      'started',
      'submitted',
      'approved',
      'declined',
      'resubmission_requested',
      'expired',
      'abandoned'
    )
  )
);

create index if not exists kyc_verifications_user_id_idx
  on public.kyc_verifications (user_id);

create index if not exists kyc_verifications_vendor_data_idx
  on public.kyc_verifications (vendor_data);

-- 3) Row Level Security
--    Users may read their own rows. Writes happen via service role
--    (session start + decision webhook).
alter table public.kyc_verifications enable row level security;

drop policy if exists "kyc_verifications select own" on public.kyc_verifications;
create policy "kyc_verifications select own"
  on public.kyc_verifications for select
  using (auth.uid() = user_id);

drop policy if exists "kyc_verifications admin select" on public.kyc_verifications;
create policy "kyc_verifications admin select"
  on public.kyc_verifications for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
