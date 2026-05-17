# MedProof Sprint 1 Detailed Source Context

## Document Metadata

| Field | Value |
|---|---|
| Product | MedProof |
| Document Type | Detailed Sprint 1 source context |
| Status | Superseded by `plans/sprint-01/overview.md` as active contract |
| Source Documents | `plans/sprint-01/PRD.md`, `plans/sprint-01/medproof_questions_answers.md` |
| Last Updated | May 2026 |
| Target Use | Competition MVP with demo/test data only |
| UI and AI Response Language | Indonesian |
| Repository Documentation Language | English |
| Blockchain Network | Polygon Amoy Testnet |

This file preserves detailed Sprint 1 source context. Use `plans/sprint-01/overview.md` as the active contract, then the numbered feature specs. Use this file when those documents are silent or need deeper detail.

## Required Reading Order

Before editing implementation code, agents must read:

1. `plans/sprint-01/overview.md`.
2. Relevant numbered feature spec in `plans/sprint-01/`.
3. This file for detailed source context.
4. `plans/sprint-01/medproof_questions_answers.md` for rationale behind revised decisions.
5. `plans/sprint-01/PRD.md` only as historical product context.
6. Existing source files affected by the task, once the app scaffold exists.

When instructions conflict, follow this order:

1. User's latest explicit instruction.
2. `plans/sprint-01/overview.md`.
3. Relevant numbered feature spec in `plans/sprint-01/`.
4. This file.
5. `plans/sprint-01/medproof_questions_answers.md`.
6. `plans/sprint-01/PRD.md`.
7. Existing codebase patterns.
8. General framework best practices.

## Product Summary

MedProof is a web-based personal medical record and health journaling platform. Patients control which verified doctors may access their data, which data scopes are visible, whether attachments may be downloaded, and when access expires or is revoked.

MedProof stores health data off-chain. Polygon Amoy stores only privacy-preserving hashes for integrity proof. The product must never store patient names, diagnoses, prescriptions, symptoms, mood, anxiety, sleep data, raw quotes, or plaintext medical content on-chain.

Sprint 1 proves three product claims:

1. Patient-controlled, time-limited, granular doctor access.
2. AI-assisted patient health journaling and doctor-facing text Q&A over patient-generated data.
3. Tamper-evident integrity proof for records, consent events, and audit events.

## Sprint Goal

Build the full Sprint 1 MVP scope from this contract as a secure competition demo, not a production clinical system.

Sprint 1 must deliver:

1. Supabase Google OAuth registration/login for Patient, Doctor, and Medical Admin.
2. Medical Admin doctor KYC review.
3. Doctor QR Code and 6-digit Doctor Access Code.
4. Patient access grant, replacement, expiry, revocation, and access history.
5. Patient AI chat, traceable Scope 2 extraction, emergency flagging, and session summaries.
6. Doctor temporary patient data view with encrypted data decrypted only after authorization.
7. Doctor Scope 1 record creation with encrypted attachments and blockchain proof status.
8. Doctor text RAG over authorized Scope 2 data using explicit SQL retrieval and DeepSeek.
9. Audit logging with patient-facing access history.
10. Blockchain hash registration, retry, and user-facing verification status.

## Non-Scope

Do not implement these in Sprint 1:

1. Real clinical deployment or real patient production data.
2. Certification as a national Electronic Medical Record system.
3. SATUSEHAT integration.
4. KKI API automatic STR verification.
5. Emergency dispatch, SOS workflow, break-glass access, or automatic doctor/admin alert.
6. Mobile apps.
7. Patient or doctor blockchain wallets.
8. Zero-knowledge or client-side encryption.
9. Vector database, embedding search, or LlamaIndex.
10. Account deletion, health data deletion, or retention automation.
11. Doctor-initiated access extension request.
12. Web push notifications.
13. FHIR R4 export.
14. Predictive health insights.
15. AI chart generation or advanced chart function calling.
16. Physical NFC Health Access Card.
17. Broad UI redesign outside screens required by this contract.

## Tech Stack

| Layer | Sprint 1 Decision | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router, TypeScript, pnpm | Node version must satisfy Next.js 16 requirements. |
| Styling/UI | Tailwind CSS, shadcn/ui | Use restrained dashboard/product UI, not landing-page styling. |
| Auth | Supabase Auth with Google OAuth | All roles authenticate through Google OAuth. |
| Database | Supabase PostgreSQL | Use SQL migrations and Row-Level Security. |
| DB Client | Supabase JS | Do not use Prisma in Sprint 1. |
| State | Zustand where needed | Keep state local/simple unless app state is shared across pages. |
| Chat | Vercel AI SDK | Streaming UI for patient chat and doctor RAG. |
| AI Model | DeepSeek | Used for patient conversation, extraction, summaries, and doctor RAG. |
| RAG | Explicit SQL retrieval plus LLM response | No LlamaIndex, embeddings, or vector DB in Sprint 1. |
| File Storage | Supabase Storage private buckets | Store encrypted bytes only. |
| Email | Resend | KYC approval/rejection notification only. |
| Encryption | Server-side AES-256-GCM | All health fields and uploaded file bytes are app-encrypted. |
| Blockchain | Solidity, Hardhat, viem, Polygon Amoy | Server relayer wallet signs hash registration txs. |
| QR Code | qrcode.js or equivalent lightweight library | Generate doctor QR from approved doctor token. |
| Hosting | Vercel + Supabase | Vercel server env stores app secrets. |

