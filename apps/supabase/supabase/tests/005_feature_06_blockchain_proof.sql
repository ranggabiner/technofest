create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select isnt_empty(
  $$select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_blockchain_proofs'$$,
  'Feature 06 proof claim RPC exists'
);

select is(
  coalesce(
    (
      select has_function_privilege('authenticated', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'claim_blockchain_proofs'
      limit 1
    ),
    false
  ),
  false,
  'authenticated cannot execute proof claim RPC'
);

select is(
  coalesce(
    (
      select has_function_privilege('service_role', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'claim_blockchain_proofs'
      limit 1
    ),
    false
  ),
  true,
  'service_role can execute proof claim RPC'
);

select isnt_empty(
  $$select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('scope_1_medical_records', 'access_grants', 'audit_logs')
      and column_name in (
        'blockchain_claimed_at',
        'blockchain_claimed_by',
        'blockchain_attempt_count',
        'blockchain_next_retry_at'
      )
    group by table_schema
    having count(*) = 12$$,
  'proof tables expose lease-based retry columns'
);

select isnt_empty(
  $$select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'scope_1_records_blockchain_queue_idx',
        'access_grants_blockchain_queue_idx',
        'audit_logs_blockchain_queue_idx'
      )
    group by schemaname
    having count(*) = 3$$,
  'proof queue partial indexes exist'
);

select isnt_empty(
  $$select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('approve_doctor_with_audit', 'reject_doctor_with_audit')
    group by n.nspname
    having count(*) = 2$$,
  'admin doctor review atomic RPCs exist'
);

update public.scope_1_medical_records set blockchain_status = 'confirmed';
update public.access_grants set blockchain_status = 'confirmed';
update public.audit_logs set blockchain_status = 'confirmed';

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000006101', 'authenticated', 'authenticated', 'feature06-patient@example.test'),
  ('00000000-0000-0000-0000-000000006201', 'authenticated', 'authenticated', 'feature06-doctor@example.test'),
  ('00000000-0000-0000-0000-000000006301', 'authenticated', 'authenticated', 'feature06-admin@example.test'),
  ('00000000-0000-0000-0000-000000006202', 'authenticated', 'authenticated', 'feature06-pending-approve@example.test'),
  ('00000000-0000-0000-0000-000000006203', 'authenticated', 'authenticated', 'feature06-pending-reject@example.test');

insert into public.patients (patient_id, auth_user_id, full_name, email)
values (
  '10000000-0000-0000-0000-000000006001',
  '00000000-0000-0000-0000-000000006101',
  'Feature 06 Patient',
  'feature06-patient@example.test'
);

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  account_status,
  qr_code_token,
  doctor_access_code
)
values (
  '20000000-0000-0000-0000-000000006001',
  '00000000-0000-0000-0000-000000006201',
  'Feature 06 Doctor',
  'feature06-doctor@example.test',
  'approved',
  'feature06-token',
  '660601'
);

