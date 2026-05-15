-- Local Supabase seed data for MedProof demo/admin access.
-- This file is loaded by the Supabase CLI after migrations during local reset.

with existing_admin_user as (
  select id
  from auth.users
  where lower(email) = 'ranggabiner@gmail.com'
  limit 1
),
inserted_admin_user as (
  insert into auth.users (
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    '00000000-0000-0000-0000-000000000901',
    'authenticated',
    'authenticated',
    'ranggabiner@gmail.com',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Rangga Biner"}'::jsonb,
    now(),
    now()
  where not exists (select 1 from existing_admin_user)
  returning id
),
admin_user as (
  select id from existing_admin_user
  union all
  select id from inserted_admin_user
)
update public.medical_admins
set
  auth_user_id = (select id from admin_user limit 1),
  full_name = 'Rangga Biner'
where lower(email) = 'ranggabiner@gmail.com';

with admin_user as (
  select id
  from auth.users
  where lower(email) = 'ranggabiner@gmail.com'
  limit 1
)
insert into public.medical_admins (auth_user_id, full_name, email)
select id, 'Rangga Biner', 'ranggabiner@gmail.com'
from admin_user
on conflict (auth_user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email;

-- Demo patient dashboard data.
-- Encrypted medical and AI text values below are generated for the local ENCRYPTION_MASTER_KEY.
insert into auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'pasien.demo@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Cenna Demo"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    'authenticated',
    'authenticated',
    'andi.pratama@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Dr. Andi Pratama"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'klinik.sehat@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Klinik Sehat Bersama"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'authenticated',
    'authenticated',
    'maya.lestari@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Dr. Maya Lestari"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    'authenticated',
    'authenticated',
    'budi.santoso@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Dr. Budi Santoso"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.patients (
  patient_id,
  auth_user_id,
  full_name,
  email,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  'Cenna Demo',
  'pasien.demo@medproof.test',
  'complete',
  now() - interval '10 days',
  now() - interval '12 days',
  now() - interval '1 day'
)
on conflict (patient_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  specialization,
  account_status,
  qr_code_token,
  doctor_access_code,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'Dr. Andi Pratama',
    'andi.pratama@medproof.test',
    'Spesialis Penyakit Dalam',
    'approved',
    'seed-doctor-qr-andi',
    '110001',
    'complete',
    now() - interval '12 days',
    now() - interval '12 days',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    'Klinik Sehat Bersama',
    'klinik.sehat@medproof.test',
    'Sistem Rekam Medis',
    'approved',
    'seed-doctor-qr-klinik',
    '110002',
    'complete',
    now() - interval '11 days',
    now() - interval '11 days',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000203',
    'Dr. Maya Lestari',
    'maya.lestari@medproof.test',
    'Spesialis Saraf',
    'approved',
    'seed-doctor-qr-maya',
    '110003',
    'complete',
    now() - interval '10 days',
    now() - interval '10 days',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000204',
    'Dr. Budi Santoso',
    'budi.santoso@medproof.test',
    'Dokter Umum',
    'approved',
    'seed-doctor-qr-budi',
    '110004',
    'complete',
    now() - interval '9 days',
    now() - interval '9 days',
    now() - interval '1 day'
  )
on conflict (doctor_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  specialization = excluded.specialization,
  account_status = excluded.account_status,
  qr_code_token = excluded.qr_code_token,
  doctor_access_code = excluded.doctor_access_code,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

-- seed_patient_dashboard_access_log
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
  is_revoked,
  revoked_at,
  consent_hash,
  blockchain_status,
  blockchain_tx_hash,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000301',
    true,
    true,
    true,
    false,
    now() - interval '1 day',
    now() + interval '6 days',
    false,
    null,
    'seed_consent_hash_401',
    'confirmed',
    '0xseed_grant_401',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000302',
    true,
    false,
    true,
    true,
    now() - interval '3 days',
    now() + interval '4 days',
    false,
    null,
    'seed_consent_hash_402',
    'pending',
    null,
    now() - interval '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000303',
    false,
    true,
    false,
    false,
    now() - interval '5 days',
    now() + interval '3 days',
    true,
    now() - interval '2 days',
    'seed_consent_hash_403',
    'confirmed',
    '0xseed_grant_403',
    now() - interval '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000404',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000304',
    true,
    false,
    false,
    false,
    now() - interval '9 days',
    now() - interval '2 days',
    false,
    null,
    'seed_consent_hash_404',
    'failed',
    null,
    now() - interval '9 days'
  )
on conflict (grant_id) do update
set
  expires_at = excluded.expires_at,
  is_revoked = excluded.is_revoked,
  revoked_at = excluded.revoked_at,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  created_at = excluded.created_at;

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
  audit_event_hash,
  blockchain_status,
  blockchain_tx_hash,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000101',
    'patient',
    'ai_processing_consent_accepted',
    'patient',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000101',
    null,
    'accepted',
    null,
    'seed_audit_hash_701',
    'confirmed',
    '0xseed_audit_701',
    now() - interval '10 days'
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    '00000000-0000-0000-0000-000000000201',
    'doctor',
    'doctor_patient_view_allowed',
    'access_grant',
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000301',
    'allowed',
    null,
    'seed_audit_hash_702',
    'confirmed',
    '0xseed_audit_702',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000703',
    '00000000-0000-0000-0000-000000000202',
    'doctor',
    'doctor_patient_view_allowed',
    'access_grant',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000302',
    'allowed',
    null,
    'seed_audit_hash_703',
    'pending',
    null,
    now() - interval '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000704',
    '00000000-0000-0000-0000-000000000101',
    'patient',
    'patient_grant_revoked',
    'access_grant',
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000303',
    'revoked',
    null,
    'seed_audit_hash_704',
    'confirmed',
    '0xseed_audit_704',
    now() - interval '2 days'
  )
