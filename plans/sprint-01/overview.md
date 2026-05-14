# MedProof Sprint 1 Overview

## Sprint Title

Sprint 1 - Competition MVP Foundation

## Sprint Goal

Build MedProof as a secure web competition MVP for demo/test data only. Sprint 1 must prove patient-controlled doctor access, AI-assisted patient journaling, and tamper-evident proof without storing plaintext medical content on-chain.

## Sprint Scope

- Next.js 16 App Router app with TypeScript, pnpm, Tailwind CSS, shadcn/ui, Supabase JS, `@supabase/ssr`, Vercel AI SDK, DeepSeek, Resend, Hardhat, viem, and Polygon Amoy.
- Supabase Google OAuth for Patient, Doctor, and Medical Admin roles.
- Medical Admin allowlist and manual doctor KYC review for STR, SIP, and KTP documents, with optional manual KKI cross-check outside MedProof.
- Patient AI onboarding, AI processing consent, chat sessions, encrypted messages, final Scope 2 extraction, emergency flags, and encrypted summaries.
- Patient access management through Doctor QR Code or 6-digit Doctor Access Code, with boolean scope flags, finite expiry, replacement, revocation, and access history.
- Doctor temporary patient data view, Scope 1 append-only record creation, encrypted attachments, and text Doctor RAG over authorized Scope 2 data.
- Supabase SQL migrations, RLS policies, private storage buckets, explicit Data API grants where tables are intentionally reachable, and validation for anonymous, Patient, approved Doctor, pending Doctor, rejected Doctor, and Medical Admin sessions.
- Blockchain proof for Scope 1 records, access-grant consent events, and audit events using privacy-preserving hashes only. Proof hashes are computed before off-chain insert/update and saved with `blockchain_status = 'pending'`. AI processing consent is persisted as an audit event and does not create an access-grant consent proof.

## Sprint Non-Scope

Do not implement:

- Production clinical deployment, production patient data, or national EMR certification.
- SATUSEHAT, KKI API automation, emergency dispatch, SOS, break-glass access, or automatic doctor/admin alerting.
- Mobile apps, patient/doctor wallets, zero-knowledge/client-side encryption, vector DB, embeddings, LlamaIndex, FHIR export, predictive insights, web push, NFC cards, account deletion, retention automation, or doctor-initiated access extension.
- AI diagnosis, automated treatment recommendation, AI chart generation, or advanced chart function calling.
- Broad UI redesign outside required application screens.

## Sprint Assumptions

- Repository docs stay in English; user-facing UI copy and AI responses stay Indonesian.
- No app scaffold exists at planning time, so exact app folders and scripts are finalized during scaffold and reported after implementation.
- `plans/sprint-01/Draft.md` remains detailed source context. This `overview.md` is the active Sprint 1 contract.
- Supabase table exposure behavior must be handled explicitly: RLS alone controls rows, while Data API reachability may require explicit grants/settings for intended client-accessed tables.
- App-level encryption limits direct SQL analytics over health content; implementation queries operational metadata, decrypts after authorization, and computes trends server-side.
- Medical Admin may manually cross-check STR/SIP/KTP against official KKI sources outside MedProof. This is optional review support, not KKI API automation.
- Patient AI processing consent is persisted as an `audit_logs` event with `action = 'ai_processing_consent_accepted'` before AI chat starts.
- Audit actions and `access_status` values must use the shared taxonomy defined in Features 02 and 06, including AI consent acceptance, grant lifecycle, doctor view allowed/denied, Scope 1 create/amend, RAG request, admin approval/rejection, KYC email notification failure, failed Doctor Access Code lookup, and blockchain verification mismatch.

## Feature List

Read feature specs in this order:

1. `01-foundation-auth-admin.md` - scaffold, env validation, Supabase SSR auth, role resolution, admin allowlist, doctor KYC.
2. `02-supabase-data-rls-storage.md` - schema, RLS, Data API exposure, private storage, encryption field model.
3. `03-patient-ai-journaling.md` - patient onboarding, consent, AI chat, messages, final Scope 2 extraction, summaries.
4. `04-patient-doctor-access.md` - QR/code lookup, grant replacement, expiry, revoke, access history.
5. `05-doctor-records-rag.md` - doctor temporary view, Scope 1 records, attachments, Doctor RAG.
6. `06-audit-blockchain-proof.md` - audit logs, hash payloads, relayer, Amoy contract, retry, verify.
7. `07-ui-validation.md` - required screens, states, Indonesian copy, validation matrix, manual QA.

