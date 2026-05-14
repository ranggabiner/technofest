# MedProof PRD Draft - Sprint 1

## Product Subtitle

Personal medical record and health journaling platform with AI-assisted extraction, patient-controlled consent, and blockchain-backed integrity proof.

## Document Metadata

| Field | Value |
|---|---|
| Product | MedProof |
| Document Type | PRD Draft |
| Sprint | Sprint 1 |
| Version | Draft 1.0 |
| Source Documents | `PRD.md`, `medproof_questions_answers.md` |
| Last Updated | May 2026 |
| Blockchain Network | Polygon Amoy Testnet |

## 1. Executive Summary

MedProof is a web-based personal health data platform where patients control access to their own health records and AI-generated health journal data. The platform combines three main layers:

1. AI conversational journaling, so patients can record daily mental and physical health context naturally.
2. Granular, time-limited consent, so patients decide which verified doctors may access which data and for how long.
3. Blockchain-backed integrity proof, so medical records, consent events, and audit events can be verified as tamper-proof without storing medical data on-chain.

MedProof does not use blockchain as the primary medical data store. Medical data is stored off-chain in an encrypted database. Polygon Amoy stores only hashes used to prove that records or events have not been silently changed after being registered.

**Product positioning:** MedProof is not an interoperability replacement for national health infrastructure or hospital electronic medical record systems. Sprint 1 focuses on patient-controlled access, consent verification, tamper-proof audit trails, and AI-assisted patient health journaling.

**Tagline:** Your health data. Your proof.

Product title, tagline, and short descriptions must represent both main product scopes:

1. Scope 1: tamper-proof medical records, consent, and audit trail.
2. Scope 2: AI health journaling, extraction, summaries, and doctor-facing RAG support.

## 2. Problem Statement

Sprint 1 addresses these problems:

1. Patients have limited practical control over who can access their personal medical data, which parts can be viewed, and how long access remains valid.
2. Consent for medical data access is difficult to verify in a tamper-proof way.
3. Medical data access logs are often not transparent or easily auditable by patients.
4. Doctors often need patient context beyond formal records, but patient-generated health history is usually unstructured, scattered, or unavailable during consultation.
5. Existing patient notes, symptoms, mood, sleep, and anxiety context are rarely captured in a structured format that can support trend analysis or doctor-facing retrieval.

Sprint 1 intentionally avoids claiming that MedProof fully solves national medical record interoperability or integrates all hospital, clinic, or government health data sources. MedProof can complement official systems, but it does not replace them.

## 3. Sprint 1 Goals

Sprint 1 must produce a clear MVP foundation for:

1. Patient registration, onboarding, daily AI check-in, and access management.
2. Verified doctor registration through Medical Admin review.
3. Patient-controlled doctor access using QR Code or Doctor Access Code.
4. Scope 1 medical record creation by verified doctors with blockchain hash registration.
5. Scope 2 AI-generated patient health journal extraction with traceable structured storage.
6. Doctor-facing patient data view and text-based RAG Q&A over Scope 2 data.
7. Audit logging and blockchain-backed proof for sensitive events.

## 4. Sprint 1 Non-Goals

The following are out of Sprint 1 scope:

1. Full integration with all hospitals, clinics, SATUSEHAT, or national health data systems.
2. Automatic STR verification through KKI API.
3. Emergency SOS dispatch, break-glass emergency access, or NIK-based emergency search.
4. AI diagnosis or automated medical decision-making.
5. AI chart generation or advanced function-calling charts in the doctor portal.
6. Doctor-initiated access extension requests.
7. Web push notifications.
8. Mobile applications for Android or iOS.
9. Zero-knowledge client-side encryption.
10. FHIR R4 export.
11. Predictive health insights.
12. Physical NFC Health Access Card.

Emergency flags may be detected and stored in Sprint 1 as structured risk markers, but full emergency response workflows are out of scope.

## 5. Key Concepts

### 5.1 Self-Sovereignty

Self-sovereignty means the patient is the primary owner and controller of their health data. In MedProof, this means patients control:

1. Who may access their data.
2. Which data scope may be viewed.
3. How long access remains active.
4. When access is revoked.

### 5.2 Granular Permission

Granular permission means access is not all-or-nothing. Patients can choose whether a doctor receives:

1. Scope 1 only.
2. Scope 1 and Scope 2.

Patients also choose access duration and whether the doctor may download a PDF export.

### 5.3 Tamper-Proof

Tamper-proof means the system can prove that data or sensitive activity has not been silently changed after it was recorded. MedProof does this by hashing off-chain data or events and registering those hashes on Polygon Amoy.

### 5.4 RAG AI for Doctors

RAG means Retrieval-Augmented Generation. The AI does not answer directly from model memory. It first retrieves relevant patient data from MedProof, then uses that data as context to generate an answer.