on conflict (log_id) do update
set
  access_status = excluded.access_status,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  created_at = excluded.created_at;

-- seed_patient_dashboard_scope1
insert into public.scope_1_medical_records (record_id, patient_id, doctor_id, record_type_ciphertext, record_type_iv, record_type_tag, title_ciphertext, title_iv, title_tag, description_ciphertext, description_iv, description_tag, record_hash, blockchain_status, blockchain_tx_hash, key_version, created_at) values ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '9VxxwzSNgHJqMQ==', 'x8oiRuC8VzjsWVj7', 'xcok+yNaKiN40DtR54RGsw==', 'EMAGpb6oMjATbKqvKGwBVhQ=', 'MeYuHOKY5dezND/2', 'Y2mOOqSt2DK/MzLB1mjM9Q==', 'luJFzYCWdFDwAa8X+UdU6kw7TRGk+gveCmRR9/XF2ApUbFxUIk3lTICe2h9K02DdFbS1xEbWu8LnJYU=', 'v3O4hzFb5ZfWhBeM', '7+2ei7BuPmHBXqIttVYtmg==', 'seed_scope1_hash_00000000-0000-0000-0000-000000000501', 'confirmed', '0xseed_scope1_1', 'v1', now() - interval '4 days') on conflict (record_id) do update set record_type_ciphertext = excluded.record_type_ciphertext, record_type_iv = excluded.record_type_iv, record_type_tag = excluded.record_type_tag, title_ciphertext = excluded.title_ciphertext, title_iv = excluded.title_iv, title_tag = excluded.title_tag, description_ciphertext = excluded.description_ciphertext, description_iv = excluded.description_iv, description_tag = excluded.description_tag, blockchain_status = excluded.blockchain_status, blockchain_tx_hash = excluded.blockchain_tx_hash, created_at = excluded.created_at;
insert into public.scope_1_medical_records (record_id, patient_id, doctor_id, record_type_ciphertext, record_type_iv, record_type_tag, title_ciphertext, title_iv, title_tag, description_ciphertext, description_iv, description_tag, record_hash, blockchain_status, blockchain_tx_hash, key_version, created_at) values ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000302', 'mcFtPdqM0TeUZVXR', '4IwHl8N3RVqPsALf', 'PXL0HL0qdQbBNlE4ed+gOQ==', 'R9Ys9HqAA2v7wYHtbtnTS9zCdsI=', 'TiSdKihnt4vdph9p', 'HqEtgCnkJvyhwX7Kcl4g1Q==', 'bD8P1mUcbF1WcGowbYBYE15lSFhpjUMf1eGC+DS6Linz5YG7Rvkkc5v4/CEYneRBhlY=', 'CO5Tr99whc0eQk3w', 'p7FjgTJvzGvfNM/W0Wr5+g==', 'seed_scope1_hash_00000000-0000-0000-0000-000000000502', 'pending', null, 'v1', now() - interval '3 days') on conflict (record_id) do update set record_type_ciphertext = excluded.record_type_ciphertext, record_type_iv = excluded.record_type_iv, record_type_tag = excluded.record_type_tag, title_ciphertext = excluded.title_ciphertext, title_iv = excluded.title_iv, title_tag = excluded.title_tag, description_ciphertext = excluded.description_ciphertext, description_iv = excluded.description_iv, description_tag = excluded.description_tag, blockchain_status = excluded.blockchain_status, blockchain_tx_hash = excluded.blockchain_tx_hash, created_at = excluded.created_at;
insert into public.scope_1_medical_records (record_id, patient_id, doctor_id, record_type_ciphertext, record_type_iv, record_type_tag, title_ciphertext, title_iv, title_tag, description_ciphertext, description_iv, description_tag, record_hash, blockchain_status, blockchain_tx_hash, key_version, created_at) values ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000303', '2/t5PA+CXQ==', '55+s6yr8Wrz4gmSW', 'LHNJI1jEOwwk6G56v+S0Kg==', 'u2YTI4723QtQkz5dKdVBBRNGhwGWmMH4bSs=', 'eaMITWTF3t5OH//7', 't4zKIUGtDTczktTy7MhOtw==', 'SkNoWOtUEBCEX7o2XUoHSUj8WvGMzb/dhY6wiUWlO6iAgE1NuhEE4dQHLis+86/p799n1Q==', 'mU1RkNyhRWQhhF7v', 'G080s8DZbtrA7PkJdGW/bA==', 'seed_scope1_hash_00000000-0000-0000-0000-000000000503', 'failed', null, 'v1', now() - interval '2 days') on conflict (record_id) do update set record_type_ciphertext = excluded.record_type_ciphertext, record_type_iv = excluded.record_type_iv, record_type_tag = excluded.record_type_tag, title_ciphertext = excluded.title_ciphertext, title_iv = excluded.title_iv, title_tag = excluded.title_tag, description_ciphertext = excluded.description_ciphertext, description_iv = excluded.description_iv, description_tag = excluded.description_tag, blockchain_status = excluded.blockchain_status, blockchain_tx_hash = excluded.blockchain_tx_hash, created_at = excluded.created_at;
insert into public.scope_1_medical_records (record_id, patient_id, doctor_id, record_type_ciphertext, record_type_iv, record_type_tag, title_ciphertext, title_iv, title_tag, description_ciphertext, description_iv, description_tag, record_hash, blockchain_status, blockchain_tx_hash, key_version, created_at) values ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000304', 'gC3K8g==', 'ElXAbeOubpFF+Jya', 'glN0NeoNjI8HeHjRQOjNJg==', 'D7ySVtmgKL6Qlcts+T1YZeJFwfpK', 'z6j8ZQpPavfUAHO4', 'oz6fbIId843vjag9DPKriA==', 'WhbNfWh/Mfs+dkyURzCh8233SsaQQOB2DwcV9CVTdHuvnzhCtZcEj/nfk9wKj9jn9a+P7A==', 'f3Rb+cdV+iYT19ds', 'ztKp2shZYYkUZHTdWeDbEg==', 'seed_scope1_hash_00000000-0000-0000-0000-000000000504', 'confirmed', '0xseed_scope1_4', 'v1', now() - interval '1 days') on conflict (record_id) do update set record_type_ciphertext = excluded.record_type_ciphertext, record_type_iv = excluded.record_type_iv, record_type_tag = excluded.record_type_tag, title_ciphertext = excluded.title_ciphertext, title_iv = excluded.title_iv, title_tag = excluded.title_tag, description_ciphertext = excluded.description_ciphertext, description_iv = excluded.description_iv, description_tag = excluded.description_tag, blockchain_status = excluded.blockchain_status, blockchain_tx_hash = excluded.blockchain_tx_hash, created_at = excluded.created_at;

