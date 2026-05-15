create index if not exists audit_logs_lookup_rate_limit_idx
on public.audit_logs(actor_auth_user_id, ip_address, created_at desc)
where action = 'doctor_access_code_lookup_failed'
  and target_type = 'doctor_lookup';

create or replace function private.is_approved_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.doctors d
    where d.doctor_id = target_doctor_id
      and d.account_status = 'approved'
  )
$$;

grant insert on public.audit_logs to authenticated;

create policy "patients can insert access audit logs through rpc"
on public.audit_logs for insert to authenticated
with check (
  actor_auth_user_id = (select auth.uid())
  and actor_role = 'patient'
  and patient_id = private.current_patient_id()
  and doctor_id is not null
  and action in ('patient_grant_created', 'patient_grant_replaced', 'patient_grant_revoked')
  and access_status in ('created', 'replaced', 'revoked')
  and target_type = 'access_grant'
  and target_id is not null
  and (select current_setting('request.medproof.audit_mutation', true)) = 'patient_access_grant'
);

create or replace function public.replace_active_access_grant_v2(
  target_grant_id uuid,
  target_patient_id uuid,
  target_doctor_id uuid,
  allow_scope1 boolean,
  allow_scope2_mental boolean,
  allow_scope2_physical boolean,
  allow_download_attachments boolean,
  target_granted_at timestamptz,
  target_expires_at timestamptz,
  target_consent_hash text,
  prior_replacement_consent_hash text,
  target_audit_log_id uuid,
  target_audit_event_hash text,
  target_ip_address inet default null
)
returns public.access_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_patient uuid;
  new_grant public.access_grants;
  active_grant_count int;
  existing_active_count int;
  mutation_action text;
  mutation_status text;
  lock_key bigint;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'authentication required';
  end if;

  select p.patient_id
  into current_patient
  from public.patients p
  where p.auth_user_id = (select auth.uid())
  limit 1;

  if current_patient is distinct from target_patient_id then
    raise insufficient_privilege using message = 'patient grant mutation forbidden';
  end if;

  if not private.is_approved_doctor(target_doctor_id) then
    raise insufficient_privilege using message = 'doctor is not approved';
  end if;

  if not (
    coalesce(allow_scope1, false)
    or coalesce(allow_scope2_mental, false)
    or coalesce(allow_scope2_physical, false)
  ) then
    raise check_violation using message = 'at least one view scope is required';
  end if;

  if coalesce(allow_download_attachments, false) and not coalesce(allow_scope1, false) then
    raise check_violation using message = 'attachment download requires Scope 1 access';
  end if;

  if target_grant_id is null then
    raise not_null_violation using message = 'grant_id is required';
  end if;

  if target_granted_at is null or target_expires_at is null then
    raise not_null_violation using message = 'grant timestamps are required';
  end if;

  if target_expires_at <= target_granted_at or not isfinite(target_expires_at) then
    raise check_violation using message = 'expires_at must be finite and after granted_at';
  end if;

  if target_consent_hash is null or btrim(target_consent_hash) = '' then
    raise check_violation using message = 'consent_hash is required';
  end if;

  if target_audit_log_id is null then
    raise not_null_violation using message = 'audit log id is required';
  end if;

  if target_audit_event_hash is null or btrim(target_audit_event_hash) = '' then
    raise check_violation using message = 'audit_event_hash is required';
  end if;

  lock_key := hashtextextended(target_patient_id::text || ':' || target_doctor_id::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  perform 1
  from public.access_grants ag
  where ag.patient_id = target_patient_id
    and ag.doctor_id = target_doctor_id
  for update;

  select count(*)::int
  into existing_active_count
  from public.access_grants ag
  where ag.patient_id = target_patient_id
    and ag.doctor_id = target_doctor_id
    and ag.is_revoked = false
    and ag.expires_at > transaction_timestamp();

  if existing_active_count > 0 and (prior_replacement_consent_hash is null or btrim(prior_replacement_consent_hash) = '') then
    raise check_violation using message = 'replacement consent_hash is required';
  end if;

  mutation_action := case
    when existing_active_count > 0 then 'patient_grant_replaced'
    else 'patient_grant_created'
  end;
  mutation_status := case
    when existing_active_count > 0 then 'replaced'
    else 'created'
  end;

  perform set_config('request.medproof.grant_mutation', 'replace_active_access_grant', true);

  insert into public.access_grants (
    grant_id,
    patient_id,
    doctor_id,
    can_view_scope1,
    can_view_scope2_mental,
    can_view_scope2_physical,
    can_download_attachments,
    granted_at,
    expires_at,
    consent_hash,
    blockchain_status,
    created_at
  )
  values (
    target_grant_id,
    target_patient_id,
    target_doctor_id,
    coalesce(allow_scope1, false),
    coalesce(allow_scope2_mental, false),
    coalesce(allow_scope2_physical, false),
    coalesce(allow_download_attachments, false),
    target_granted_at,
    target_expires_at,
    target_consent_hash,
    'pending',
    target_granted_at
  )
  returning * into new_grant;

  update public.access_grants ag
  set is_revoked = true,
      revoked_at = target_granted_at,
      replaced_by_grant_id = new_grant.grant_id,
      consent_hash = coalesce(nullif(btrim(prior_replacement_consent_hash), ''), ag.consent_hash),
      blockchain_tx_hash = null,
      blockchain_status = 'pending',
      blockchain_last_error = null
  where ag.patient_id = target_patient_id
    and ag.doctor_id = target_doctor_id
    and ag.grant_id <> new_grant.grant_id
    and ag.is_revoked = false
    and ag.expires_at > transaction_timestamp();

  select count(*)::int
  into active_grant_count
  from public.access_grants ag
  where ag.patient_id = target_patient_id
    and ag.doctor_id = target_doctor_id
    and ag.is_revoked = false
    and ag.expires_at > transaction_timestamp();

  if active_grant_count <> 1 then
    raise integrity_constraint_violation using message = 'active grant invariant failed';
  end if;

  perform set_config('request.medproof.audit_mutation', 'patient_access_grant', true);

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
    reason,
    ip_address,
    audit_event_hash,
    blockchain_status,
    created_at
  )
  values (
    target_audit_log_id,
    (select auth.uid()),
    'patient',
    mutation_action,
    'access_grant',
    new_grant.grant_id,
    target_patient_id,
    target_doctor_id,
    mutation_status,
    null,
    target_ip_address,
    target_audit_event_hash,
    'pending',
    target_granted_at
  );

  return new_grant;