## Priority Order

1. Security boundaries: auth, role resolution, RLS, service-role restrictions, encryption, and safe logging.
2. Data durability and traceability: schema, storage metadata, AI messages, extraction provenance, audit logs.
3. Consent and authorization: grants, expiry, revoke, scope checks, attachment policy, denied access audit.
4. Doctor and patient workflows: dashboards, temporary views, Scope 1 input, Doctor RAG.
5. Blockchain proof and user-facing status.
6. UI polish after required states and validation pass.

## Development Order

1. Scaffold app and baseline tooling.
2. Add environment validation and Supabase SSR client utilities.
3. Create SQL migrations, RLS policies, private buckets, explicit Data API grants for intended tables, and RLS/advisor checks.
4. Implement crypto utilities, canonical JSON, HMAC hashing, file encryption, and safe logging.
5. Implement role resolution, admin allowlist, KYC document upload, and admin review.
6. Implement patient onboarding, AI consent, AI chat shell, message storage, final extraction, Scope 2 writes, and summaries.
7. Implement doctor lookup, grant create/replace/revoke, access expiry, access history, and Doctor Access Code rate limits: 10 failed attempts per rolling 15 minutes and 20 failed attempts per rolling 24 hours per authenticated user plus IP.
8. Implement doctor data view, encrypted attachment preview/download policy, Scope 1 append-only records, and Doctor RAG.
9. Implement audit events, smart contract, relayer jobs, blockchain retry, status, and verification.
10. Add required UI states, run validation, and report changed files, assumptions, risks, and out-of-scope items not touched.

## User Flow Across Sprint

```text
Patient signs in with Google
-> accepts AI processing consent
-> completes AI profiling
-> chats with AI in Indonesian
-> session messages are encrypted
-> final extraction writes Scope 2 rows
-> patient finds approved doctor by QR/code
-> patient grants finite scoped access
-> doctor views only authorized data while grant is active
-> doctor adds append-only Scope 1 record when Scope 1 is granted
-> Doctor RAG answers from authorized Scope 2 data only
-> audit/proof status appears in patient and doctor views
```

## ERD/Data Model Summary

Core tables:

- `patients`, `doctors`, `medical_admins`
- `secure_files`, `doctor_kyc_documents`
- `ai_sessions`, `ai_messages`
- `scope_2_mental`, `scope_2_physical`
- `scope_1_medical_records`
- `access_grants`
- `audit_logs`

Required model rules:

- Domain role tables map to `auth.users.id` through `auth_user_id`; no domain password or OTP secrets.
- Health content uses AES-256-GCM triplets: `<field>_ciphertext`, `<field>_iv`, `<field>_tag`, plus `key_version`.
- Scope 2 canonical data is row-based; raw extraction JSON is encrypted supporting traceability, not primary query source.
- `access_grants` uses boolean flags: `can_view_scope1`, `can_view_scope2_mental`, `can_view_scope2_physical`, `can_download_attachments`.
- Scope 1 is append-only; corrections create rows linked by `amends_record_id`.
- Blockchain fields store hashes, tx hashes, non-sensitive error summaries, and status only.

## Architecture Notes

- Use `@supabase/ssr` for App Router SSR auth. Server code must verify users with Supabase Auth and business role checks before returning sensitive data.
- Do not rely on user-editable metadata for authorization. Store role state in domain tables and use allowlisted admin bootstrap.
- Keep service-role usage server-only and narrow. Service-role routes must still enforce authenticated user role and business checks.
- Keep security-definer helpers in a private/unexposed schema when needed for RLS performance.
- Enable RLS on exposed-schema tables and write policies with explicit `TO authenticated` where applicable.
- Since Supabase is changing table exposure behavior, migrations must include explicit grants/exposure checks for any table meant to be accessed through Supabase Data API. Private/internal tables should remain unexposed or have grants revoked.
- Use explicit SQL column selection in access-sensitive logic. Do not use `SELECT *` in production API logic.
- Blockchain write path is hash-first/save-first: compute deterministic proof hash, persist off-chain row with `pending`, retry safely, expose status.

