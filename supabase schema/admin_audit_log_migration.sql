-- =============================================================================
-- Admin audit log — records sensitive admin actions (no secret values stored).
-- Run once in the Supabase SQL editor.
-- =============================================================================

create table if not exists public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid not null references public.profiles(id) on delete cascade,
  action          text not null,
  target_user_id  uuid references public.profiles(id) on delete set null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_actor_id_idx
  on public.admin_audit_log (actor_id);

alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_audit_log admin read" on public.admin_audit_log;
create policy "admin_audit_log admin read"
  on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Inserts are performed server-side with the service role (bypasses RLS).

notify pgrst, 'reload schema';
