-- =============================================================================
-- Manual receiver payout tracking (admin marks sent after ~10-day holding period).
-- =============================================================================

alter table public.orders
  add column if not exists payout_sent_at timestamptz,
  add column if not exists payout_sent_by uuid references public.profiles(id) on delete set null,
  add column if not exists payout_admin_note text;

comment on column public.orders.payout_sent_at is
  'When ops manually sent the receiver payout (no automatic payout integration).';

notify pgrst, 'reload schema';
