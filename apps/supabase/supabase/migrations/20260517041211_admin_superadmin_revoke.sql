alter table public.medical_admins
  add column if not exists admin_role text not null default 'admin',
  add column if not exists revoked_at timestamptz null,
  add column if not exists revoked_by uuid null,
  add column if not exists updated_at timestamptz null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'medical_admins_admin_role_check'
  ) then
    alter table public.medical_admins
      add constraint medical_admins_admin_role_check
      check (admin_role in ('superadmin', 'admin'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'medical_admins_revoked_by_fkey'
  ) then
    alter table public.medical_admins
      add constraint medical_admins_revoked_by_fkey
      foreign key (revoked_by) references public.medical_admins(admin_id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'medical_admins_revoke_consistency_check'
  ) then
    alter table public.medical_admins
      add constraint medical_admins_revoke_consistency_check
      check (
        (revoked_at is null and revoked_by is null)
        or (revoked_at is not null and revoked_by is not null)
      );
  end if;
end;
$$;

create index if not exists medical_admins_admin_role_idx
on public.medical_admins(admin_role)
where revoked_at is null;

alter table public.admin_invitations
  add column if not exists revoked_at timestamptz null,
  add column if not exists revoked_by uuid null,
  add column if not exists updated_at timestamptz null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'admin_invitations_revoked_by_fkey'
  ) then
    alter table public.admin_invitations
      add constraint admin_invitations_revoked_by_fkey
      foreign key (revoked_by) references public.medical_admins(admin_id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'admin_invitations_revoke_consistency_check'
  ) then
    alter table public.admin_invitations
      add constraint admin_invitations_revoke_consistency_check
      check (
        (revoked_at is null and revoked_by is null)
        or (revoked_at is not null and revoked_by is not null)
      );
  end if;
end;
$$;

drop index if exists public.admin_invitations_email_key;

create unique index if not exists admin_invitations_active_email_key
on public.admin_invitations(email)
where revoked_at is null;

create index if not exists admin_invitations_active_invited_by_idx
on public.admin_invitations(invited_by, created_at desc)
where revoked_at is null;

create or replace function private.current_superadmin_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.admin_id
  from public.medical_admins a
  where a.auth_user_id = (select auth.uid())
    and a.admin_role = 'superadmin'
    and a.revoked_at is null
  limit 1
$$;

create or replace function private.current_admin_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.admin_id
  from public.medical_admins a
  where a.auth_user_id = (select auth.uid())
    and a.revoked_at is null
    and (
      a.admin_role = 'superadmin'
      or exists (
        select 1
        from public.admin_invitations ai
        where ai.email = a.email
          and ai.accepted_at is not null
          and ai.revoked_at is null
      )
    )
  limit 1
$$;

drop policy if exists "admins can view admin invitations" on public.admin_invitations;
drop policy if exists "admins can create admin invitations" on public.admin_invitations;
drop policy if exists "superadmins can view own admin invitations" on public.admin_invitations;
drop policy if exists "superadmins can create admin invitations" on public.admin_invitations;
drop policy if exists "superadmins can revoke own admin invitations" on public.admin_invitations;

create policy "superadmins can view own admin invitations"
on public.admin_invitations for select to authenticated
using (invited_by = (select private.current_superadmin_id()));

create policy "superadmins can create admin invitations"
on public.admin_invitations for insert to authenticated
with check (
  invited_by = (select private.current_superadmin_id())
  and lower(email) = email
  and revoked_at is null
  and revoked_by is null
);

create policy "superadmins can revoke own admin invitations"
on public.admin_invitations for update to authenticated
using (
  invited_by = (select private.current_superadmin_id())
  and revoked_at is null
)
with check (
  invited_by = (select private.current_superadmin_id())
  and lower(email) = email
  and revoked_at is not null
  and revoked_by = (select private.current_superadmin_id())
);

revoke all on function private.current_superadmin_id() from public, anon;
grant execute on function private.current_superadmin_id() to authenticated;
grant execute on function private.current_admin_id() to authenticated;

grant select, insert on public.admin_invitations to authenticated;
grant select, insert, update on public.admin_invitations to service_role;

