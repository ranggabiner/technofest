create table if not exists public.admin_invitations (
  invitation_id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid not null references public.medical_admins(admin_id) on delete restrict,
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint admin_invitations_email_lower_check check (lower(email) = email),
  constraint admin_invitations_email_format_check check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create unique index if not exists admin_invitations_email_key
on public.admin_invitations(email);

create index if not exists admin_invitations_invited_by_idx
on public.admin_invitations(invited_by);

alter table public.admin_invitations enable row level security;

drop policy if exists "admins can view admin invitations" on public.admin_invitations;
create policy "admins can view admin invitations"
on public.admin_invitations for select to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists "admins can create admin invitations" on public.admin_invitations;
create policy "admins can create admin invitations"
on public.admin_invitations for insert to authenticated
with check (
  invited_by = (select private.current_admin_id())
  and lower(email) = email
);

grant select, insert on public.admin_invitations to authenticated;
