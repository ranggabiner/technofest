revoke all on function public.replace_active_access_grant_v2(
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  timestamptz,
  text,
  text,
  uuid,
  text,
  inet
) from public, anon;

revoke all on function public.replace_active_access_grant_v3(
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  uuid[],
  jsonb,
  timestamptz,
  timestamptz,
  text,
  text,
  uuid,
  text,
  inet
) from public, anon;

revoke all on function public.revoke_active_access_grant(
  uuid,
  uuid,
  timestamptz,
  text,
  uuid,
  text,
  inet
) from public, anon;

grant execute on function public.replace_active_access_grant_v2(
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  timestamptz,
  text,
  text,
  uuid,
  text,
  inet
) to authenticated;

grant execute on function public.replace_active_access_grant_v3(
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  boolean,
  uuid[],
  jsonb,
  timestamptz,
  timestamptz,
  text,
  text,
  uuid,
  text,
  inet
) to authenticated;

grant execute on function public.revoke_active_access_grant(
  uuid,
  uuid,
  timestamptz,
  text,
  uuid,
  text,
  inet
) to authenticated;
