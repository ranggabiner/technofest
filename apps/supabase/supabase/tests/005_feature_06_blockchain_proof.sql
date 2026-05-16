create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

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

update public.scope_1_medical_records set blockchain_status = 'confirmed';
update public.access_grants set blockchain_status = 'confirmed';
update public.audit_logs set blockchain_status = 'confirmed';

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000006101', 'authenticated', 'authenticated', 'feature06-patient@example.test'),
  ('00000000-0000-0000-0000-000000006201', 'authenticated', 'authenticated', 'feature06-doctor@example.test');

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
  $$select proof_type, id, proof_hash, patient_id, doctor_id
    from public.claim_blockchain_proofs('scope1_record', 5)$$,
  $$values (
      'scope1_record'::text,
      '90000000-0000-0000-0000-000000006001'::uuid,
      repeat('b', 64),
      '10000000-0000-0000-0000-000000006001'::uuid,
      '20000000-0000-0000-0000-000000006001'::uuid
    )$$,
  'service role claims pending Scope 1 proofs'
);

select results_eq(
  $$select proof_type, id, proof_hash, patient_id, doctor_id, is_revoked
    from public.claim_blockchain_proofs('access_grant', 5)$$,
  $$values (
      'access_grant'::text,
      '80000000-0000-0000-0000-000000006001'::uuid,
      repeat('a', 64),
      '10000000-0000-0000-0000-000000006001'::uuid,
      '20000000-0000-0000-0000-000000006001'::uuid,
      false
    )$$,
  'service role claims pending consent proofs'
);

select results_eq(
  $$select proof_type, id, proof_hash, actor_auth_user_id, target_id, action
    from public.claim_blockchain_proofs('audit_log', 5)$$,
  $$values (
      'audit_log'::text,
      '91000000-0000-0000-0000-000000006001'::uuid,
      repeat('c', 64),
      '00000000-0000-0000-0000-000000006201'::uuid,
      '80000000-0000-0000-0000-000000006001'::uuid,
      'doctor_rag_requested'::text
    )$$,
  'service role claims pending audit proofs'
);

select * from finish();

rollback;
