# Patient Record Attachment Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Lihat lampiran` functional on `/patient/health-history/records` with a guarded responsive preview/download modal.

**Architecture:** Keep the records page server-rendered and move only the attachment control into a small client component. Add patient-owned API routes that decrypt attachments after patient ownership checks. Reuse existing UI tokens, modal behavior from patient QR scanner, existing crypto/storage helpers, and existing dictionary structure.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, lucide-react, Supabase JS server/admin clients.

---

## File Structure

- Modify `apps/web/src/app/patient/patient-health-history-ui.test.ts`: add source tests for modal component, patient routes, and localized copy.
- Modify `apps/web/src/lib/i18n/dictionary.ts`: add Indonesian and English modal/action/error copy under `patient.healthHistory.recordsDetail`.
- Modify `apps/web/src/lib/patient/health-history.ts`: expose patient-owned attachment loading service for preview/download routes.
- Create `apps/web/src/app/api/patient/health-history/records/[recordId]/attachments/[fileId]/preview/route.ts`: guarded inline stream route.
- Create `apps/web/src/app/api/patient/health-history/records/[recordId]/attachments/[fileId]/download/route.ts`: guarded attachment route.
- Create `apps/web/src/app/patient/(portal)/health-history/records/_components/attachment-preview-modal.tsx`: client modal/control.
- Modify `apps/web/src/app/patient/(portal)/health-history/records/page.tsx`: use the modal control for records with attachments.

## Tasks

### Task 1: Add Failing UI And Route Tests

**Files:**
- Modify: `apps/web/src/app/patient/patient-health-history-ui.test.ts`

- [ ] Add tests that assert:
  - records page imports `AttachmentPreviewControl`.
  - modal component file exists and contains `role="dialog"`, `aria-modal="true"`, Escape close handling, overlay mouse-down close handling, `iframe`, `img`, and download link behavior.
  - preview/download patient route files exist and call `requireRole`.
  - dictionary copy includes `attachmentModalTitle`, `attachmentModalClose`, `attachmentModalDownload`, `attachmentPreviewUnavailable`, and `attachmentPreviewFailed` for Indonesian and English.

- [ ] Run focused test:

```bash
cd apps/web && pnpm test src/app/patient/patient-health-history-ui.test.ts
```

Expected: fails because component/routes/copy do not exist yet.

### Task 2: Add Localized Copy

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionary.ts`

- [ ] Add Indonesian copy:

```ts
attachmentModalTitle: "Pratinjau lampiran",
attachmentModalClose: "Tutup pratinjau lampiran",
attachmentModalDownload: "Unduh Dokumen",
attachmentModalCloseAction: "Tutup",
attachmentPreviewUnavailable: "Lampiran ini tidak dapat dipratinjau di browser.",
attachmentPreviewFailed: "Pratinjau lampiran gagal dimuat.",
attachmentMissing: "Data lampiran tidak tersedia.",
```

- [ ] Add English copy:

```ts
attachmentModalTitle: "Attachment preview",
attachmentModalClose: "Close attachment preview",
attachmentModalDownload: "Download Document",
attachmentModalCloseAction: "Close",
attachmentPreviewUnavailable: "This attachment cannot be previewed in the browser.",
attachmentPreviewFailed: "Attachment preview failed to load.",
attachmentMissing: "Attachment data is not available.",
```

### Task 3: Add Patient Attachment Loader

**Files:**
- Modify: `apps/web/src/lib/patient/health-history.ts`

- [ ] Add `loadPatientHealthHistoryAttachment({ role, recordId, fileId })`.

Implementation requirements:
- require `role.kind === "patient"` and `role.patientId`.
- select explicit columns from `scope_1_medical_records` joined to `secure_files`.
- filter by `record_id`, `patient_id`, and `attachment_file_id`.
- return 404-style error when missing.
- download encrypted object via admin storage.
- JSON-parse encrypted bytes and decrypt using `decryptBytes`.
- decrypt original filename using existing filename decrypt logic.
- return `{ bytes, filename, mimeType }`.

### Task 4: Add Guarded Routes

**Files:**
- Create: `apps/web/src/app/api/patient/health-history/records/[recordId]/attachments/[fileId]/preview/route.ts`
- Create: `apps/web/src/app/api/patient/health-history/records/[recordId]/attachments/[fileId]/download/route.ts`

- [ ] Both routes call `requireRole()`, then `loadPatientHealthHistoryAttachment`.
- [ ] Preview returns `content-disposition: inline`.
- [ ] Download returns `content-disposition: attachment`.
- [ ] Both return JSON error with `404` for missing attachment and `403` for wrong role.

### Task 5: Add Client Modal Control

**Files:**
- Create: `apps/web/src/app/patient/(portal)/health-history/records/_components/attachment-preview-modal.tsx`

- [ ] Export `AttachmentPreviewControl`.
- [ ] Render button styled like current record attachment row, with `Eye` icon and localized label.
- [ ] Modal opens only when record has `attachmentFileId`; otherwise show localized missing state.
- [ ] Modal behavior:
  - close icon button
  - footer close button
  - overlay `onMouseDown` close
  - Escape key close
- [ ] Preview behavior:
  - PDF -> `iframe src={previewUrl}`.
  - `image/jpeg` or `image/png` -> `img src={previewUrl}` with `onError`.
  - unsupported MIME -> localized unavailable message.
  - image error -> localized failed message.
- [ ] Footer has download `Button asChild` link to download route.

### Task 6: Wire Records Page

**Files:**
- Modify: `apps/web/src/app/patient/(portal)/health-history/records/page.tsx`

- [ ] Import `AttachmentPreviewControl`.
- [ ] Replace static `span` for `Lihat lampiran` with client control.
- [ ] Pass record ID, file ID, filename, MIME, meta string, and `detailCopy`.
- [ ] Preserve current record layout, proof status, filters, sidebar, and empty state behavior.

### Task 7: Validate

**Files:**
- No production file edits unless validation exposes defects.

- [ ] Run focused test:

```bash
cd apps/web && pnpm test src/app/patient/patient-health-history-ui.test.ts
```

- [ ] Run project validation:

```bash
cd apps/web && pnpm typecheck
cd apps/web && pnpm lint
cd apps/web && pnpm test
cd apps/web && pnpm build
```

- [ ] Inspect `git diff` to confirm no sidebar/navigation style changes and no all-records PDF export.
