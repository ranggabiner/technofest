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
cp .env.example .env.local
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

The Supabase wrapper scripts run the CLI against `../supabase/supabase` from this app folder. This repo uses local Supabase ports `55321` through `55329` to avoid collisions with other projects using the CLI defaults.

Generate `ENCRYPTION_MASTER_KEY` with:

```bash
openssl rand -base64 32
```

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

Use demo/test data only. MedProof Sprint 1 is not a production clinical system.