create or replace function public.approve_doctor_with_audit(
  target_doctor_id uuid,
  target_qr_code_token text,
  target_doctor_access_code text,
  target_verified_at timestamptz,
  target_audit_log_id uuid,
  target_audit_event_hash text
)
returns public.doctors
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_admin uuid;
  updated_doctor public.doctors;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'authentication required';
  end if;

  select private.current_admin_id() into current_admin;

  if current_admin is null then
    raise insufficient_privilege using message = 'medical admin required';
  end if;

  if target_qr_code_token is null or btrim(target_qr_code_token) = '' then
    raise check_violation using message = 'qr code token is required';
  end if;

  if target_doctor_access_code is null or target_doctor_access_code !~ '^[0-9]{6}$' then
    raise check_violation using message = 'doctor access code must be 6 digits';
  end if;

  if target_verified_at is null then
    raise not_null_violation using message = 'verified_at is required';
  end if;

  if target_audit_log_id is null then
    raise not_null_violation using message = 'audit log id is required';
  end if;

  if target_audit_event_hash is null or target_audit_event_hash !~ '^[0-9a-fA-F]{64}$' then
    raise check_violation using message = 'audit_event_hash must be 64 hex characters';
  end if;

  update public.doctors d
  set account_status = 'approved',
      rejection_reason = null,
      verified_by = current_admin,
      verified_at = target_verified_at,
      qr_code_token = target_qr_code_token,
      doctor_access_code = target_doctor_access_code,
      updated_at = transaction_timestamp()
  where d.doctor_id = target_doctor_id
  returning * into updated_doctor;

  if updated_doctor.doctor_id is null then
    raise no_data_found using message = 'doctor not found';
  end if;

  perform set_config('request.medproof.audit_mutation', 'admin_doctor_review', true);

  insert into public.audit_logs (
    log_id,
    actor_auth_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    doctor_id,
    access_status,
    audit_event_hash,
    blockchain_status,
    created_at
  )
  values (
    target_audit_log_id,
    (select auth.uid()),
    'medical_admin',
    'admin_doctor_approved',
    'doctor',
    target_doctor_id,
    target_doctor_id,
    'approved',
    target_audit_event_hash,
    'pending',
    target_verified_at
  );

  return updated_doctor;
end;
$$;

create or replace function public.reject_doctor_with_audit(
  target_doctor_id uuid,
  target_rejection_reason text,
  target_verified_at timestamptz,
  target_audit_log_id uuid,
  target_audit_event_hash text
)
returns public.doctors
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_admin uuid;
  updated_doctor public.doctors;
  safe_reason text := coalesce(nullif(btrim(target_rejection_reason), ''), 'manual_rejection');
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'authentication required';
  end if;

  select private.current_admin_id() into current_admin;

  if current_admin is null then
    raise insufficient_privilege using message = 'medical admin required';
  end if;

  if target_verified_at is null then
    raise not_null_violation using message = 'verified_at is required';
  end if;

  if target_audit_log_id is null then
    raise not_null_violation using message = 'audit log id is required';
  end if;

  if target_audit_event_hash is null or target_audit_event_hash !~ '^[0-9a-fA-F]{64}$' then
    raise check_violation using message = 'audit_event_hash must be 64 hex characters';
  end if;

  update public.doctors d
  set account_status = 'rejected',
      rejection_reason = safe_reason,
      verified_by = current_admin,
      verified_at = target_verified_at,
      qr_code_token = null,
      doctor_access_code = null,
      updated_at = transaction_timestamp()
  where d.doctor_id = target_doctor_id
  returning * into updated_doctor;

  if updated_doctor.doctor_id is null then
    raise no_data_found using message = 'doctor not found';
  end if;

  perform set_config('request.medproof.audit_mutation', 'admin_doctor_review', true);

  insert into public.audit_logs (
    log_id,
    actor_auth_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    doctor_id,
    access_status,
    reason,
    audit_event_hash,
    blockchain_status,
    created_at
  )
  values (
    target_audit_log_id,
    (select auth.uid()),
    'medical_admin',
    'admin_doctor_rejected',
    'doctor',
    target_doctor_id,
    target_doctor_id,
    'rejected',
    'manual_rejection',
    target_audit_event_hash,
    'pending',
    target_verified_at
  );

  return updated_doctor;
end;
$$;

revoke all on function public.approve_doctor_with_audit(uuid, text, text, timestamptz, uuid, text)
from public, anon;

revoke all on function public.reject_doctor_with_audit(uuid, text, timestamptz, uuid, text)
from public, anon;

grant execute on function public.approve_doctor_with_audit(uuid, text, text, timestamptz, uuid, text)
to authenticated;

grant execute on function public.reject_doctor_with_audit(uuid, text, timestamptz, uuid, text)
to authenticated;
