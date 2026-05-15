create extension if not exists pgcrypto with schema extensions;
drop extension if exists pg_graphql cascade;

create schema if not exists private;
revoke all on schema private from anon, authenticated, public;

create table public.patients (
  patient_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  date_of_birth date null,
  profiling_data_ciphertext text null,
  profiling_data_iv text null,
  profiling_data_tag text null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

create table public.medical_admins (
  admin_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table public.doctors (
  doctor_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone_number text null,
  specialization text null,
  account_status text not null default 'pending',
  rejection_reason text null,
  verified_by uuid null references public.medical_admins(admin_id),
  verified_at timestamptz null,
  qr_code_token text unique null,
  doctor_access_code char(6) unique null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint doctors_account_status_check check (account_status in ('pending', 'approved', 'rejected')),
  constraint doctors_access_code_format_check check (doctor_access_code is null or doctor_access_code ~ '^[0-9]{6}$'),
  constraint doctors_unapproved_has_no_public_code_check check (
    account_status = 'approved' or (qr_code_token is null and doctor_access_code is null)
  ),
  constraint doctors_approved_has_public_code_check check (
    account_status <> 'approved' or (qr_code_token is not null and doctor_access_code is not null)
  )
);

create table public.secure_files (
  file_id uuid primary key default gen_random_uuid(),
  owner_role text not null,
  owner_id uuid not null,
  bucket_name text not null,
  object_path text not null,
  original_filename_ciphertext text not null,
  original_filename_iv text not null,
  original_filename_tag text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  file_sha256 text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  constraint secure_files_owner_role_check check (owner_role in ('patient', 'doctor', 'medical_admin')),
  constraint secure_files_size_check check (file_size_bytes >= 0)
);

create table public.doctor_kyc_documents (
  document_id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(doctor_id) on delete cascade,
  document_type text not null,
  file_id uuid not null references public.secure_files(file_id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint doctor_kyc_documents_type_check check (document_type in ('str', 'sip', 'ktp')),
  constraint doctor_kyc_documents_doctor_type_key unique (doctor_id, document_type)
);

create table public.ai_sessions (
  session_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  session_title_ciphertext text null,
  session_title_iv text null,
  session_title_tag text null,
  summary_text_ciphertext text null,
  summary_text_iv text null,
  summary_text_tag text null,
  ended_at timestamptz null,
  end_reason text null,
  summary_generated_at timestamptz null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint ai_sessions_end_reason_check check (
    end_reason is null or end_reason in ('manual_end', 'inactivity_timeout', 'new_session_started')
  )
);

create table public.ai_messages (
  message_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_sessions(session_id) on delete cascade,
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  sender_role text not null,
  message_text_ciphertext text not null,
  message_text_iv text not null,
  message_text_tag text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  constraint ai_messages_sender_role_check check (sender_role in ('patient', 'ai'))
);

create table public.scope_2_mental (
  log_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  session_id uuid not null references public.ai_sessions(session_id) on delete cascade,
  log_date date not null,
  mood_score_ciphertext text null,
  mood_score_iv text null,
  mood_score_tag text null,
  anxiety_level_ciphertext text null,
  anxiety_level_iv text null,
  anxiety_level_tag text null,
  sleep_hours_ciphertext text null,
  sleep_hours_iv text null,
  sleep_hours_tag text null,
  trigger_notes_ciphertext text null,
  trigger_notes_iv text null,
  trigger_notes_tag text null,
  raw_quote_ciphertext text not null,
  raw_quote_iv text not null,
  raw_quote_tag text not null,
  is_emergency_flagged_ciphertext text not null,
  is_emergency_flagged_iv text not null,
  is_emergency_flagged_tag text not null,
  extraction_confidence_ciphertext text null,
  extraction_confidence_iv text null,
  extraction_confidence_tag text null,
  ai_model text null,
  schema_version text not null default 'v1',
  raw_extraction_jsonb_ciphertext text null,
  raw_extraction_jsonb_iv text null,
  raw_extraction_jsonb_tag text null,
  raw_quote_hash text null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint scope_2_mental_session_key unique (session_id)
);

create table public.scope_2_physical (
  log_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  session_id uuid not null references public.ai_sessions(session_id) on delete cascade,
  log_date date not null,
  symptom_type_ciphertext text null,
  symptom_type_iv text null,
  symptom_type_tag text null,
  severity_ciphertext text null,
  severity_iv text null,
  severity_tag text null,
  body_location_ciphertext text null,
  body_location_iv text null,
  body_location_tag text null,
  duration_note_ciphertext text null,
  duration_note_iv text null,
  duration_note_tag text null,
  raw_quote_ciphertext text not null,
  raw_quote_iv text not null,
  raw_quote_tag text not null,
  is_emergency_flagged_ciphertext text not null,
  is_emergency_flagged_iv text not null,
  is_emergency_flagged_tag text not null,
  extraction_confidence_ciphertext text null,
  extraction_confidence_iv text null,
  extraction_confidence_tag text null,
  ai_model text null,
  schema_version text not null default 'v1',
  raw_extraction_jsonb_ciphertext text null,
  raw_extraction_jsonb_iv text null,
  raw_extraction_jsonb_tag text null,
  raw_quote_hash text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint scope_2_physical_session_quote_key unique (session_id, raw_quote_hash)
);

create table public.scope_1_medical_records (
  record_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  doctor_id uuid not null references public.doctors(doctor_id) on delete restrict,
  amends_record_id uuid null references public.scope_1_medical_records(record_id) on delete restrict,
  record_type_ciphertext text not null,
  record_type_iv text not null,
  record_type_tag text not null,
  title_ciphertext text not null,
  title_iv text not null,
  title_tag text not null,
  description_ciphertext text null,
  description_iv text null,
  description_tag text null,
  attachment_file_id uuid null references public.secure_files(file_id) on delete restrict,
  record_hash text not null,
  blockchain_tx_hash text null,
  blockchain_status text not null default 'pending',
  blockchain_last_error text null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  constraint scope_1_blockchain_status_check check (blockchain_status in ('pending', 'confirmed', 'failed'))
);

create table public.access_grants (
  grant_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  doctor_id uuid not null references public.doctors(doctor_id) on delete cascade,
  can_view_scope1 boolean not null default false,
  can_view_scope2_mental boolean not null default false,
  can_view_scope2_physical boolean not null default false,
  can_download_attachments boolean not null default false,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_revoked boolean not null default false,
  revoked_at timestamptz null,
  replaced_by_grant_id uuid null references public.access_grants(grant_id),
  consent_hash text not null,
  blockchain_tx_hash text null,
  blockchain_status text not null default 'pending',
  blockchain_last_error text null,
  created_at timestamptz not null default now(),
  constraint access_grants_scope_check check (
    can_view_scope1 = true or can_view_scope2_mental = true or can_view_scope2_physical = true
  ),
  constraint access_grants_finite_expiry_check check (isfinite(expires_at)),
  constraint access_grants_expiry_order_check check (expires_at > granted_at),
  constraint access_grants_revoked_consistency_check check (
    (is_revoked = false and revoked_at is null) or (is_revoked = true and revoked_at is not null)
  ),
  constraint access_grants_blockchain_status_check check (blockchain_status in ('pending', 'confirmed', 'failed'))
);

create table public.audit_logs (
  log_id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid not null references auth.users(id) on delete restrict,
  actor_role text not null,
  action text not null,
  target_type text null,
  target_id uuid null,
  patient_id uuid null references public.patients(patient_id) on delete cascade,
  doctor_id uuid null references public.doctors(doctor_id) on delete cascade,
  access_status text not null,
  reason text null,
  ip_address inet null,
  audit_event_hash text not null,
  blockchain_tx_hash text null,
  blockchain_status text not null default 'pending',
  blockchain_last_error text null,
  created_at timestamptz not null default now(),
  constraint audit_logs_actor_role_check check (actor_role in ('patient', 'doctor', 'medical_admin')),
  constraint audit_logs_status_check check (
    access_status in (
      'accepted', 'approved', 'rejected', 'allowed', 'denied', 'created',
      'amended', 'revoked', 'replaced', 'failed', 'mismatch'
    )
  ),
  constraint audit_logs_blockchain_status_check check (blockchain_status in ('pending', 'confirmed', 'failed'))
);

create index patients_auth_user_id_idx on public.patients(auth_user_id);
create index patients_email_idx on public.patients(email);
create index doctors_auth_user_id_idx on public.doctors(auth_user_id);
create index doctors_email_idx on public.doctors(email);
create index doctors_account_status_idx on public.doctors(account_status);
create index doctors_qr_code_token_idx on public.doctors(qr_code_token) where qr_code_token is not null;
create index doctors_access_code_idx on public.doctors(doctor_access_code) where doctor_access_code is not null;
create index medical_admins_auth_user_id_idx on public.medical_admins(auth_user_id);
create index medical_admins_email_idx on public.medical_admins(email);
create index secure_files_owner_idx on public.secure_files(owner_role, owner_id);
create index doctor_kyc_documents_doctor_id_idx on public.doctor_kyc_documents(doctor_id);
create index doctor_kyc_documents_file_id_idx on public.doctor_kyc_documents(file_id);
create index ai_sessions_patient_id_idx on public.ai_sessions(patient_id);
create index ai_messages_session_id_idx on public.ai_messages(session_id);
create index ai_messages_patient_id_idx on public.ai_messages(patient_id);
create index scope_2_mental_patient_id_idx on public.scope_2_mental(patient_id);
create index scope_2_mental_session_id_idx on public.scope_2_mental(session_id);
create index scope_2_physical_patient_id_idx on public.scope_2_physical(patient_id);
create index scope_2_physical_session_id_idx on public.scope_2_physical(session_id);
create index scope_1_records_patient_id_idx on public.scope_1_medical_records(patient_id);
create index scope_1_records_doctor_id_idx on public.scope_1_medical_records(doctor_id);
create index scope_1_records_amends_record_id_idx on public.scope_1_medical_records(amends_record_id);
create index scope_1_records_attachment_file_id_idx on public.scope_1_medical_records(attachment_file_id);
create index access_grants_patient_doctor_granted_idx on public.access_grants(patient_id, doctor_id, granted_at desc);
create index access_grants_doctor_expiry_revoked_idx on public.access_grants(doctor_id, expires_at, is_revoked);
create index access_grants_active_doctor_patient_idx on public.access_grants(doctor_id, patient_id, granted_at desc)
  where is_revoked = false;
create index audit_logs_patient_created_idx on public.audit_logs(patient_id, created_at desc);
create index audit_logs_doctor_created_idx on public.audit_logs(doctor_id, created_at desc);
create index audit_logs_actor_created_idx on public.audit_logs(actor_auth_user_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs(action);

create or replace function private.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.patient_id
  from public.patients p
  where p.auth_user_id = (select auth.uid())
  limit 1
$$;

create or replace function private.current_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.doctor_id
  from public.doctors d
  where d.auth_user_id = (select auth.uid())
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
  limit 1
$$;

create or replace function private.is_current_doctor_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.doctors d
    where d.auth_user_id = (select auth.uid())
      and d.account_status = 'approved'
  )
$$;

create or replace function private.has_active_grant(
  target_patient_id uuid,
  required_scope text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.access_grants ag
    join public.doctors d on d.doctor_id = ag.doctor_id
    where ag.patient_id = target_patient_id
      and d.auth_user_id = (select auth.uid())
      and d.account_status = 'approved'
      and ag.is_revoked = false
      and ag.expires_at > now()
      and (
        required_scope is null
        or (required_scope = 'scope1' and ag.can_view_scope1)
        or (required_scope = 'scope2_mental' and ag.can_view_scope2_mental)
        or (required_scope = 'scope2_physical' and ag.can_view_scope2_physical)
        or (required_scope = 'attachments' and ag.can_view_scope1 and ag.can_download_attachments)
      )
  )
$$;

create or replace function public.replace_active_access_grant(
  target_patient_id uuid,
  target_doctor_id uuid,
  allow_scope1 boolean,
  allow_scope2_mental boolean,
  allow_scope2_physical boolean,
  allow_download_attachments boolean,
  target_expires_at timestamptz,
  target_consent_hash text
)
returns public.access_grants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_patient uuid;
  new_grant public.access_grants;
  active_grant_count int;
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

  if target_expires_at <= transaction_timestamp() or not isfinite(target_expires_at) then
    raise check_violation using message = 'expires_at must be finite and in the future';
  end if;

  if target_consent_hash is null or btrim(target_consent_hash) = '' then
    raise check_violation using message = 'consent_hash is required';
  end if;

  lock_key := hashtextextended(target_patient_id::text || ':' || target_doctor_id::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  perform 1
  from public.access_grants ag
  where ag.patient_id = target_patient_id
    and ag.doctor_id = target_doctor_id
  for update;

  perform set_config('request.medproof.grant_mutation', 'replace_active_access_grant', true);

  insert into public.access_grants (
    patient_id,
    doctor_id,
    can_view_scope1,
    can_view_scope2_mental,
    can_view_scope2_physical,
    can_download_attachments,
    expires_at,
    consent_hash
  )
  values (
    target_patient_id,
    target_doctor_id,
    coalesce(allow_scope1, false),
    coalesce(allow_scope2_mental, false),
    coalesce(allow_scope2_physical, false),
    coalesce(allow_download_attachments, false),
    target_expires_at,
    target_consent_hash
  )
  returning * into new_grant;

  update public.access_grants ag
  set is_revoked = true,
      revoked_at = transaction_timestamp(),
      replaced_by_grant_id = new_grant.grant_id
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

  return new_grant;
end;
$$;

alter table public.patients enable row level security;
alter table public.medical_admins enable row level security;
alter table public.doctors enable row level security;
alter table public.secure_files enable row level security;
alter table public.doctor_kyc_documents enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.scope_2_mental enable row level security;
alter table public.scope_2_physical enable row level security;
alter table public.scope_1_medical_records enable row level security;
alter table public.access_grants enable row level security;
alter table public.audit_logs enable row level security;

create policy "patients can view own patient row"
on public.patients for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or private.has_active_grant(patient_id, null)
);

create policy "patients can insert own patient row"
on public.patients for insert to authenticated
with check (auth_user_id = (select auth.uid()));

create policy "patients can update own patient row"
on public.patients for update to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

create policy "admins can view own admin row"
on public.medical_admins for select to authenticated
using (auth_user_id = (select auth.uid()));

create policy "doctors and admins can view doctors"
on public.doctors for select to authenticated
using (auth_user_id = (select auth.uid()) or private.current_admin_id() is not null);

create policy "doctors can insert own pending row"
on public.doctors for insert to authenticated
with check (auth_user_id = (select auth.uid()) and account_status = 'pending');

create policy "doctors can update own pending profile"
on public.doctors for update to authenticated
using (auth_user_id = (select auth.uid()) and account_status = 'pending')
with check (auth_user_id = (select auth.uid()) and account_status = 'pending');

create policy "secure files visible to owner or admin"
on public.secure_files for select to authenticated
using (
  (owner_role = 'patient' and owner_id = private.current_patient_id())
  or (owner_role = 'doctor' and owner_id = private.current_doctor_id())
  or (owner_role = 'medical_admin' and owner_id = private.current_admin_id())
  or (
    private.current_admin_id() is not null
    and owner_role = 'doctor'
    and exists (
      select 1
      from public.doctor_kyc_documents dkd
      where dkd.file_id = secure_files.file_id
    )
  )
);

create policy "secure files insertable by owner"
on public.secure_files for insert to authenticated
with check (
  (owner_role = 'patient' and owner_id = private.current_patient_id())
  or (owner_role = 'doctor' and owner_id = private.current_doctor_id())
  or (owner_role = 'medical_admin' and owner_id = private.current_admin_id())
);

create policy "kyc docs visible to doctor owner or admin"
on public.doctor_kyc_documents for select to authenticated
using (
  private.current_admin_id() is not null
  or exists (
    select 1
    from public.doctors d
    where d.doctor_id = doctor_kyc_documents.doctor_id
      and d.auth_user_id = (select auth.uid())
  )
);

create policy "kyc docs insertable by doctor owner"
on public.doctor_kyc_documents for insert to authenticated
with check (
  exists (
    select 1
    from public.doctors d
    where d.doctor_id = doctor_kyc_documents.doctor_id
      and d.auth_user_id = (select auth.uid())
  )
);

create policy "patients can access own ai sessions"
on public.ai_sessions for select to authenticated
using (patient_id = private.current_patient_id());

create policy "patients can insert own ai sessions"
on public.ai_sessions for insert to authenticated
with check (patient_id = private.current_patient_id());

create policy "patients can update own ai sessions"
on public.ai_sessions for update to authenticated
using (patient_id = private.current_patient_id())
with check (patient_id = private.current_patient_id());

create policy "patients can access own ai messages"
on public.ai_messages for select to authenticated
using (patient_id = private.current_patient_id());

create policy "patients can insert own ai messages"
on public.ai_messages for insert to authenticated
with check (patient_id = private.current_patient_id());

create policy "scope2 mental visible to owner or granted doctor"
on public.scope_2_mental for select to authenticated
using (
  patient_id = private.current_patient_id()
  or private.has_active_grant(patient_id, 'scope2_mental')
);

create policy "patients can insert own scope2 mental"
on public.scope_2_mental for insert to authenticated
with check (patient_id = private.current_patient_id());

create policy "scope2 physical visible to owner or granted doctor"
on public.scope_2_physical for select to authenticated
using (
  patient_id = private.current_patient_id()
  or private.has_active_grant(patient_id, 'scope2_physical')
);

create policy "patients can insert own scope2 physical"
on public.scope_2_physical for insert to authenticated
with check (patient_id = private.current_patient_id());

create policy "scope1 visible to owner or granted doctor"
on public.scope_1_medical_records for select to authenticated
using (
  patient_id = private.current_patient_id()
  or private.has_active_grant(patient_id, 'scope1')
);

create policy "approved doctors can insert granted scope1"
on public.scope_1_medical_records for insert to authenticated
with check (
  doctor_id = private.current_doctor_id()
  and private.is_current_doctor_approved()
  and private.has_active_grant(patient_id, 'scope1')
);

create policy "patients and granted doctors can view access grants"
on public.access_grants for select to authenticated
using (
  patient_id = private.current_patient_id()
  or (
    doctor_id = private.current_doctor_id()
    and private.is_current_doctor_approved()
    and is_revoked = false
    and expires_at > now()
  )
);

create policy "patients can insert access grants through rpc"
on public.access_grants for insert to authenticated
with check (
  patient_id = private.current_patient_id()
  and (select current_setting('request.medproof.grant_mutation', true)) = 'replace_active_access_grant'
);

create policy "patients can update own access grants through rpc"
on public.access_grants for update to authenticated
using (
  patient_id = private.current_patient_id()
  and (select current_setting('request.medproof.grant_mutation', true)) = 'replace_active_access_grant'
)
with check (
  patient_id = private.current_patient_id()
  and (select current_setting('request.medproof.grant_mutation', true)) = 'replace_active_access_grant'
);

create policy "audit logs visible by role scope"
on public.audit_logs for select to authenticated
using (
  (patient_id is not null and patient_id = private.current_patient_id())
  or (doctor_id is not null and doctor_id = private.current_doctor_id())
  or (
    private.current_admin_id() is not null
    and action in ('admin_doctor_approved', 'admin_doctor_rejected', 'doctor_kyc_email_notification_failed')
  )
);

revoke all on schema public from public;
grant usage on schema public to anon, authenticated;
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;
revoke all on all tables in schema public from anon, authenticated, public;
revoke all on all functions in schema public from anon, authenticated, public;
revoke all on all functions in schema private from anon, authenticated, public;

grant execute on function private.current_patient_id() to authenticated;
grant execute on function private.current_doctor_id() to authenticated;
grant execute on function private.current_admin_id() to authenticated;
grant execute on function private.is_current_doctor_approved() to authenticated;
grant execute on function private.has_active_grant(uuid, text) to authenticated;
grant execute on function public.replace_active_access_grant(
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  text
) to authenticated;

grant select, insert, update on public.patients to authenticated;
grant select, insert, update on public.doctors to authenticated;
grant select on public.medical_admins to authenticated;
grant select, insert on public.secure_files to authenticated;
grant select, insert on public.doctor_kyc_documents to authenticated;
grant select, insert, update on public.ai_sessions to authenticated;
grant select, insert on public.ai_messages to authenticated;
grant select, insert on public.scope_2_mental to authenticated;
grant select, insert on public.scope_2_physical to authenticated;
grant select, insert on public.scope_1_medical_records to authenticated;
grant select, insert, update on public.access_grants to authenticated;
grant select on public.audit_logs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'encrypted-kyc-documents',
    'encrypted-kyc-documents',
    false,
    10485760,
    array['application/octet-stream']
  ),
  (
    'encrypted-medical-attachments',
    'encrypted-medical-attachments',
    false,
    10485760,
    array['application/octet-stream']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated users upload encrypted files in own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('encrypted-kyc-documents', 'encrypted-medical-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "authenticated users read encrypted files in own folder"
on storage.objects for select to authenticated
using (
  bucket_id in ('encrypted-kyc-documents', 'encrypted-medical-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
