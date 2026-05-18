create index if not exists access_grants_replaced_by_grant_id_idx
  on public.access_grants(replaced_by_grant_id);

create index if not exists admin_invitations_revoked_by_idx
  on public.admin_invitations(revoked_by);

create index if not exists doctors_verified_by_idx
  on public.doctors(verified_by);

create index if not exists medical_admins_revoked_by_idx
  on public.medical_admins(revoked_by);
