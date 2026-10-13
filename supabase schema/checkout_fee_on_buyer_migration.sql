-- =============================================================================
-- Fee on buyer at checkout: receiver gets full wishlist price (expected_payout = price).
-- =============================================================================

create or replace function public.calculate_expected_payout(price numeric)
returns numeric
language sql
stable
as $$
  select round(coalesce(price, 0), 2);
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

select public.recalculate_all_expected_payouts();

notify pgrst, 'reload schema';
