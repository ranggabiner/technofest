alter table public.access_grant_scope2_filters
  add column if not exists start_date date null,
  add column if not exists end_date date null;

alter table public.access_grant_scope2_filters
  drop constraint if exists access_grant_scope2_filters_mode_check,
  drop constraint if exists access_grant_scope2_filters_value_check;

alter table public.access_grant_scope2_filters
  add constraint access_grant_scope2_filters_mode_check
  check (mode in ('last_n_days', 'selected_session', 'date_range')),
  add constraint access_grant_scope2_filters_value_check
  check (
    (
      mode = 'last_n_days'
      and window_days is not null
      and window_days > 0
      and session_id is null
      and start_date is null
      and end_date is null
    )
    or (
      mode = 'selected_session'
      and window_days is null
      and session_id is not null
      and start_date is null
      and end_date is null
    )
    or (
      mode = 'date_range'
      and window_days is null
      and session_id is null
      and start_date is not null
      and end_date is not null
      and end_date >= start_date
    )
  );

create index if not exists access_grant_scope2_filters_date_range_idx
on public.access_grant_scope2_filters(scope_kind, start_date, end_date)
where mode = 'date_range';

create index if not exists scope_2_mental_patient_log_date_idx
on public.scope_2_mental(patient_id, log_date desc);

create index if not exists scope_2_physical_patient_log_date_idx
on public.scope_2_physical(patient_id, log_date desc);

create or replace function private.validate_access_grant_scope2_filter(
  target_patient_id uuid,
  target_scope_kind text,
  target_filter jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_mode text;
  target_start_date date;
  target_end_date date;
begin
  if target_filter is null or jsonb_typeof(target_filter) <> 'object' then
    raise check_violation using message = 'scope2 filter must be an object';
  end if;

  if target_scope_kind not in ('mental', 'physical') then
    raise check_violation using message = 'scope2 kind is invalid';
  end if;

  target_mode := target_filter->>'mode';

  if target_mode = 'date_range' then
    target_start_date := nullif(target_filter->>'start_date', '')::date;
    target_end_date := nullif(target_filter->>'end_date', '')::date;

    if target_start_date is null or target_end_date is null or target_end_date < target_start_date then
      raise check_violation using message = 'scope2 date range is invalid';
    end if;

    return;
  end if;

  raise check_violation using message = 'scope2 filter mode is invalid';
end;
$$;

create or replace function public.replace_active_access_grant_v3(
  target_grant_id uuid,
  target_patient_id uuid,
  target_doctor_id uuid,
  allow_scope1 boolean,
  allow_scope2_mental boolean,
  allow_scope2_physical boolean,
  target_attachment_record_ids uuid[],
  target_scope2_filters jsonb,
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
  normalized_attachment_record_ids uuid[];
  allow_download_attachments boolean;
  missing_attachment_count int;
  mental_filter jsonb;
  physical_filter jsonb;
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

  select coalesce(array_agg(distinct selected_record_id order by selected_record_id), array[]::uuid[])
  into normalized_attachment_record_ids
  from unnest(coalesce(target_attachment_record_ids, array[]::uuid[])) as selected(selected_record_id)
  where selected_record_id is not null;

  allow_download_attachments := coalesce(allow_scope1, false) and cardinality(normalized_attachment_record_ids) > 0;

  if cardinality(normalized_attachment_record_ids) > 0 and not coalesce(allow_scope1, false) then
    raise check_violation using message = 'attachment record permission requires Scope 1 access';
  end if;

  if cardinality(normalized_attachment_record_ids) > 0 then
    select count(*)::int
    into missing_attachment_count
    from unnest(normalized_attachment_record_ids) as selected(selected_record_id)
    left join public.scope_1_medical_records r
      on r.record_id = selected.selected_record_id
      and r.patient_id = target_patient_id
      and r.attachment_file_id is not null
    where r.record_id is null;

    if missing_attachment_count > 0 then
      raise check_violation using message = 'attachment record permission is invalid';
    end if;
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

  mental_filter := coalesce(target_scope2_filters, '{}'::jsonb)->'mental';
  physical_filter := coalesce(target_scope2_filters, '{}'::jsonb)->'physical';

  if coalesce(allow_scope2_mental, false) then
    perform private.validate_access_grant_scope2_filter(target_patient_id, 'mental', mental_filter);
  end if;

  if coalesce(allow_scope2_physical, false) then
    perform private.validate_access_grant_scope2_filter(target_patient_id, 'physical', physical_filter);
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
    allow_download_attachments,
    target_granted_at,
    target_expires_at,
    target_consent_hash,
    'pending',
    target_granted_at
  )
  returning * into new_grant;

  insert into public.access_grant_attachment_permissions (grant_id, record_id, created_at)
  select new_grant.grant_id, selected_record_id, target_granted_at
  from unnest(normalized_attachment_record_ids) as selected(selected_record_id);

  if coalesce(allow_scope2_mental, false) then
    insert into public.access_grant_scope2_filters (
      grant_id,
      scope_kind,
      mode,
      window_days,
      session_id,
      start_date,
      end_date,
      created_at
    )
    select
      new_grant.grant_id,
      'mental',
      mental_filter->>'mode',
      nullif(mental_filter->>'window_days', '')::integer,
      nullif(mental_filter->>'session_id', '')::uuid,
      nullif(mental_filter->>'start_date', '')::date,
      nullif(mental_filter->>'end_date', '')::date,
      target_granted_at;
  end if;

  if coalesce(allow_scope2_physical, false) then
    insert into public.access_grant_scope2_filters (
      grant_id,
      scope_kind,
      mode,
      window_days,
      session_id,
      start_date,
      end_date,
      created_at
    )
    select
      new_grant.grant_id,
      'physical',
      physical_filter->>'mode',
      nullif(physical_filter->>'window_days', '')::integer,
      nullif(physical_filter->>'session_id', '')::uuid,
      nullif(physical_filter->>'start_date', '')::date,
      nullif(physical_filter->>'end_date', '')::date,
      target_granted_at;
  end if;

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
