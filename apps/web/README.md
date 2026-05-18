# MedProof

Sprint 1 competition MVP scaffold for a personal medical record and health journaling platform.

## Stack

- Next.js 16 App Router, TypeScript, pnpm
- Tailwind CSS with local shadcn-style components
- Supabase Auth, Postgres, RLS, Storage
- Server-side AES-256-GCM encryption
- Resend for doctor KYC notification attempts
- Vitest and Supabase pgTAP tests

## Local Setup

```bash
cd apps/web
corepack enable
pnpm install
cp .env.local.example .env.local
pnpm supabase:start
pnpm supabase:reset
pnpm demo:seed-auth
pnpm dev
```

The Supabase wrapper scripts run the CLI against `../supabase/supabase` from this app folder. This repo uses local Supabase ports `55321` through `55329` to avoid collisions with other projects using the CLI defaults.
Use `.env.local.example` when you want the local-only template. Staging and production examples live in `.env.staging.example` and `.env.production.example`; their real values belong in GitHub Environments and Vercel, not in the repository.

Generate `ENCRYPTION_MASTER_KEY` with:

```bash
openssl rand -base64 32
```

## Demo Seed Data

Seed locations:

- `../supabase/supabase/seed.sql`: loaded by `pnpm supabase:reset`; creates the four local email/password demo accounts, baseline Indonesian admin/doctor/patient rows, verification examples, KYC document metadata, access grants, and audit activity.
- `scripts/seed-demo-auth-users.mjs`: run with `pnpm demo:seed-auth`; upserts the same four accounts through Supabase Auth Admin API and adds richer encrypted demo data, storage objects, AI journal sessions/messages, Scope 1 records, Scope 2 extractions, doctor access history, verification data, and platform activity logs.

Run locally:

```bash
cd apps/web
pnpm supabase:start
pnpm supabase:reset
pnpm demo:seed-auth
```

`pnpm demo:seed-auth` requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a 32-byte base64 `ENCRYPTION_MASTER_KEY`. The script is repeatable: auth users, relational rows, and storage objects use deterministic IDs, upserts, or storage overwrite semantics.

Demo accounts, all with password `test123`:

| Role | Email | Name |
|---|---|---|
| Superadmin | `superadmin@test.com` | Nadia Paramitha |
| Admin | `admin@test.com` | Dewi Anggraini |
| Patient | `pasien@test.com` | Alya Pramesti |
| Doctor | `dokter@test.com` | dr. Arif Wicaksana, Sp.PD |

Role visibility after full seed:

- Patient sees Indonesian health history, encrypted AI journaling/chat history, Scope 2 mental/physical summaries, complaints, symptoms, doctor grants, revoked/expired/pending access examples, proof statuses, and audit/activity history.
- Doctor sees approved profile data, active patient grants, multiple patient summaries, reviewed records, notes, Scope 2 context for RAG, and interaction history.
- Admin sees realistic doctor verification queues, approved/rejected/pending doctors, KYC document metadata, admin invitations, user-management examples, notification failures, and operational audit logs.
- Superadmin sees the same operational surface plus broader admin/invitation state and platform-level doctors, patients, grants, verification records, and system activity.

Assumptions:

- Extra `@medproof.test` users exist only to populate demo lists, filters, search, pagination, dashboard cards, and audit history.
- No schema changes were added for seed richness; unsupported future integrations such as SATUSEHAT, KKI lookup, FHIR export, or production identity verification remain out of scope.
- SQL seed keeps local reset useful even before storage objects exist. The service-role script is the canonical rich demo seed because it encrypts health content with the active environment key and uploads encrypted storage payloads.

## Google OAuth Locally

Create a Google OAuth Web client and configure:

```text
Authorized JavaScript origins:
http://localhost:3000

Authorized redirect URIs:
http://127.0.0.1:55321/auth/v1/callback
```

Set these in `apps/web/.env.local` for the app and wrapper scripts. Supabase CLI provider configuration can also be placed in `apps/supabase/.env` or `apps/supabase/.env.local`.

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=...
```

Restart Supabase after changing OAuth values:

```bash
cd apps/web
pnpm supabase:stop
pnpm supabase:start
```

## Validation

```bash
cd apps/web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm supabase:test
pnpm supabase:advisors
pnpm validate:privacy
```

Remote `pnpm validate:privacy` uses `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_REF`, and `SUPABASE_SERVICE_ROLE_KEY` from the active environment. The URL and project ref must point to the same Supabase project.

Use demo/test data only. MedProof Sprint 1 is not a production clinical system.
