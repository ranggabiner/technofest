# plan.md

## Purpose

This file defines the active execution plan for this repository.

AI agents must use this file to determine current project focus, required reading order, execution order, validation expectations, and conflict resolution rules.

## Active Sprint

| Field | Value |
|---|---|
| Active sprint | Sprint 1 |
| Product | MedProof |
| Active contract | `plans/sprint-01/overview.md` |
| Status | Final for Sprint 1 implementation |
| Target use | Competition MVP with demo/test data only |
| UI and AI response language | Indonesian |
| Repository documentation language | English |
| Blockchain network | Polygon Amoy Testnet |

## Previous Sprint

No previous sprint is documented in this repository.

## Current Development Focus

Build the Sprint 1 MedProof MVP from `plans/sprint-01/overview.md` and the numbered feature specs under `plans/sprint-01/`.

Current focus includes:

1. Supabase Google OAuth registration/login for Patient, Doctor, and Medical Admin.
2. Medical Admin doctor KYC review.
3. Doctor QR Code and 6-digit Doctor Access Code.
4. Patient access grant, replacement, expiry, revocation, and access history.
5. Patient AI chat, Scope 2 extraction, emergency flagging, and session summaries.
6. Doctor temporary patient data view after active authorization.
7. Doctor Scope 1 record creation with encrypted attachments and blockchain proof status.
8. Doctor text RAG over authorized Scope 2 data using explicit SQL retrieval and DeepSeek.
9. Audit logging with patient-facing access history.
10. Blockchain hash registration, retry, and verification status.

Do not work outside this focus unless the user's latest instruction explicitly changes scope.

## Execution Order

Follow this order for Sprint 1 implementation:

1. Scaffold Next.js 16 app with pnpm, TypeScript, Tailwind, shadcn/ui, Supabase JS, Vercel AI SDK, DeepSeek config, Resend, Hardhat, and viem.
2. Add environment validation for Supabase, Google OAuth, DeepSeek, Resend, AES key, hash pepper, relayer wallet, Amoy RPC, contract address, and admin allowlist.
3. Create Supabase SQL migrations for tables, indexes, RLS policies, explicit Data API grants/exposure checks, and private storage buckets.
4. Implement crypto utilities for AES-GCM, canonical JSON, HMAC ID hashing, file encryption/decryption, and safe logging.
5. Implement Supabase Auth callbacks and session role resolution for Patient, Doctor, and Medical Admin.
6. Implement Medical Admin allowlist and doctor KYC flow.
7. Implement doctor approval/rejection, QR/code generation, Resend emails, and code rate limiting with both 10 failed lookups per rolling 15 minutes and 20 failed lookups per rolling 24 hours per authenticated user plus IP.
8. Implement patient onboarding, AI processing consent, dashboard, and AI chat shell.
9. Implement AI message storage, session lifecycle, final extraction, emergency flagging, and encrypted Scope 2 writes.
10. Implement patient access grant/replacement/revoke and access history.
11. Implement doctor temporary patient data view with scope checks and decrypted display.
12. Implement encrypted file upload, preview, and download policy.
13. Implement Scope 1 append-only record creation and amendment.
14. Implement Doctor RAG with SQL retrieval and DeepSeek response.
15. Implement audit logging and patient/admin audit UI.
16. Implement smart contract, Amoy deployment, relayer calls, pending retry, proof status, and Verify button.
17. Add loading, empty, error, unauthorized, expired, revoked, pending, failed, and Verify mismatch states.
18. Run validation checklist and report results.

Do not skip earlier security layers to build UI faster. If scope pressure appears, reduce visual polish before reducing authorization, encryption, audit, or RLS.

## Repository Context Priority

When instructions conflict, follow this order:

1. User's latest explicit instruction.
2. `plan.md`.
3. `plans/sprint-01/overview.md`.
4. Relevant numbered feature spec in `plans/sprint-01/`.
5. `plans/sprint-01/Draft.md`.
6. `plans/sprint-01/medproof_questions_answers.md`.
7. `plans/sprint-01/PRD.md`.
8. `agents.md`.
9. Existing codebase patterns.
10. General framework best practices.

## Global Implementation Rules

- Keep implementation scoped to Sprint 1.
- Do not implement Sprint 1 non-scope items.
- Do not refactor unrelated code.
- Do not add dependencies, rename files, or restructure code unless required by the active task.
- Use Supabase JS and SQL migrations. Do not use Prisma in Sprint 1.
- Use `@supabase/ssr` for Next.js App Router server-side auth once scaffolded.
- Explicitly handle Supabase Data API grants/exposure for intended client-accessed tables; do not rely on RLS alone for table reachability.
- Use explicit SQL retrieval for RAG and access checks. Do not use `SELECT *` in access-sensitive logic.
- Encrypt all health fields and file bytes before persistence.
- Never store plaintext medical content on-chain.
- Medical Admin must not access patient Scope 1, Scope 2, AI session, AI message, or patient profile data.
- Pending/rejected doctors must not access doctor features.
- Doctors must not free-search patients.
- Scope 1 records must be append-only.
- Access grants must use boolean scope flags and finite expiry.
- Blockchain writes must be save-first, pending/retry capable.