## Milestones

1. Foundation and schema validated.
2. Auth, role, KYC, and admin review validated.
3. Patient AI journaling and Scope 2 extraction validated.
4. Grant lifecycle and access history validated.
5. Doctor data view, Scope 1 input, attachments, and RAG validated.
6. Audit and blockchain proof status validated.
7. Required UI states and end-to-end demo validated.

## Sprint Acceptance Criteria

- Google OAuth works for Patient, Doctor, and Medical Admin.
- Medical Admin is allowlisted and cannot access patient medical data.
- Pending/rejected doctors cannot access doctor features.
- Approved doctors get QR Code and 6-digit Doctor Access Code.
- Doctor code lookup is rate-limited at both 10 failed attempts per rolling 15 minutes and 20 failed attempts per rolling 24 hours per authenticated user plus IP, and returns generic errors.
- Patients can grant, replace, expire, revoke, and review doctor access.
- Doctors cannot free-search patients and can see only authorized categories.
- Health fields and file bytes are encrypted before persistence.
- No plaintext health content appears in DB rows, logs, AI prompt logs, storage, or blockchain payloads.
- Patient AI messages, Scope 2 extraction, emergency flags, and summaries are traceable to sessions.
- Doctor RAG uses authorized Scope 2 SQL retrieval only and includes Indonesian non-diagnostic disclaimer.
- Scope 1 records are append-only and amendments are linked.
- Audit logs exist for required sensitive actions.
- Database `blockchain_status` supports pending, failed, and confirmed. Verify is enabled only after transaction confirmation; before confirmation, verification is unavailable/pending. Verification mismatch is a Verify result and audit event, not a `blockchain_status` value.
- No non-scope features are implemented.

## Sprint Validation Checklist

- [ ] `pnpm install` when scaffold or deps changed.
- [ ] `pnpm typecheck`.
- [ ] `pnpm lint`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Supabase migration apply/verify against local or staging.
- [ ] Supabase advisors reviewed for security and performance.
- [ ] RLS checks for anonymous, Patient, approved Doctor, pending Doctor, rejected Doctor, and Medical Admin.
- [ ] Data API exposure/grants checked for intended tables and private tables.
- [ ] Encryption checks confirm DB rows and storage bytes are unreadable without app key.
- [ ] Doctor Access Code rolling 15-minute and rolling 24-hour rate limits plus generic error checks.
- [ ] Access expiry/revocation blocks doctor data requests.
- [ ] Blockchain pending/failed/confirmed checks plus Verify mismatch checks.
- [ ] Manual QA for Patient, Doctor, and Medical Admin flows.
- [ ] Confirm non-scope features were not added.

## Sprint Risks / Blockers

| Risk | Required Handling |
|---|---|
| Scope is large | Follow development order; reduce polish before security/privacy/audit/auth. |
| Supabase table exposure changes | Include explicit grants/exposure validation, not only RLS policies. |
| Service role bypasses RLS | Keep server-only, narrow, audited, and guarded by business checks. |
| External AI sees decrypted text | Require explicit consent and demo/test-data disclaimer. |
| App encryption limits SQL analytics | Query metadata, decrypt after authorization, compute trends server-side. |
| Polygon Amoy fails or slows | Save off-chain first; mark pending/failed; retry safely. |
| 6-digit doctor codes are brute-forceable | Rate-limit 10 failed attempts per rolling 15 minutes and 20 failed attempts per rolling 24 hours by authenticated user plus IP, generic errors, audit failed lookups. |
| Medical/legal claims overreach | Keep non-diagnostic and competition MVP disclaimers visible. |

## Sprint Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-14 | `overview.md` is active Sprint 1 contract | Normalizes the detailed draft into implementation-ready repo context. |
| 2026-05-14 | Keep `Draft.md` as detailed source context | It contains source details and rationale-derived contract language useful when specs are silent. |
| 2026-05-14 | Use vertical-slice feature specs | Keeps security, data, UI, and validation tied to user workflows. |
| 2026-05-14 | Include Supabase explicit Data API exposure checks | Supabase 2026 behavior changes mean table reachability and RLS are separate concerns. |
| 2026-05-14 | Keep docs in English and UI/AI in Indonesian | Matches repo contract. |
