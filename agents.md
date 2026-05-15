# agents.md

## Purpose

This file defines working rules for AI agents in this repository.

Treat this file, `plan.md`, and active sprint documents as implementation contracts. Keep changes small, scoped, validated, and aligned with the MedProof Sprint 1 contract.

## Project Context

- Project name: MedProof
- Product type: Web-based personal medical record and health journaling platform
- Current stage: Sprint 1 competition MVP planning and implementation
- Target use: Demo/test data only, not production clinical deployment
- Primary users: Patient, Doctor, Medical Admin
- Core claims:
  - Patient-controlled, time-limited, granular doctor access
  - AI-assisted patient health journaling and doctor-facing Q&A over patient-generated data
  - Tamper-evident integrity proof for records, consent events, and audit events

MedProof stores health data off-chain. Polygon Amoy stores privacy-preserving hashes only. Do not store patient names, diagnoses, prescriptions, symptoms, mood, anxiety, sleep data, raw quotes, or plaintext medical content on-chain.

## Tech Stack

| Layer | Sprint 1 Decision |
|---|---|
| Frontend | Next.js 16 App Router, TypeScript, pnpm |
| Styling/UI | Tailwind CSS, shadcn/ui |
| Auth | Supabase Auth with Google OAuth |
| Database | Supabase PostgreSQL with SQL migrations and RLS |
| DB Client | Supabase JS |
| State | Zustand only where shared state is needed |
| Chat | Vercel AI SDK |
| AI Model | DeepSeek |
| RAG | Explicit SQL retrieval plus LLM response |
| File Storage | Supabase Storage private buckets |
| Email | Resend for KYC approval/rejection notification |
| Encryption | Server-side AES-256-GCM |
| Blockchain | Solidity, Hardhat, viem, Polygon Amoy |
| Hosting | Vercel + Supabase |

Do not use Prisma, LlamaIndex, embeddings, vector DB, user wallets, or client-side/zero-knowledge encryption in Sprint 1.

## Repository Structure

Current repository structure keeps root focused on repository context and app folders:

```text
agents.md
plan.md
plans/
  sprint-01/
    overview.md
    01-foundation-auth-admin.md
    02-supabase-data-rls-storage.md
    03-patient-ai-journaling.md
    04-patient-doctor-access.md
    05-doctor-records-rag.md
    06-audit-blockchain-proof.md
    07-ui-validation.md
    Draft.md
    PRD.md
    medproof_questions_answers.md
apps/
  web/
    src/
    public/
    contracts/
    scripts/
    package.json
    pnpm-lock.yaml
  supabase/
    supabase/
      config.toml
      migrations/
      tests/
```

Important document roles:

- `plans/sprint-01/overview.md`: active Sprint 1 implementation contract.
- `plans/sprint-01/01-foundation-auth-admin.md` through `07-ui-validation.md`: vertical-slice Sprint 1 feature specs.
- `plans/sprint-01/Draft.md`: detailed source context for Sprint 1. Use when `overview.md` or a feature spec is silent.
- `plans/sprint-01/medproof_questions_answers.md`: decision rationale and design refinements.
- `plans/sprint-01/PRD.md`: historical product context. Use only when active contract is silent.

Application code, website dependencies, website config, package scripts, and the pnpm lockfile live in `apps/web`. Supabase CLI configuration, migrations, and pgTAP tests live in `apps/supabase/supabase`. The repository root should stay limited to `agents.md`, `plan.md`, `plans/`, and `apps/` plus repository metadata such as `.git` and `.gitignore`.

## Required Reading Order

Before editing implementation code, read:

1. User's latest instruction.
2. `plan.md`.
3. `agents.md`.
4. `plans/sprint-01/overview.md`.
5. Relevant numbered feature spec in `plans/sprint-01/`.
6. `plans/sprint-01/Draft.md` for detailed source context.
7. `plans/sprint-01/medproof_questions_answers.md` for rationale.
8. `plans/sprint-01/PRD.md` only for historical context.
9. Existing source files affected by the task, once app code exists.

## Architecture Rules