Validation must run lint separately from build. Do not rely on `next build` to run lint.

## Roles

| Role | Description | Allowed Data Access |
|---|---|---|
| Patient | Owner/controller of own personal health data. | Full access to own profile, Scope 1 records, Scope 2 data, grants, proof status, and access history. |
| Doctor | Medical professional manually approved by Medical Admin. | Only data covered by an active, unexpired, non-revoked patient grant. Can add Scope 1 records only if Scope 1 is granted. |
| Medical Admin | Internal doctor verifier. | Doctor registration/KYC data and admin KYC audit only. No patient Scope 1, Scope 2, AI session, or patient profile access. |

## Auth And Authorization

### Supabase Auth

All users sign in with Google OAuth through Supabase Auth. Domain tables store `auth_user_id` mapped to `auth.users.id`; no domain table stores passwords, OTP secrets, or credential hashes.

Role resolution:

1. If email is in `ADMIN_EMAIL_ALLOWLIST`, create or link `medical_admins`.
2. If user starts doctor onboarding, create or link `doctors` with `account_status = 'pending'`.
3. Otherwise create or link `patients`.
4. A single auth user must not hold multiple roles in Sprint 1 unless explicitly allowlisted as admin for demo setup.

Admin bootstrap:

1. Medical Admin accounts are created only through Google OAuth with `ADMIN_EMAIL_ALLOWLIST`.
2. No public admin signup route.
3. Non-allowlisted users cannot create or mutate admin records.

### Row-Level Security

Use Supabase RLS on all tables containing user, grant, audit, session, record, extraction, and file metadata.

RLS must enforce:

1. Patients can read their own rows.
2. Doctors can read patient rows only through active grants.
3. Doctors cannot read unapproved-doctor features while `account_status != 'approved'`.
4. Medical Admin can read/write doctor KYC review rows only.
5. Medical Admin cannot read patient profile, Scope 1, Scope 2, AI session, or AI message rows.

Backend server routes may use service role only for controlled operations that cannot safely use user JWT directly, such as blockchain retry worker, encryption/decryption, and admin-gated KYC mutations. Service-role routes must still check authenticated user role and business access before returning data.

## Security Model

### Encryption

All health fields must be encrypted by the application before database storage.

Plaintext may be stored only for operational metadata:

1. IDs and foreign keys.
2. `auth_user_id`.
3. Role/status fields.
4. Access scope flags.
5. `log_date`, timestamps, expiry, revocation status.
6. Blockchain transaction hashes and proof status.
7. Non-health routing/status metadata.

Clinical and health content must be encrypted, including:

1. Scope 1 record type, title, description, and attachment bytes.
2. Scope 2 mood, anxiety, sleep, trigger notes, symptom type, severity, body location, duration note, emergency flag, raw quote, raw extraction JSON, and AI session summary.
3. Patient profiling health/lifestyle free text.
4. AI messages.

Encrypted field schema pattern:

```sql
<field_name>_ciphertext TEXT NOT NULL
<field_name>_iv         TEXT NOT NULL
<field_name>_tag        TEXT NOT NULL
```

Rows containing encrypted health fields must also include:

```sql
key_version TEXT NOT NULL DEFAULT 'v1'
```

Implementation rules:

1. Use AES-256-GCM.
2. Store master key only in Vercel environment variables, never in the database.
3. Store `key_version` for future manual rotation.
4. Validate AI outputs before encryption because DB `CHECK` constraints cannot inspect encrypted values.
5. Never log plaintext health fields, decrypted payloads, raw AI prompts, or decrypted files.

### AI Data Sharing Consent

Patient onboarding must disclose that AI chat, extraction, summaries, and authorized doctor RAG send relevant decrypted text to DeepSeek for processing. Sprint 1 uses demo/test data only.

Doctor RAG may send decrypted Scope 2 context to DeepSeek only when:

1. Doctor is authenticated.
2. Doctor is approved.
3. Patient has active, unexpired, non-revoked grant.
4. Grant includes the requested Scope 2 category.

### Doctor Access Code Rate Limit

Doctor Access Code is a lookup helper, not a credential and not permission.

Policy:

1. Code format: unique 6-digit numeric string.
2. Available only for approved doctors.
3. 10 failed lookup attempts per rolling 15 minutes per authenticated user plus IP.
4. 20 failed lookup attempts per rolling 24 hours per authenticated user plus IP.
5. Failed lookups are logged in `audit_logs` with generic reason.
6. UI errors must not reveal whether a code exists.

## Data Model Summary

Use SQL migrations. Names below are required unless implementation has a strong reason to preserve an existing equivalent name.

### Core Tables

`patients`

```sql
patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id UUID UNIQUE NOT NULL
full_name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
date_of_birth DATE NULL
profiling_data_ciphertext TEXT NULL
profiling_data_iv TEXT NULL
profiling_data_tag TEXT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NULL
```

`doctors`

```sql
doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id UUID UNIQUE NOT NULL
full_name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
phone_number TEXT NULL
specialization TEXT NULL
account_status TEXT NOT NULL DEFAULT 'pending'
rejection_reason TEXT NULL
verified_by UUID NULL REFERENCES medical_admins(admin_id)
verified_at TIMESTAMPTZ NULL
qr_code_token TEXT UNIQUE NULL
doctor_access_code CHAR(6) UNIQUE NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NULL
```

