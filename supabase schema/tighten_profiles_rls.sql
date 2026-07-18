-- Tighten profiles SELECT access.
--
-- Previously the policy "Users can view own profile and public profiles" used
-- USING ((auth.uid() = id) OR true), which effectively let ANY authenticated
-- (or anonymous) client read EVERY profile row, including email and role. That
-- is a PII leak: any logged-in user could `select * from profiles` and dump all
-- users' email addresses.
--
-- Public wishlist pages and other cross-user reads have been moved to the
-- service-role client in application code (server-side only, selecting just the
-- non-sensitive columns), and username-availability checks now go through the
-- SECURITY DEFINER function below, so this permissive policy can be removed.

-- 1. Username availability check (callable by anon + authenticated) without
--    exposing any profile rows.
create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(check_username))
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- 2. Remove the overly-permissive SELECT policy. The remaining SELECT policies
--    are:
--      * "Users can view own profile"  -> USING (auth.uid() = id)
--      * "Admins can view all profiles" -> USING (is_admin(auth.uid()))
drop policy if exists "Users can view own profile and public profiles" on public.profiles;