In Sprint 1, doctor RAG is limited to text Q&A over Scope 2 data. It is not a diagnosis engine.

### 5.5 Smart Contract

A smart contract is a program running on blockchain. In MedProof, the smart contract stores hashes for medical records, consent events, and audit events. It does not store patient names, diagnoses, prescriptions, symptoms, or any raw medical content.

## 6. User Roles

| Role | Description | Data Access |
|---|---|---|
| Patient | Primary owner and controller of personal health data. Registers, completes AI profiling, performs daily AI check-ins, and manages doctor access. | Full access to own data. Can grant and revoke doctor access. |
| Doctor | Medical professional verified through KYC by Medical Admin. Views patient data only after explicit patient consent. | Access only to patients who granted active, unexpired, non-revoked permission. Can add Scope 1 records while access is active. |
| Medical Admin | Internal verifier for doctor identity and legal documents. | Access only to doctor registration and verification data. No access to patient Scope 1 or Scope 2 data. |

## 7. Data Architecture and Scopes

### 7.1 Scope 1 - Verified Medical Data

Scope 1 is doctor-driven medical data.

**Source:** Verified doctors with active patient access.

**Examples:**

1. Lab results.
2. X-ray or imaging results.
3. Diagnosis notes.
4. Prescriptions.
5. Vaccination records.
6. Medical actions, procedures, injections, or surgeries.

**Rules:**

1. Patients can read Scope 1 data but cannot edit or delete records created by doctors.
2. Doctors can add new Scope 1 data for a patient while access is active.
3. Doctors cannot edit records created by other doctors.
4. Medical Admin has no access to Scope 1 data.
5. Each Scope 1 record must generate a `record_hash` and register it on Polygon Amoy.

### 7.2 Scope 2 - Patient-Generated AI Data

Scope 2 is patient-driven health data extracted by AI from daily chat sessions.

**Source:** Patient conversations with MedProof AI.

**Data categories:**

1. Mental health signals: mood, anxiety, sleep, stress, burnout, emotional triggers.
2. Physical health signals: symptoms, severity, body location, duration, emergency flags.

**Canonical storage model:** Hybrid.

1. Row-based tables are the canonical source for production query, RAG, charting, filtering, trend analysis, and audit.
2. JSONB is a supporting field for raw AI extraction, metadata, debugging, audit review, and future model improvement.
3. JSONB must not be treated as the main production source for Scope 2 retrieval.

### 7.3 Scope 2A - Mental Health Data

Table: `scope_2_mental`

One session should produce at most one mental health row when mental health signals exist.

```sql
log_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_id              UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date                DATE NOT NULL
mood_score              INT CHECK (mood_score BETWEEN 1 AND 10) NULL
anxiety_level           INT CHECK (anxiety_level BETWEEN 1 AND 10) NULL
sleep_hours             DECIMAL NULL
trigger_notes           TEXT NULL
raw_quote               TEXT NOT NULL
is_emergency_flagged    BOOLEAN DEFAULT FALSE
extraction_confidence   DECIMAL NULL
ai_model                VARCHAR(100) NULL
schema_version          VARCHAR(20) DEFAULT 'v1'
raw_extraction_jsonb    JSONB NULL
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

### 7.4 Scope 2B - Physical Symptom Data

Table: `scope_2_physical`

One session may produce multiple physical symptom rows. Each row represents one primary symptom.

```sql
log_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_id              UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date                DATE NOT NULL
symptom_type            VARCHAR NULL
severity                INT CHECK (severity BETWEEN 1 AND 10) NULL
body_location           VARCHAR NULL
duration_note           TEXT NULL
raw_quote               TEXT NOT NULL
is_emergency_flagged    BOOLEAN DEFAULT FALSE
extraction_confidence   DECIMAL NULL
ai_model                VARCHAR(100) NULL
schema_version          VARCHAR(20) DEFAULT 'v1'
raw_extraction_jsonb    JSONB NULL
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

### 7.5 Optional Scope 2 Traceability Fields

These fields are recommended when implementation capacity allows:

```sql
source_message_id   UUID NULL REFERENCES ai_messages(message_id)
raw_quote_hash      TEXT NULL
extraction_status   ENUM('draft', 'final') DEFAULT 'final'
```

For Sprint 1, `session_id` and `raw_quote` are mandatory traceability requirements even if optional fields are deferred.

### 7.6 Scope 2 Extraction Rules

1. Scope 2 is not manually filled through patient forms.
2. AI extracts Scope 2 from natural conversation.
3. AI must not invent medical facts, severity, duration, or body location.
4. Fields not mentioned by the patient remain `NULL`.
5. AI may ask natural follow-up questions if important information is medically relevant, but patients are not forced to complete every field.
6. AI must not make diagnoses.
7. Every saved Scope 2 row must be traceable to `patient_id`, `session_id`, `log_date`, and `raw_quote`.
8. Mental health and physical symptom data must be separated into their respective tables.
9. A single session may write to both Scope 2 tables.