## Active Sprint Documents

| Document | Purpose | Read When |
|---|---|---|
| `plans/sprint-01/overview.md` | Active Sprint 1 implementation contract | Always before implementation |
| `plans/sprint-01/01-foundation-auth-admin.md` | Foundation, auth, role resolution, admin KYC | When working on scaffold, auth, admin, or KYC |
| `plans/sprint-01/02-supabase-data-rls-storage.md` | Supabase schema, RLS, Storage, Data API exposure, encryption model | When working on migrations, RLS, storage, DB access, or encrypted fields |
| `plans/sprint-01/03-patient-ai-journaling.md` | Patient AI onboarding, chat, messages, extraction, summaries | When working on patient AI or Scope 2 |
| `plans/sprint-01/04-patient-doctor-access.md` | QR/code lookup, grants, replacement, expiry, revoke, access history | When working on patient access control |
| `plans/sprint-01/05-doctor-records-rag.md` | Doctor temporary view, Scope 1, attachments, Doctor RAG | When working on doctor patient-data workflows |
| `plans/sprint-01/06-audit-blockchain-proof.md` | Audit logs, hashes, Amoy contract, relayer, Verify UI | When working on audit or blockchain proof |
| `plans/sprint-01/07-ui-validation.md` | Required UI screens, states, copy, and validation matrix | When working on UI or final QA |
| `plans/sprint-01/Draft.md` | Detailed Sprint 1 source context | When active contract/spec is silent or needs detail |
| `plans/sprint-01/medproof_questions_answers.md` | Rationale for design revisions | When decisions need context or contract is unclear |
| `plans/sprint-01/PRD.md` | Historical product context | Only when active contract is silent |

There is no `issues.md` for Sprint 1. If QA or implementation finds expectation gaps later, create `plans/sprint-01/issues.md` only when the user asks or when concrete sprint defects need tracking.

## Validation Expectations

Once app scaffold and scripts exist, run from `apps/web`:

- [ ] `pnpm install` when dependencies changed or scaffold is new.
- [ ] `pnpm typecheck`.
- [ ] `pnpm lint`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] `pnpm supabase:test`.
- [ ] `pnpm supabase:advisors`.
- [ ] `pnpm validate:privacy`.
- [ ] Supabase SQL migration verification.
- [ ] RLS verification for Patient, approved Doctor, pending Doctor, rejected Doctor, Medical Admin, and anonymous sessions.
- [ ] Supabase Data API grants/exposure verification for intended and private tables.
- [ ] Encryption verification for database rows and storage bytes.
- [ ] Doctor Access Code rate-limit verification for both 10 failed lookups per rolling 15 minutes and 20 failed lookups per rolling 24 hours per authenticated user plus IP.
- [ ] Access expiry/revocation verification.
- [ ] Blockchain pending/failed/confirmed verification plus Verify mismatch-state verification.
- [ ] Manual QA for Patient, Doctor, and Medical Admin primary flows.
- [ ] Confirmation that no non-scope features were added.

For documentation-only tasks before scaffold exists, validate with:

- [ ] Read changed Markdown files.
- [ ] Check required headings and links.
- [ ] Review `git diff`.
- [ ] Confirm no unrelated files were modified.

## Reporting Expectations

Every implementation task must report:

```markdown
## Summary
- ...

## Changed Files
- `path/to/file`: reason

## Validation
- [ ] command or check run

## Assumptions
- ...

## Risks / Notes
- ...

## Out Of Scope Not Touched
- ...
```

If validation cannot run, state why and list the checks that are blocked.

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-14 | Use `plans/sprint-01/overview.md` as active Sprint 1 contract | It normalizes the detailed Sprint 1 draft into an agent-ready execution contract. |
| 2026-05-14 | Keep `plans/sprint-01/Draft.md` as detailed source context | It preserves source details and rationale-derived requirements for cases where overview/specs are silent. |
| 2026-05-14 | Add numbered vertical-slice feature specs | They keep security, data, UI, and validation tied to implementable user workflows. |
| 2026-05-14 | Add explicit Supabase Data API exposure validation | Supabase table reachability and RLS row authorization are separate concerns under current Supabase behavior. |
| 2026-05-14 | Keep repository docs in English | User requested consistent English docs for AI agents. |
| 2026-05-14 | Keep UI and AI response language Indonesian | Sprint 1 contract requires Indonesian user-facing copy. |
| 2026-05-14 | Do not create speculative app folders in docs | At planning time, the repository had no app scaffold, so folder details followed implementation context. |
| 2026-05-14 | Documentation validation replaces app validation for doc-only work | Before app scaffold existed, documentation-only validation replaced app validation. |
| 2026-05-15 | Keep website requirements inside `apps/web` | Root stays limited to repository docs, `plans/`, and `apps/`; website package files, config, scripts, source, assets, contracts, and lockfile live in `apps/web`, while Supabase CLI files live in `apps/supabase/supabase`. |

## Open Questions

- Exact deployment environment variable names and hosting setup.
