# Patient Record Attachment Preview Modal Design

## Context

The `apps/web` patient route `/patient/health-history/records` already renders a server-side Scope 1 record timeline with encrypted record fields, localized copy, and proof status. Each record with an attachment currently displays `Lihat lampiran` as static text.

The Stitch reference screen `MedProof - Preview Hasil Lab (Modal)` is used only for modal structure and behavior: overlay modal, filename header, large preview region, close control, and footer actions.

## Design

Use the current MedProof patient portal style rather than copying Stitch visual styling. The modal will reuse existing rounded card surfaces, border tokens, muted overlay, `Button`, lucide icons, and current spacing scale.

The record attachment row becomes interactive only when `attachmentFileId` exists. Clicking `Lihat lampiran` opens a client-side modal:

- Header: file icon, filename, MIME/size metadata, close icon button.
- Body: scrollable preview region sized for desktop and mobile.
- Preview content:
  - PDF attachments render in an `iframe`.
  - JPG/PNG attachments render in an `img`.
  - unsupported or missing MIME renders localized fallback.
  - failed route response renders localized error.
- Footer: `Tutup` and `Unduh Dokumen`.
- Close behavior: close icon, footer close button, overlay click, and Escape, matching existing patient modal behavior.

## Data Flow

Add patient-owned guarded attachment routes:

- `GET /api/patient/health-history/records/[recordId]/attachments/[fileId]/preview`
- `GET /api/patient/health-history/records/[recordId]/attachments/[fileId]/download`

Each route resolves the current Supabase user through existing server auth, requires patient role, verifies the record belongs to that patient and points to the requested attachment, then decrypts the stored file bytes server-side. The preview route returns inline content, while the download route returns attachment content disposition.

No client receives encrypted storage paths, service role keys, or decrypted bytes except through these guarded routes.

## Error Handling

The modal handles:

- record has no attachment metadata.
- preview MIME is unsupported.
- image preview load fails.
- PDF iframe route returns an error or cannot render in-browser.
- patient route returns unauthorized, forbidden, or not found.

All visible messages use `dictionary.id` and `dictionary.en` under `patient.healthHistory.recordsDetail`.

## Tests And Validation

Update focused UI/source tests for:

- `Lihat lampiran` uses a client modal component, not static text.
- modal has dialog semantics, Escape handling, overlay click handling, close button, preview area, and download action.
- localized Indonesian and English strings exist for title/action/error states.
- patient guarded preview/download routes exist and use patient auth.

Run from `apps/web`:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Non-Scope

- No sidebar/navigation styling changes.
- No all-records PDF export.
- No new dependencies.
- No change to doctor grant preview/download policy.
- No storage schema or RLS migration changes.
