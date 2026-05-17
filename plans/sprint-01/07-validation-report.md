# Feature 07 Validation Report

## Automated Checks

Run from `apps/web`:

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm supabase:test`
- [ ] `pnpm supabase:advisors`
- [ ] `pnpm validate:privacy`

## Supabase And Privacy Checks

- [ ] RLS verified for anonymous, Patient, approved Doctor, pending Doctor, rejected Doctor, and Medical Admin.
- [ ] Data API grants checked: `anon` has no direct table grants; `authenticated` access remains RLS-controlled.
- [ ] Remote privacy validation checked: service-role read grants exist for required validation tables, and PostgREST schema cache refresh runs after migrations.
- [ ] Plaintext database check passes after seeded demo flows.
- [ ] KYC storage bytes are encrypted and private.
- [ ] Medical attachment storage bytes are encrypted and private.
- [ ] Storage object paths do not include patient names, diagnosis, prescription, symptoms, mood, anxiety, sleep, raw quotes, or medical content.
- [ ] Doctor Access Code rate limit verified for 10 failed attempts per rolling 15 minutes.
- [ ] Doctor Access Code rate limit verified for 20 failed attempts per rolling 24 hours per authenticated user plus IP.

## Manual QA Matrix

- [ ] Anonymous user opens protected Patient, Doctor, and Admin URLs and is sent to sign-in.
- [ ] Authenticated Patient opening Doctor/Admin URLs sees forbidden state and dashboard return link.
- [ ] Authenticated Doctor opening Patient/Admin URLs sees forbidden state and dashboard return link.
- [ ] Authenticated Medical Admin opening Patient/Doctor URLs sees forbidden state and dashboard return link.
- [ ] Patient accepts AI consent, completes profiling, chats, finishes session, and sees Scope 2 summary.
- [ ] AI chat is blocked until `ai_processing_consent_accepted` audit event exists.
- [ ] Patient dashboard shows greeting, AI CTA, Scope 1 summary, Scope 2 summary, active grants, access history, and Proof indicators.
- [ ] Patient grants access with finite expiry and selected Scope 1 / Scope 2 / attachment flags.
- [ ] Patient sees strong confirmation requirement when expiry is more than 30 days away.
- [ ] Patient revokes access and doctor data requests return denied state on next request.
- [ ] Patient access history shows grant, revoke, doctor view, denied attempt, RAG, and mismatch events.
- [ ] Pending Doctor sees pending status only: no QR, code, patient list, patient data, Scope 1 form, or RAG.
- [ ] Rejected Doctor sees rejected status only: no QR, code, patient list, patient data, Scope 1 form, or RAG.
- [ ] Approved Doctor dashboard shows QR, Kode Akses Dokter, active grants, remaining access time, and no patient search.
- [ ] Doctor grant view hides panels not covered by grant flags.
- [ ] Expired, revoked, missing-scope, and not-found grant states render distinctly.
- [ ] Doctor creates Scope 1 record and optional encrypted attachment preview works while grant is active.
- [ ] Attachment download is hidden/blocked when `can_download_attachments = false`.
- [ ] Doctor RAG uses only authorized Scope 2 and displays Indonesian non-diagnostic disclaimer.
- [ ] Admin dashboard shows KYC queue, filters, retry Proof button, and no patient-data navigation.
- [ ] Admin doctor detail shows encrypted KYC document preview links, approve/reject actions, KYC audit, and Proof status.
- [ ] Upload failure, AI failure, blockchain pending, blockchain failed, and integrity mismatch states render clearly.
- [ ] Verify before confirmation shows pending/unavailable, not pass/fail.
- [ ] No all-records PDF export button, route, menu item, server action, or API endpoint exists.
- [ ] No SATUSEHAT, KKI API automation, wallets, NFC, web push, FHIR export, predictive insights, or future-scope screens were added.

## Notes

- Use demo/test data only.
- `pnpm validate:privacy` uses `MEDPROOF_PRIVACY_SENTINELS` when set. Match it to local demo inputs for strongest leakage checks.