### 7.7 Emergency Flag Handling

If AI detects emergency indicators, the relevant row must set `is_emergency_flagged = TRUE`.

Examples include:

1. Severe chest pain.
2. Severe shortness of breath.
3. Fainting.
4. Intent to self-harm.
5. Stroke-like symptoms such as facial drooping, slurred speech, or one-sided weakness.

Sprint 1 stores emergency flags and uses cautious AI responses that recommend seeking professional or emergency help where appropriate. Sprint 1 does not implement full emergency dispatch.

## 8. Database Architecture

PostgreSQL is the primary database. Supabase is the planned managed PostgreSQL provider.

### 8.1 Authentication Boundary

Authentication data must live in the authentication layer, not in domain tables.

`patients` and `medical_admins` must not store `password_hash`. Storing password hashes in domain tables duplicates sensitive auth data and violates separation of concerns.

### 8.2 Core User Tables

#### `patients`

```sql
patient_id      UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id    UUID UNIQUE NOT NULL
full_name       VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
date_of_birth   DATE
profiling_data  JSONB
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### `doctors`

```sql
doctor_id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id        UUID UNIQUE NOT NULL
full_name           VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
phone_number        VARCHAR(20)
specialization      VARCHAR(100)
account_status      ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
str_document_url    TEXT
sip_document_url    TEXT
ktp_document_url    TEXT
verified_by         UUID REFERENCES medical_admins(admin_id)
verified_at         TIMESTAMP
qr_code_token       TEXT UNIQUE
doctor_access_code  VARCHAR(20) UNIQUE
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

`qr_code_token` and `doctor_access_code` are generated only after the doctor is approved.

#### `medical_admins`

```sql
admin_id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id    UUID UNIQUE NOT NULL
full_name       VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 8.3 AI Session Tables

#### `ai_sessions`

```sql
session_id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_title           VARCHAR(255)
summary_text            TEXT
ended_at                TIMESTAMP
end_reason              ENUM('manual_end', 'inactivity_timeout', 'new_session_started')
summary_generated_at    TIMESTAMP
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

`summary_text` is generated only after a session ends. A session ends when:

1. The patient presses **Finish Check-in**.
2. No patient activity occurs for 30 minutes.
3. The patient starts a new session while the previous session has no `summary_text`.

#### `ai_messages`

```sql
message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id      UUID NOT NULL REFERENCES ai_sessions(session_id)
patient_id      UUID NOT NULL REFERENCES patients(patient_id)
sender_role     ENUM('patient', 'ai') NOT NULL
message_text    TEXT NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

`ai_messages` stores all patient and AI messages so Scope 2 extraction can be traced back to the original conversation.

### 8.4 Scope 1 Medical Records

```sql
record_id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id          UUID NOT NULL REFERENCES patients(patient_id)
doctor_id           UUID NOT NULL REFERENCES doctors(doctor_id)
record_type         ENUM('lab', 'xray', 'diagnosis', 'prescription', 'vaccine', 'action', 'note')
title               VARCHAR(255) NOT NULL
description         TEXT
attachment_url      TEXT
record_hash         TEXT NOT NULL
blockchain_tx_hash  TEXT
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 8.5 Access Grants

`access_grants` is the critical table for doctor access control.

```sql
grant_id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id          UUID NOT NULL REFERENCES patients(patient_id)
doctor_id           UUID NOT NULL REFERENCES doctors(doctor_id)
scope_granted       ENUM('scope_1_only', 'scope_1_and_2') NOT NULL
can_download        BOOLEAN DEFAULT FALSE
granted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
expires_at          TIMESTAMP NOT NULL
is_revoked          BOOLEAN DEFAULT FALSE
revoked_at          TIMESTAMP
consent_hash        TEXT
blockchain_tx_hash  TEXT
```

Access validation should use explicit column selection, not `SELECT *`.

```sql
SELECT
  grant_id,
  scope_granted,
  can_download,
  expires_at
FROM access_grants
WHERE doctor_id = :doctor_id
  AND patient_id = :patient_id
  AND expires_at > CURRENT_TIMESTAMP
  AND is_revoked = FALSE
LIMIT 1;
```

If the query returns no row, the backend must return `403 Forbidden`.

### 8.6 Audit Logs