insert into public.medical_admins (admin_id, auth_user_id, full_name, email, admin_role)
values (
  '30000000-0000-0000-0000-000000006001',
  '00000000-0000-0000-0000-000000006301',
  'Feature 06 Admin',
  'feature06-admin@example.test',
  'superadmin'
);

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  account_status
)
values
  (
    '20000000-0000-0000-0000-000000006002',
    '00000000-0000-0000-0000-000000006202',
    'Feature 06 Pending Approve',
    'feature06-pending-approve@example.test',
    'pending'
  ),
  (
    '20000000-0000-0000-0000-000000006003',
    '00000000-0000-0000-0000-000000006203',
    'Feature 06 Pending Reject',
    'feature06-pending-reject@example.test',
    'pending'
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000006301';

select lives_ok(
  $$select public.approve_doctor_with_audit(
      '20000000-0000-0000-0000-000000006002',
      'feature06-approved-token',
      '660602',
      '2026-05-15T10:00:00+00'::timestamptz,
      '92000000-0000-0000-0000-000000006001',
      repeat('d', 64)
    )$$,
  'admin approves doctor and writes audit in one RPC'
);

select lives_ok(
  $$select public.reject_doctor_with_audit(
      '20000000-0000-0000-0000-000000006003',
      'manual_rejection',
      '2026-05-15T10:30:00+00'::timestamptz,
      '92000000-0000-0000-0000-000000006002',
      repeat('e', 64)
    )$$,
  'admin rejects doctor and writes audit in one RPC'
);

reset role;

select results_eq(
  $$select d.account_status, a.action, a.blockchain_status
    from public.doctors d
    join public.audit_logs a on a.target_id = d.doctor_id
    where d.doctor_id in (
      '20000000-0000-0000-0000-000000006002',
      '20000000-0000-0000-0000-000000006003'
    )
    order by d.doctor_id$$,
  $$values
    ('approved'::text, 'admin_doctor_approved'::text, 'pending'::text),
    ('rejected'::text, 'admin_doctor_rejected'::text, 'pending'::text)$$,
  'admin review RPCs persist status and pending audit proofs atomically'
);

update public.audit_logs
set blockchain_status = 'confirmed'
where log_id in (
  '92000000-0000-0000-0000-000000006001',
  '92000000-0000-0000-0000-000000006002'
);

insert into public.access_grants (
  grant_id,
  patient_id,
  doctor_id,
  can_view_scope1,
  expires_at,
  consent_hash
)
values (
  '80000000-0000-0000-0000-000000006001',
  '10000000-0000-0000-0000-000000006001',
  '20000000-0000-0000-0000-000000006001',
  true,
  now() + interval '1 day',
  repeat('a', 64)
);

insert into public.scope_1_medical_records (
  record_id,
  patient_id,
  doctor_id,
  record_type_ciphertext,
  record_type_iv,
  record_type_tag,
  title_ciphertext,
  title_iv,
  title_tag,
  record_hash
)
values (
  '90000000-0000-0000-0000-000000006001',
  '10000000-0000-0000-0000-000000006001',
  '20000000-0000-0000-0000-000000006001',
  'cipher-type',
  'iv-type',
  'tag-type',
  'cipher-title',
  'iv-title',
  'tag-title',
  repeat('b', 64)
);

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
  audit_event_hash
)
values (
  '91000000-0000-0000-0000-000000006001',
  '00000000-0000-0000-0000-000000006201',
  'doctor',
  'doctor_rag_requested',
  'access_grant',
  '80000000-0000-0000-0000-000000006001',
  '10000000-0000-0000-0000-000000006001',
  '20000000-0000-0000-0000-000000006001',
  'allowed',
  repeat('c', 64)
);

set local role service_role;

select results_eq(
  $$select proof_type, id, proof_hash, patient_id, doctor_id, attempt_count
    from public.claim_blockchain_proofs('scope1_record', 5, 'feature06-worker', 300)$$,
  $$values (
      'scope1_record'::text,
      '90000000-0000-0000-0000-000000006001'::uuid,
      repeat('b', 64),
      '10000000-0000-0000-0000-000000006001'::uuid,
      '20000000-0000-0000-0000-000000006001'::uuid,
      1
    )$$,
  'service role claims pending Scope 1 proofs'
);

select is_empty(
  $$select 1
    from public.claim_blockchain_proofs('scope1_record', 5, 'feature06-other-worker', 300)$$,
  'leased Scope 1 proof is not claimed twice'
);

select isnt_empty(
  $$select 1
    from public.scope_1_medical_records
    where record_id = '90000000-0000-0000-0000-000000006001'
      and blockchain_claimed_by = 'feature06-worker'
      and blockchain_claimed_at is not null
      and blockchain_attempt_count = 1$$,
  'Scope 1 claim stores lease metadata'
);

select results_eq(
  $$select proof_type, id, proof_hash, patient_id, doctor_id, is_revoked, attempt_count
    from public.claim_blockchain_proofs('access_grant', 5, 'feature06-worker', 300)$$,
  $$values (
      'access_grant'::text,
      '80000000-0000-0000-0000-000000006001'::uuid,
      repeat('a', 64),
      '10000000-0000-0000-0000-000000006001'::uuid,
      '20000000-0000-0000-0000-000000006001'::uuid,
      false,
      1
    )$$,
  'service role claims pending consent proofs'
);

select results_eq(
  $$select proof_type, id, proof_hash, actor_auth_user_id, target_id, action, attempt_count
    from public.claim_blockchain_proofs('audit_log', 5, 'feature06-worker', 300)$$,
  $$values (
      'audit_log'::text,
      '91000000-0000-0000-0000-000000006001'::uuid,
      repeat('c', 64),
      '00000000-0000-0000-0000-000000006201'::uuid,
      '80000000-0000-0000-0000-000000006001'::uuid,
      'doctor_rag_requested'::text,
      1
    )$$,
  'service role claims pending audit proofs'
);

select * from finish();

rollback;
