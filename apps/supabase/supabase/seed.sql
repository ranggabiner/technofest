-- Local Supabase seed data for MedProof demo access.
-- This file is loaded by the Supabase CLI after migrations during local reset.
-- Real Google OAuth admin users are intentionally not seeded in auth.users.
-- Demo email/password users below are seeded only for local/demo testing.

-- Demo manual login accounts. Password for all rows: test123.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000009101',
    'authenticated',
    'authenticated',
    'superadmin@test.com',
    extensions.crypt('test123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"demo_role":"superadmin"}'::jsonb,
    '{"full_name":"Nadia Paramitha"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000009102',
    'authenticated',
    'authenticated',
    'admin@test.com',
    extensions.crypt('test123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"demo_role":"admin"}'::jsonb,
    '{"full_name":"Dewi Anggraini"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000009103',
    'authenticated',
    'authenticated',
    'pasien@test.com',
    extensions.crypt('test123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"demo_role":"patient"}'::jsonb,
    '{"full_name":"Alya Pramesti"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000009104',
    'authenticated',
    'authenticated',
    'dokter@test.com',
    extensions.crypt('test123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"demo_role":"doctor"}'::jsonb,
    '{"full_name":"dr. Arif Wicaksana, Sp.PD"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000009101',
    '00000000-0000-0000-0000-000000009101',
    '00000000-0000-0000-0000-000000009101',
    '{"sub":"00000000-0000-0000-0000-000000009101","email":"superadmin@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000009102',
    '00000000-0000-0000-0000-000000009102',
    '00000000-0000-0000-0000-000000009102',
    '{"sub":"00000000-0000-0000-0000-000000009102","email":"admin@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000009103',
    '00000000-0000-0000-0000-000000009103',
    '00000000-0000-0000-0000-000000009103',
    '{"sub":"00000000-0000-0000-0000-000000009103","email":"pasien@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000009104',
    '00000000-0000-0000-0000-000000009104',
    '00000000-0000-0000-0000-000000009104',
    '{"sub":"00000000-0000-0000-0000-000000009104","email":"dokter@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.medical_admins (
  admin_id,
  auth_user_id,
  full_name,
  email,
  phone_number,
  admin_role,
  revoked_at,
  revoked_by,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000009201',
    '00000000-0000-0000-0000-000000009101',
    'Nadia Paramitha',
    'superadmin@test.com',
    '+62 812-1000-9101',
    'superadmin',
    null,
    null,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000009202',
    '00000000-0000-0000-0000-000000009102',
    'Dewi Anggraini',
    'admin@test.com',
    '+62 812-1000-9102',
    'admin',
    null,
    null,
    now(),
    now()
  )
on conflict (admin_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  admin_role = excluded.admin_role,
  revoked_at = excluded.revoked_at,
  revoked_by = excluded.revoked_by,
  updated_at = excluded.updated_at;

insert into public.admin_invitations (
  invitation_id,
  email,
  invited_by,
  accepted_at,
  revoked_at,
  revoked_by,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000009301',
  'admin@test.com',
  '00000000-0000-0000-0000-000000009201',
  now(),
  null,
  null,
  now(),
  now()
)
on conflict (invitation_id) do update
set
  email = excluded.email,
  invited_by = excluded.invited_by,
  accepted_at = excluded.accepted_at,
  revoked_at = excluded.revoked_at,
  revoked_by = excluded.revoked_by,
  updated_at = excluded.updated_at;

insert into public.patients (
  patient_id,
  auth_user_id,
  full_name,
  email,
  date_of_birth,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000009401',
  '00000000-0000-0000-0000-000000009103',
  'Alya Pramesti',
  'pasien@test.com',
  '1993-08-17',
  'complete',
  now() - interval '1 day',
  now() - interval '1 day',
  now()
)
on conflict (patient_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  date_of_birth = excluded.date_of_birth,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  phone_number,
  age_years,
  gender,
  specialization,
  account_status,
  verified_by,
  verified_at,
  qr_code_token,
  doctor_access_code,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000009501',
  '00000000-0000-0000-0000-000000009104',
  'dr. Arif Wicaksana, Sp.PD',
  'dokter@test.com',
  '+62 812-2200-9501',
  41,
  'male',
  'Spesialis Penyakit Dalam',
  'approved',
  '00000000-0000-0000-0000-000000009201',
  now(),
  'seed-doctor-qr-demo-manual',
  '119901',
  'complete',
  now() - interval '1 day',
  now() - interval '1 day',
  now()
)
on conflict (doctor_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  age_years = excluded.age_years,
  gender = excluded.gender,
  specialization = excluded.specialization,
  account_status = excluded.account_status,
  verified_by = excluded.verified_by,
  verified_at = excluded.verified_at,
  qr_code_token = excluded.qr_code_token,
  doctor_access_code = excluded.doctor_access_code,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

-- Rich operational demo baseline for the four canonical login accounts.
-- The service-role seed script adds encrypted journal, Scope 1, Scope 2, and storage objects using the active ENCRYPTION_MASTER_KEY.
insert into auth.users (
  instance_id,
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
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009111', 'authenticated', 'authenticated', 'ops.admin@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"admin"}'::jsonb, '{"full_name":"Rizky Mahendra"}'::jsonb, now() - interval '35 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009112', 'authenticated', 'authenticated', 'audit.admin@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"admin"}'::jsonb, '{"full_name":"Putri Sekar Ayu"}'::jsonb, now() - interval '60 days', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009131', 'authenticated', 'authenticated', 'rafi.maulana@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Rafi Maulana"}'::jsonb, now() - interval '44 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009132', 'authenticated', 'authenticated', 'siti.aisyah@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Siti Nur Aisyah"}'::jsonb, now() - interval '43 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009133', 'authenticated', 'authenticated', 'made.aditya@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Made Aditya Pranata"}'::jsonb, now() - interval '42 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009134', 'authenticated', 'authenticated', 'lestari.wulandari@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Lestari Wulandari"}'::jsonb, now() - interval '41 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009135', 'authenticated', 'authenticated', 'bayu.satrio@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Bayu Satrio"}'::jsonb, now() - interval '40 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009136', 'authenticated', 'authenticated', 'melati.kartika@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Melati Kartika"}'::jsonb, now() - interval '39 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009137', 'authenticated', 'authenticated', 'taufik.hidayat@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"patient"}'::jsonb, '{"full_name":"Taufik Hidayat"}'::jsonb, now() - interval '38 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009151', 'authenticated', 'authenticated', 'ratna.lestari@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Ratna Lestari, Sp.JP"}'::jsonb, now() - interval '47 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009152', 'authenticated', 'authenticated', 'hendra.saputra@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Hendra Saputra, Sp.S"}'::jsonb, now() - interval '46 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009153', 'authenticated', 'authenticated', 'fajar.nugroho@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Fajar Nugroho"}'::jsonb, now() - interval '45 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009154', 'authenticated', 'authenticated', 'laila.rahma@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Laila Rahma, Sp.KK"}'::jsonb, now() - interval '44 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009155', 'authenticated', 'authenticated', 'wulan.permata@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Wulan Permata, Sp.A"}'::jsonb, now() - interval '43 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009156', 'authenticated', 'authenticated', 'ahmad.faris@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Ahmad Faris, Sp.OG"}'::jsonb, now() - interval '42 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009157', 'authenticated', 'authenticated', 'maya.prameswari@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Maya Prameswari, Sp.PD"}'::jsonb, now() - interval '41 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009158', 'authenticated', 'authenticated', 'bima.santoso@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Bima Santoso"}'::jsonb, now() - interval '40 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009159', 'authenticated', 'authenticated', 'citra.dewi@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Citra Dewi, Sp.M"}'::jsonb, now() - interval '39 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009160', 'authenticated', 'authenticated', 'yusuf.hanif@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Yusuf Hanif, Sp.THT"}'::jsonb, now() - interval '38 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009161', 'authenticated', 'authenticated', 'tania.salsabila@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Tania Salsabila, Sp.KJ"}'::jsonb, now() - interval '37 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009162', 'authenticated', 'authenticated', 'bagus.mahendra@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Bagus Mahendra, Sp.OT"}'::jsonb, now() - interval '36 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009163', 'authenticated', 'authenticated', 'sekar.larasati@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"drg. Sekar Larasati"}'::jsonb, now() - interval '35 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009164', 'authenticated', 'authenticated', 'reno.adiputra@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Reno Adiputra, Sp.U"}'::jsonb, now() - interval '34 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009165', 'authenticated', 'authenticated', 'nurul.huda@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Nurul Huda, Sp.PD"}'::jsonb, now() - interval '33 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009166', 'authenticated', 'authenticated', 'vina.oktaviani@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Vina Oktaviani, Sp.KFR"}'::jsonb, now() - interval '32 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009167', 'authenticated', 'authenticated', 'galih.prakoso@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Galih Prakoso, Sp.P"}'::jsonb, now() - interval '31 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009168', 'authenticated', 'authenticated', 'intan.puspa@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Intan Puspa, Sp.Rad"}'::jsonb, now() - interval '30 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000009169', 'authenticated', 'authenticated', 'reza.kurniawan@medproof.test', now(), '{"provider":"google","providers":["google"],"demo_role":"doctor"}'::jsonb, '{"full_name":"dr. Reza Kurniawan, Sp.B"}'::jsonb, now() - interval '29 days', now() - interval '2 days')
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  email = excluded.email,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.medical_admins (
  admin_id,
  auth_user_id,
  full_name,
  email,
  phone_number,
  admin_role,
  revoked_at,
  revoked_by,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000009211', '00000000-0000-0000-0000-000000009111', 'Rizky Mahendra', 'ops.admin@medproof.test', '+62 812-1000-9211', 'admin', null, null, now() - interval '35 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000009212', '00000000-0000-0000-0000-000000009112', 'Putri Sekar Ayu', 'audit.admin@medproof.test', '+62 812-1000-9212', 'admin', now() - interval '7 days', '00000000-0000-0000-0000-000000009201', now() - interval '60 days', now() - interval '7 days')
on conflict (admin_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  admin_role = excluded.admin_role,
  revoked_at = excluded.revoked_at,
  revoked_by = excluded.revoked_by,
  updated_at = excluded.updated_at;

insert into public.admin_invitations (
  invitation_id,
  email,
  invited_by,
  accepted_at,
  revoked_at,
  revoked_by,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000009302', 'ops.admin@medproof.test', '00000000-0000-0000-0000-000000009201', now() - interval '34 days', null, null, now() - interval '35 days', now() - interval '34 days'),
  ('00000000-0000-0000-0000-000000009303', 'calon.admin@medproof.test', '00000000-0000-0000-0000-000000009201', null, null, null, now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009304', 'audit.admin@medproof.test', '00000000-0000-0000-0000-000000009201', now() - interval '58 days', now() - interval '7 days', '00000000-0000-0000-0000-000000009201', now() - interval '60 days', now() - interval '7 days')
on conflict (invitation_id) do update
set
  email = excluded.email,
  invited_by = excluded.invited_by,
  accepted_at = excluded.accepted_at,
  revoked_at = excluded.revoked_at,
  revoked_by = excluded.revoked_by,
  updated_at = excluded.updated_at;

insert into public.patients (
  patient_id,
  auth_user_id,
  full_name,
  email,
  date_of_birth,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000009411', '00000000-0000-0000-0000-000000009131', 'Rafi Maulana', 'rafi.maulana@medproof.test', '1988-04-12', 'complete', now() - interval '24 days', now() - interval '44 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009412', '00000000-0000-0000-0000-000000009132', 'Siti Nur Aisyah', 'siti.aisyah@medproof.test', '1997-11-03', 'complete', now() - interval '23 days', now() - interval '43 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009413', '00000000-0000-0000-0000-000000009133', 'Made Aditya Pranata', 'made.aditya@medproof.test', '1982-06-29', 'complete', now() - interval '22 days', now() - interval '42 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009414', '00000000-0000-0000-0000-000000009134', 'Lestari Wulandari', 'lestari.wulandari@medproof.test', '1990-02-21', 'complete', now() - interval '21 days', now() - interval '41 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009415', '00000000-0000-0000-0000-000000009135', 'Bayu Satrio', 'bayu.satrio@medproof.test', '1979-09-08', 'complete', now() - interval '20 days', now() - interval '40 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009416', '00000000-0000-0000-0000-000000009136', 'Melati Kartika', 'melati.kartika@medproof.test', '1995-05-16', 'complete', now() - interval '19 days', now() - interval '39 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009417', '00000000-0000-0000-0000-000000009137', 'Taufik Hidayat', 'taufik.hidayat@medproof.test', '1985-12-30', 'complete', now() - interval '18 days', now() - interval '38 days', now() - interval '2 days')
on conflict (patient_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  date_of_birth = excluded.date_of_birth,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

insert into public.doctors (
  doctor_id,
  auth_user_id,
  full_name,
  email,
  phone_number,
  age_years,
  gender,
  specialization,
  account_status,
  rejection_reason,
  verified_by,
  verified_at,
  qr_code_token,
  doctor_access_code,
  onboarding_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000009511', '00000000-0000-0000-0000-000000009151', 'dr. Ratna Lestari, Sp.JP', 'ratna.lestari@medproof.test', '+62 812-2200-9511', 45, 'female', 'Spesialis Jantung', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '19 days', 'seed-doctor-qr-ratna', '219511', 'complete', now() - interval '29 days', now() - interval '47 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009512', '00000000-0000-0000-0000-000000009152', 'dr. Hendra Saputra, Sp.S', 'hendra.saputra@medproof.test', '+62 812-2200-9512', 39, 'male', 'Spesialis Saraf', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '18 days', 'seed-doctor-qr-hendra', '219512', 'complete', now() - interval '28 days', now() - interval '46 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009513', '00000000-0000-0000-0000-000000009153', 'dr. Fajar Nugroho', 'fajar.nugroho@medproof.test', '+62 812-2200-9513', 32, 'male', 'Dokter Umum', 'pending', null, null, null, null, null, 'complete', now() - interval '27 days', now() - interval '45 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009514', '00000000-0000-0000-0000-000000009154', 'dr. Laila Rahma, Sp.KK', 'laila.rahma@medproof.test', '+62 812-2200-9514', 37, 'female', 'Spesialis Kulit', 'pending', null, null, null, null, null, 'complete', now() - interval '26 days', now() - interval '44 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009515', '00000000-0000-0000-0000-000000009155', 'dr. Wulan Permata, Sp.A', 'wulan.permata@medproof.test', '+62 812-2200-9515', 42, 'female', 'Spesialis Anak', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '16 days', 'seed-doctor-qr-wulan', '219515', 'complete', now() - interval '25 days', now() - interval '43 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009516', '00000000-0000-0000-0000-000000009156', 'dr. Ahmad Faris, Sp.OG', 'ahmad.faris@medproof.test', '+62 812-2200-9516', 44, 'male', 'Spesialis Obstetri dan Ginekologi', 'rejected', 'Dokumen SIP tidak sesuai fasilitas praktik yang diajukan.', '00000000-0000-0000-0000-000000009202', now() - interval '15 days', null, null, 'complete', now() - interval '24 days', now() - interval '42 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009517', '00000000-0000-0000-0000-000000009157', 'dr. Maya Prameswari, Sp.PD', 'maya.prameswari@medproof.test', '+62 812-2200-9517', 40, 'female', 'Spesialis Penyakit Dalam', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '14 days', 'seed-doctor-qr-maya-prameswari', '219517', 'complete', now() - interval '23 days', now() - interval '41 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009518', '00000000-0000-0000-0000-000000009158', 'dr. Bima Santoso', 'bima.santoso@medproof.test', '+62 812-2200-9518', 36, 'male', 'Dokter Umum', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '13 days', 'seed-doctor-qr-bima', '219518', 'complete', now() - interval '22 days', now() - interval '40 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009519', '00000000-0000-0000-0000-000000009159', 'dr. Citra Dewi, Sp.M', 'citra.dewi@medproof.test', '+62 812-2200-9519', 38, 'female', 'Spesialis Mata', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '12 days', 'seed-doctor-qr-citra', '219519', 'complete', now() - interval '21 days', now() - interval '39 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009520', '00000000-0000-0000-0000-000000009160', 'dr. Yusuf Hanif, Sp.THT', 'yusuf.hanif@medproof.test', '+62 812-2200-9520', 43, 'male', 'Spesialis THT', 'pending', null, null, null, null, null, 'complete', now() - interval '20 days', now() - interval '38 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009521', '00000000-0000-0000-0000-000000009161', 'dr. Tania Salsabila, Sp.KJ', 'tania.salsabila@medproof.test', '+62 812-2200-9521', 35, 'female', 'Psikiater', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '10 days', 'seed-doctor-qr-tania', '219521', 'complete', now() - interval '19 days', now() - interval '37 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009522', '00000000-0000-0000-0000-000000009162', 'dr. Bagus Mahendra, Sp.OT', 'bagus.mahendra@medproof.test', '+62 812-2200-9522', 46, 'male', 'Spesialis Ortopedi', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '9 days', 'seed-doctor-qr-bagus', '219522', 'complete', now() - interval '18 days', now() - interval '36 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009523', '00000000-0000-0000-0000-000000009163', 'drg. Sekar Larasati', 'sekar.larasati@medproof.test', '+62 812-2200-9523', 34, 'female', 'Dokter Gigi', 'rejected', 'Foto KTP tidak terbaca jelas pada unggahan demo.', '00000000-0000-0000-0000-000000009202', now() - interval '8 days', null, null, 'complete', now() - interval '17 days', now() - interval '35 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009524', '00000000-0000-0000-0000-000000009164', 'dr. Reno Adiputra, Sp.U', 'reno.adiputra@medproof.test', '+62 812-2200-9524', 47, 'male', 'Spesialis Urologi', 'pending', null, null, null, null, null, 'complete', now() - interval '16 days', now() - interval '34 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009525', '00000000-0000-0000-0000-000000009165', 'dr. Nurul Huda, Sp.PD', 'nurul.huda@medproof.test', '+62 812-2200-9525', 48, 'female', 'Spesialis Penyakit Dalam', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '7 days', 'seed-doctor-qr-nurul', '219525', 'complete', now() - interval '15 days', now() - interval '33 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009526', '00000000-0000-0000-0000-000000009166', 'dr. Vina Oktaviani, Sp.KFR', 'vina.oktaviani@medproof.test', '+62 812-2200-9526', 39, 'female', 'Rehabilitasi Medik', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '6 days', 'seed-doctor-qr-vina', '219526', 'complete', now() - interval '14 days', now() - interval '32 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009527', '00000000-0000-0000-0000-000000009167', 'dr. Galih Prakoso, Sp.P', 'galih.prakoso@medproof.test', '+62 812-2200-9527', 42, 'male', 'Spesialis Paru', 'pending', null, null, null, null, null, 'complete', now() - interval '13 days', now() - interval '31 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009528', '00000000-0000-0000-0000-000000009168', 'dr. Intan Puspa, Sp.Rad', 'intan.puspa@medproof.test', '+62 812-2200-9528', 37, 'female', 'Spesialis Radiologi', 'approved', null, '00000000-0000-0000-0000-000000009202', now() - interval '5 days', 'seed-doctor-qr-intan', '219528', 'complete', now() - interval '12 days', now() - interval '30 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009529', '00000000-0000-0000-0000-000000009169', 'dr. Reza Kurniawan, Sp.B', 'reza.kurniawan@medproof.test', '+62 812-2200-9529', 50, 'male', 'Spesialis Bedah', 'rejected', 'Nomor STR tidak cocok dengan nama pada dokumen identitas.', '00000000-0000-0000-0000-000000009202', now() - interval '4 days', null, null, 'complete', now() - interval '11 days', now() - interval '29 days', now() - interval '2 days')
on conflict (doctor_id) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  age_years = excluded.age_years,
  gender = excluded.gender,
  specialization = excluded.specialization,
  account_status = excluded.account_status,
  rejection_reason = excluded.rejection_reason,
  verified_by = excluded.verified_by,
  verified_at = excluded.verified_at,
  qr_code_token = excluded.qr_code_token,
  doctor_access_code = excluded.doctor_access_code,
  onboarding_step = excluded.onboarding_step,
  onboarding_completed_at = excluded.onboarding_completed_at,
  updated_at = excluded.updated_at;

with demo_doctors (doctor_id, auth_user_id) as (
  values
    ('00000000-0000-0000-0000-000000009501'::uuid, '00000000-0000-0000-0000-000000009104'::uuid),
    ('00000000-0000-0000-0000-000000009511'::uuid, '00000000-0000-0000-0000-000000009151'::uuid),
    ('00000000-0000-0000-0000-000000009512'::uuid, '00000000-0000-0000-0000-000000009152'::uuid),
    ('00000000-0000-0000-0000-000000009513'::uuid, '00000000-0000-0000-0000-000000009153'::uuid),
    ('00000000-0000-0000-0000-000000009514'::uuid, '00000000-0000-0000-0000-000000009154'::uuid),
    ('00000000-0000-0000-0000-000000009520'::uuid, '00000000-0000-0000-0000-000000009160'::uuid),
    ('00000000-0000-0000-0000-000000009524'::uuid, '00000000-0000-0000-0000-000000009164'::uuid),
    ('00000000-0000-0000-0000-000000009527'::uuid, '00000000-0000-0000-0000-000000009167'::uuid)
),
doc_types (document_type, offset_value) as (
  values ('str'::text, 1), ('sip'::text, 2), ('ktp'::text, 3)
),
seed_sample_pdf_metadata (visible_text, file_size_bytes, file_sha256) as (
  values (
    'SAMPLE PDF',
    585::bigint,
    'b7d387f5f50b1c6bb4e2f09f00c3f4802b3cae63ccce79aae696757366dafd88'
  )
),
seed_files as (
  select
    ('00000000-0000-0000-0000-' || lpad((970000 + right(d.doctor_id::text, 4)::integer * 10 + t.offset_value)::text, 12, '0'))::uuid as file_id,
    d.doctor_id,
    d.auth_user_id,
    t.document_type,
    t.offset_value,
    p.file_size_bytes,
    p.file_sha256
  from demo_doctors d
  cross join doc_types t
  cross join seed_sample_pdf_metadata p
)
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
  file_sha256,
  key_version,
  created_at
)
select
  file_id,
  'doctor',
  doctor_id,
  'encrypted-kyc-documents',
  auth_user_id::text || '/kyc/' || doctor_id::text || '/' || document_type || '.json',
  'ZGVtb19lbmNyeXB0ZWRfZmlsZW5hbWU=',
  'ZGVtb19pdl9zZWVk',
  'ZGVtb190YWdfc2VlZA==',
  'application/pdf',
  file_size_bytes,
  file_sha256,
  'v1',
  now() - interval '20 days'
from seed_files
on conflict (file_id) do update
set
  owner_role = excluded.owner_role,
  owner_id = excluded.owner_id,
  bucket_name = excluded.bucket_name,
  object_path = excluded.object_path,
  original_filename_ciphertext = excluded.original_filename_ciphertext,
  original_filename_iv = excluded.original_filename_iv,
  original_filename_tag = excluded.original_filename_tag,
  mime_type = excluded.mime_type,
  file_size_bytes = excluded.file_size_bytes,
  file_sha256 = excluded.file_sha256,
  key_version = excluded.key_version,
  created_at = excluded.created_at;

with demo_doctors (doctor_id) as (
  values
    ('00000000-0000-0000-0000-000000009501'::uuid),
    ('00000000-0000-0000-0000-000000009511'::uuid),
    ('00000000-0000-0000-0000-000000009512'::uuid),
    ('00000000-0000-0000-0000-000000009513'::uuid),
    ('00000000-0000-0000-0000-000000009514'::uuid),
    ('00000000-0000-0000-0000-000000009520'::uuid),
    ('00000000-0000-0000-0000-000000009524'::uuid),
    ('00000000-0000-0000-0000-000000009527'::uuid)
),
doc_types (document_type, offset_value) as (
  values ('str'::text, 1), ('sip'::text, 2), ('ktp'::text, 3)
)
insert into public.doctor_kyc_documents (
  document_id,
  doctor_id,
  document_type,
  file_id,
  created_at
)
select
  ('00000000-0000-0000-0000-' || lpad((980000 + right(d.doctor_id::text, 4)::integer * 10 + t.offset_value)::text, 12, '0'))::uuid,
  d.doctor_id,
  t.document_type,
  ('00000000-0000-0000-0000-' || lpad((970000 + right(d.doctor_id::text, 4)::integer * 10 + t.offset_value)::text, 12, '0'))::uuid,
  now() - interval '19 days'
from demo_doctors d
cross join doc_types t
on conflict (doctor_id, document_type) do update
set
  file_id = excluded.file_id,
  created_at = excluded.created_at;

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
  replaced_by_grant_id,
  consent_hash,
  blockchain_status,
  blockchain_tx_hash,
  blockchain_last_error,
  blockchain_attempt_count,
  created_at
)
values
  ('00000000-0000-0000-0000-000000009701', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009501', true, true, true, true, now() - interval '5 days', now() + interval '10 days', false, null, null, 'seed_consent_9701', 'confirmed', '0xseedgrant01', null, 0, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000009702', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009511', true, false, true, false, now() - interval '3 days', now() + interval '4 days', false, null, null, 'seed_consent_9702', 'pending', null, null, 0, now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000009703', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009512', false, true, false, false, now() - interval '12 days', now() + interval '8 days', true, now() - interval '6 days', null, 'seed_consent_9703', 'confirmed', '0xseedgrant03', null, 0, now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000009704', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009518', true, false, false, false, now() - interval '18 days', now() - interval '2 days', false, null, null, 'seed_consent_9704', 'failed', null, 'amoy_tx_reverted', 2, now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000009705', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009517', false, true, true, false, now() - interval '9 days', now() + interval '6 days', true, now() - interval '2 days', '00000000-0000-0000-0000-000000009706', 'seed_consent_9705', 'confirmed', '0xseedgrant05', null, 0, now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000009706', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009517', true, true, true, false, now() - interval '2 days', now() + interval '14 days', false, null, null, 'seed_consent_9706', 'confirmed', '0xseedgrant06', null, 0, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009707', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009521', false, true, false, false, now() - interval '1 day', now() + interval '30 days', false, null, null, 'seed_consent_9707', 'pending', null, null, 0, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000009720', '00000000-0000-0000-0000-000000009411', '00000000-0000-0000-0000-000000009501', true, true, true, true, now() - interval '6 days', now() + interval '5 days', false, null, null, 'seed_consent_9720', 'pending', null, null, 0, now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000009721', '00000000-0000-0000-0000-000000009412', '00000000-0000-0000-0000-000000009501', true, false, true, false, now() - interval '5 days', now() + interval '6 days', false, null, null, 'seed_consent_9721', 'confirmed', '0xseedgrant21', null, 0, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000009722', '00000000-0000-0000-0000-000000009413', '00000000-0000-0000-0000-000000009501', true, true, true, false, now() - interval '4 days', now() + interval '7 days', false, null, null, 'seed_consent_9722', 'confirmed', '0xseedgrant22', null, 0, now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000009723', '00000000-0000-0000-0000-000000009414', '00000000-0000-0000-0000-000000009501', true, false, true, true, now() - interval '3 days', now() + interval '8 days', false, null, null, 'seed_consent_9723', 'confirmed', '0xseedgrant23', null, 0, now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000009724', '00000000-0000-0000-0000-000000009415', '00000000-0000-0000-0000-000000009501', true, true, true, false, now() - interval '2 days', now() + interval '9 days', false, null, null, 'seed_consent_9724', 'pending', null, null, 0, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000009725', '00000000-0000-0000-0000-000000009416', '00000000-0000-0000-0000-000000009501', true, false, true, false, now() - interval '1 day', now() + interval '10 days', false, null, null, 'seed_consent_9725', 'confirmed', '0xseedgrant25', null, 0, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000009730', '00000000-0000-0000-0000-000000009417', '00000000-0000-0000-0000-000000009525', false, false, true, false, now() - interval '10 days', now() - interval '1 day', false, null, null, 'seed_consent_9730', 'confirmed', '0xseedgrant30', null, 0, now() - interval '10 days')
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
  replaced_by_grant_id = excluded.replaced_by_grant_id,
  consent_hash = excluded.consent_hash,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  blockchain_last_error = excluded.blockchain_last_error,
  blockchain_attempt_count = excluded.blockchain_attempt_count,
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
  ip_address,
  audit_event_hash,
  blockchain_status,
  blockchain_tx_hash,
  blockchain_last_error,
  blockchain_attempt_count,
  created_at
)
values
  ('00000000-0000-0000-0000-000000990101', '00000000-0000-0000-0000-000000009103', 'patient', 'ai_processing_consent_accepted', 'patient', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009401', null, 'accepted', null, null, 'seed_audit_990101', 'confirmed', '0xseedaudit1', null, 0, now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000990102', '00000000-0000-0000-0000-000000009103', 'patient', 'patient_grant_created', 'access_grant', '00000000-0000-0000-0000-000000009701', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009501', 'created', null, null, 'seed_audit_990102', 'confirmed', '0xseedaudit2', null, 0, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000990103', '00000000-0000-0000-0000-000000009104', 'doctor', 'doctor_patient_view_allowed', 'access_grant', '00000000-0000-0000-0000-000000009701', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009501', 'allowed', null, null, 'seed_audit_990103', 'confirmed', '0xseedaudit3', null, 0, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000990104', '00000000-0000-0000-0000-000000009104', 'doctor', 'doctor_rag_requested', 'access_grant', '00000000-0000-0000-0000-000000009701', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009501', 'allowed', null, null, 'seed_audit_990104', 'pending', null, null, 0, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000990105', '00000000-0000-0000-0000-000000009103', 'patient', 'patient_grant_revoked', 'access_grant', '00000000-0000-0000-0000-000000009703', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009512', 'revoked', null, null, 'seed_audit_990105', 'confirmed', '0xseedaudit5', null, 0, now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000990106', '00000000-0000-0000-0000-000000009152', 'doctor', 'doctor_patient_view_denied', 'access_grant', '00000000-0000-0000-0000-000000009703', '00000000-0000-0000-0000-000000009401', '00000000-0000-0000-0000-000000009512', 'denied', 'revoked', null, 'seed_audit_990106', 'confirmed', '0xseedaudit6', null, 0, now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000990107', '00000000-0000-0000-0000-000000009103', 'patient', 'doctor_access_code_lookup_failed', 'doctor_lookup', null, '00000000-0000-0000-0000-000000009401', null, 'failed', 'generic_lookup_failed', '103.127.11.24', 'seed_audit_990107', 'pending', null, null, 0, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000990108', '00000000-0000-0000-0000-000000009102', 'medical_admin', 'admin_doctor_approved', 'doctor', '00000000-0000-0000-0000-000000009501', null, '00000000-0000-0000-0000-000000009501', 'approved', null, null, 'seed_admin_audit_990108', 'confirmed', '0xseedadminaudit8', null, 0, now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000990109', '00000000-0000-0000-0000-000000009102', 'medical_admin', 'admin_doctor_approved', 'doctor', '00000000-0000-0000-0000-000000009511', null, '00000000-0000-0000-0000-000000009511', 'approved', null, null, 'seed_admin_audit_990109', 'confirmed', '0xseedadminaudit9', null, 0, now() - interval '17 days'),
  ('00000000-0000-0000-0000-000000990110', '00000000-0000-0000-0000-000000009102', 'medical_admin', 'admin_doctor_rejected', 'doctor', '00000000-0000-0000-0000-000000009516', null, '00000000-0000-0000-0000-000000009516', 'rejected', 'Dokumen SIP tidak sesuai fasilitas praktik yang diajukan.', null, 'seed_admin_audit_990110', 'confirmed', '0xseedadminaudit10', null, 0, now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000990111', '00000000-0000-0000-0000-000000009102', 'medical_admin', 'admin_doctor_rejected', 'doctor', '00000000-0000-0000-0000-000000009523', null, '00000000-0000-0000-0000-000000009523', 'rejected', 'Foto KTP tidak terbaca jelas pada unggahan demo.', null, 'seed_admin_audit_990111', 'confirmed', '0xseedadminaudit11', null, 0, now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000990112', '00000000-0000-0000-0000-000000009102', 'medical_admin', 'doctor_kyc_email_notification_failed', 'doctor', '00000000-0000-0000-0000-000000009514', null, '00000000-0000-0000-0000-000000009514', 'failed', 'resend_demo_delivery_failed', null, 'seed_admin_audit_990112', 'failed', null, 'resend_delivery_failed', 1, now() - interval '3 days')
on conflict (log_id) do update
set
  actor_auth_user_id = excluded.actor_auth_user_id,
  actor_role = excluded.actor_role,
  action = excluded.action,
  target_type = excluded.target_type,
  target_id = excluded.target_id,
  patient_id = excluded.patient_id,
  doctor_id = excluded.doctor_id,
  access_status = excluded.access_status,
  reason = excluded.reason,
  ip_address = excluded.ip_address,
  audit_event_hash = excluded.audit_event_hash,
  blockchain_status = excluded.blockchain_status,
  blockchain_tx_hash = excluded.blockchain_tx_hash,
  blockchain_last_error = excluded.blockchain_last_error,
  blockchain_attempt_count = excluded.blockchain_attempt_count,
  created_at = excluded.created_at;

-- Demo patient dashboard data.
-- Encrypted medical and AI text values below are generated for the local ENCRYPTION_MASTER_KEY.
insert into auth.users (
  instance_id,
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
    '00000000-0000-0000-0000-000000000000',
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
    '00000000-0000-0000-0000-000000000000',
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
    '00000000-0000-0000-0000-000000000000',
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
    '00000000-0000-0000-0000-000000000000',
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
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000204',
    'authenticated',
    'authenticated',
    'budi.santoso@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Dr. Budi Santoso"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000205',
    'authenticated',
    'authenticated',
    'sari.wijaya@medproof.test',
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Dr. Sari Wijaya"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  instance_id = excluded.instance_id,
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
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000205',
    'Dr. Sari Wijaya',
    'sari.wijaya@medproof.test',
    'Spesialis Rehabilitasi Medik',
    'approved',
    'seed-doctor-qr-sari',
    '110005',
    'complete',
    now() - interval '8 days',
    now() - interval '8 days',
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
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, summary_generation_status, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', 'yKKeXwI8vv6WK2cn4DvzVgdbJ+8u', 'GYI8B0x/1v60SemN', 'TiMxU5WS2+l+PLS1bQT44Q==', 'aUHHDTfltRET90CU2h45mx5hjplufhDfImk+EmCo2qwCBoi16q+58851JzIt51eZNB03iS4j/Dw3a+Oku2BsbYKJoZt8yfbYFMJNEec=', 'VSbyghXAXNsJMfO7', 'yMb/TuLnNNpJ/9p09FKxiA==', now() - interval '4 days', 'manual_end', now() - interval '4 days', 'completed', 'v1', now() - interval '10 days', now() - interval '4 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, summary_generation_status = excluded.summary_generation_status, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, summary_generation_status, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000101', 'XKQHxDo1FcEMPuEU0UxQQqmZilg=', 'Sd9TqeEZN79Qf4cE', 'NAEPTTTzy5G5IYoQr26KqA==', 'Logpc+MVFuFibv6a/Suj2djBnGtIARJo8AIKNLyfjS7zpPi6QVVbcGmrGGoA/p65/aloJaC0mdPLX4XJYNT7fbv85n/Fgha8rvjkDg==', 'lHHdbhWyWuLpLqlA', 'Z1Owr7rToZ6cke3qa7Gd1Q==', now() - interval '3 days', 'manual_end', now() - interval '3 days', 'completed', 'v1', now() - interval '9 days', now() - interval '3 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, summary_generation_status = excluded.summary_generation_status, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, summary_generation_status, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000101', 'tylg9I1/7SCrNfHoR5tj8Q==', 'hxdJqE3btRGYXwLm', 'uAVWiOZWwp02It8dvDq8jA==', 'd85SmcsK19zN42GHmpJn6Mj6rQJUItF70TXStMKype0MTrh5raiNKvqLO92QS0ieAqpjNXSV21VRG/bBgyswUiYPt8ed7p8z', 'WH8yhJsmUGaDH5vz', '36ojvly1RzrTp5Wy2V8Hrg==', now() - interval '2 days', 'manual_end', now() - interval '2 days', 'completed', 'v1', now() - interval '8 days', now() - interval '2 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, summary_generation_status = excluded.summary_generation_status, updated_at = excluded.updated_at;
insert into public.ai_sessions (session_id, patient_id, session_title_ciphertext, session_title_iv, session_title_tag, summary_text_ciphertext, summary_text_iv, summary_text_tag, ended_at, end_reason, summary_generated_at, summary_generation_status, key_version, created_at, updated_at) values ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000101', 'OVrnsDLuI1itSreL9QFmecoatQ==', 'Dd8mhV2z+KgkR2wj', 'nJOrZneWjZbI9ktLe/FIKg==', 'oU6tVbwbK6ly8Amhf+29Q+JJqhSnUZjKX6VzKJOElhpthE9ZN8HJscOeFgykG7vmbdonWyCFGhLj50rEhH0LRZW8BK4=', 'UUcCdXY/JmgjzlMv', 'wafQRKeKR1/IUQ92RHm0Rg==', now() - interval '1 days', 'manual_end', now() - interval '1 days', 'completed', 'v1', now() - interval '7 days', now() - interval '1 days') on conflict (session_id) do update set session_title_ciphertext = excluded.session_title_ciphertext, session_title_iv = excluded.session_title_iv, session_title_tag = excluded.session_title_tag, summary_text_ciphertext = excluded.summary_text_ciphertext, summary_text_iv = excluded.summary_text_iv, summary_text_tag = excluded.summary_text_tag, summary_generated_at = excluded.summary_generated_at, summary_generation_status = excluded.summary_generation_status, updated_at = excluded.updated_at;

-- Developer patient dashboard data.
with existing_developer_user as (
  select id
  from auth.users
  where lower(email) = 'developer@binerlabs.com'
  limit 1
),
inserted_developer_user as (
  insert into auth.users (
    instance_id,
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
    '00000000-0000-0000-0000-000000000000',
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
    ('00000000-0000-0000-0000-000000000414'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, true, false, false, false, now() - interval '7 days', now() - interval '1 day', false, null::timestamptz, 'seed_developer_consent_hash_414', 'failed', null, now() - interval '7 days'),
    ('00000000-0000-0000-0000-000000000415'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, false, true, true, false, now() - interval '8 days', now() + interval '7 days', false, null::timestamptz, 'seed_developer_consent_hash_415', 'confirmed', '0xseed_dev_grant_415', now() - interval '8 days')
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
    ('00000000-0000-0000-0000-000000000714'::uuid, null::uuid, 'patient', 'patient_grant_revoked', 'access_grant', '00000000-0000-0000-0000-000000000413'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'revoked', null::text, 'seed_developer_audit_hash_714', 'confirmed', '0xseed_dev_audit_714', now() - interval '2 days'),
    ('00000000-0000-0000-0000-000000000715'::uuid, '00000000-0000-0000-0000-000000000205'::uuid, 'doctor', 'doctor_patient_view_allowed', 'access_grant', '00000000-0000-0000-0000-000000000415'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'allowed', null::text, 'seed_developer_audit_hash_715', 'failed', null, now() - interval '12 hours')
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
  ('00000000-0000-0000-0000-000000000514'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'cMSihQ==', 'nX1OP3dtyhCn5Dkn', 'uy5j5mu4ogIFdqPB+PUeQg==', 'nnYF50Sw2XCFVx607UZmGIlYPJrBL/CFOGk=', '+DdBrRlBIXYdKvRn', '81dusYfCZzAB4IJngpMD6Q==', 'YH66JswmDc0CSIqNNhnEO581umDpoCRfVnpHx0l2DHhKOyAS+Bc9hrWCN/4xjpsafxsV2kL4Qw==', 'q/REgZwyczJ+Fq/B', 'fTN6ofkYUpdP0TKXDILAug==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000514', 'confirmed', '0xseed_dev_scope1_514', 'v1', now() - interval '1 days'),
  ('00000000-0000-0000-0000-000000000515'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'NvZpzRUAJoQ1aA==', 'pfKeuFp9JWktviEZ', 'cEGgn5Hf5gg6wy+BTZRNIQ==', '41y69s+Md8YzOPzvHF/AF8o2UA==', '78sUrg+7e0qRMGtH', 'uxLmjYUFc46SYZhBFkK1Cg==', 'JMUTmsJF7ZhFlXfvl17WQLLvTx0QQVc8dCHj7ffq5kJC+OTMtru/URFUfYBPdLcfVNI8', 'OjnKFEOykqRgVdpf', 'euzVcXFo/pr+75Vk5JoCyA==', 'seed_developer_scope1_hash_00000000-0000-0000-0000-000000000515', 'pending', null, 'v1', now() - interval '12 hours')
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
  summary_generation_status,
  key_version,
  created_at,
  updated_at
) as (
  values
  ('00000000-0000-0000-0000-000000000611'::uuid, '8m8ApycNM7J391fxIdaCZ2lt', '69i1MxvTLZFsmCLl', 'HbhzKwBLjgCl5DPT23IFxA==', 'G5+9I1f0gz+6WAz6I6ePPO/kcv9QqhKwG5NjgPXAgmJxrrZhkxuEjW4tDF5AgIrwMkKxCp/s97iQTOzrey1cKW+LhbTP65Q=', 'qm3yQaV1o73j9dC7', 'lE70BLJ9llY5WOm45f8hLQ==', now() - interval '4 days', 'manual_end', now() - interval '4 days', 'completed', 'v1', now() - interval '10 days', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000612'::uuid, 'cEGDy3t0Dgl4ktXugkmAZyuNhOVicOI=', 'itiXGLu8oNxYcQJ1', '/MfYbfnrDYAZvirxmCdovg==', 'PIkTbpUHzPIE55iY3kdXctYcGV+uNcEcohH8eCk30+8lvHZrneDnn5mNttJSmiPLbi6sTBQPpc6KXLcx3fOvgN0nNg==', 'QHgMzir3XFckgD+F', 'xN9/2XbWEj4olPkBSqknww==', now() - interval '3 days', 'manual_end', now() - interval '3 days', 'completed', 'v1', now() - interval '9 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000613'::uuid, 'NlriW2SXcU17v332XlMZ92y7bol5', 'Ie1EPAbKyQeO6Yw9', 'Cl9CLK4nB6bTlZj7QVSOuQ==', '+O/htrNxJD8H8AVdPhql/7nNXZpG3z3ubw78/7E0YVdmMwYIpn0zoQ1D3KNIQuIVzYvTEWevg5s3cvusyXHiGKGieP4jJNCbzuh6vgE=', 'dd2Wm+FnGyhir16K', 'tHllNIYPliXqA79AdM5x8g==', now() - interval '2 days', 'manual_end', now() - interval '2 days', 'completed', 'v1', now() - interval '8 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000614'::uuid, 'OhDD54wXUXtPldhekaxa/tkqxK3C6g==', 'u1zj4Jq8hG8u8GTQ', 'tVP0bqOrgeRQW7/EeGJaqQ==', '7Aj1fyiWHvnJiDkiyhgVBWXC4nHv1QDSdt5c6jptF0TbHvsprN18P1IvFNx0m3P5Vp+IBLgcK9BUY2Q2ePxnhag4HG+5+EM=', 'oeXV1VGnRUlAw9Qk', 'E2tdHFhCsZY0UbKp7C1VVQ==', now() - interval '1 days', 'manual_end', now() - interval '1 days', 'completed', 'v1', now() - interval '7 days', now() - interval '1 days')
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
  summary_generation_status,
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
  seed_rows.summary_generation_status,
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
  summary_generation_status = excluded.summary_generation_status,
  updated_at = excluded.updated_at;

-- Supabase Auth expects manually seeded OAuth token fields to be non-null strings.
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change_token_new is null
  or email_change is null;
