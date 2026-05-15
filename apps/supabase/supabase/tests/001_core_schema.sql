create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select has_table('public', 'patients', 'patients table exists');
select has_table('public', 'doctors', 'doctors table exists');
select has_table('public', 'medical_admins', 'medical_admins table exists');
select has_table('public', 'secure_files', 'secure_files table exists');
select has_table('public', 'doctor_kyc_documents', 'doctor_kyc_documents table exists');
select has_table('public', 'audit_logs', 'audit_logs table exists');
select has_table('public', 'access_grants', 'access_grants table exists');

select col_is_pk('public', 'patients', 'patient_id', 'patients primary key');
select col_is_pk('public', 'doctors', 'doctor_id', 'doctors primary key');
select col_is_unique('public', 'doctors', 'doctor_access_code', 'doctor access code unique');

select is(
  (select relrowsecurity from pg_class where oid = 'public.patients'::regclass),
  true,
  'patients RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass),
  true,
  'audit logs RLS enabled'
);

select isnt_empty(
  $$select 1 from storage.buckets where id = 'encrypted-kyc-documents' and public = false$$,
  'encrypted KYC bucket is private'
);

select isnt_empty(
  $$select 1 from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'patients'
      and privilege_type = 'SELECT'$$,
  'patients has explicit authenticated grant'
);

select * from finish();

rollback;