```sql
log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
actor_id            UUID NOT NULL
actor_role          ENUM('patient', 'doctor', 'admin') NOT NULL
action              VARCHAR(100) NOT NULL
target_type         VARCHAR(50)
target_id           UUID
patient_id          UUID REFERENCES patients(patient_id)
access_status       ENUM('ALLOWED', 'DENIED') NOT NULL
reason              TEXT
ip_address          INET
audit_event_hash    TEXT
blockchain_tx_hash  TEXT
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Audit logs are required for:

1. Successful and denied doctor attempts to view patient data.
2. Patient access grants.
3. Patient access revocations.
4. Doctor Scope 1 record creation.
5. Doctor RAG AI sessions.
6. Admin doctor approval or rejection.
7. Optional failed Doctor Access Code lookups if rate-limit monitoring is implemented.

### 8.7 Query Safety Rule

Production application queries must not use `SELECT *`.

Use explicit column selection for:

1. Backend API responses.
2. Middleware access checks.
3. Frontend data retrieval.
4. RAG data retrieval.
5. Audit data shown to users or consumed by another system.

`SELECT *` is allowed only for controlled ad-hoc debugging, local development, or internal forensic audit workflows.

## 9. Patient Portal

### 9.1 Patient Registration and Login

Registration flow:

1. Patient enters full name, email, password, and password confirmation.
2. System sends OTP email verification.
3. Patient enters OTP and activates the account.
4. Patient is directed to one-time AI Profiling.

Login flow:

1. Patient logs in with email and password.
2. If required, OTP is sent to the registered email.

### 9.2 One-Time AI Profiling

AI Profiling is a short conversational onboarding flow. It should ask naturally about:

1. How the patient learned about MedProof.
2. Age and date of birth.
3. Current feelings.
4. Work, study, or main daily activities.
5. General environment and lifestyle context.
6. Known illness history, if the patient is willing to share.

AI converts responses into structured `profiling_data` on `patients`. This data is used to personalize AI tone, response style, and conversational approach.

### 9.3 Patient Dashboard

The patient dashboard shows:

1. Personal greeting and daily check-in status.
2. Streak tracker or check-in calendar.
3. Primary CTA to open AI Chat.
4. Scope 1 summary panel with recent doctor-created records.
5. Scope 2 summary panel with recent mood, symptoms, and AI journal trends.
6. Active doctor access list with remaining access time.
7. Quick access to doctor permission management.

### 9.4 Patient AI Chat

The chat interface follows a ChatGPT-like layout:

1. Left sidebar for session history.
2. Main chat area for free-form conversation.
3. AI greeting based on patient profile and recent session context.
4. Finish Check-in action to end the current session.

Backend behavior:

1. Create an `ai_sessions` row when a session starts.
2. Store each patient and AI message in `ai_messages`.
3. Run lightweight extraction during chat for emergency flag detection and contextual response support.
4. Run final extraction when the session ends.
5. Save final Scope 2 rows to `scope_2_mental` and/or `scope_2_physical`.
6. Generate `summary_text` after session end.
7. Update `ended_at`, `end_reason`, `summary_generated_at`, and `updated_at`.

### 9.5 Patient Access Control

Patients can grant doctor access through two doctor identification methods:

1. Scan Doctor QR Code.
2. Enter Doctor Access Code.

QR Code is the primary method. Doctor Access Code is the fallback for online consultations, camera problems, or failed QR scanning.

Grant access flow:

1. Patient opens Manage Doctor Access.
2. Patient chooses Scan QR Code or Enter Doctor Access Code.
3. Backend finds an approved doctor by `qr_code_token` or `doctor_access_code`.
4. System shows doctor confirmation details: name and specialization.
5. Patient selects data scope: Scope 1 only or Scope 1 and Scope 2.
6. Patient selects duration: 1 hour, 6 hours, 24 hours, 3 days, 7 days, or custom duration.
7. Patient selects whether doctor may download PDF.
8. System creates `access_grants`.
9. System generates `consent_hash`.
10. System records consent hash on Polygon Amoy.
11. System stores `blockchain_tx_hash`.
12. System logs the action in `audit_logs`.

Doctor Access Code is not a login credential and does not grant data access. It only helps the patient find a verified doctor profile before explicit consent.

### 9.6 Revoke Access

Patients can revoke doctor access before it expires.

Revoke flow:

1. Patient selects active doctor access.
2. Patient confirms revoke.
3. System sets `is_revoked = TRUE`.
4. System sets `revoked_at`.
5. System logs the action.
6. System records a consent revocation hash on Polygon Amoy.
7. Any later doctor request must return `403 Forbidden`.

## 10. Doctor Portal

### 10.1 Doctor Registration and KYC

Doctor registration collects:

1. Full name.
2. Specialization.
3. Phone number.
4. Email.
5. STR document.
6. SIP document.
7. KTP or official identity document.

After registration, `account_status = 'pending'`. Portal features remain locked until Medical Admin approval.

When approved:

1. `account_status` becomes `approved`.
2. `qr_code_token` is generated.
3. `doctor_access_code` is generated in format `MP-DR-XXXXX`.
4. Ambiguous characters such as `O`, `0`, `I`, and `1` should be avoided.
5. Approval email is sent.
6. Doctor dashboard becomes available.

Doctors with `pending` or `rejected` status must not have active QR Codes or Doctor Access Codes.

### 10.2 Doctor Dashboard

Doctor dashboard shows:

1. Doctor QR Code.
2. Doctor Access Code.
3. Active patient list where access is currently valid.
4. Remaining access time for each patient.

Doctors must not have free patient search. They can only access patients who explicitly granted access. This prevents data fishing.

### 10.3 Temporary Patient Data View

The patient data page is available only when an active grant exists.

The page must show a prominent countdown timer for remaining access.

Available content depends on `scope_granted`.

Scope 1 panel:

1. Chronological medical record timeline.
2. Record title, type, doctor, and date.
3. Attachments if available.
4. PDF download only when `can_download = TRUE`.

Scope 2 panel:

1. Visible only when `scope_granted = 'scope_1_and_2'`.
2. Daily AI journal timeline.
3. Mood, anxiety, sleep, symptoms, emergency flags, and raw quotes where appropriate.
4. Summary indicators such as recent check-in, average mood, and frequent symptoms.

When access expires or is revoked, the page locks and all patient data requests fail.

### 10.4 Doctor Input for Scope 1

Doctors can add Scope 1 records while access is active.

Input fields:

1. Record type: lab, xray, diagnosis, prescription, vaccine, action, or note.
2. Title.
3. Description.
4. Optional attachment.

Save flow:

1. Backend validates active access.
2. Record is saved to `scope_1_medical_records`.
3. `record_hash` is generated from the encrypted payload.
4. Hash is sent to Polygon Amoy smart contract.
5. `blockchain_tx_hash` is stored.
6. Action is written to `audit_logs`.

### 10.5 Doctor RAG AI

Doctors can ask questions about patient Scope 2 data while access is active and includes Scope 2.

Examples:

1. "How has the patient's anxiety changed over the last 14 days?"
2. "When did the patient first report headaches?"
3. "How often did the patient report fever in the last month?"
4. "Are there days with emergency flags?"
5. "Is there a pattern between sleep hours and nausea?"

RAG flow:

1. Doctor submits a question.
2. Backend validates active access and granted scope.
3. Backend retrieves relevant Scope 2 rows using explicit columns.
4. Retrieved data is formatted into structured context.
5. AI generates an answer based only on available patient data.
6. Response is shown with the mandatory disclaimer.
7. RAG session is logged in `audit_logs`.

Mandatory disclaimer:

```text
This information is generated from the patient's MedProof AI daily check-in summaries and is not a medical assessment or recommendation. Use it as preliminary context, not as the sole basis for diagnosis.
```

## 11. Medical Admin Portal

### 11.1 Admin Dashboard

Admin dashboard shows pending doctor registrations with:

1. Doctor name.
2. Specialization.
3. Registration date.
4. Uploaded STR, SIP, and KTP documents.
5. Filter options by date, specialization, and status.

### 11.2 Doctor Verification

Admin verification flow:

1. Admin opens doctor detail page.
2. Admin checks STR, SIP, and KTP.
3. Admin may manually cross-check STR through official KKI sources.
4. Admin approves or rejects the doctor.

Approve:

1. Set `account_status = 'approved'`.
2. Generate `qr_code_token`.
3. Generate `doctor_access_code`.
4. Send approval email.
5. Write audit log.

Reject:

1. Set `account_status = 'rejected'`.
2. Store rejection reason if supported.
3. Send rejection email.
4. Write audit log.

### 11.3 Admin Access Restriction

This is a hard rule:

Medical Admin must not access patient Scope 1 or Scope 2 data.

Enforcement layers:

1. UI: Admin portal has no patient data navigation.
2. Backend middleware: admin-token requests containing `patient_id` are rejected with `403 Forbidden`.
3. Database RLS: admin sessions cannot read `patients`, `scope_1_medical_records`, `scope_2_mental`, `scope_2_physical`, or `ai_sessions`.

## 12. Security Architecture

### 12.1 Encryption

1. AES-256-GCM is used for data at rest.
2. TLS 1.3 is used for data in transit.
3. Medical payloads are encrypted before database storage.
4. Encrypted fields must store ciphertext, IV, and authentication tag.
5. Encryption keys must not be stored in the same database as encrypted data.
6. Keys are managed through environment variables or a secret management service.

### 12.2 Access Control

Every endpoint that accesses patient data must enforce:

1. Authenticated JWT session.
2. Role validation.
3. Active access grant check for doctors.
4. `expires_at > CURRENT_TIMESTAMP`.
5. `is_revoked = FALSE`.
6. Granted scope check.
7. PostgreSQL RLS as defense in depth.

### 12.3 Rate Limiting for Doctor Access Code

Doctor Access Code lookup must be rate-limited to reduce brute force risk.

Mitigations:

1. Limit attempts per user and IP.
2. Use short but random non-ambiguous codes.
3. Show doctor name and specialization before consent.
4. Require explicit patient confirmation before access creation.
5. Optionally log failed lookup attempts in `audit_logs`.

## 13. Blockchain Layer

### 13.1 Why Polygon Amoy

Polygon Amoy is selected for Sprint 1 because it is feasible for a competition MVP, has low cost, is EVM-compatible, has accessible tooling, and provides a practical path to later Polygon mainnet migration.

### 13.2 Blockchain Principle

Blockchain stores only hashes. It must never store:

1. Patient name.
2. NIK.
3. Email.
4. Diagnosis.
5. Prescription.
6. Lab result.
7. Patient symptom.
8. Mood, anxiety, sleep, or raw quote.
9. Any plaintext medical data.

### 13.3 On-Chain Events

Record hash event:

```json
{
  "event": "HealthRecordRegistered",
  "record_id": "HR-UUID",
  "patient_hash": "SHA256(patient_id)",
  "record_hash": "SHA256(encrypted_payload)",
  "issuer_hash": "SHA256(doctor_id)",
  "version": 1,
  "created_at": 1778322600
}
```

Consent hash event:

```json
{
  "event": "ConsentGranted / ConsentRevoked",
  "consent_hash": "SHA256(grant_id + patient_id + doctor_id + scope + expires_at)",
  "patient_hash": "SHA256(patient_id)",
  "grantee_hash": "SHA256(doctor_id)",
  "scope_hash": "SHA256(scope_granted)",
  "expires_at": 1781049599,
  "created_at": 1778324400
}
```

Audit hash event:

```json
{
  "event": "AuditEventRecorded",
  "audit_event_hash": "SHA256(log_id + actor_id + action + target_id + created_at)",
  "actor_hash": "SHA256(actor_id)",
  "target_hash": "SHA256(target_id)",
  "action_hash": "SHA256(action)",
  "created_at": 1778325000
}
```

### 13.4 Smart Contract Functions

```solidity
function registerHealthRecord(
    string memory recordId,
    bytes32 patientHash,
    bytes32 recordHash,
    bytes32 issuerHash,
    uint256 version
) external;

