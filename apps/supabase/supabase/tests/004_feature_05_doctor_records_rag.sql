create extension if not exists pgtap with schema extensions;

begin;

select plan(11);

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000005101', 'authenticated', 'authenticated', 'feature05-patient@example.test'),
  ('00000000-0000-0000-0000-000000005201', 'authenticated', 'authenticated', 'feature05-approved-doctor@example.test'),
  ('00000000-0000-0000-0000-000000005202', 'authenticated', 'authenticated', 'feature05-pending-doctor@example.test'),
  ('00000000-0000-0000-0000-000000005203', 'authenticated', 'authenticated', 'feature05-rejected-doctor@example.test');

insert into public.patients (patient_id, auth_user_id, full_name, email)
values (
  '10000000-0000-0000-0000-000000005001',
  '00000000-0000-0000-0000-000000005101',
  'Feature 05 Patient',
  'feature05-patient@example.test'
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
values
  (
    '20000000-0000-0000-0000-000000005001',
    '00000000-0000-0000-0000-000000005201',
    'Feature 05 Approved Doctor',
    'feature05-approved-doctor@example.test',
    'approved',
    'feature05-approved-token',
    '550501'
  ),
  (
    '20000000-0000-0000-0000-000000005002',
    '00000000-0000-0000-0000-000000005202',
    'Feature 05 Pending Doctor',
    'feature05-pending-doctor@example.test',
    'pending',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000005003',
    '00000000-0000-0000-0000-000000005203',
    'Feature 05 Rejected Doctor',
    'feature05-rejected-doctor@example.test',
    'rejected',
    null,
    null
  );

insert into public.ai_sessions (session_id, patient_id)
values ('60000000-0000-0000-0000-000000005001', '10000000-0000-0000-0000-000000005001');

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
  '70000000-0000-0000-0000-000000005001',
  '10000000-0000-0000-0000-000000005001',
  '60000000-0000-0000-0000-000000005001',
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
  can_view_scope1,
  can_view_scope2_mental,
  can_download_attachments,
  expires_at,
  consent_hash
)
values (
  '80000000-0000-0000-0000-000000005001',
  '10000000-0000-0000-0000-000000005001',
  '20000000-0000-0000-0000-000000005001',
  true,
  true,
  false,
  now() + interval '1 day',
  'feature05-consent-hash'
);

select is(
  has_table_privilege('authenticated', 'public.scope_1_medical_records', 'update'),
  false,
  'authenticated cannot update Scope 1 records'
);

select is(
  has_table_privilege('authenticated', 'public.scope_1_medical_records', 'delete'),
  false,
  'authenticated cannot delete Scope 1 records'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000005201';

select is(
  (select count(*)::int from public.access_grants),
  1,
  'approved doctor can see active grant row'
);

select is(
  (select count(*)::int from public.scope_2_mental),
  1,
  'approved doctor can see authorized Scope 2 mental rows'
);

select lives_ok(
  $$insert into public.scope_1_medical_records (
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
      '90000000-0000-0000-0000-000000005001',
      '10000000-0000-0000-0000-000000005001',
      '20000000-0000-0000-0000-000000005001',
      'cipher-type',
      'iv-type',
      'tag-type',
      'cipher-title',
      'iv-title',
      'tag-title',
      'record-proof-hash'
    )$$,
  'approved doctor can insert Scope 1 row with active Scope 1 grant'
);

select throws_ok(
  $$update public.scope_1_medical_records
    set title_ciphertext = 'changed'
    where record_id = '90000000-0000-0000-0000-000000005001'$$,
  '42501',
  null,
  'doctor cannot update append-only Scope 1 row'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000005202';

select is(
  (select count(*)::int from public.scope_2_mental),
  0,
  'pending doctor cannot see authorized Scope 2 rows'
);

select throws_ok(
  $$insert into public.scope_1_medical_records (
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
      '10000000-0000-0000-0000-000000005001',
      '20000000-0000-0000-0000-000000005002',
      'cipher-type',
      'iv-type',
      'tag-type',
      'cipher-title',
      'iv-title',
      'tag-title',
      'pending-record-proof-hash'
    )$$,
  '42501',
  null,
  'pending doctor cannot insert Scope 1 row'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000005203';

select is(
  (select count(*)::int from public.scope_2_mental),
  0,
  'rejected doctor cannot see authorized Scope 2 rows'
);

select is(
  (select count(*)::int from public.scope_1_medical_records),
  0,
  'rejected doctor cannot see Scope 1 rows'
);

reset role;

select isnt_empty(
  $$select 1 from storage.buckets where id = 'encrypted-medical-attachments' and public = false$$,
  'medical attachments bucket remains private'
);

select * from finish();

rollback;
