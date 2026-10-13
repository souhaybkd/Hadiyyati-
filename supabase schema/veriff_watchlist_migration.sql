-- =============================================================================
-- Veriff PEP & Sanctions (watchlist screening)
-- Also included at the end of veriff_kyc_migration.sql — run this file only if you
-- already ran the older KYC migration before watchlist columns were added.
-- =============================================================================

alter table public.kyc_verifications
  add column if not exists watchlist_review_status text,
  add column if not exists watchlist_total_hits integer,
  add column if not exists watchlist_has_unacknowledged_changes boolean not null default false,
  add column if not exists watchlist_monitor_status text,
  add column if not exists watchlist_screened_at timestamptz,
  add column if not exists raw_watchlist jsonb;

comment on column public.kyc_verifications.watchlist_review_status is
  'no_match | potential_match | reviewed (Veriff PEP/sanctions webhook)';

alter table public.profiles
  add column if not exists watchlist_review_status text,
  add column if not exists watchlist_cleared boolean not null default false;

comment on column public.profiles.watchlist_cleared is
  'True when PEP/sanctions screening allows payouts (in addition to kyc_status = approved)';

notify pgrst, 'reload schema';