- Implement Sprint 1 as a secure competition MVP, not a production clinical system.
- Do not skip auth, RLS, encryption, audit, or authorization layers to build UI faster.
- Use Supabase Auth Google OAuth for all roles.
- Use `@supabase/ssr` for Next.js App Router server-side auth in `apps/web`.
- Use SQL migrations and Supabase RLS for tables containing user, grant, audit, session, record, extraction, and file metadata.
- Explicitly handle Supabase Data API exposure/grants for tables intended to be reachable through Supabase clients. RLS controls rows; grants/exposure control table reachability.
- Use service role only in controlled server-side operations, and still enforce authenticated role and business checks.
- Store health fields and uploaded file bytes encrypted before persistence.
- Keep operational metadata plaintext only when required for routing, status, lookup, or proof.
- Use append-only Scope 1 records; corrections create amendments.
- Use boolean grant flags for Scope 1, Scope 2 mental, Scope 2 physical, and attachment downloads.
- Use explicit SQL retrieval for Doctor RAG. Do not use `SELECT *` in access-sensitive logic.
- Save off-chain records first, mark blockchain status `pending`, and retry blockchain writes safely.

## UI Rules

- Use Indonesian for UI copy and AI responses.
- All app-controlled user-facing UI text must support Indonesian and English localization. Do not hardcode visible copy directly in UI components; use the existing localization/i18n structure for pages, components, buttons, labels, placeholders, empty states, error messages, success messages, validation messages, dialogs, sheets, tooltips, and navigation text. Provide natural, context-aware `id` and `en` translations for every user-facing string, with Indonesian as the primary/default language unless an active project contract explicitly changes the default.
- Build application screens directly, not a marketing landing page.
- Use restrained dashboard/product UI, not decorative landing-page styling.
- Use existing shadcn/ui and Tailwind patterns once scaffold exists.
- Every clickable UI element must visually use the pointer cursor. Buttons, links, clickable cards, icon controls, tabs, dropdown triggers, menu items, and custom interactive elements must show `cursor: pointer`; disabled or inactive controls must keep an appropriate disabled cursor/state instead.
- Required states include loading, empty, unauthorized, expired access, revoked access, pending doctor approval, rejected doctor account, upload failure, AI failure, blockchain pending, blockchain failed, and integrity mismatch.
- Do not redesign unrelated screens or add future-scope screens.

## Code Style

- Use TypeScript for application code.
- Prefer server-side validation for sensitive operations.
- Keep modules small and role boundaries clear.
- Use descriptive names that match the Sprint 1 contract.
- Avoid logging plaintext health fields, decrypted payloads, raw AI prompts, or decrypted files.
- Validate AI outputs before encryption because encrypted fields cannot rely on database checks.
- Keep comments rare and useful. Explain non-obvious security or crypto decisions.

## Folder And Package Convention

- Keep root documentation at repository root using lowercase filenames: `agents.md` and `plan.md`.
- Keep sprint planning under `plans/sprint-01/`.
- Keep all website requirements under `apps/web`, including `package.json`, `pnpm-lock.yaml`, app config, scripts, source, public assets, and blockchain files used by the web app.
- Keep SQL migrations and Supabase tests under `apps/supabase/supabase`.
- Keep blockchain contracts and deployment scripts under `apps/web/contracts` and `apps/web/scripts`.
- Do not rename existing planning files unless the user explicitly requests it.

## Dependency Rules

- Do not add dependencies unless required by `plans/sprint-01/overview.md`, a relevant numbered feature spec, or the user's task.
- Prefer the stack listed in this file and the active Sprint 1 contract.
- If a dependency is needed, explain why existing stack cannot cover the requirement.
- Do not add broad frameworks for future-scope features.

## Data And Storage Rules

- Store all health data off-chain in Supabase PostgreSQL or encrypted Supabase Storage objects.
- Store only privacy-preserving hashes on Polygon Amoy.
- Use AES-256-GCM for health fields and file bytes.
- Store the master encryption key only in server environment variables.
- Include `key_version` for encrypted rows.
- Use HMAC with server-held pepper for pseudonymous on-chain IDs.
- Do not implement deletion or retention automation in Sprint 1; revoke access only.

## Testing And Validation Rules

Once scripts exist, run relevant validation from `apps/web` before final response:

