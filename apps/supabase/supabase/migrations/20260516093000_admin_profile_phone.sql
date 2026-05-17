alter table public.medical_admins
  add column if not exists phone_number text null;

grant select on public.medical_admins to authenticated;
