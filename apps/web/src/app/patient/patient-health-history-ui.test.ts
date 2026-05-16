import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("patient health history page", () => {
  const pagePath = new URL("./(portal)/health-history/page.tsx", import.meta.url);
  const loadingPath = new URL("./(portal)/health-history/loading.tsx", import.meta.url);
  const recordsPagePath = new URL("./(portal)/health-history/records/page.tsx", import.meta.url);
  const recordsLoadingPath = new URL("./(portal)/health-history/records/loading.tsx", import.meta.url);
  const attachmentModalPath = new URL(
    "./(portal)/health-history/records/_components/attachment-preview-modal.tsx",
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
    expect(source).toContain("font-serif");
    expect(source).toContain("min-h-[375px]");
    expect(source).toContain("ArrowRight");
    expect(source).toContain('data-health-history-section="records"');
    expect(source).toContain('data-health-history-section="journal"');
    expect(source).toContain('href="/patient/health-history/records"');
    expect(source).not.toContain('href="#records"');
    expect(source).not.toContain("loadPatientDashboardState");
    expect(source).not.toContain("loadPatientJournalState");
    expect(source).not.toContain("SummaryMetric");
    expect(source).not.toContain("ProofStatus");
  });

  it("adds a native patient portal record timeline route from the records card", () => {
    expect(existsSync(recordsPagePath)).toBe(true);
    expect(existsSync(recordsLoadingPath)).toBe(true);

    const source = readFileSync(recordsPagePath, "utf8");

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
  });

  it("adds a guarded attachment preview modal for patient record attachments", () => {
    expect(existsSync(attachmentModalPath)).toBe(true);
    expect(existsSync(attachmentPreviewRoutePath)).toBe(true);
    expect(existsSync(attachmentDownloadRoutePath)).toBe(true);

    const modal = readFileSync(attachmentModalPath, "utf8");
    const previewRoute = readFileSync(attachmentPreviewRoutePath, "utf8");
    const downloadRoute = readFileSync(attachmentDownloadRoutePath, "utf8");

    expect(modal).toContain('"use client"');
    expect(modal).toContain("AttachmentPreviewControl");
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('event.key === "Escape"');
    expect(modal).toContain("onMouseDown={(event)");
    expect(modal).toContain("<iframe");
    expect(modal).toContain("<Image");
    expect(modal).toContain("downloadUrl");
    expect(modal).toContain("copy.attachmentModalDownload");

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
