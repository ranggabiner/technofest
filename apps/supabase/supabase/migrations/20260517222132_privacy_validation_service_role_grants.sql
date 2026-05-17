grant usage on schema public to service_role;

grant select on table
  public.patients,
  public.ai_sessions,
  public.ai_messages,
  public.scope_2_mental,
  public.scope_2_physical,
  public.scope_1_medical_records,
  public.secure_files,
  public.audit_logs
to service_role;

notify pgrst, 'reload schema';
