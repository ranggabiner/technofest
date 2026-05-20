import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = (path: string) => readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
const componentSource = (path: string) => readFileSync(new URL(`../components/${path}`, import.meta.url), "utf8");

describe("lazy loading performance contracts", () => {
  it("defers rare patient QR scanner UI from initial dashboard and access bundles", () => {
    const dashboardQuickAccess = appSource("patient/_components/patient-dashboard-quick-access.tsx");
    const doctorAccessClient = appSource("patient/_components/doctor-access-client.tsx");

    for (const source of [dashboardQuickAccess, doctorAccessClient]) {
      expect(source).toContain('import dynamic from "next/dynamic"');
      expect(source).toContain("dynamic(");
      expect(source).toContain("DoctorQrScannerModalFallback");
      expect(source).not.toContain('import { DoctorQrScannerModal } from "./doctor-qr-scanner-modal";');
    }
  });

  it("defers heavy chat markdown parsing until assistant markdown is rendered", () => {
    const chatClient = appSource("patient/_components/ai-journal-client.tsx");
    const journalHistoryClient = appSource(
      "patient/(portal)/health-history/journal/_components/journal-history-client.tsx",
    );

    expect(chatClient).toContain('import dynamic from "next/dynamic"');
    expect(chatClient).toContain("AssistantMarkdownFallback");
    expect(chatClient).toContain('import("./assistant-markdown")');
    expect(chatClient).not.toContain('import { AssistantMarkdown } from "./assistant-markdown";');
    expect(journalHistoryClient).toContain('import dynamic from "next/dynamic"');
    expect(journalHistoryClient).toContain("JournalAssistantMarkdownFallback");
    expect(journalHistoryClient).toContain('import("../../../../_components/assistant-markdown")');
    expect(journalHistoryClient).not.toContain(
      'import { AssistantMarkdown } from "../../../../_components/assistant-markdown";',
    );
  });

  it("defers admin review modal and patient attachment preview dialog until triggered", () => {
    const adminTable = appSource("admin/_components/admin-doctor-table.tsx");
    const attachmentControl = appSource(
      "patient/(portal)/health-history/records/_components/attachment-preview-modal.tsx",
    );
    const attachmentDialogUrl = new URL(
      "./patient/(portal)/health-history/records/_components/attachment-preview-dialog.tsx",
      import.meta.url,
    );

    expect(adminTable).toContain('import dynamic from "next/dynamic"');
    expect(adminTable).toContain("AdminReviewModalFallback");
    expect(adminTable).toContain('import("./admin-review-modal")');
    expect(adminTable).not.toContain('import { AdminReviewModal } from "./admin-review-modal";');

    expect(existsSync(attachmentDialogUrl)).toBe(true);
    expect(attachmentControl).toContain('import dynamic from "next/dynamic"');
    expect(attachmentControl).toContain("AttachmentPreviewDialogFallback");
    expect(attachmentControl).toContain('import("./attachment-preview-dialog")');
    expect(attachmentControl).not.toContain("<iframe");
    expect(attachmentControl).not.toContain("<Image");
  });

  it("defers doctor RAG and dashboard grant modal internals from first paint", () => {
    const dashboardClient = appSource("doctor/_components/doctor-dashboard-client.tsx");
    const modalContentUrl = new URL("./doctor/_components/doctor-grant-modal-content.tsx", import.meta.url);
    const grantPage = appSource("doctor/(portal)/grants/[grantId]/page.tsx");
    const lazyRagUrl = new URL("./doctor/_components/doctor-rag-lazy-panel.tsx", import.meta.url);

    expect(existsSync(modalContentUrl)).toBe(true);
    expect(dashboardClient).toContain('import dynamic from "next/dynamic"');
    expect(dashboardClient).toContain("GrantModalContentFallback");
    expect(dashboardClient).toContain('import("./doctor-grant-modal-content")');
    expect(dashboardClient).not.toContain('import { DoctorRagClient } from "@/app/doctor/_components/doctor-rag-client";');

    expect(existsSync(lazyRagUrl)).toBe(true);
    expect(grantPage).toContain("DoctorRagLazyPanel");
    expect(grantPage).not.toContain("DoctorRagClient");
    expect(appSource("doctor/_components/doctor-rag-lazy-panel.tsx")).toContain("IntersectionObserver");
  });

  it("keeps shared route skeletons out of initial portal navigation bundles", () => {
    const patientTransition = appSource("patient/_components/patient-navigation-transition.tsx");
    const doctorNavigation = appSource("doctor/_components/doctor-navigation.tsx");
    const adminNavigation = appSource("admin/_components/admin-navigation.tsx");

    for (const source of [patientTransition, doctorNavigation, adminNavigation]) {
      expect(source).toContain('import dynamic from "next/dynamic"');
      expect(source).toContain("PendingSkeletonFallback");
      expect(source).not.toMatch(/import\s*\{[\s\S]*Skeleton[\s\S]*\}\s*from\s*"@\/components\/loading-skeletons"/);
    }
  });

  it("uses responsive sizes and lazy raw preview images for non-critical media", () => {
    const landingPage = appSource("page.tsx");
    const articlesPage = appSource("articles/page.tsx");
    const articleDetailPage = appSource("articles/[slug]/page.tsx");
    const kycPreview = componentSource("kyc-document-preview.tsx");

    expect(landingPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(3);
    expect(articlesPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(1);
    expect(articleDetailPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(2);
    expect(kycPreview.match(/loading="lazy"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(kycPreview.match(/decoding="async"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("stores article .webp assets as real WebP bytes instead of mislabeled PNG files", () => {
    const articleAssetDir = join(process.cwd(), "public", "assets", "articles");
    const articleImages = [
      "ai-diagnostics-clinic.webp",
      "encryption-records.webp",
      "medical-network.webp",
      "medical-research-lab.webp",
      "patient-rights.webp",
    ];

    for (const image of articleImages) {
      const bytes = readFileSync(join(articleAssetDir, image));
      expect(bytes.subarray(0, 4).toString("ascii"), image).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii"), image).toBe("WEBP");
      expect(bytes.byteLength, image).toBeLessThan(80 * 1024);
    }
  });
});