-- seed_patient_dashboard_ai_summary
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', 'yKKeXwI8vv6WK2cn4DvzVgdbJ+8u', 'GYI8B0x/1v60SemN', 'TiMxU5WS2+l+PLS1bQT44Q==', 'aUHHDTfltRET90CU2h45mx5hjplufhDfImk+EmCo2qwCBoi16q+58851JzIt51eZNB03iS4j/Dw3a+Oku2BsbYKJoZt8yfbYFMJNEec=', 'VSbyghXAXNsJMfO7', 'yMb/TuLnNNpJ/9p09FKxiA==', now() - interval '4 days', 'manual_end', now() - interval '4 days', 'v1', now() - interval '10 days', now() - interval '4 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000101', 'XKQHxDo1FcEMPuEU0UxQQqmZilg=', 'Sd9TqeEZN79Qf4cE', 'NAEPTTTzy5G5IYoQr26KqA==', 'Logpc+MVFuFibv6a/Suj2djBnGtIARJo8AIKNLyfjS7zpPi6QVVbcGmrGGoA/p65/aloJaC0mdPLX4XJYNT7fbv85n/Fgha8rvjkDg==', 'lHHdbhWyWuLpLqlA', 'Z1Owr7rToZ6cke3qa7Gd1Q==', now() - interval '3 days', 'manual_end', now() - interval '3 days', 'v1', now() - interval '9 days', now() - interval '3 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000101', 'tylg9I1/7SCrNfHoR5tj8Q==', 'hxdJqE3btRGYXwLm', 'uAVWiOZWwp02It8dvDq8jA==', 'd85SmcsK19zN42GHmpJn6Mj6rQJUItF70TXStMKype0MTrh5raiNKvqLO92QS0ieAqpjNXSV21VRG/bBgyswUiYPt8ed7p8z', 'WH8yhJsmUGaDH5vz', '36ojvly1RzrTp5Wy2V8Hrg==', now() - interval '2 days', 'manual_end', now() - interval '2 days', 'v1', now() - interval '8 days', now() - interval '2 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000101', 'OVrnsDLuI1itSreL9QFmecoatQ==', 'Dd8mhV2z+KgkR2wj', 'nJOrZneWjZbI9ktLe/FIKg==', 'oU6tVbwbK6ly8Amhf+29Q+JJqhSnUZjKX6VzKJOElhpthE9ZN8HJscOeFgykG7vmbdonWyCFGhLj50rEhH0LRZW8BK4=', 'UUcCdXY/JmgjzlMv', 'wafQRKeKR1/IUQ92RHm0Rg==', now() - interval '1 days', 'manual_end', now() - interval '1 days', 'v1', now() - interval '7 days', now() - interval '1 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, updated_at = excluded.updated_at;

