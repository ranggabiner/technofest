# MedProof Deployment Setup

This repository uses GitHub Actions for validation and Supabase migrations. Vercel Git deploys the web app from `apps/web`.

## Branch To Environment Map

| Git branch | App environment | Supabase target | Vercel target |
|---|---|---|---|
| `development` | Staging | Staging Supabase project | Preview deployment scoped to `development` |
| `master` | Production | Production Supabase project | Production deployment |
| `main` | Production alias | Production Supabase project | Use if the repo is later renamed from `master` |

The local environment uses a separate local Supabase project and a separate Google OAuth client.

## Required GitHub Environments

Create GitHub Environments named `staging` and `production`. Configure production with required reviewers before deployment.

Environment variables:

```text
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

## Required Vercel Setup

Connect the Git repository to Vercel and set:

```text
Root Directory: apps/web
Production Branch: master
```

Vercel environment variables must mirror the GitHub environment values:

- Production variables use the production Supabase project, production Google OAuth client, and `https://medproof.binerlabs.com`.
- Preview variables scoped to the `development` branch use the staging Supabase project, staging Google OAuth client, and `https://staging.medproof.binerlabs.com`.

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

Configure each Supabase project dashboard with the matching Google OAuth client ID and secret. The CI workflow intentionally does not run `supabase config push` because `apps/supabase/supabase/config.toml` contains localhost settings for local development.

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
