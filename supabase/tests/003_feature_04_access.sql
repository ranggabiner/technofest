create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select isnt_empty(
  $$select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'replace_active_access_grant_v2'$$,
  'Feature 04 grant replacement RPC exists'
);

select isnt_empty(
  $$select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'revoke_active_access_grant'$$,
  'Feature 04 grant revoke RPC exists'
);

select is(
  coalesce(
    (
      select has_function_privilege('authenticated', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'replace_active_access_grant_v2'
      limit 1
    ),
    false
  ),
  true,
  'authenticated can execute Feature 04 grant replacement RPC'
);

select is(
  coalesce(
    (
      select has_function_privilege('authenticated', p.oid, 'execute')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'revoke_active_access_grant'
      limit 1
    ),
    false
  ),
  true,
  'authenticated can execute grant revoke RPC'
);

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000004101', 'authenticated', 'authenticated', 'feature04-patient@example.test'),
  ('00000000-0000-0000-0000-000000004201', 'authenticated', 'authenticated', 'feature04-doctor@example.test');

insert into public.patients (patient_id, auth_user_id, full_name, email)
values (
  '10000000-0000-0000-0000-000000004001',
  '00000000-0000-0000-0000-000000004101',
  'Feature 04 Patient',
  'feature04-patient@example.test'
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
  '20000000-0000-0000-0000-000000004001',
  '00000000-0000-0000-0000-000000004201',
  'Feature 04 Doctor',
  'feature04-doctor@example.test',
  'approved',
  'feature04-token',
  '440401'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000004101';

select throws_ok(
  $$insert into public.audit_logs (
      log_id,
      actor_auth_user_id,
      actor_role,
      action,
      access_status,
      audit_event_hash
    )
    values (
      '90000000-0000-0000-0000-000000004000',
      '00000000-0000-0000-0000-000000004101',
      'patient',
      'patient_grant_created',
      'created',
      'direct-audit-hash'
    )$$,
  '42501',
  'new row violates row-level security policy for table "audit_logs"',
  'direct audit insert without RPC marker is blocked'
);

select lives_ok(
  $$select public.replace_active_access_grant_v2(
      '80000000-0000-0000-0000-000000004001',
      '10000000-0000-0000-0000-000000004001',
      '20000000-0000-0000-0000-000000004001',
      true,
      false,
      true,
      false,
      '2026-05-15T10:00:00+00'::timestamptz,
      '2026-05-20T10:00:00+00'::timestamptz,
      'consent-create-hash',
      null,
      '90000000-0000-0000-0000-000000004001',
      'audit-create-hash',
      '127.0.0.1'::inet
    )$$,
  'patient can create a finite active doctor grant through RPC'
);

reset role;

select is(
  (
    select count(*)::int
    from public.access_grants
    where patient_id = '10000000-0000-0000-0000-000000004001'
      and doctor_id = '20000000-0000-0000-0000-000000004001'
      and is_revoked = false
      and expires_at > now()
  ),
  1,
  'grant creation leaves exactly one active grant'
);

select isnt_empty(
  $$select 1
    from public.audit_logs
    where log_id = '90000000-0000-0000-0000-000000004001'
      and action = 'patient_grant_created'
      and access_status = 'created'
      and target_id = '80000000-0000-0000-0000-000000004001'
      and blockchain_status = 'pending'$$,
  'grant creation writes pending audit proof row'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000004101';

select lives_ok(
  $$select public.replace_active_access_grant_v2(
      '80000000-0000-0000-0000-000000004002',
      '10000000-0000-0000-0000-000000004001',
      '20000000-0000-0000-0000-000000004001',
      false,
      true,
      false,
      false,
      '2026-05-15T11:00:00+00'::timestamptz,
      '2026-05-21T10:00:00+00'::timestamptz,
      'consent-replace-hash',
      'prior-replaced-consent-hash',
      '90000000-0000-0000-0000-000000004002',
      'audit-replace-hash',
      '127.0.0.1'::inet
    )$$,
  'patient can replace an active doctor grant through RPC'
);

reset role;

select isnt_empty(
  $$select 1
    from public.access_grants
    where grant_id = '80000000-0000-0000-0000-000000004001'
      and is_revoked = true
      and revoked_at = '2026-05-15T11:00:00+00'::timestamptz
      and replaced_by_grant_id = '80000000-0000-0000-0000-000000004002'
      and consent_hash = 'prior-replaced-consent-hash'
      and blockchain_status = 'pending'$$,
  'grant replacement revokes prior grant with refreshed consent proof'
);

select isnt_empty(
  $$select 1
    from public.audit_logs
    where log_id = '90000000-0000-0000-0000-000000004002'
      and action = 'patient_grant_replaced'
      and access_status = 'replaced'
      and target_id = '80000000-0000-0000-0000-000000004002'$$,
  'grant replacement writes replacement audit row'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000004101';

select lives_ok(
  $$select public.revoke_active_access_grant(
      '80000000-0000-0000-0000-000000004002',
      '10000000-0000-0000-0000-000000004001',
      '2026-05-15T12:00:00+00'::timestamptz,
      'consent-revoked-hash',
      '90000000-0000-0000-0000-000000004003',
      'audit-revoke-hash',
      '127.0.0.1'::inet
    )$$,
  'patient can revoke active doctor grant through RPC'
);

reset role;

select isnt_empty(
  $$select 1
    from public.access_grants
    where grant_id = '80000000-0000-0000-0000-000000004002'
      and is_revoked = true
      and revoked_at = '2026-05-15T12:00:00+00'::timestamptz
      and consent_hash = 'consent-revoked-hash'
      and blockchain_status = 'pending'$$,
  'grant revoke stores refreshed consent proof'
);

select isnt_empty(
  $$select 1
    from public.audit_logs
    where log_id = '90000000-0000-0000-0000-000000004003'
      and action = 'patient_grant_revoked'
      and access_status = 'revoked'
      and target_id = '80000000-0000-0000-0000-000000004002'$$,
  'grant revoke writes revoke audit row'
);

select * from finish();

rollback;