`medical_admins`

```sql
admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id UUID UNIQUE NOT NULL
full_name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

### File Metadata

Use private Supabase buckets. Stored object bytes must already be AES-encrypted before upload.

`secure_files`

```sql
file_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_role TEXT NOT NULL
owner_id UUID NOT NULL
bucket_name TEXT NOT NULL
object_path TEXT NOT NULL
original_filename_ciphertext TEXT NOT NULL
original_filename_iv TEXT NOT NULL
original_filename_tag TEXT NOT NULL
mime_type TEXT NOT NULL
file_size_bytes BIGINT NOT NULL
file_sha256 TEXT NOT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

KYC documents and medical attachments both use `secure_files`. Medical attachment access is governed by active Scope 1 grant and attachment policy.

### Doctor KYC Documents

`doctor_kyc_documents`

```sql
document_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
doctor_id UUID NOT NULL REFERENCES doctors(doctor_id)
document_type TEXT NOT NULL
file_id UUID NOT NULL REFERENCES secure_files(file_id)
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`document_type` allowed values: `str`, `sip`, `ktp`.

### AI Sessions And Messages

`ai_sessions`

```sql
session_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id UUID NOT NULL REFERENCES patients(patient_id)
session_title_ciphertext TEXT NULL
session_title_iv TEXT NULL
session_title_tag TEXT NULL
summary_text_ciphertext TEXT NULL
summary_text_iv TEXT NULL
summary_text_tag TEXT NULL
ended_at TIMESTAMPTZ NULL
end_reason TEXT NULL
summary_generated_at TIMESTAMPTZ NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NULL
```

`end_reason` allowed values: `manual_end`, `inactivity_timeout`, `new_session_started`.

`ai_messages`

```sql
message_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id UUID NOT NULL REFERENCES ai_sessions(session_id)
patient_id UUID NOT NULL REFERENCES patients(patient_id)
sender_role TEXT NOT NULL
message_text_ciphertext TEXT NOT NULL
message_text_iv TEXT NOT NULL
message_text_tag TEXT NOT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`sender_role` allowed values: `patient`, `ai`.

### Scope 2 Mental

`scope_2_mental`

```sql
log_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id UUID NOT NULL REFERENCES patients(patient_id)
session_id UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date DATE NOT NULL
mood_score_ciphertext TEXT NULL
mood_score_iv TEXT NULL
mood_score_tag TEXT NULL
anxiety_level_ciphertext TEXT NULL
anxiety_level_iv TEXT NULL
anxiety_level_tag TEXT NULL
sleep_hours_ciphertext TEXT NULL
sleep_hours_iv TEXT NULL
sleep_hours_tag TEXT NULL
trigger_notes_ciphertext TEXT NULL
trigger_notes_iv TEXT NULL
trigger_notes_tag TEXT NULL
raw_quote_ciphertext TEXT NOT NULL
raw_quote_iv TEXT NOT NULL
raw_quote_tag TEXT NOT NULL
is_emergency_flagged_ciphertext TEXT NOT NULL
is_emergency_flagged_iv TEXT NOT NULL
is_emergency_flagged_tag TEXT NOT NULL
extraction_confidence_ciphertext TEXT NULL
extraction_confidence_iv TEXT NULL
extraction_confidence_tag TEXT NULL
ai_model TEXT NULL
schema_version TEXT NOT NULL DEFAULT 'v1'
raw_extraction_jsonb_ciphertext TEXT NULL
raw_extraction_jsonb_iv TEXT NULL
raw_extraction_jsonb_tag TEXT NULL
raw_quote_hash TEXT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NULL
UNIQUE (session_id)
```

### Scope 2 Physical

`scope_2_physical`

```sql
log_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id UUID NOT NULL REFERENCES patients(patient_id)
session_id UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date DATE NOT NULL
symptom_type_ciphertext TEXT NULL
symptom_type_iv TEXT NULL
symptom_type_tag TEXT NULL
severity_ciphertext TEXT NULL
severity_iv TEXT NULL
severity_tag TEXT NULL
body_location_ciphertext TEXT NULL
body_location_iv TEXT NULL
body_location_tag TEXT NULL
duration_note_ciphertext TEXT NULL
duration_note_iv TEXT NULL
duration_note_tag TEXT NULL
raw_quote_ciphertext TEXT NOT NULL
raw_quote_iv TEXT NOT NULL
raw_quote_tag TEXT NOT NULL
is_emergency_flagged_ciphertext TEXT NOT NULL
is_emergency_flagged_iv TEXT NOT NULL
is_emergency_flagged_tag TEXT NOT NULL
extraction_confidence_ciphertext TEXT NULL
extraction_confidence_iv TEXT NULL
extraction_confidence_tag TEXT NULL
ai_model TEXT NULL
schema_version TEXT NOT NULL DEFAULT 'v1'
raw_extraction_jsonb_ciphertext TEXT NULL
raw_extraction_jsonb_iv TEXT NULL
raw_extraction_jsonb_tag TEXT NULL
raw_quote_hash TEXT NOT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NULL
```

Required duplicate-prevention constraint:

```sql
UNIQUE (session_id, raw_quote_hash)
```

Duplicate prevention: do not create multiple `scope_2_physical` rows for the same `session_id` plus `raw_quote_hash`. `raw_quote_hash` is required for persisted physical rows so null values cannot bypass duplicate prevention.