- `pnpm install` when dependencies changed or scaffold is new.
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm supabase:test`
- `pnpm supabase:advisors`
- `pnpm validate:privacy`
- SQL migration verification against local or staging Supabase.
- RLS checks for Patient, approved Doctor, pending Doctor, rejected Doctor, Medical Admin, and anonymous sessions.
- Manual QA for affected Patient, Doctor, and Medical Admin flows.

If a future task removes or breaks scripts, report that validation is not available and validate documentation-only changes with file reads, link checks, and diffs.

## Documentation Standards

- Use English for repository Markdown files.
- Keep UI and AI response language requirements documented as Indonesian.
- Update docs when implementation decisions change active scope, validation commands, folder conventions, or architecture boundaries.
- Mark unclear items under `Open Questions` instead of inventing requirements.
- Do not add speculative roadmap or future-sprint content unless the user asks.

## AI Agent Behavior

AI agents must:

- Read context before editing.
- Preserve user changes in a dirty worktree.
- Keep changes scoped to the requested task.
- Follow active sprint scope and non-scope.
- Reuse existing patterns once code exists.
- Validate before claiming completion.
- Report changed files, validation, assumptions, risks, and out-of-scope items not touched.

## Implementation Rules

- Follow the development order in `plan.md`, `plans/sprint-01/overview.md`, and the relevant numbered feature spec.
- Do not implement non-scope items.
- Do not refactor unrelated code.
- Do not add dependencies, rename files, or restructure code unless required by the active task.
- Do not bypass RLS or role checks for speed.
- Do not expose decrypted health data outside authorized server flows.
- If scope pressure appears, reduce visual polish before reducing security, privacy, audit, or authorization requirements.

## Reporting Format

Every implementation task should end with:

```markdown
## Summary
- ...

## Changed Files
- `path/to/file`: reason

## Validation
- [ ] `cd apps/web && pnpm typecheck`
- [ ] `cd apps/web && pnpm lint`
- [ ] `cd apps/web && pnpm test`
- [ ] `cd apps/web && pnpm build`
- [ ] Manual QA completed

## Assumptions
- ...

## Risks / Notes
- ...

## Out Of Scope Not Touched
- ...
```

For documentation-only tasks where app validation is irrelevant or unavailable, replace unavailable commands with the actual documentation checks run.

## Conflict Resolution

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

If repository code and `plan.md` conflict, follow `plan.md` for the current task and mention the conflict in the summary.

## Do

- Do keep Sprint 1 security and privacy boundaries explicit.
- Do use row-based Scope 2 data as canonical structured data.
- Do use raw extraction JSON only as supporting traceability/debug data.
- Do write patient-facing access history for relevant grant, revoke, doctor view, denied attempt, RAG, and proof-status events.
- Do show blockchain pending, failed, confirmed, and mismatch states.
- Do preserve active sprint documents unless the task specifically changes them.

## Don't

- Do not store plaintext health content in database rows, logs, prompts logs, storage, or blockchain payloads.
- Do not allow Medical Admin access to patient medical data.
- Do not let pending or rejected doctors access doctor features.
- Do not let doctors free-search patients.
- Do not implement SATUSEHAT, KKI API verification, emergency dispatch, mobile apps, FHIR export, predictive insights, web push, NFC cards, vector DB, or LlamaIndex in Sprint 1.
- Do not create broad UI redesigns outside required screens.

## Known Risks

| Risk | Required Handling |
|---|---|
| Sprint 1 scope is large | Follow development order; keep security layers ahead of polish. |
| App-level encryption limits SQL analytics | Query operational metadata, decrypt after authorization, compute trends server-side. |
| Custom grant expiry can weaken privacy | Require finite expiry and warn when expiry is more than 30 days away. |
| External AI processes decrypted health text | Require explicit AI consent and use demo/test data only. |
| Polygon Amoy may fail or be slow | Save off-chain first, mark proof pending/failed, retry safely. |
| 6-digit doctor codes are brute-forceable | Apply strict rate limits, generic errors, and failed lookup audit logs. |
| Service role bypasses RLS | Restrict service role usage and enforce business checks in server code. |
| Medical/legal claims may overreach | Keep MVP/demo and non-medical-advice disclaimers visible. |

## Open Questions

- Exact deployment environment names and secret schema must be finalized when scaffold and hosting config are added.
