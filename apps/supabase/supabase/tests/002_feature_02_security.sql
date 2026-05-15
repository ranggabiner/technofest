create extension if not exists pgtap with schema extensions;

begin;

select plan(18);

select is(
  exists(select 1 from pg_extension where extname = 'pg_graphql'),
  false,
  'pg_graphql is disabled for Sprint 1'
);

create table public.__feature02_default_privilege_probe(id int primary key);

select is(
  has_table_privilege('anon', 'public.__feature02_default_privilege_probe', 'select'),
  false,
  'future public tables are not auto-granted to anon'
);

select is(
  has_table_privilege('authenticated', 'public.__feature02_default_privilege_probe', 'select'),
  false,
  'future public tables are not auto-granted to authenticated'
);

drop table public.__feature02_default_privilege_probe;

select isnt_empty(
  $$select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'replace_active_access_grant'$$,
  'replace active access grant RPC exists'
);

select is(
  coalesce(
    (
      select has_function_privilege('authenticated', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'replace_active_access_grant'
      limit 1
    ),
    false
  ),
  true,
  'authenticated can execute grant replacement RPC'
);

select is(
  coalesce(
    (
      select has_function_privilege('anon', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'replace_active_access_grant'
      limit 1
    ),
    false
  ),
  false,
  'anon cannot execute grant replacement RPC'
);

select is(
  has_schema_privilege('authenticated', 'private', 'usage'),
  false,
  'authenticated cannot use private helper schema'
);

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'patient@example.test'),
  ('00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'other-patient@example.test'),
  ('00000000-0000-0000-0000-000000000201', 'authenticated', 'authenticated', 'approved-doctor@example.test'),
  ('00000000-0000-0000-0000-000000000202', 'authenticated', 'authenticated', 'pending-doctor@example.test'),
  ('00000000-0000-0000-0000-000000000203', 'authenticated', 'authenticated', 'rejected-doctor@example.test'),
  ('00000000-0000-0000-0000-000000000301', 'authenticated', 'authenticated', 'admin@example.test');

insert into public.patients (patient_id, auth_user_id, full_name, email)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Patient One', 'patient@example.test'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 'Patient Two', 'other-patient@example.test');

insert into public.medical_admins (admin_id, auth_user_id, full_name, email)
values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', 'Admin One', 'admin@example.test');

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  account_status,
  qr_code_token,
  doctor_access_code
)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'Approved Doctor', 'approved-doctor@example.test', 'approved', 'approved-token', '123456'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000202', 'Pending Doctor', 'pending-doctor@example.test', 'pending', null, null),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000203', 'Rejected Doctor', 'rejected-doctor@example.test', 'rejected', null, null);

insert into public.secure_files (
  file_id,
  owner_role,
  owner_id,
  bucket_name,
  object_path,
  original_filename_ciphertext,
  original_filename_iv,
  original_filename_tag,
  mime_type,
  file_size_bytes,
  file_sha256
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'doctor',
    '20000000-0000-0000-0000-000000000001',
    'encrypted-kyc-documents',
    '00000000-0000-0000-0000-000000000201/kyc/20000000-0000-0000-0000-000000000001/40000000-0000-0000-0000-000000000001.json',
    'cipher',
    'iv',
    'tag',
    'application/octet-stream',
    1,
    'hash'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'patient',
    '10000000-0000-0000-0000-000000000001',
    'encrypted-medical-attachments',
    '00000000-0000-0000-0000-000000000101/medical/40000000-0000-0000-0000-000000000002.json',
    'cipher',
    'iv',
    'tag',
    'application/octet-stream',
    1,
    'hash2'
  );

insert into public.doctor_kyc_documents (document_id, doctor_id, document_type, file_id)
values (
  '50000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'str',
  '40000000-0000-0000-0000-000000000001'
);

insert into public.ai_sessions (session_id, patient_id)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.scope_2_mental (
  log_id,
  patient_id,
  session_id,
  log_date,
  raw_quote_ciphertext,
  raw_quote_iv,
  raw_quote_tag,
  is_emergency_flagged_ciphertext,
  is_emergency_flagged_iv,
  is_emergency_flagged_tag
)
values (
  '70000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  current_date,
  'cipher',
  'iv',
  'tag',
  'cipher',
  'iv',
  'tag'
);

insert into public.access_grants (
  grant_id,
  patient_id,
  doctor_id,
  can_view_scope2_mental,
  expires_at,
  consent_hash
)
values (
  '80000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  true,
  now() + interval '1 day',
  'old-consent-hash'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';

select is((select count(*)::int from public.patients), 1, 'patient sees only own patient row');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000201';

select is((select count(*)::int from public.patients), 1, 'approved doctor sees active granted patient row');
select is((select count(*)::int from public.scope_2_mental), 1, 'approved doctor sees granted mental Scope 2 row');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000202';

select is((select count(*)::int from public.patients), 0, 'pending doctor cannot see granted patient row');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000203';

select is((select count(*)::int from public.scope_2_mental), 0, 'rejected doctor cannot see Scope 2 rows');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000301';

select is((select count(*)::int from public.patients), 0, 'medical admin cannot see patient rows');
select is((select count(*)::int from public.secure_files), 1, 'medical admin sees only KYC file metadata');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';

select throws_ok(
  $$insert into public.access_grants (
      patient_id,
      doctor_id,
      can_view_scope2_physical,
      expires_at,
      consent_hash
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      true,
      now() + interval '2 days',
      'direct-insert-hash'
    )$$,
  '42501',
  'new row violates row-level security policy for table "access_grants"',
  'direct access grant insert without RPC marker is blocked'
);

select lives_ok(
  $$select public.replace_active_access_grant(
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      false,
      false,
      true,
      false,
      now() + interval '2 days',
      'new-consent-hash'
    )$$,
  'grant replacement RPC can create replacement grant'
);

reset role;

select is(
  (
    select count(*)::int
    from public.access_grants
    where patient_id = '10000000-0000-0000-0000-000000000001'
      and doctor_id = '20000000-0000-0000-0000-000000000001'
      and is_revoked = false
      and expires_at > now()
  ),
  1,
  'grant replacement leaves exactly one active grant'
);

select isnt_empty(
  $$select 1
    from public.access_grants
    where grant_id = '80000000-0000-0000-0000-000000000001'
      and is_revoked = true
      and revoked_at is not null
      and replaced_by_grant_id is not null$$,
  'grant replacement revokes prior active grant'
);

select * from finish();

rollback;
