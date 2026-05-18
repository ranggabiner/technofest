import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("patient health history page", () => {
  const pagePath = new URL("./(portal)/health-history/page.tsx", import.meta.url);
  const loadingPath = new URL("./(portal)/health-history/loading.tsx", import.meta.url);
  const journalPagePath = new URL("./(portal)/health-history/journal/page.tsx", import.meta.url);
  const journalLoadingPath = new URL("./(portal)/health-history/journal/loading.tsx", import.meta.url);
  const journalClientPath = new URL(
    "./(portal)/health-history/journal/_components/journal-history-client.tsx",
    import.meta.url,
  );
  const recordsPagePath = new URL("./(portal)/health-history/records/page.tsx", import.meta.url);
  const recordsLoadingPath = new URL("./(portal)/health-history/records/loading.tsx", import.meta.url);
  const attachmentModalPath = new URL(
    "./(portal)/health-history/records/_components/attachment-preview-modal.tsx",
    import.meta.url,
  );
  const attachmentDialogPath = new URL(
    "./(portal)/health-history/records/_components/attachment-preview-dialog.tsx",
    import.meta.url,
  );
  const attachmentPreviewRoutePath = new URL(
    "../api/patient/health-history/records/[recordId]/attachments/[fileId]/preview/route.ts",
    import.meta.url,
  );
  const attachmentDownloadRoutePath = new URL(
    "../api/patient/health-history/records/[recordId]/attachments/[fileId]/download/route.ts",
    import.meta.url,
  );

  it("adds a content-only patient portal route for health history", () => {
    expect(existsSync(pagePath)).toBe(true);
    expect(existsSync(loadingPath)).toBe(true);

    const source = readFileSync(pagePath, "utf8");

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).toContain('data-health-history-page="main"');
    expect(source).toContain('data-health-history-section="overview"');
    expect(source).toContain("data-health-history-card={cardKey}");
    expect(source).toContain('cardKey="records"');
    expect(source).toContain('cardKey="journal"');
    expect(source).not.toContain("font-serif");
    expect(source).toContain("min-h-[375px]");
    expect(source).toContain("ArrowRight");
    expect(source).toContain('data-health-history-section="records"');
    expect(source).toContain('data-health-history-section="journal"');
    expect(source).toContain('href="/patient/health-history/records"');
    expect(source).toContain('href="/patient/health-history/journal"');
    expect(source).not.toContain('href="#records"');
    expect(source).not.toContain('href="/patient/chat"');
    expect(source).not.toContain("loadPatientDashboardState");
    expect(source).not.toContain("loadPatientJournalState");
    expect(source).not.toContain("SummaryMetric");
    expect(source).not.toContain("ProofStatus");
  });

  it("adds a dedicated patient journal page from the journal card", () => {
    expect(existsSync(journalPagePath)).toBe(true);
    expect(existsSync(journalLoadingPath)).toBe(true);

    const source = readFileSync(journalPagePath, "utf8");

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).toContain('data-health-history-journal-page="timeline"');
    expect(source).toContain("loadPatientHealthJournalState");
    expect(source).toContain("JournalHistoryClient");
    expect(source).toContain("copy.patient.healthHistory.journalDetail");
    expect(source).toContain('href="/patient/health-history"');
    expect(source).toContain("filter={activeFilter}");
    expect(source).toContain("EmptyState");
    expect(source).toContain("StatePanel");
    expect(source).not.toContain("Cuplikan Percakapan");
  });

  it("keeps conversation snippets inside a dismissible chat popup", () => {
    expect(existsSync(journalClientPath)).toBe(true);

    const source = readFileSync(journalClientPath, "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("JournalHistoryClient");
    expect(source).toContain('data-journal-history="items"');
    expect(source).toContain('data-journal-chat-dialog="overlay"');
    expect(source).toContain('data-journal-chat-dialog="box"');
    expect(source).toContain("copy.chatPopupTitle");
    expect(source).toContain("copy.viewChat");
    expect(source).toContain("copy.chatLoadFailed");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("onMouseDown={(event)");
    expect(source).toContain("fetch(`/api/patient/ai/sessions/${session.sessionId}`");
    expect(source).toContain("selectedSession.messages.map");
    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
  });

  it("adds a native patient portal record timeline route from the records card", () => {
    expect(existsSync(recordsPagePath)).toBe(true);
    expect(existsSync(recordsLoadingPath)).toBe(true);

    const source = readFileSync(recordsPagePath, "utf8");
    const loading = readFileSync(recordsLoadingPath, "utf8");

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).not.toContain("Budi Santoso");
    expect(source).not.toContain("sidebar-width");
    expect(source).toContain('data-health-history-records-page="timeline"');
    expect(source).toContain("loadPatientHealthHistoryRecordsState");
    expect(source).toContain("copy.patient.healthHistory.recordsDetail");
    expect(source).toContain("copy.patient.healthHistory.recordFilters");
    expect(source).toContain("ProofStatus");
    expect(source).toContain("StatusBadge");
    expect(source).toContain("attachmentFilename");
    expect(source).toContain("AttachmentPreviewControl");
    expect(source).toContain('href="/patient/health-history"');
    expect(loading).toContain("PatientHealthHistoryRecordsSkeleton");
    expect(loading).not.toContain("PatientHealthHistorySkeleton");
  });

  it("adds a guarded attachment preview modal for patient record attachments", () => {
    expect(existsSync(attachmentModalPath)).toBe(true);
    expect(existsSync(attachmentDialogPath)).toBe(true);
    expect(existsSync(attachmentPreviewRoutePath)).toBe(true);
    expect(existsSync(attachmentDownloadRoutePath)).toBe(true);

    const modal = readFileSync(attachmentModalPath, "utf8");
    const dialog = readFileSync(attachmentDialogPath, "utf8");
    const previewRoute = readFileSync(attachmentPreviewRoutePath, "utf8");
    const downloadRoute = readFileSync(attachmentDownloadRoutePath, "utf8");

    expect(modal).toContain('"use client"');
    expect(modal).toContain("AttachmentPreviewControl");
    expect(modal).toContain('import("./attachment-preview-dialog")');
    expect(modal).toContain("AttachmentPreviewDialogFallback");
    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain('event.key === "Escape"');
    expect(dialog).toContain("onMouseDown={(event)");
    expect(dialog).toContain("<iframe");
    expect(dialog).toContain("<Image");
    expect(modal).toContain("downloadUrl");
    expect(dialog).toContain("copy.attachmentModalDownload");

    expect(previewRoute).toContain("requireRole");
    expect(previewRoute).toContain("loadPatientHealthHistoryAttachment");
    expect(previewRoute).toContain("content-disposition");
    expect(previewRoute).toContain("inline");

    expect(downloadRoute).toContain("requireRole");
    expect(downloadRoute).toContain("loadPatientHealthHistoryAttachment");
    expect(downloadRoute).toContain("content-disposition");
    expect(downloadRoute).toContain("attachment");
  });

  it("localizes Stitch-derived health history copy in Indonesian and English", () => {
    const idCopy = dictionary.id.patient.healthHistory;
    const enCopy = dictionary.en.patient.healthHistory;

    expect(idCopy.title).toBe("Riwayat Kesehatan");
    expect(idCopy.description).toBe("Lihat data riwayat kesehatan mu disini.");
    expect(idCopy.recordsTitle).toBe("Rekam Medis");
    expect(idCopy.recordsCta).toBe("Lihat Rekam Medis");
    expect(idCopy.recordsDetail.title).toBe("Rekam Medis");
    expect(idCopy.recordsDetail.description).toBe(
      "Riwayat data medis terverifikasi yang diinput oleh dokter (Scope 1).",
    );
    expect(idCopy.recordsDetail.back).toBe("Kembali");
    expect(idCopy.recordsDetail.attachmentPreview).toBe("Lihat lampiran");
    expect(idCopy.recordsDetail.inputBy).toBe("Diinput oleh");
    expect(idCopy.recordsDetail.noAttachment).toBe("Tidak ada lampiran");
    expect(idCopy.recordsDetail.attachmentModalTitle).toBe("Pratinjau lampiran");
    expect(idCopy.recordsDetail.attachmentModalClose).toBe("Tutup pratinjau lampiran");
    expect(idCopy.recordsDetail.attachmentModalDownload).toBe("Unduh Dokumen");
    expect(idCopy.recordsDetail.attachmentPreviewUnavailable).toBe(
      "Lampiran ini tidak dapat dipratinjau di browser.",
    );
    expect(idCopy.recordsDetail.attachmentPreviewFailed).toBe("Pratinjau lampiran gagal dimuat.");
    expect(idCopy.recordFilters.all).toBe("Semua");
    expect(idCopy.recordFilters.lab).toBe("Hasil Lab");
    expect(idCopy.journalTitle).toBe("Jurnal Kesehatanku");
    expect(idCopy.journalCta).toBe("Lihat Jurnal");
    expect(idCopy.journalDetail.title).toBe("Jurnal Kesehatanku");
    expect(idCopy.journalDetail.description).toBe(
      "Pantau tren kesehatan harianmu berdasarkan analisis AI (Scope 2).",
    );
    expect(idCopy.journalDetail.filters.physical).toBe("Gejala Fisik");
    expect(idCopy.journalDetail.viewChat).toBe("Lihat Curhat");
    expect(idCopy.journalDetail.chatPopupTitle).toBe("Cuplikan Percakapan");
    expect(idCopy.journalDetail.chatLoading).toBe("Memuat percakapan...");
    expect(idCopy.journalDetail.noChatMessages).toBe("Belum ada pesan tersimpan untuk sesi ini.");

    expect(enCopy.title).toBe("Health History");
    expect(enCopy.description).toBe("View your health history data here.");
    expect(enCopy.recordsTitle).toBe("Medical Records");
    expect(enCopy.recordsCta).toBe("View Medical Records");
    expect(enCopy.recordsDetail.title).toBe("Medical Records");
    expect(enCopy.recordsDetail.description).toBe(
      "Verified medical data history entered by doctors (Scope 1).",
    );
    expect(enCopy.recordsDetail.back).toBe("Back");
    expect(enCopy.recordsDetail.attachmentPreview).toBe("View attachment");
    expect(enCopy.recordsDetail.inputBy).toBe("Input by");
    expect(enCopy.recordsDetail.noAttachment).toBe("No attachment");
    expect(enCopy.recordsDetail.attachmentModalTitle).toBe("Attachment preview");
    expect(enCopy.recordsDetail.attachmentModalClose).toBe("Close attachment preview");
    expect(enCopy.recordsDetail.attachmentModalDownload).toBe("Download Document");
    expect(enCopy.recordsDetail.attachmentPreviewUnavailable).toBe(
      "This attachment cannot be previewed in the browser.",
    );
    expect(enCopy.recordsDetail.attachmentPreviewFailed).toBe("Attachment preview failed to load.");
    expect(enCopy.recordFilters.all).toBe("All");
    expect(enCopy.recordFilters.lab).toBe("Lab Results");
    expect(enCopy.journalTitle).toBe("My Health Journal");
    expect(enCopy.journalCta).toBe("View Journal");
    expect(enCopy.journalDetail.title).toBe("My Health Journal");
    expect(enCopy.journalDetail.description).toBe(
      "Track your daily health trends based on AI analysis (Scope 2).",
    );
    expect(enCopy.journalDetail.filters.physical).toBe("Physical Symptoms");
    expect(enCopy.journalDetail.viewChat).toBe("View Chat");
    expect(enCopy.journalDetail.chatPopupTitle).toBe("Conversation Snippet");
    expect(enCopy.journalDetail.chatLoading).toBe("Loading conversation...");
    expect(enCopy.journalDetail.noChatMessages).toBe("No stored messages for this session yet.");
  });

  it("uses localized keys instead of hardcoded visible page copy", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("copy.patient.healthHistory.title");
    expect(source).toContain("copy.patient.healthHistory.recordsTitle");
    expect(source).toContain("copy.patient.healthHistory.journalTitle");
    expect(source).not.toContain("Riwayat Kesehatan");
    expect(source).not.toContain("Health History");
    expect(source).not.toContain("Jurnal Kesehatanku");
  });
});