end;
$$;

create or replace function public.revoke_active_access_grant(
  target_grant_id uuid,
  target_patient_id uuid,
  target_revoked_at timestamptz,
  target_consent_hash text,
  target_audit_log_id uuid,
  target_audit_event_hash text,
  target_ip_address inet default null
)
returns public.access_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_patient uuid;
  existing_grant public.access_grants;
  revoked_grant public.access_grants;
  lock_key bigint;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'authentication required';
  end if;

  select p.patient_id
  into current_patient
  from public.patients p
  where p.auth_user_id = (select auth.uid())
  limit 1;

  if current_patient is distinct from target_patient_id then
    raise insufficient_privilege using message = 'patient grant revoke forbidden';
  end if;

  select ag.*
  into existing_grant
  from public.access_grants ag
  where ag.grant_id = target_grant_id
    and ag.patient_id = target_patient_id
  for update;

  if existing_grant.grant_id is null then
    raise no_data_found using message = 'active grant not found';
  end if;

  if existing_grant.is_revoked = true or existing_grant.expires_at <= transaction_timestamp() then
    raise check_violation using message = 'grant is not active';
  end if;

  if target_revoked_at is null then
    raise not_null_violation using message = 'revoked_at is required';
  end if;

  if target_consent_hash is null or btrim(target_consent_hash) = '' then
    raise check_violation using message = 'consent_hash is required';
  end if;

  if target_audit_log_id is null then
    raise not_null_violation using message = 'audit log id is required';
  end if;

  if target_audit_event_hash is null or btrim(target_audit_event_hash) = '' then
    raise check_violation using message = 'audit_event_hash is required';
  end if;

  lock_key := hashtextextended(target_patient_id::text || ':' || existing_grant.doctor_id::text, 0);
  perform pg_advisory_xact_lock(lock_key);
  perform set_config('request.medproof.grant_mutation', 'replace_active_access_grant', true);

  update public.access_grants ag
  set is_revoked = true,
      revoked_at = target_revoked_at,
      consent_hash = target_consent_hash,
      blockchain_tx_hash = null,
      blockchain_status = 'pending',
      blockchain_last_error = null
  where ag.grant_id = target_grant_id
    and ag.patient_id = target_patient_id
  returning * into revoked_grant;

  perform set_config('request.medproof.audit_mutation', 'patient_access_grant', true);

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
    reason,
    ip_address,
    audit_event_hash,
    blockchain_status,
    created_at
  )
  values (
    target_audit_log_id,
    (select auth.uid()),
    'patient',
    'patient_grant_revoked',
    'access_grant',
    revoked_grant.grant_id,
    target_patient_id,
    revoked_grant.doctor_id,
    'revoked',
    null,
    target_ip_address,
    target_audit_event_hash,
    'pending',
    target_revoked_at
  );

  return revoked_grant;
end;
$$;

grant execute on function public.replace_active_access_grant_v2(
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  timestamptz,
  text,
  text,
  uuid,
  text,
  inet
) to authenticated;

grant execute on function public.revoke_active_access_grant(
  uuid,
  uuid,
  timestamptz,
  text,
  uuid,
  text,
  inet
) to authenticated;

grant execute on function private.is_approved_doctor(uuid) to authenticated;
