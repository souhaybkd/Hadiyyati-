-- =============================================================================
-- Guest Checkout Migration
-- Run this once in the Supabase SQL editor.
--
-- Purpose: allow people to buy/gift items from a wishlist WITHOUT creating an
-- account. Only wishlist owners need accounts. This means the buyer (user_id /
-- sender_id) can be null on orders and gift messages, and we store the guest's
-- display name alongside their Whish payment.
--
-- All statements are idempotent and safe to run more than once.
-- =============================================================================

-- Buyer is optional now (guest checkout). Dropping NOT NULL is a no-op if the
-- column is already nullable.
alter table public.orders          alter column user_id  drop not null;
alter table public.orders          alter column owner_id drop not null;

-- Gift sender is optional (guest senders have no account).
alter table public.gift_messages   alter column sender_id drop not null;

-- Store the guest buyer's display name so gift notifications can show who sent
-- the gift even when there is no account.
alter table public.whish_payments  add column if not exists customer_name text;
