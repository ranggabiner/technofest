alter table public.scope_1_medical_records
  add column if not exists blockchain_claimed_at timestamptz null,
  add column if not exists blockchain_claimed_by text null,
  add column if not exists blockchain_attempt_count integer not null default 0,
  add column if not exists blockchain_next_retry_at timestamptz null;

alter table public.access_grants
  add column if not exists blockchain_claimed_at timestamptz null,
  add column if not exists blockchain_claimed_by text null,
  add column if not exists blockchain_attempt_count integer not null default 0,
  add column if not exists blockchain_next_retry_at timestamptz null;

alter table public.audit_logs
  add column if not exists blockchain_claimed_at timestamptz null,
  add column if not exists blockchain_claimed_by text null,
  add column if not exists blockchain_attempt_count integer not null default 0,
  add column if not exists blockchain_next_retry_at timestamptz null;

do $$
begin
  alter table public.scope_1_medical_records
    add constraint scope_1_blockchain_attempt_count_check check (blockchain_attempt_count >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.access_grants
    add constraint access_grants_blockchain_attempt_count_check check (blockchain_attempt_count >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.audit_logs
    add constraint audit_logs_blockchain_attempt_count_check check (blockchain_attempt_count >= 0);
exception
  when duplicate_object then null;
end $$;

create index if not exists scope_1_records_blockchain_queue_idx
on public.scope_1_medical_records(blockchain_claimed_at, blockchain_next_retry_at, created_at)
where blockchain_status in ('pending', 'failed');

create index if not exists access_grants_blockchain_queue_idx
on public.access_grants(blockchain_claimed_at, blockchain_next_retry_at, created_at)
where blockchain_status in ('pending', 'failed');

create index if not exists audit_logs_blockchain_queue_idx
on public.audit_logs(blockchain_claimed_at, blockchain_next_retry_at, created_at)
where blockchain_status in ('pending', 'failed');

revoke execute on function public.replace_active_access_grant(
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  text
) from public, anon, authenticated;

drop function if exists public.replace_active_access_grant(
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  text
);

drop function if exists public.claim_blockchain_proofs(text, integer);

create or replace function public.claim_blockchain_proofs(
  target_proof_type text,
  batch_limit integer default 10,
  worker_id text default null,
  lease_seconds integer default 300
)
returns table (
  proof_type text,
  id uuid,
  proof_hash text,
  patient_id uuid,
  doctor_id uuid,
  actor_auth_user_id uuid,
  target_id uuid,
  action text,
  expires_at timestamptz,
  is_revoked boolean,
  blockchain_tx_hash text,
  blockchain_status text,
  claimed_by text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_limit integer := least(greatest(coalesce(batch_limit, 10), 1), 25);
  safe_worker_id text := left(coalesce(nullif(btrim(worker_id), ''), 'medproof-proof-worker'), 120);
  safe_lease_seconds integer := least(greatest(coalesce(lease_seconds, 300), 30), 3600);
  lease_cutoff timestamptz := transaction_timestamp() - make_interval(secs => safe_lease_seconds);
begin
  if target_proof_type = 'scope1_record' then
    return query
    with candidate as (
      select r.record_id
      from public.scope_1_medical_records r
      where r.blockchain_status in ('pending', 'failed')
        and (r.blockchain_next_retry_at is null or r.blockchain_next_retry_at <= transaction_timestamp())
        and (r.blockchain_claimed_at is null or r.blockchain_claimed_at < lease_cutoff)
      order by r.created_at, r.record_id
      for update skip locked
      limit safe_limit
    ),
    claimed as (
      update public.scope_1_medical_records r
      set blockchain_claimed_at = transaction_timestamp(),
          blockchain_claimed_by = safe_worker_id,
          blockchain_attempt_count = r.blockchain_attempt_count + 1
      from candidate
      where r.record_id = candidate.record_id
      returning
        r.record_id,
        r.record_hash,
        r.patient_id,
        r.doctor_id,
        r.blockchain_tx_hash,
        r.blockchain_status,
        r.blockchain_claimed_by,
        r.blockchain_attempt_count
    )
    select
      'scope1_record'::text,
      c.record_id,
      c.record_hash,
      c.patient_id,
      c.doctor_id,
      null::uuid,
      null::uuid,
      null::text,
      null::timestamptz,
      null::boolean,
      c.blockchain_tx_hash,
      c.blockchain_status,
      c.blockchain_claimed_by,
      c.blockchain_attempt_count
    from claimed c;
    return;
  end if;

  if target_proof_type = 'access_grant' then
    return query
    with candidate as (
      select g.grant_id
      from public.access_grants g
      where g.blockchain_status in ('pending', 'failed')
        and (g.blockchain_next_retry_at is null or g.blockchain_next_retry_at <= transaction_timestamp())
        and (g.blockchain_claimed_at is null or g.blockchain_claimed_at < lease_cutoff)
      order by g.created_at, g.grant_id
      for update skip locked
      limit safe_limit
    ),
    claimed as (
      update public.access_grants g
      set blockchain_claimed_at = transaction_timestamp(),
          blockchain_claimed_by = safe_worker_id,
          blockchain_attempt_count = g.blockchain_attempt_count + 1
      from candidate
      where g.grant_id = candidate.grant_id
      returning
        g.grant_id,
        g.consent_hash,
        g.patient_id,
        g.doctor_id,
        g.expires_at,
        g.is_revoked,
        g.blockchain_tx_hash,
        g.blockchain_status,
        g.blockchain_claimed_by,
        g.blockchain_attempt_count
    )
    select
      'access_grant'::text,
      c.grant_id,
      c.consent_hash,
      c.patient_id,
      c.doctor_id,
      null::uuid,
      null::uuid,
      null::text,
      c.expires_at,
      c.is_revoked,
      c.blockchain_tx_hash,
      c.blockchain_status,
      c.blockchain_claimed_by,
      c.blockchain_attempt_count
    from claimed c;
    return;
  end if;

  if target_proof_type = 'audit_log' then
    return query
    with candidate as (
      select a.log_id
      from public.audit_logs a
      where a.blockchain_status in ('pending', 'failed')
        and (a.blockchain_next_retry_at is null or a.blockchain_next_retry_at <= transaction_timestamp())
        and (a.blockchain_claimed_at is null or a.blockchain_claimed_at < lease_cutoff)
      order by a.created_at, a.log_id
      for update skip locked
      limit safe_limit
    ),
    claimed as (
      update public.audit_logs a
      set blockchain_claimed_at = transaction_timestamp(),
          blockchain_claimed_by = safe_worker_id,
          blockchain_attempt_count = a.blockchain_attempt_count + 1
      from candidate
      where a.log_id = candidate.log_id
      returning
        a.log_id,
        a.audit_event_hash,
        a.patient_id,
        a.doctor_id,
        a.actor_auth_user_id,
        a.target_id,
        a.action,
        a.blockchain_tx_hash,
        a.blockchain_status,
        a.blockchain_claimed_by,
        a.blockchain_attempt_count
    )
    select
      'audit_log'::text,
      c.log_id,
      c.audit_event_hash,
      c.patient_id,
      c.doctor_id,
      c.actor_auth_user_id,
      c.target_id,
      c.action,
      null::timestamptz,
      null::boolean,
      c.blockchain_tx_hash,
      c.blockchain_status,
      c.blockchain_claimed_by,
      c.blockchain_attempt_count
    from claimed c;
    return;
  end if;

  raise exception 'unsupported proof type'
    using errcode = '22023';
end;
$$;

revoke all on function public.claim_blockchain_proofs(text, integer, text, integer) from public, anon, authenticated;
grant usage on schema public to service_role;
grant execute on function public.claim_blockchain_proofs(text, integer, text, integer) to service_role;

revoke insert on public.scope_1_medical_records from authenticated;

create or replace function public.create_scope1_record_with_audit(
  target_record_id uuid,
  target_patient_id uuid,
  target_doctor_id uuid,
  target_amends_record_id uuid,
  target_record_type_ciphertext text,
  target_record_type_iv text,
  target_record_type_tag text,
  target_title_ciphertext text,
  target_title_iv text,
  target_title_tag text,
  target_description_ciphertext text,
  target_description_iv text,
  target_description_tag text,
  target_attachment_file_id uuid,
  target_record_hash text,
  target_key_version text,
  target_created_at timestamptz,
  target_audit_log_id uuid,
  target_audit_event_hash text
)
returns public.scope_1_medical_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_doctor uuid;
  inserted_record public.scope_1_medical_records;
  audit_action text;
  audit_status text;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'authentication required';
  end if;

  select d.doctor_id
  into current_doctor
  from public.doctors d
  where d.auth_user_id = (select auth.uid())
    and d.account_status = 'approved'
  limit 1;

  if current_doctor is distinct from target_doctor_id then
    raise insufficient_privilege using message = 'approved doctor required';
  end if;

  if not private.has_active_grant(target_patient_id, 'scope1') then
    raise insufficient_privilege using message = 'active Scope 1 grant required';
  end if;

  if target_record_id is null or target_patient_id is null or target_doctor_id is null then
    raise not_null_violation using message = 'record, patient, and doctor ids are required';
  end if;

  if target_created_at is null then
    raise not_null_violation using message = 'created_at is required';
  end if;

  if target_record_hash is null or target_record_hash !~ '^[0-9a-fA-F]{64}$' then
    raise check_violation using message = 'record_hash must be 64 hex characters';
  end if;

  if target_audit_log_id is null then
    raise not_null_violation using message = 'audit log id is required';
  end if;

  if target_audit_event_hash is null or target_audit_event_hash !~ '^[0-9a-fA-F]{64}$' then
    raise check_violation using message = 'audit_event_hash must be 64 hex characters';
  end if;

  if target_amends_record_id is not null and not exists (
    select 1
    from public.scope_1_medical_records r
    where r.record_id = target_amends_record_id
      and r.patient_id = target_patient_id
  ) then
    raise no_data_found using message = 'amended record not found for patient';
  end if;

  if target_attachment_file_id is not null and not exists (
    select 1
    from public.secure_files f
    where f.file_id = target_attachment_file_id
      and f.owner_role = 'patient'
      and f.owner_id = target_patient_id
  ) then
    raise foreign_key_violation using message = 'attachment file not found for patient';
  end if;

  audit_action := case
    when target_amends_record_id is null then 'scope1_record_created'
    else 'scope1_record_amended'
  end;
  audit_status := case
    when target_amends_record_id is null then 'created'
    else 'amended'
  end;

  perform set_config('request.medproof.scope1_mutation', 'create_scope1_record_with_audit', true);

  insert into public.scope_1_medical_records (
    record_id,
    patient_id,
    doctor_id,
    amends_record_id,
    record_type_ciphertext,
    record_type_iv,
    record_type_tag,
    title_ciphertext,
    title_iv,
    title_tag,
    description_ciphertext,
    description_iv,
    description_tag,
    attachment_file_id,
    record_hash,
    blockchain_status,
    key_version,
    created_at
  )
  values (
    target_record_id,
    target_patient_id,
    target_doctor_id,
    target_amends_record_id,
    target_record_type_ciphertext,
    target_record_type_iv,
    target_record_type_tag,
    target_title_ciphertext,
    target_title_iv,
    target_title_tag,
    target_description_ciphertext,
    target_description_iv,
    target_description_tag,
    target_attachment_file_id,
    target_record_hash,
    'pending',
    coalesce(nullif(btrim(target_key_version), ''), 'v1'),
    target_created_at
  )
  returning * into inserted_record;

  perform set_config('request.medproof.audit_mutation', 'scope1_record_with_audit', true);

  insert into public.audit_logs (
    log_id,
    actor_auth_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    patient_id,
    doctor_id,
    access_status,
    audit_event_hash,
    blockchain_status,
    created_at
  )
  values (
    target_audit_log_id,
    (select auth.uid()),
    'doctor',
    audit_action,
    'scope_1_medical_record',
    target_record_id,
    target_patient_id,
    target_doctor_id,
    audit_status,
    target_audit_event_hash,
    'pending',
    target_created_at
  );

  return inserted_record;
end;
$$;

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

  select a.admin_id
  into current_admin
  from public.medical_admins a
  where a.auth_user_id = (select auth.uid())
  limit 1;

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

  select a.admin_id
  into current_admin
  from public.medical_admins a
  where a.auth_user_id = (select auth.uid())
  limit 1;

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

revoke all on function public.create_scope1_record_with_audit(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  timestamptz,
  uuid,
  text
) from public, anon;

revoke all on function public.approve_doctor_with_audit(uuid, text, text, timestamptz, uuid, text)
from public, anon;

revoke all on function public.reject_doctor_with_audit(uuid, text, timestamptz, uuid, text)
from public, anon;

grant execute on function public.create_scope1_record_with_audit(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  timestamptz,
  uuid,
  text
) to authenticated;

grant execute on function public.approve_doctor_with_audit(uuid, text, text, timestamptz, uuid, text)
to authenticated;

grant execute on function public.reject_doctor_with_audit(uuid, text, timestamptz, uuid, text)
to authenticated;
