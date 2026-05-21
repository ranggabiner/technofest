import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = (path: string) => readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
const componentSource = (path: string) => readFileSync(new URL(`../components/${path}`, import.meta.url), "utf8");
const appRootSource = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

type WebPDimensions = {
  height: number;
  width: number;
};

function parseWebPDimensions(bytes: Buffer): WebPDimensions {
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkType === "VP8 ") {
      return {
        width: bytes.readUInt16LE(chunkStart + 6) & 0x3fff,
        height: bytes.readUInt16LE(chunkStart + 8) & 0x3fff,
      };
    }

    if (chunkType === "VP8X") {
      return {
        width:
          1 +
          bytes[chunkStart + 4] +
          (bytes[chunkStart + 5] << 8) +
          (bytes[chunkStart + 6] << 16),
        height:
          1 +
          bytes[chunkStart + 7] +
          (bytes[chunkStart + 8] << 8) +
          (bytes[chunkStart + 9] << 16),
      };
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  throw new Error("Unsupported WebP encoding");
}

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
    expect(chatClient).toContain('import("@/components/assistant-markdown")');
    expect(chatClient).not.toContain('import { AssistantMarkdown } from "./assistant-markdown";');
    expect(journalHistoryClient).toContain('import dynamic from "next/dynamic"');
    expect(journalHistoryClient).toContain("JournalAssistantMarkdownFallback");
    expect(journalHistoryClient).toContain('import("@/components/assistant-markdown")');
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
    const nextConfig = appRootSource("next.config.ts");

    expect(landingPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(3);
    expect(articlesPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(1);
    expect(articleDetailPage.match(/sizes=/g)?.length).toBeGreaterThanOrEqual(2);
    expect(nextConfig).toContain('formats: ["image/webp"]');
    expect(nextConfig).toContain("qualities: [75, 82, 88]");
    expect(landingPage.match(/quality=\{88\}/g)?.length).toBeGreaterThanOrEqual(2);
    expect(articlesPage).toContain("quality={82}");
    expect(articleDetailPage).toContain("quality={88}");
    expect(articleDetailPage).toContain("fill");
    expect(kycPreview.match(/loading="lazy"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(kycPreview.match(/decoding="async"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("stores marketing WebP assets at display-safe resolution without oversized sources", () => {
    const images = [
      {
        path: "public/assets/landing/hero-ai-interface.webp",
        minWidth: 1536,
        minHeight: 1536,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/landing/doctor-tablet.webp",
        minWidth: 1536,
        minHeight: 1536,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/articles/medical-research-lab.webp",
        minWidth: 1200,
        minHeight: 900,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/articles/encryption-records.webp",
        minWidth: 1200,
        minHeight: 900,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/articles/medical-network.webp",
        minWidth: 1200,
        minHeight: 900,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/articles/patient-rights.webp",
        minWidth: 1200,
        minHeight: 900,
        maxBytes: 220 * 1024,
      },
      {
        path: "public/assets/articles/ai-diagnostics-clinic.webp",
        minWidth: 2200,
        minHeight: 1238,
        maxBytes: 280 * 1024,
      },
      {
        path: "public/assets/articles/encryption-records-detail.webp",
        minWidth: 2200,
        minHeight: 1238,
        maxBytes: 280 * 1024,
      },
      {
        path: "public/assets/articles/medical-network-detail.webp",
        minWidth: 2200,
        minHeight: 1238,
        maxBytes: 280 * 1024,
      },
      {
        path: "public/assets/articles/patient-rights-detail.webp",
        minWidth: 2200,
        minHeight: 1238,
        maxBytes: 280 * 1024,
      },
    ];

    for (const image of images) {
      const bytes = readFileSync(join(process.cwd(), image.path));
      const dimensions = parseWebPDimensions(bytes);
      expect(bytes.byteLength, image.path).toBeLessThanOrEqual(image.maxBytes);
      expect(dimensions.width, image.path).toBeGreaterThanOrEqual(image.minWidth);
      expect(dimensions.height, image.path).toBeGreaterThanOrEqual(image.minHeight);
    }
  });
});
