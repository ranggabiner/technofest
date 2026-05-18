# MedProof CI/CD Setup

This repository separates app validation, Supabase validation, Supabase deployment, and Vercel environment variable sync. Vercel Git remains responsible for app deployments from `apps/web`.

## Branch To Environment Map

| Git branch | App environment | Supabase target | Vercel target |
|---|---|---|---|
| `development` | Staging | Staging Supabase project | Preview env scoped to `development` |
| `main` | Production | Production Supabase project | Production env |

The local environment uses a separate local Supabase project and a separate Google OAuth client.

## Workflow Responsibilities

| Workflow | Responsibility | Push/PR path trigger |
|---|---|---|
| `Code Validation` | App lint, typecheck, test, and build only | `apps/web/**`, excluding env files, `apps/web/README.md`, and the Vercel env sync script; `.github/workflows/ci.yml` |
| `Secret File Guard` | Blocks committed real `.env*` files | Real env file patterns; `.github/workflows/secret-file-guard.yml` |
| `Supabase Validation` | Local Supabase reset, pgTAP tests, local advisors, and remote privacy validation after successful Supabase deploy | `apps/supabase/**`; `.github/workflows/supabase-validation.yml`; successful `Supabase Deploy` |
| `Supabase Deploy` | Linked Supabase migration preview, apply, migration list, and PostgREST schema-cache refresh | `apps/supabase/supabase/config.toml`, `apps/supabase/supabase/migrations/**`, `.github/workflows/supabase-deploy.yml` |
| `Vercel Env Sync` | Idempotent Vercel env upsert only; no deploy | `apps/web/scripts/vercel-env-sync.mjs`, `apps/web/.env.staging.example`, `apps/web/.env.production.example`, `.github/workflows/vercel-env-sync.yml` |

`Supabase Deploy` does not run app build, lint, typecheck, tests, or Vercel commands. `Vercel Env Sync` does not deploy the app and uses Vercel's `upsert=true` API behavior so existing variables are updated instead of duplicated.

## Required GitHub Environments

Create GitHub Environments named `staging` and `production`. Configure production with required reviewers before deployment.

Environment variables:

```text
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID
RESEND_FROM_EMAIL
AMOY_RPC_URL
MEDPROOF_CONTRACT_ADDRESS
NEXT_PUBLIC_MEDPROOF_CONTRACT_ADDRESS
MEDPROOF_PRIVACY_SENTINELS
```

Environment secrets:

```text
VERCEL_TOKEN
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAIL_ALLOWLIST
ENCRYPTION_MASTER_KEY
HASH_PEPPER
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET
RESEND_API_KEY
DEEPSEEK_API_KEY
RELAYER_PRIVATE_KEY
```

Use staging values in the `staging` environment and production values in the `production` environment. Do not reuse staging Supabase credentials for production or production credentials for staging.

## Supabase Deployment

`Supabase Deploy` links the CLI to the environment's Supabase project with `SUPABASE_PROJECT_REF`, authenticated by `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`, then runs:

```bash
supabase --workdir apps/supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase --workdir apps/supabase db push --linked --dry-run
supabase --workdir apps/supabase db push --linked
supabase --workdir apps/supabase migration list --linked
```

The workflow intentionally does not run `supabase config push` because `apps/supabase/supabase/config.toml` contains localhost settings for local development.

Remote `pnpm validate:privacy` runs in `Supabase Validation` after `Supabase Deploy` succeeds. It uses `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `MEDPROOF_PRIVACY_SENTINELS` from the same GitHub Environment.

## Vercel Env Sync

`Vercel Env Sync` reads values from the active GitHub Environment and upserts them into the Vercel project identified by `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID`.

- Staging sync writes Vercel `preview` variables scoped to Git branch `development`.
- Production sync writes Vercel `production` variables.
- Secret values must come from GitHub Secrets, not repository files.
- The sync script calls the Vercel Project Env API with `upsert=true`; it does not call any deployment endpoint.

Vercel project setup:

```text
Root Directory: apps/web
Production Branch: main
```

Recommended Vercel Deployment Checks for production:

- `Web validation for production`
- `Deploy Supabase migrations to production`

This prevents production promotion until GitHub validation and production Supabase migration deployment have passed.

## Google OAuth And Supabase Auth

Use separate Google OAuth clients for local, staging, and production.

Local:

```text
App URL: http://localhost:3000
Supabase callback URL: http://127.0.0.1:55321/auth/v1/callback
```

Staging:

```text
App URL: https://staging.medproof.binerlabs.com
Supabase callback URL: https://<staging-project-ref>.supabase.co/auth/v1/callback
```

Production:

```text
App URL: https://medproof.binerlabs.com
Supabase callback URL: https://<production-project-ref>.supabase.co/auth/v1/callback
```

Configure each Supabase project dashboard with the matching Google OAuth client ID and secret.

## Local Env Files

Tracked examples:

```text
apps/web/.env.local.example
apps/web/.env.staging.example
apps/web/.env.production.example
```

For local development:

```bash
cd apps/web
cp .env.local.example .env.local
```

Fill values manually. Real `.env*` files and `env.local` are ignored and must not be committed.

## Secret Rotation Note

`apps/web/env.local` was previously tracked. Rotate any credentials that were stored there before using staging or production.
