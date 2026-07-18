-- =============================================================================
-- Security hardening migration
-- Fixes a privilege-escalation vulnerability: the profiles RLS UPDATE policy
-- ("Users can update own profile" USING auth.uid() = id) allows a user to
-- update ANY column of their own row, including `role` and `status`. That means
-- any signed-in user could set role = 'admin' via the public anon key and take
-- over the platform. RLS cannot restrict individual columns, so we enforce it
-- with a trigger instead.
--
-- After this migration, only admins can change a profile's role/status.
-- Normal users' attempts to do so are silently reverted (their other profile
-- edits still succeed).
-- Safe to run multiple times.
-- =============================================================================

create or replace function public.enforce_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    -- A brand-new profile may only be created with the default 'user' role
    -- unless the creator is already an admin. Prevents self-inserting as admin.
    if (new.role is distinct from 'user') and not public.is_admin(auth.uid()) then
      new.role := 'user';
    end if;

  elsif (TG_OP = 'UPDATE') then
    -- Block changes to role/status by anyone who is not an admin.
    if ((new.role is distinct from old.role) or (new.status is distinct from old.status))
       and not public.is_admin(auth.uid()) then
      new.role := old.role;
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_privileges on public.profiles;
create trigger profiles_enforce_privileges
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_privileges();