### Scope 1 Medical Records

`scope_1_medical_records`

```sql
record_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id UUID NOT NULL REFERENCES patients(patient_id)
doctor_id UUID NOT NULL REFERENCES doctors(doctor_id)
amends_record_id UUID NULL REFERENCES scope_1_medical_records(record_id)
record_type_ciphertext TEXT NOT NULL
record_type_iv TEXT NOT NULL
record_type_tag TEXT NOT NULL
title_ciphertext TEXT NOT NULL
title_iv TEXT NOT NULL
title_tag TEXT NOT NULL
description_ciphertext TEXT NULL
description_iv TEXT NULL
description_tag TEXT NULL
attachment_file_id UUID NULL REFERENCES secure_files(file_id)
record_hash TEXT NOT NULL
blockchain_tx_hash TEXT NULL
blockchain_status TEXT NOT NULL DEFAULT 'pending'
blockchain_last_error TEXT NULL
key_version TEXT NOT NULL DEFAULT 'v1'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Allowed record types before encryption: `lab`, `xray`, `diagnosis`, `prescription`, `vaccine`, `action`, `note`.

Scope 1 is append-only:

1. Doctors cannot edit or delete saved records.
2. Corrections create a new record with `amends_record_id`.
3. Each original and amendment record gets its own hash, audit event, and blockchain status.

### Access Grants

Use boolean scope flags, not a single enum.

`access_grants`

```sql
grant_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id UUID NOT NULL REFERENCES patients(patient_id)
doctor_id UUID NOT NULL REFERENCES doctors(doctor_id)
can_view_scope1 BOOLEAN NOT NULL DEFAULT FALSE
can_view_scope2_mental BOOLEAN NOT NULL DEFAULT FALSE
can_view_scope2_physical BOOLEAN NOT NULL DEFAULT FALSE
can_download_attachments BOOLEAN NOT NULL DEFAULT FALSE
granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
expires_at TIMESTAMPTZ NOT NULL
is_revoked BOOLEAN NOT NULL DEFAULT FALSE
revoked_at TIMESTAMPTZ NULL
replaced_by_grant_id UUID NULL REFERENCES access_grants(grant_id)
consent_hash TEXT NOT NULL
blockchain_tx_hash TEXT NULL
blockchain_status TEXT NOT NULL DEFAULT 'pending'
blockchain_last_error TEXT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Rules:

1. At least one `can_view_*` flag must be true.
2. `expires_at` is always required and finite.
3. Custom duration has no maximum, but UI must warn when the chosen expiry is more than 30 days away.
4. Only one active patient-doctor grant may exist at a time.
5. Creating a new grant for the same patient-doctor pair revokes the prior active grant, sets `replaced_by_grant_id`, creates a consent proof for the prior replaced grant state, creates a consent proof for the new active grant state, and creates a new audit blockchain event.

Access check must not use `SELECT *`. Use explicit columns and deterministic ordering:

```sql
SELECT
  grant_id,
  can_view_scope1,
  can_view_scope2_mental,
  can_view_scope2_physical,
  can_download_attachments,
  expires_at
FROM access_grants
WHERE doctor_id = :doctor_id
  AND patient_id = :patient_id
  AND expires_at > now()
  AND is_revoked = FALSE
ORDER BY granted_at DESC
LIMIT 1;
```

If no row is returned, backend returns `403 Forbidden`.

### Audit Logs

`audit_logs`