-- Developer patient dashboard data.
with existing_developer_user as (
  select id
  from auth.users
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
inserted_developer_user as (
  insert into auth.users (
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    '00000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'developer@binerlabs.com',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Developer Biner Labs"}'::jsonb,
    now(),
    now()
  where not exists (select 1 from existing_developer_user)
  returning id
),
developer_user as (
  select id from existing_developer_user
  union all
  select id from inserted_developer_user
)
insert into public.patients (
  patient_id,
  auth_user_id,
  full_name,
  email,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000102',
  id,
  'Developer Biner Labs',
  'developer@binerlabs.com',
  'complete',
  now() - interval '10 days',
  now() - interval '12 days',
  now() - interval '1 day'
from developer_user
on conflict (email) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

-- seed_developer_dashboard_access_log
with developer_patient as (
  select patient_id
  from public.patients
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
seed_rows (
  grant_id,
  doctor_id,
  can_view_scope1,
  can_view_scope2_mental,
  can_view_scope2_physical,
  can_download_attachments,
  granted_at,
  expires_at,
  is_revoked,
  revoked_at,
  consent_hash,
  blockchain_status,
  blockchain_tx_hash,
  created_at
) as (
  values
    ('00000000-0000-0000-0000-000000000411'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, true, true, true, false, now() - interval '1 day', now() + interval '6 days', false, null::timestamptz, 'seed_developer_consent_hash_411', 'confirmed', '0xseed_dev_grant_411', now() - interval '1 day'),
    ('00000000-0000-0000-0000-000000000412'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, true, false, true, true, now() - interval '2 days', now() + interval '5 days', false, null::timestamptz, 'seed_developer_consent_hash_412', 'pending', null, now() - interval '2 days'),
    ('00000000-0000-0000-0000-000000000413'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, false, true, false, false, now() - interval '4 days', now() + interval '4 days', true, now() - interval '2 days', 'seed_developer_consent_hash_413', 'confirmed', '0xseed_dev_grant_413', now() - interval '4 days'),
    ('00000000-0000-0000-0000-000000000414'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, true, false, false, false, now() - interval '7 days', now() - interval '1 day', false, null::timestamptz, 'seed_developer_consent_hash_414', 'failed', null, now() - interval '7 days')
)
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
  is_revoked,
  revoked_at,
  consent_hash,
  blockchain_status,
  blockchain_tx_hash,
  created_at
)
select
  seed_rows.grant_id,
  developer_patient.patient_id,
  seed_rows.doctor_id,
  seed_rows.can_view_scope1,
  seed_rows.can_view_scope2_mental,
  seed_rows.can_view_scope2_physical,
  seed_rows.can_download_attachments,
  seed_rows.granted_at,
  seed_rows.expires_at,
  seed_rows.is_revoked,
  seed_rows.revoked_at,
  seed_rows.consent_hash,
  seed_rows.blockchain_status,
  seed_rows.blockchain_tx_hash,
  seed_rows.created_at
from seed_rows
cross join developer_patient
on conflict (grant_id) do update
set
  patient_id = excluded.patient_id,
  doctor_id = excluded.doctor_id,
  can_view_scope1 = excluded.can_view_scope1,
  can_view_scope2_mental = excluded.can_view_scope2_mental,
  can_view_scope2_physical = excluded.can_view_scope2_physical,
  can_download_attachments = excluded.can_download_attachments,
  granted_at = excluded.granted_at,
  expires_at = excluded.expires_at,
  is_revoked = excluded.is_revoked,
  revoked_at = excluded.revoked_at,
  consent_hash = excluded.consent_hash,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  created_at = excluded.created_at;

with developer_patient as (
  select patient_id, auth_user_id
  from public.patients
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
seed_rows (
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
  blockchain_tx_hash,
  created_at
) as (
  values
    ('00000000-0000-0000-0000-000000000711'::uuid, null::uuid, 'patient', 'ai_processing_consent_accepted', 'patient', null::uuid, null::uuid, 'accepted', null::text, 'seed_developer_audit_hash_711', 'confirmed', '0xseed_dev_audit_711', now() - interval '10 days'),
    ('00000000-0000-0000-0000-000000000712'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, 'doctor', 'doctor_patient_view_allowed', 'access_grant', '00000000-0000-0000-0000-000000000411'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'allowed', null::text, 'seed_developer_audit_hash_712', 'confirmed', '0xseed_dev_audit_712', now() - interval '1 day'),
    ('00000000-0000-0000-0000-000000000713'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, 'doctor', 'doctor_rag_requested', 'access_grant', '00000000-0000-0000-0000-000000000412'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'allowed', null::text, 'seed_developer_audit_hash_713', 'pending', null, now() - interval '2 days'),
    ('00000000-0000-0000-0000-000000000714'::uuid, null::uuid, 'patient', 'patient_grant_revoked', 'access_grant', '00000000-0000-0000-0000-000000000413'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'revoked', null::text, 'seed_developer_audit_hash_714', 'confirmed', '0xseed_dev_audit_714', now() - interval '2 days')
)
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
  audit_event_hash,
  blockchain_status,
  blockchain_tx_hash,
  created_at
)
select
  seed_rows.log_id,
  coalesce(seed_rows.actor_auth_user_id, developer_patient.auth_user_id),
  seed_rows.actor_role,
  seed_rows.action,
  seed_rows.target_type,
  coalesce(seed_rows.target_id, developer_patient.patient_id),
  developer_patient.patient_id,
  seed_rows.doctor_id,
  seed_rows.access_status,
  seed_rows.reason,
  seed_rows.audit_event_hash,
  seed_rows.blockchain_status,
  seed_rows.blockchain_tx_hash,
  seed_rows.created_at
from seed_rows
cross join developer_patient
on conflict (log_id) do update
set
  actor_auth_user_id = excluded.actor_auth_user_id,
  patient_id = excluded.patient_id,
  doctor_id = excluded.doctor_id,
  access_status = excluded.access_status,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  created_at = excluded.created_at;

-- seed_developer_dashboard_scope1
with developer_patient as (
  select patient_id
  from public.patients
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
seed_rows (
  record_id,
  doctor_id,
  record_type_ciphertext,
  record_type_iv,
  record_type_tag,
  title_ciphertext,
  title_iv,
  title_tag,
  description_ciphertext,
  description_iv,
  description_tag,
  record_hash,
  blockchain_status,
  blockchain_tx_hash,
  key_version,
  created_at
) as (
  values
  ('00000000-0000-0000-0000-000000000511'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, '256g', 'FKKVxPEgOTAMx4BC', 'k+ur4Gth2rPDUnDdfOgPNQ==', 'vCI9k22SKmeHIj2inu3ydVE=', '0gSZfxCcg6EPYsXh', 'FPxUxJ/yQe6ITRxHSlRHUw==', 'IChJlqyiaK39G6RZ6BHdsJM3ZR+ro/agLYWpKH2KkTWPcNAp2MUkgHuq0J/BDUY=', 'eHbUsE/nBXBZNgFc', 'hJsyQ9n+PZ2hKRj5tUlyLQ==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000511', 'confirmed', '0xseed_dev_scope1_511', 'v1', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000512'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'irw8vi6tEPIW', 'uK2QWOlGRtIZCWTS', '5O8Vqd5eA/qa4r4sy1Kxlg==', '2CrI2CgfaKa/+L6y6nOZ+AuHtvsbVl03lA==', 'uZzr4fj1xnCCte5y', 'Mk0Jh+y79ph2k1PFDxO7ow==', 'yMYVdP4ujpDiIeBGtltZiy1ai+NYULyL/fxlqoTd8O4DTqltJOg9EGQkFGU/GqWEs2gqKgG89IJTqyEV', 'jUbTWVM2AWJh7ZSN', 'dbIqMqkI5nqTZXPhuv4Rwg==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000512', 'pending', null, 'v1', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000513'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, '/L5cR7940r8czRAa', '01AzrP7mmZS5J4W5', '4ZtJxIqXgLbNNfaX3G48xg==', 'adiTYZ7r89izaal4e5b75AsZ6/HoBw==', '0S1nBONJcblKuR3p', 'Ki/AHIgNtwjLr5kW6dy9tw==', 'mEkui3YofhP7ORzlOVQBHZFPoeNB2HlOOkJfI93tEHL0IAPAIg/8VaZjE5ESOt9kBW3dHZ0o', '9LwORweT1ecEw0l/', 'jdSQ1ag8CXcthoEG6yK/3Q==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000513', 'failed', null, 'v1', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000514'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'cMSihQ==', 'nX1OP3dtyhCn5Dkn', 'uy5j5mu4ogIFdqPB+PUeQg==', 'nnYF50Sw2XCFVx607UZmGIlYPJrBL/CFOGk=', '+DdBrRlBIXYdKvRn', '81dusYfCZzAB4IJngpMD6Q==', 'YH66JswmDc0CSIqNNhnEO581umDpoCRfVnpHx0l2DHhKOyAS+Bc9hrWCN/4xjpsafxsV2kL4Qw==', 'q/REgZwyczJ+Fq/B', 'fTN6ofkYUpdP0TKXDILAug==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000514', 'confirmed', '0xseed_dev_scope1_514', 'v1', now() - interval '1 days')
)
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
  description_ciphertext,
  description_iv,
  description_tag,
  record_hash,
  blockchain_status,
  blockchain_tx_hash,
  key_version,
  created_at
)
select
  seed_rows.record_id,
  developer_patient.patient_id,
  seed_rows.doctor_id,
  seed_rows.record_type_ciphertext,
  seed_rows.record_type_iv,
  seed_rows.record_type_tag,
  seed_rows.title_ciphertext,
  seed_rows.title_iv,
  seed_rows.title_tag,
  seed_rows.description_ciphertext,
  seed_rows.description_iv,
  seed_rows.description_tag,
  seed_rows.record_hash,
  seed_rows.blockchain_status,
  seed_rows.blockchain_tx_hash,
  seed_rows.key_version,
  seed_rows.created_at
from seed_rows
cross join developer_patient
on conflict (record_id) do update
set
  patient_id = excluded.patient_id,
  doctor_id = excluded.doctor_id,
  record_type_ciphertext = excluded.record_type_ciphertext,
  record_type_iv = excluded.record_type_iv,
  record_type_tag = excluded.record_type_tag,
  title_ciphertext = excluded.title_ciphertext,
  title_iv = excluded.title_iv,
  title_tag = excluded.title_tag,
  description_ciphertext = excluded.description_ciphertext,
  description_iv = excluded.description_iv,
  description_tag = excluded.description_tag,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  created_at = excluded.created_at;

-- seed_developer_dashboard_ai_summary
with developer_patient as (
  select patient_id
  from public.patients
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
seed_rows (
  session_id,
  session_title_ciphertext,
  session_title_iv,
  session_title_tag,
  summary_text_ciphertext,
  summary_text_iv,
  summary_text_tag,
  ended_at,
  end_reason,
  summary_generated_at,
  key_version,
  created_at,
  updated_at
) as (
  values
  ('00000000-0000-0000-0000-000000000611'::uuid, '8m8ApycNM7J391fxIdaCZ2lt', '69i1MxvTLZFsmCLl', 'HbhzKwBLjgCl5DPT23IFxA==', 'G5+9I1f0gz+6WAz6I6ePPO/kcv9QqhKwG5NjgPXAgmJxrrZhkxuEjW4tDF5AgIrwMkKxCp/s97iQTOzrey1cKW+LhbTP65Q=', 'qm3yQaV1o73j9dC7', 'lE70BLJ9llY5WOm45f8hLQ==', now() - interval '4 days', 'manual_end', now() - interval '4 days', 'v1', now() - interval '10 days', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000612'::uuid, 'cEGDy3t0Dgl4ktXugkmAZyuNhOVicOI=', 'itiXGLu8oNxYcQJ1', '/MfYbfnrDYAZvirxmCdovg==', 'PIkTbpUHzPIE55iY3kdXctYcGV+uNcEcohH8eCk30+8lvHZrneDnn5mNttJSmiPLbi6sTBQPpc6KXLcx3fOvgN0nNg==', 'QHgMzir3XFckgD+F', 'xN9/2XbWEj4olPkBSqknww==', now() - interval '3 days', 'manual_end', now() - interval '3 days', 'v1', now() - interval '9 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000613'::uuid, 'NlriW2SXcU17v332XlMZ92y7bol5', 'Ie1EPAbKyQeO6Yw9', 'Cl9CLK4nB6bTlZj7QVSOuQ==', '+O/htrNxJD8H8AVdPhql/7nNXZpG3z3ubw78/7E0YVdmMwYIpn0zoQ1D3KNIQuIVzYvTEWevg5s3cvusyXHiGKGieP4jJNCbzuh6vgE=', 'dd2Wm+FnGyhir16K', 'tHllNIYPliXqA79AdM5x8g==', now() - interval '2 days', 'manual_end', now() - interval '2 days', 'v1', now() - interval '8 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000614'::uuid, 'OhDD54wXUXtPldhekaxa/tkqxK3C6g==', 'u1zj4Jq8hG8u8GTQ', 'tVP0bqOrgeRQW7/EeGJaqQ==', '7Aj1fyiWHvnJiDkiyhgVBWXC4nHv1QDSdt5c6jptF0TbHvsprN18P1IvFNx0m3P5Vp+IBLgcK9BUY2Q2ePxnhag4HG+5+EM=', 'oeXV1VGnRUlAw9Qk', 'E2tdHFhCsZY0UbKp7C1VVQ==', now() - interval '1 days', 'manual_end', now() - interval '1 days', 'v1', now() - interval '7 days', now() - interval '1 days')
)
insert into public.ai_sessions (
  session_id,
  patient_id,
  session_title_ciphertext,
  session_title_iv,
  session_title_tag,
  summary_text_ciphertext,
  summary_text_iv,
  summary_text_tag,
  ended_at,
  end_reason,
  summary_generated_at,
  key_version,
  created_at,
  updated_at
)
select
  seed_rows.session_id,
  developer_patient.patient_id,
  seed_rows.session_title_ciphertext,
  seed_rows.session_title_iv,
  seed_rows.session_title_tag,
  seed_rows.summary_text_ciphertext,
  seed_rows.summary_text_iv,
  seed_rows.summary_text_tag,
  seed_rows.ended_at,
  seed_rows.end_reason,
  seed_rows.summary_generated_at,
  seed_rows.key_version,
  seed_rows.created_at,
  seed_rows.updated_at
from seed_rows
cross join developer_patient
on conflict (session_id) do update
set
  patient_id = excluded.patient_id,
  session_title_ciphertext = excluded.session_title_ciphertext,
  session_title_iv = excluded.session_title_iv,
  session_title_tag = excluded.session_title_tag,
  summary_text_ciphertext = excluded.summary_text_ciphertext,
  summary_text_iv = excluded.summary_text_iv,
  summary_text_tag = excluded.summary_text_tag,
  summary_generated_at = excluded.summary_generated_at,
  updated_at = excluded.updated_at;
