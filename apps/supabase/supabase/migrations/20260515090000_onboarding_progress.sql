alter table public.patients
  add column if not exists onboarding_step text not null default 'basic',
  add column if not exists onboarding_completed_at timestamptz null;

alter table public.patients
  add constraint patients_onboarding_step_check
  check (onboarding_step in ('basic', 'health', 'ai_consent', 'complete'));

alter table public.patients
  add constraint patients_onboarding_completed_check
  check (
    (onboarding_step = 'complete' and onboarding_completed_at is not null)
    or (onboarding_step <> 'complete' and onboarding_completed_at is null)
  );

alter table public.doctors
  add column if not exists age_years integer null,
  add column if not exists gender text null,
  add column if not exists onboarding_step text not null default 'profile',
  add column if not exists onboarding_completed_at timestamptz null;

alter table public.doctors
  add constraint doctors_age_years_check
  check (age_years is null or (age_years >= 18 and age_years <= 120));

alter table public.doctors
  add constraint doctors_gender_check
  check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));

alter table public.doctors
  add constraint doctors_onboarding_step_check
  check (onboarding_step in ('profile', 'documents', 'review', 'complete'));

alter table public.doctors
  add constraint doctors_onboarding_completed_check
  check (
    (onboarding_step = 'complete' and onboarding_completed_at is not null)
    or (onboarding_step <> 'complete' and onboarding_completed_at is null)
  );

with patient_progress as (
  select
    p.patient_id,
    exists (
      select 1
      from public.audit_logs al
      where al.patient_id = p.patient_id
        and al.actor_auth_user_id = p.auth_user_id
        and al.action = 'ai_processing_consent_accepted'
        and al.access_status = 'accepted'
    ) as has_ai_consent,
    p.profiling_data_ciphertext is not null
      and p.profiling_data_iv is not null
      and p.profiling_data_tag is not null as has_profile
  from public.patients p
)
update public.patients p
set
  onboarding_step = case
    when pp.has_profile and pp.has_ai_consent then 'complete'
    when pp.has_profile then 'ai_consent'
    else 'basic'
  end,
  onboarding_completed_at = case
    when pp.has_profile and pp.has_ai_consent then coalesce(p.updated_at, p.created_at, now())
    else null
  end
from patient_progress pp
where p.patient_id = pp.patient_id;

with doctor_document_counts as (
  select doctor_id, count(distinct document_type) as document_count
  from public.doctor_kyc_documents
  group by doctor_id
),
doctor_progress as (
  select
    d.doctor_id,
    d.account_status in ('approved', 'rejected')
      or coalesce(ddc.document_count, 0) >= 3 as has_completed_submission,
    d.specialization is not null
      and d.phone_number is not null as has_profile
  from public.doctors d
  left join doctor_document_counts ddc on ddc.doctor_id = d.doctor_id
)
update public.doctors d
set
  onboarding_step = case
    when dp.has_completed_submission then 'complete'
    when dp.has_profile then 'documents'
    else 'profile'
  end,
  onboarding_completed_at = case
    when dp.has_completed_submission then coalesce(d.updated_at, d.created_at, now())
    else null
  end
from doctor_progress dp
where d.doctor_id = dp.doctor_id;

create index if not exists patients_onboarding_step_idx
on public.patients(onboarding_step);

create index if not exists doctors_onboarding_step_idx
on public.doctors(onboarding_step, account_status);
