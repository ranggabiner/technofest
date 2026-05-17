create or replace function public.claim_blockchain_proofs(
  target_proof_type text,
  batch_limit integer default 10
)
returns table (
  proof_type text,
  id uuid,
  proof_hash text,
  patient_id uuid,
  doctor_id uuid,
  actor_auth_user_id uuid,
  target_id uuid,
  action text,
  expires_at timestamptz,
  is_revoked boolean,
  blockchain_tx_hash text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_limit integer := least(greatest(coalesce(batch_limit, 10), 1), 25);
begin
  if target_proof_type = 'scope1_record' then
    return query
    select
      'scope1_record'::text,
      r.record_id,
      r.record_hash,
      r.patient_id,
      r.doctor_id,
      null::uuid,
      null::uuid,
      null::text,
      null::timestamptz,
      null::boolean,
      r.blockchain_tx_hash
    from (
      select
        record_id,
        record_hash,
        patient_id,
        doctor_id,
        blockchain_tx_hash,
        created_at
      from public.scope_1_medical_records
      where blockchain_status in ('pending', 'failed')
      order by created_at
      for update skip locked
      limit safe_limit
    ) r;
    return;
  end if;

  if target_proof_type = 'access_grant' then
    return query
    select
      'access_grant'::text,
      g.grant_id,
      g.consent_hash,
      g.patient_id,
      g.doctor_id,
      null::uuid,
      null::uuid,
      null::text,
      g.expires_at,
      g.is_revoked,
      g.blockchain_tx_hash
    from (
      select
        grant_id,
        consent_hash,
        patient_id,
        doctor_id,
        expires_at,
        is_revoked,
        blockchain_tx_hash,
        created_at
      from public.access_grants
      where blockchain_status in ('pending', 'failed')
      order by created_at
      for update skip locked
      limit safe_limit
    ) g;
    return;
  end if;

  if target_proof_type = 'audit_log' then
    return query
    select
      'audit_log'::text,
      a.log_id,
      a.audit_event_hash,
      a.patient_id,
      a.doctor_id,
      a.actor_auth_user_id,
      a.target_id,
      a.action,
      null::timestamptz,
      null::boolean,
      a.blockchain_tx_hash
    from (
      select
        log_id,
        audit_event_hash,
        patient_id,
        doctor_id,
        actor_auth_user_id,
        target_id,
        action,
        blockchain_tx_hash,
        created_at
      from public.audit_logs
      where blockchain_status in ('pending', 'failed')
      order by created_at
      for update skip locked
      limit safe_limit
    ) a;
    return;
  end if;

  raise exception 'unsupported proof type'
    using errcode = '22023';
end;
$$;

revoke all on function public.claim_blockchain_proofs(text, integer) from public, anon, authenticated;
grant execute on function public.claim_blockchain_proofs(text, integer) to service_role;
