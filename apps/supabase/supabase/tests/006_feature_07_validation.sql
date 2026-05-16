create extension if not exists pgtap with schema extensions;

begin;

select plan(13);

select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'patients',
        'doctors',
        'medical_admins',
        'secure_files',
        'doctor_kyc_documents',
        'ai_sessions',
        'ai_messages',
        'scope_2_mental',
        'scope_2_physical',
        'scope_1_medical_records',
        'access_grants',
        'access_grant_attachment_permissions',
        'access_grant_scope2_filters',
        'audit_logs'
      )
      and c.relrowsecurity = false
  ),
  0,
  'all Sprint 1 public tables keep RLS enabled'
);

select is(
  (
    select count(*)::int
    from (
      values
        ('patients'),
        ('doctors'),
        ('medical_admins'),
        ('secure_files'),
        ('doctor_kyc_documents'),
        ('ai_sessions'),
        ('ai_messages'),
        ('scope_2_mental'),
        ('scope_2_physical'),
        ('scope_1_medical_records'),
        ('access_grants'),
        ('access_grant_attachment_permissions'),
        ('access_grant_scope2_filters'),
        ('audit_logs')
    ) as t(table_name)
    where has_table_privilege('anon', format('public.%I', table_name), 'select')
       or has_table_privilege('anon', format('public.%I', table_name), 'insert')
       or has_table_privilege('anon', format('public.%I', table_name), 'update')
       or has_table_privilege('anon', format('public.%I', table_name), 'delete')
  ),
  0,
  'anon has no direct Data API table grants for Sprint 1 tables'
);

select is(
  (
    select count(*)::int
    from (
      values
        ('patients'),
        ('doctors'),
        ('medical_admins'),
        ('secure_files'),
        ('doctor_kyc_documents'),
        ('ai_sessions'),
        ('ai_messages'),
        ('scope_2_mental'),
        ('scope_2_physical'),
        ('scope_1_medical_records'),
        ('access_grants'),
        ('access_grant_attachment_permissions'),
        ('access_grant_scope2_filters'),
        ('audit_logs')
    ) as t(table_name)
    where not has_table_privilege('authenticated', format('public.%I', table_name), 'select')
  ),
  0,
  'authenticated has explicit select grants only where RLS remains authoritative'
);

select is(
  (
    select count(*)::int
    from (
      values
        ('access_grant_attachment_permissions'),
        ('access_grant_scope2_filters')
    ) as t(table_name)
    where not has_table_privilege('service_role', format('public.%I', table_name), 'select')
  ),
  0,
  'service_role has explicit select grants for granular server-side Data API reads'
);

select is(
  has_table_privilege('authenticated', 'public.scope_1_medical_records', 'update'),
  false,
  'authenticated cannot update append-only Scope 1 records'
);

select is(
  has_table_privilege('authenticated', 'public.scope_1_medical_records', 'delete'),
  false,
  'authenticated cannot delete append-only Scope 1 records'
);

select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'patients',
        'ai_sessions',
        'ai_messages',
        'scope_2_mental',
        'scope_2_physical',
        'scope_1_medical_records'
      )
      and column_name in (
        'message_text',
        'summary_text',
        'profiling_data',
        'record_type',
        'title',
        'description',
        'diagnosis',
        'prescription',
        'symptom_type',
        'mood_score',
        'anxiety_level',
        'sleep_hours',
        'raw_quote',
        'extracted_text'
      )
  ),
  0,
  'health content columns are encrypted triplets, not plaintext fields'
);

select isnt_empty(
  $$select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scope_2_physical'
      and column_name in ('raw_quote_ciphertext', 'raw_quote_iv', 'raw_quote_tag')
    group by table_name
    having count(*) = 3$$,
  'Scope 2 physical raw quote encryption triplet exists'
);

select isnt_empty(
  $$select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scope_1_medical_records'
      and column_name in ('title_ciphertext', 'title_iv', 'title_tag', 'description_ciphertext', 'description_iv', 'description_tag')
    group by table_name
    having count(*) = 6$$,
  'Scope 1 title and description encryption triplets exist'
);

select isnt_empty(
  $$select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_sessions'
      and column_name = 'summary_generation_status'
      and column_default = '''pending''::text'
      and is_nullable = 'NO'$$,
  'AI sessions track summary generation status'
);

select hasnt_table('public', 'ai_message_attachments', 'AI message attachments table is removed');

select is(
  (
    select count(*)::int
    from storage.buckets
    where id in ('encrypted-kyc-documents', 'encrypted-medical-attachments')
      and public = false
  ),
  2,
  'KYC and medical attachment buckets are private'
);

select is(
  (
    select count(*)::int
    from storage.objects
    where bucket_id in ('encrypted-kyc-documents', 'encrypted-medical-attachments')
      and (
        lower(name) like '%diagnosis%'
        or lower(name) like '%prescription%'
        or lower(name) like '%resep%'
        or lower(name) like '%gejala%'
        or lower(name) like '%symptom%'
        or lower(name) like '%raw_quote%'
        or lower(name) like '%mood%'
        or lower(name) like '%sleep%'
        or lower(name) like '%anxiety%'
      )
  ),
  0,
  'storage object paths do not reveal medical content terms'
);

select * from finish();

rollback;
