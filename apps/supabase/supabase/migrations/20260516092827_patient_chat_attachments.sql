create table public.ai_message_attachments (
  attachment_id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_messages(message_id) on delete cascade,
  session_id uuid not null references public.ai_sessions(session_id) on delete cascade,
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  file_id uuid not null references public.secure_files(file_id) on delete restrict,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  extracted_text_ciphertext text not null,
  extracted_text_iv text not null,
  extracted_text_tag text not null,
  extracted_text_truncated boolean not null default false,
  extraction_method text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  constraint ai_message_attachments_method_check check (extraction_method in ('pdf_text', 'image_ocr')),
  constraint ai_message_attachments_message_file_key unique (message_id, file_id)
);

create index ai_message_attachments_message_id_idx on public.ai_message_attachments(message_id);
create index ai_message_attachments_session_id_idx on public.ai_message_attachments(session_id);
create index ai_message_attachments_patient_id_idx on public.ai_message_attachments(patient_id);
create index ai_message_attachments_file_id_idx on public.ai_message_attachments(file_id);

alter table public.ai_message_attachments enable row level security;

create policy "patients can access own ai message attachments"
on public.ai_message_attachments for select to authenticated
using (patient_id = private.current_patient_id());

create policy "patients can insert own ai message attachments"
on public.ai_message_attachments for insert to authenticated
with check (
  patient_id = private.current_patient_id()
  and exists (
    select 1
    from public.ai_messages m
    where m.message_id = ai_message_attachments.message_id
      and m.session_id = ai_message_attachments.session_id
      and m.patient_id = ai_message_attachments.patient_id
      and m.sender_role = 'patient'
  )
  and exists (
    select 1
    from public.secure_files sf
    where sf.file_id = ai_message_attachments.file_id
      and sf.owner_role = 'patient'
      and sf.owner_id = ai_message_attachments.patient_id
  )
);

grant select, insert on public.ai_message_attachments to authenticated, service_role;