```sql
log_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
actor_auth_user_id UUID NOT NULL
actor_role TEXT NOT NULL
action TEXT NOT NULL
target_type TEXT NULL
target_id UUID NULL
patient_id UUID NULL REFERENCES patients(patient_id)
doctor_id UUID NULL REFERENCES doctors(doctor_id)
access_status TEXT NOT NULL
reason TEXT NULL
ip_address INET NULL
audit_event_hash TEXT NOT NULL
blockchain_tx_hash TEXT NULL
blockchain_status TEXT NOT NULL DEFAULT 'pending'
blockchain_last_error TEXT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Required audit events:

1. Patient grant created.
2. Patient grant replaced.
3. Patient grant revoked.
4. Doctor allowed/denied patient data view.
5. Doctor Scope 1 record created or amended.
6. Doctor RAG request.
7. Admin doctor approval/rejection.
8. Failed Doctor Access Code lookup.
9. Blockchain verification mismatch.

Patient-facing access history shows patient-relevant grant, revoke, doctor view, denied attempt, RAG, and proof-status events. Admin UI shows only KYC audit events.

## Patient Portal

### Patient Registration And Onboarding

Flow:

1. Patient selects "Lanjutkan dengan Google".
2. Supabase Auth authenticates Google identity.
3. System creates or links `patients`.
4. Patient sees explicit AI processing consent and competition/demo disclaimer.
5. Patient completes one-time AI profiling conversation.

AI profiling may ask in Indonesian about:

1. How the patient learned about MedProof.
2. Age and date of birth.
3. Current feeling.
4. Work, study, or usual activity.
5. Lifestyle/environment context.
6. Known illness history if patient is willing to share.

Profiling content is encrypted in `patients.profiling_data_*`.

### Patient Dashboard

Dashboard shows:

1. Personal greeting.
2. Primary CTA to open AI Chat.
3. Scope 1 recent records summary.
4. Scope 2 recent journal summary.
5. Active doctor access list with expiry.
6. Access history entry point.
7. Proof status indicators where relevant.

Empty states are required for no records, no AI sessions, no active grants, and pending blockchain proof.

### Patient AI Chat

Chat UI:

1. ChatGPT-like session list and main chat area.
2. Indonesian AI responses.
3. Finish Session action.
4. Clear non-diagnostic copy when health topics appear.

Backend behavior:

1. Create `ai_sessions` row when a session starts.
2. Store each patient and AI message encrypted in `ai_messages`.
3. Run lightweight AI classification during chat for emergency flag/context awareness.
4. Run final extraction when session ends.
5. Write at most one `scope_2_mental` row per session.
6. Write one `scope_2_physical` row per primary symptom per session.
7. Store traceability through `session_id`, encrypted `raw_quote`, optional mental `raw_quote_hash`, and required non-null physical `raw_quote_hash`.
8. Generate encrypted `summary_text` after session end.

Session ends when:

1. Patient presses Finish Session.
2. No patient activity occurs for 30 minutes.
3. Patient starts a new session while prior session has no summary.

AI extraction rules:

1. Do not diagnose.
2. Do not invent severity, duration, body location, mood, sleep, or symptoms.
3. Leave unknown fields null.
4. Validate values before encryption.
5. No patient manual edit workflow in Sprint 1.
6. Doctors see provenance/disclaimer, not editable extracted data.

Emergency behavior:

1. If emergency/self-harm indicators are detected, store an encrypted emergency flag value.
2. AI gives cautious Indonesian guidance to seek professional or emergency help.
3. No dispatch, no automatic doctor alert, no automatic admin alert.

### Patient Access Management

Grant flow:

1. Patient opens Manage Doctor Access.
2. Patient scans Doctor QR Code or enters Doctor Access Code.
3. Backend finds approved doctor only.
4. UI shows doctor name and specialization.
5. Patient selects any combination of:
   - Scope 1.
   - Scope 2 mental.
   - Scope 2 physical.
6. Patient selects expiry date/time. It must be finite. No maximum cap.
7. If expiry is more than 30 days away, UI shows a strong warning.
8. Patient chooses whether attachment downloads are allowed.
9. Backend revokes existing active grant for same doctor if present.
10. Backend creates new grant, consent hash, audit log, and blockchain pending job.

Revoke flow:

1. Patient selects active grant.
2. Patient confirms revoke.
3. Backend sets `is_revoked = TRUE` and `revoked_at`.
4. Backend logs audit event and blockchain pending job.
5. Later doctor access returns `403 Forbidden`.

## Doctor Portal

### Doctor Registration And KYC

Flow:

1. Doctor selects "Lanjutkan dengan Google".
2. System creates or links `doctors` with `account_status = 'pending'`.
3. Doctor submits full name, specialization, phone number, STR document, SIP document, and KTP/identity document.
4. Uploaded documents are AES-encrypted before private Supabase Storage upload.
5. Doctor portal remains locked until Medical Admin approval.

Approved doctors receive:

1. `account_status = 'approved'`.
2. `qr_code_token`.
3. Unique 6-digit `doctor_access_code`.
4. Resend approval email.
5. Doctor dashboard access.

Pending/rejected doctors must not have active QR Code, Doctor Access Code, patient list, or patient data access.

### Doctor Dashboard

Doctor dashboard shows:

1. QR Code.
2. Doctor Access Code.
3. Active patient grants.
4. Remaining access time.

Doctors must not have free patient search.

### Temporary Patient Data View

The page is available only while an active grant exists. It must show a prominent countdown timer and lock immediately after expiry/revocation on the next data request.

Scope 1 panel:

1. Visible only when `can_view_scope1 = TRUE`.
2. Shows decrypted records after backend authorization.
3. Shows encrypted attachment previews in-app while access is active.
4. Allows file download only when `can_download_attachments = TRUE`.
5. No all-records PDF export.

Scope 2 mental panel:

1. Visible only when `can_view_scope2_mental = TRUE`.
2. Shows decrypted mood/anxiety/sleep/trigger/raw quote data where available.
3. Shows emergency flags after backend decryption.

Scope 2 physical panel:

1. Visible only when `can_view_scope2_physical = TRUE`.
2. Shows decrypted symptom/severity/body location/duration/raw quote data where available.
3. Shows emergency flags after backend decryption.

### Scope 1 Input

Doctors can add Scope 1 records only while active grant includes Scope 1.

Save flow:

1. Validate doctor auth, approval, active grant, and Scope 1 flag.
2. Generate the Scope 1 record UUID before insert.
3. Encrypt clinical fields and attachment bytes.
4. Build the canonical encrypted record payload and compute `record_hash` before insert.
5. Save Scope 1 record with `record_hash` and `blockchain_status = 'pending'` in the same transaction.
6. Create audit log with `audit_event_hash` and `blockchain_status = 'pending'`.
7. Create blockchain pending jobs for record and audit event.
8. UI shows proof pending until confirmed.

### Doctor RAG

Doctor RAG is text Q&A over authorized Scope 2 data only. It is not diagnosis or medical decision automation.

Flow:

1. Doctor submits question.
2. Backend validates doctor approval and active grant.
3. Backend checks which Scope 2 categories are permitted.
4. Backend retrieves explicit SQL columns for permitted rows only.
5. Backend decrypts authorized Scope 2 fields.
6. Backend sends minimal relevant context and question to DeepSeek.
7. UI shows answer with mandatory Indonesian disclaimer.
8. Backend writes audit log and blockchain pending job.

Mandatory disclaimer meaning:

```text
Informasi ini dibuat dari data sesi AI MedProof pasien dan bukan diagnosis, asesmen medis, atau rekomendasi pengobatan. Gunakan hanya sebagai konteks awal, bukan sebagai satu-satunya dasar keputusan klinis.
```

## Medical Admin Portal

Admin dashboard shows pending doctor registrations with:

1. Doctor name.
2. Specialization.
3. Registration date.
4. Encrypted KYC document preview after admin authorization.
5. Filters by date, specialization, and status.

Verification flow:

1. Admin opens doctor detail page.
2. Admin checks STR, SIP, and KTP.
3. Admin may manually cross-check official KKI sources outside MedProof.
4. Admin approves or rejects.
5. Approval generates QR Code token and Doctor Access Code.
6. Approval/rejection sends Resend email.
7. Admin action writes audit log and blockchain pending job.

Hard restriction:

1. Admin UI has no patient-data navigation.
2. Admin backend requests containing patient data targets return `403 Forbidden`.
3. RLS must prevent admin sessions from reading patient, Scope 1, Scope 2, AI session, AI message, and patient audit rows.

## Blockchain Layer

### Privacy-Preserving Hashing

Do not hash raw IDs directly for on-chain values. Use a server-held hash pepper and HMAC for pseudonymous IDs.

Required patterns:

1. `patient_hash = HMAC_SHA256(HASH_PEPPER, patient_id)`.
2. `doctor_hash = HMAC_SHA256(HASH_PEPPER, doctor_id)`.
3. `actor_hash = HMAC_SHA256(HASH_PEPPER, actor_auth_user_id)`.
4. `target_ref_hash = HMAC_SHA256(HASH_PEPPER, target_id)` when a target ID exists.
5. `record_hash = SHA256(canonical_json(encrypted_record_payload))`.
6. `consent_hash = SHA256(canonical_json(consent_event_payload_with_hmac_ids))`.
7. `audit_event_hash = SHA256(canonical_json(audit_event_payload_with_hmac_ids))`.

Canonical JSON must use stable key ordering, stable UTC timestamp format, stable schema version, explicit nulls for nullable included fields, and no plaintext health content. Proof payloads must exclude mutable proof transport fields: `blockchain_tx_hash`, `blockchain_status`, and `blockchain_last_error`.

Exact proof payloads:

`encrypted_record_payload` includes exactly:

1. `proof_type = "scope_1_record"`.
2. `schema_version = "v1"`.
3. `record_ref_hash = HMAC_SHA256(HASH_PEPPER, record_id)`.
4. `patient_hash`.
5. `doctor_hash`.
6. `amends_record_ref_hash` or null.
7. `record_type_ciphertext`, `record_type_iv`, `record_type_tag`.
8. `title_ciphertext`, `title_iv`, `title_tag`.
9. `description_ciphertext`, `description_iv`, `description_tag`.
10. `attachment_file_ref_hash` or null.
11. `attachment_file_sha256` or null.
12. `key_version`.
13. `created_at`.

`consent_event_payload_with_hmac_ids` includes exactly:

1. `proof_type = "access_grant_consent"`.
2. `schema_version = "v1"`.
3. `grant_ref_hash = HMAC_SHA256(HASH_PEPPER, grant_id)`.
4. `patient_hash`.
5. `doctor_hash`.
6. `can_view_scope1`.
7. `can_view_scope2_mental`.
8. `can_view_scope2_physical`.
9. `can_download_attachments`.
10. `granted_at`.
11. `expires_at`.
12. `is_revoked`.
13. `revoked_at` or null.
14. `replaced_by_grant_ref_hash` or null.
15. `created_at`.

`audit_event_payload_with_hmac_ids` includes exactly:

1. `proof_type = "audit_event"`.
2. `schema_version = "v1"`.
3. `log_ref_hash = HMAC_SHA256(HASH_PEPPER, log_id)`.
4. `actor_hash`.
5. `actor_role`.
6. `action`.
7. `target_type` or null.
8. `target_ref_hash` or null.
9. `patient_hash` or null.
10. `doctor_hash` or null.
11. `access_status`.
12. `reason_code` or null, using only generic non-sensitive reason values.
13. `created_at`.

### Contract Interface

Contract must support:

```solidity
function registerHealthRecord(
    bytes32 recordHash,
    bytes32 patientHash,
    bytes32 issuerHash,
    uint256 version
) external;