function recordConsent(
    bytes32 consentHash,
    bytes32 patientHash,
    bytes32 granteeHash,
    bytes32 scopeHash,
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

### 13.5 Integrity Verification

Verification flow:

1. Retrieve encrypted payload from database.
2. Generate SHA-256 hash from the payload.
3. Compare generated hash with the hash registered on Polygon Amoy.
4. If hashes match, data integrity is valid.
5. If hashes differ, system shows an integrity warning.

## 14. AI Architecture

### 14.1 Patient AI

Patient AI has two roles:

1. Companion: responds empathetically and encourages natural journaling.
2. Extractor: extracts structured Scope 2 data in the background.

AI behavior rules:

1. Do not judge patients.
2. Do not force medical form completion.
3. Do not diagnose.
4. Do not invent missing fields.
5. Ask natural follow-up questions only when useful.
6. Summarize what was recorded after session completion.

### 14.2 Scope 2 Extraction Lifecycle

Sprint 1 uses a combined extraction model:

1. Store all messages in `ai_messages`.
2. Run lightweight extraction during chat for emergency flag detection and context awareness.
3. Run final extraction when the session ends.
4. Use final extraction as canonical Scope 2 data.
5. Upsert final extraction results to avoid duplicates.

Idempotency rules:

1. `scope_2_mental` should have only one row per `session_id`.
2. `scope_2_physical` can have multiple rows per `session_id`, but must not duplicate the same symptom from the same quote.
3. `source_message_id` or `raw_quote_hash` may be used for stronger duplicate prevention.

### 14.3 Doctor RAG AI

Doctor RAG AI retrieves Scope 2 data from structured rows, not by parsing JSONB blobs.

Example mental trend query:

```sql
SELECT
  log_date,
  mood_score,
  anxiety_level,
  sleep_hours,
  trigger_notes,
  raw_quote
FROM scope_2_mental
WHERE patient_id = :patient_id
  AND log_date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY log_date ASC;
```

Example symptom frequency query:

```sql
SELECT
  symptom_type,
  COUNT(*) AS total_reports,
  AVG(severity) AS avg_severity
FROM scope_2_physical
WHERE patient_id = :patient_id
  AND log_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY symptom_type
ORDER BY total_reports DESC;
```

Example emergency flag query:

```sql
SELECT
  log_date,
  symptom_type,
  severity,
  body_location,
  raw_quote
FROM scope_2_physical
WHERE patient_id = :patient_id
  AND is_emergency_flagged = TRUE
ORDER BY log_date DESC;
```

## 15. End-to-End Flows

### 15.1 Patient Flow

```text
Patient registers
-> Email OTP verification
-> One-time AI Profiling
-> Patient dashboard
-> Opens AI Chat
-> Messages stored in ai_messages
-> Lightweight extraction supports emergency/context awareness
-> Patient presses Finish Check-in, becomes inactive for 30 minutes, or starts a new session
-> Final extraction writes scope_2_mental and/or scope_2_physical
-> AI summarizer writes summary_text and session end metadata
```

Access grant:

```text
Patient opens Manage Doctor Access
-> Scans QR Code or enters Doctor Access Code
-> System shows verified doctor profile
-> Patient selects scope, duration, and download permission
-> System creates access_grants
-> System records consent hash on Polygon Amoy
-> Doctor can access data until expiry or revoke
```

Revoke:

```text
Patient selects active doctor access
-> Patient confirms revoke
-> System sets is_revoked = TRUE
-> System records audit log and consent revocation hash
-> Doctor access becomes forbidden
```

### 15.2 Doctor Flow

```text
Doctor registers
-> Uploads STR, SIP, KTP
-> account_status = pending
-> Medical Admin reviews documents
-> If approved, QR Code and Doctor Access Code are generated
-> Doctor dashboard becomes available
-> Patient grants access
-> Doctor opens patient data page
-> Middleware validates access_grants
-> Doctor views permitted Scope 1 and optionally Scope 2 data
-> Doctor may add Scope 1 record while access is active
-> Record hash is registered on Polygon Amoy
-> Doctor may ask RAG AI over Scope 2 if allowed
```

### 15.3 Medical Admin Flow

```text
Doctor registers
-> Pending registration appears in Admin dashboard
-> Admin reviews STR, SIP, and KTP
-> Admin may manually cross-check KKI source
-> Admin approves or rejects
-> Approval generates QR Code and Doctor Access Code
-> Rejection sends reason if supported
-> Audit log records decision
```

## 16. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 App Router, TailwindCSS, shadcn/ui | SSR and client components for web MVP |
| State Management | Zustand | Lightweight client state for sessions and access state |
| Chat UI | Vercel AI SDK | Streaming chat interface |
| Backend API | Next.js Route Handlers | No separate backend server for Sprint 1 |
| Database | PostgreSQL via Supabase | JSONB, RLS, managed database |
| ORM | Prisma | Type-safe database access |
| Auth | NextAuth.js / Auth.js v5 | Session and JWT auth |
| Email / OTP | Resend or SendGrid | Email OTP and notifications |
| AI Model | Claude API | Patient conversation and doctor RAG |
| RAG Orchestration | LangChain or LlamaIndex | Retrieval and prompt context composition |
| File Storage | Supabase Storage or Cloudflare R2 | Doctor documents and medical attachments |
| Encryption | AES-256-GCM and TLS 1.3 | At-rest and in-transit protection |
| Blockchain | Solidity, Hardhat, Polygon Amoy Testnet | Hash registration smart contract |
| QR Code | qrcode.js or similar | Doctor QR Code generation |
| Hosting | Vercel and Supabase | Web deployment and managed backend resources |

## 17. Sprint 1 Feature Scope

| No | Feature | Portal / Layer | Sprint 1 Status |
|---|---|---|---|
| 1 | Patient registration and login with email OTP | Patient | In scope |
| 2 | One-time AI Profiling | Patient | In scope |
| 3 | Patient dashboard | Patient | In scope |
| 4 | Patient AI Chat with Scope 2 extraction | Patient / AI | In scope |
| 5 | Doctor registration and KYC with STR, SIP, KTP | Doctor | In scope |
| 6 | Medical Admin doctor approval workflow | Admin | In scope |
| 7 | Doctor QR Code and Doctor Access Code | Doctor | In scope |
| 8 | Access grant system with timer, scope, and download permission | Patient / Doctor | In scope |
| 9 | Doctor patient data view for Scope 1 and permitted Scope 2 | Doctor | In scope |
| 10 | Doctor Scope 1 input with blockchain record hash | Doctor / Blockchain | In scope |
| 11 | Patient manual revoke access | Patient | In scope |
| 12 | Doctor RAG AI text Q&A over Scope 2 | Doctor / AI | In scope |
| 13 | Blockchain layer for record, consent, and audit hashes | System | In scope |
| 14 | Audit logging for sensitive activity | System | In scope |
| 15 | `ai_messages` traceability and AI session summary metadata | System / AI | In scope |

## 18. Future Scope

| Feature | Target Phase |
|---|---|
| Emergency SOS Detection workflow | Phase 2 |
| Health Access Card with NFC and physical QR | Phase 2 |
| Break-glass emergency protocol | Phase 2 |
| AI chart generation or function-calling charts | Phase 2 |
| Doctor request for access extension | Phase 2 |
| NIK-based emergency search | Phase 2 |
| Web push notifications | Phase 2 |
| Mobile app for Android and iOS | Phase 3 |
| Zero-knowledge client-side encryption | Phase 3 |
| SATUSEHAT API integration | Phase 4 |
| KKI API integration for automatic STR verification | Phase 4 |
| Predictive health insight AI | Phase 4 |
| FHIR R4 export | Phase 5 |

## 19. Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Patient login identifier | Email | Familiar for tech-savvy users and feasible for MVP without SMS gateway |
| Password storage | Auth layer only | Avoid duplicate sensitive data in domain tables |
| Scope 2 storage | Hybrid: row-based canonical data plus JSONB support | Supports query, RAG, charting, audit, and AI evolution |
| Scope 2 input method | AI extraction from chat | Keeps patient experience natural |
| Final Scope 2 source of truth | Final extraction at session end | Reduces inconsistent partial records |
| Emergency extraction | Lightweight during conversation | Allows faster risk detection without making drafts canonical |
| Doctor verification | Manual Medical Admin review | Feasible for Sprint 1 and avoids KKI API dependency |
| Doctor lookup | QR Code primary, Doctor Access Code fallback | Supports both in-person and remote consultations |
| Blockchain network | Polygon Amoy Testnet | Low cost, EVM-compatible, suitable for competition MVP |
| On-chain data | Hashes only | Protects medical privacy and supports integrity proof |
| RAG AI scope | Text Q&A over Scope 2 only | Feasible and avoids unsupported diagnosis behavior |
| Access control | UI, middleware, and PostgreSQL RLS | Defense in depth |
| Encryption | Server-side AES-256-GCM | Practical Sprint 1 baseline before future zero-knowledge encryption |
| Query style | Explicit columns, no production `SELECT *` | Least privilege, better performance, lower accidental exposure risk |

## 20. Compliance and Regulatory Notes

MedProof Sprint 1 is designed with awareness of Indonesian health and privacy requirements.

Relevant principles:

1. Health data is sensitive personal data under Indonesia's Personal Data Protection Law.
2. Explicit consent, limited scope, limited duration, and revocation support privacy-by-design.
3. Electronic medical record principles require confidentiality, integrity, and availability.
4. Encryption supports confidentiality.
5. Blockchain hash verification supports integrity.
6. Cloud database and storage support availability when configured correctly.

Important disclaimer:

MedProof Sprint 1 does not claim to be a fully certified national Electronic Medical Record system and does not claim full SATUSEHAT integration. It is a consent-controlled personal health data and proof-of-integrity platform that complements, but does not replace, official medical record systems.

## 21. Sprint 1 Acceptance Criteria

Sprint 1 planning and implementation should satisfy:

1. Patients can register, verify email, complete AI Profiling, and access the dashboard.
2. Patients can chat naturally with AI and end a check-in session.
3. Chat messages are stored in `ai_messages`.
4. Ended chat sessions generate `summary_text` and session end metadata.
5. Scope 2 extraction writes structured rows without inventing missing fields.
6. Scope 2 records are traceable through `session_id` and `raw_quote`.
7. Verified doctors can be approved manually by Medical Admin using STR, SIP, and KTP.
8. Approved doctors receive QR Code and Doctor Access Code.
9. Patients can grant access by QR Code or Doctor Access Code.
10. Patients can choose scope, duration, and download permission.
11. Access expires automatically by `expires_at`.
12. Patients can revoke access manually.
13. Doctors cannot freely search patients.
14. Doctors can view only data allowed by active access grants.
15. Doctors can add Scope 1 records only while access is active.
16. Scope 1 records generate hashes and blockchain transaction references.
17. Consent and audit events generate hashes and blockchain transaction references.
18. Doctor RAG AI answers only from permitted Scope 2 data and includes the required disclaimer.
19. Medical Admin cannot access patient medical data.
20. Production queries use explicit columns instead of `SELECT *`.

## 22. Validation Checklist for AI Agents and Developers

Before using this draft as Sprint 1 implementation context, confirm:

1. `Draft.md` is treated as the Sprint 1 PRD draft, not a final sprint implementation contract.
2. Sprint 1 scope maps to the MVP feature list in this document.
3. Future scope items are not implemented unless a later sprint document explicitly moves them into scope.
4. `medproof_questions_answers.md` decisions take priority over conflicting `PRD.md` content.
5. Scope 2 uses hybrid storage, not full JSONB as the canonical model.
6. Authentication data is separated from domain tables.
7. Doctor Access Code is implemented only as a lookup fallback, not a permission mechanism.
8. Blockchain stores only hashes.
9. RAG AI does not diagnose.
10. Medical Admin has no patient data access.