function recordConsent(
    bytes32 consentHash,
    bytes32 patientHash,
    bytes32 granteeHash,
    uint256 expiresAt,
    bool isRevoked
) external;

function recordAuditEvent(
    bytes32 auditEventHash,
    bytes32 actorHash,
    bytes32 targetHash,
    bytes32 actionHash
) external;
```

Contract must also emit deterministic indexed events for verification:

```solidity
event HealthRecordRegistered(bytes32 indexed recordHash, bytes32 indexed patientHash, bytes32 indexed issuerHash, uint256 version);
event ConsentRecorded(bytes32 indexed consentHash, bytes32 indexed patientHash, bytes32 indexed granteeHash, uint256 expiresAt, bool isRevoked);
event AuditEventRecorded(bytes32 indexed auditEventHash, bytes32 indexed actorHash, bytes32 indexed targetHash, bytes32 actionHash);
```

Verify reads confirmed transaction receipts or indexed contract logs and compares the event hash argument with the recomputed local hash.
Contract implementation must prevent duplicate registration of the same `recordHash`, `consentHash`, or `auditEventHash`; relayer retries must treat a duplicate matching hash as idempotent success after event lookup.

### Transaction Policy

Use a server relayer wallet stored in Vercel env. Users do not need wallets.

If Polygon Amoy write is slow or fails:

1. Generate stable row IDs, capture one transaction timestamp for included timestamp fields, build canonical proof payload, and compute the required hash before the off-chain insert/update.
2. Save off-chain record/grant/audit with the hash and `blockchain_status = 'pending'`.
3. Retry through a controlled server job.
4. If retry fails, set `blockchain_status = 'failed'` and store non-sensitive error summary.
5. UI must show pending/failed/confirmed status.
6. User can press Verify after tx confirmation.

Relayer retry must claim rows with `FOR UPDATE SKIP LOCKED`. Duplicate matching proof hashes are idempotent and must be resolved through confirmed event lookup before marking a proof failed.

Proof UI:

1. Scope 1 records show tx status/hash and Verify button.
2. Access grants show tx status/hash and Verify button.
3. Patient access history shows audit proof status.
4. Verification recomputes hash from current encrypted payload/event and compares with the matching confirmed contract event hash.
5. Mismatch shows integrity warning and writes audit log.

## End-To-End Flows

### Patient AI Flow

```text
Patient signs in with Google
-> completes AI processing consent
-> completes one-time profiling
-> opens AI Chat
-> messages stored encrypted
-> emergency classifier runs during chat
-> patient finishes session or session times out
-> final extraction validates values
-> Scope 2 rows stored encrypted
-> summary stored encrypted
```

### Access Flow

```text
Approved doctor shows QR/code
-> patient scans/enters code
-> backend finds approved doctor
-> patient selects scope flags, expiry, download permission
-> previous active grant for same doctor is revoked if present
-> new grant saved
-> consent/audit hashes queued for blockchain
-> doctor can access only authorized data until expiry/revoke
```

### Doctor Record Flow

```text
Doctor opens patient data page
-> backend validates approved doctor and active grant
-> doctor adds Scope 1 record
-> clinical fields and attachment bytes encrypted
-> record saved append-only
-> record/audit hashes queued for blockchain
-> UI shows proof status
```

### Doctor RAG Flow

```text
Doctor asks Scope 2 question
-> backend validates active grant and permitted Scope 2 flags
-> backend retrieves explicit encrypted rows
-> backend decrypts only authorized fields
-> DeepSeek receives minimal relevant context
-> answer returned with disclaimer
-> audit hash queued for blockchain
```

## Development Order

1. Scaffold Next.js 16 app with pnpm, TypeScript, Tailwind, shadcn/ui, Supabase JS, Vercel AI SDK, DeepSeek config, Resend, Hardhat, viem.
2. Add environment schema/validation for Supabase, Google OAuth, DeepSeek, Resend, AES key, hash pepper, relayer wallet, Amoy RPC, contract address, and admin allowlist.
3. Create Supabase SQL migrations for tables, indexes, RLS policies, and private storage buckets.
4. Implement crypto utilities for AES-GCM, canonical JSON, HMAC ID hashing, file encrypt/decrypt streaming, and safe logging.
5. Implement Supabase Auth callbacks/session role resolution for Patient, Doctor, and Medical Admin.
6. Implement Medical Admin allowlist and doctor KYC flow.
7. Implement doctor approval/rejection, QR/code generation, Resend emails, and code rate limiting.
8. Implement patient onboarding, AI processing consent, dashboard, and AI chat shell.
9. Implement AI message storage, session lifecycle, final extraction, emergency flagging, and encrypted Scope 2 writes.
10. Implement patient access grant/replacement/revoke and access history.
11. Implement doctor temporary patient data view with scope checks and decrypted display.
12. Implement encrypted file upload/preview/download policy.
13. Implement Scope 1 append-only record creation and amendment.
14. Implement Doctor RAG with SQL retrieval and DeepSeek response.
15. Implement audit logging and patient/admin audit UI.
16. Implement smart contract, deploy to Amoy, relayer calls, pending retry, proof status, and Verify button.
17. Add error/empty/loading/expired/revoked/pending/failed states.
18. Run validation checklist and report results.

Do not skip earlier security layers to build UI faster. If scope pressure appears, reduce visual polish before reducing authorization, encryption, audit, or RLS.

## UI Requirements

Use Indonesian UI copy. Build application screens directly, not a marketing landing page.

Required screens:

1. Auth/sign-in landing with Google.
2. Patient onboarding/AI consent/profiling.
3. Patient dashboard.
4. Patient AI Chat.
5. Patient Manage Doctor Access.
6. Patient Access History and proof status.
7. Doctor onboarding/KYC.
8. Doctor pending/rejected status.
9. Doctor dashboard with QR/code.
10. Doctor temporary patient data view.
11. Doctor Scope 1 form.
12. Doctor RAG panel.
13. Medical Admin dashboard.
14. Medical Admin doctor detail/review.

Required states:

1. Loading.
2. Empty.
3. Unauthorized.
4. Expired access.
5. Revoked access.
6. Pending doctor approval.
7. Rejected doctor account.
8. Upload failure.
9. AI failure.
10. Blockchain pending.
11. Blockchain failed.
12. Integrity mismatch.

## Acceptance Criteria

Sprint 1 passes only if:

1. Users authenticate with Supabase Google OAuth.
2. Admin role is restricted to allowlisted emails.
3. Patient, Doctor, and Medical Admin role boundaries work through UI, backend checks, and RLS.
4. Pending/rejected doctors cannot access doctor features.
5. Approved doctors get QR Code and 6-digit access code.
6. Doctor Access Code rate limiting works.
7. Patients can grant, replace, expire, and revoke access.
8. Access grants use boolean scope flags.
9. Doctors cannot free-search patients.
10. Doctors see only authorized Scope 1/Scope 2 categories.
11. Attachment preview/download policy works.
12. Health fields and file bytes are encrypted before persistence.
13. No plaintext health content appears in database, logs, or blockchain payloads.
14. Patient AI chat stores encrypted messages.
15. Final extraction writes encrypted Scope 2 rows traceable to session and raw quote.
16. Emergency flags store encrypted marker and show safe non-diagnostic guidance.
17. Doctor RAG uses only authorized Scope 2 SQL retrieval and includes disclaimer.
18. Scope 1 records are append-only and amendments are linked.
19. Audit logs are written for required sensitive actions.
20. Patient access history exposes patient-relevant audit events.
21. Admin cannot access patient medical data.
22. Blockchain tx status exists for records, grants, and audit events.
23. Verify button can show pass/fail/pending for proof checks.
24. Future-scope items are not implemented.

## Validation Checklist

Use exact commands once scripts exist. Until then, implementation must add equivalent scripts.

- [ ] Install dependencies with `pnpm install`.
- [ ] Run TypeScript check: `pnpm typecheck`.
- [ ] Run lint: `pnpm lint`.
- [ ] Run unit tests: `pnpm test`.
- [ ] Run build: `pnpm build`.
- [ ] Run SQL migration verification against local/staging Supabase.
- [ ] Verify RLS with Patient, approved Doctor, pending Doctor, rejected Doctor, Medical Admin, and anonymous sessions.
- [ ] Verify no plaintext health content appears in database rows after creating AI sessions and Scope 1 records.
- [ ] Verify encrypted file bytes are unreadable directly from storage.
- [ ] Verify Doctor Access Code rate limit and generic errors.
- [ ] Verify access expiry/revocation blocks doctor data requests.
- [ ] Verify blockchain pending/failed/confirmed states plus Verify mismatch state.
- [ ] Manually test patient full flow.
- [ ] Manually test doctor full flow.
- [ ] Manually test admin full flow.
- [ ] Confirm no non-scope features were added.

## Risks And Required Handling

| Risk | Required Handling |
|---|---|
| Full Draft Scope is large for one sprint | Use development order; do not sacrifice auth/RLS/encryption/audit for polish. |
| App-level encryption reduces SQL analytics | Retrieve by operational metadata, decrypt after authorization, compute trends in backend. |
| Unlimited custom expiry may weaken privacy | Require finite expiry and show warning over 30 days. |
| External AI processes decrypted health text | Use explicit AI consent and demo/test data only. |
| Polygon Amoy may be slow or unreliable | Save off-chain first, mark proof pending/failed, retry safely. |
| 6-digit doctor codes are brute-forceable | Apply strict rate limits, generic errors, failed lookup logging. |
| Service role can bypass RLS | Restrict to server-only jobs and enforce role/business checks in code. |
| Medical/legal claims may overreach | Keep competition MVP and non-medical-advice disclaimers visible. |

## Decisions Log

| Decision | Final Choice |
|---|---|
| Sprint shape | Full Sprint 1 scope normalized into `overview.md` plus vertical feature specs |
| Final doc shape | `overview.md` active contract, numbered specs for implementation, `Draft.md` as detailed source context |
| Auth | Supabase Auth Google |
| Admin bootstrap | Email allowlist |
| DB access | Supabase JS + SQL migrations |
| ORM | No Prisma in Sprint 1 |
| Frontend | Next.js 16 + pnpm + TypeScript |
| AI model | DeepSeek |
| RAG | Explicit SQL retrieval, no vector DB/LlamaIndex |
| Encryption | AES-256-GCM for all health fields and files |
| Plaintext boundary | Operational metadata only |
| Key management | Vercel env master key plus `key_version` |
| File storage | Encrypted bytes in private Supabase buckets |
| Access scopes | Boolean flags |
| Grant duplicates | Replace prior active grant |
| Access duration | Finite expiry required, no max cap |
| Doctor code | 6-digit numeric, strict rate limit |
| Scope 1 records | Append-only with amendments |
| Blockchain hashing | HMAC IDs plus canonical encrypted payload/event hash |
| Blockchain signer | Server relayer wallet |
| Blockchain failure | Save first, pending retry |
| Proof UI | Status/hash plus Verify button |
| Emergency | Flag plus safe guidance, no dispatch/alert |
| Deletion | Out of scope; revoke only |
| UI language | Indonesian |
| Compliance stance | Competition MVP, demo/test data only |

## Implementation Report Format

Every implementation task must end with:

```markdown
## Summary
- ...

## Changed Files
- `path/to/file`: reason

## Validation
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Manual QA completed

## Assumptions
- ...

## Risks / Notes
- ...

## Out Of Scope Not Touched
- ...
```
