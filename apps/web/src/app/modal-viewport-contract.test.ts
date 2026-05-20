import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDir = join(process.cwd(), "src", "app");

function source(path: string) {
  return readFileSync(join(appDir, path), "utf8");
}

const modalFiles = [
  "_components/profile-shell.tsx",
  "admin/_components/admin-doctor-table.tsx",
  "admin/_components/admin-review-modal.tsx",
  "doctor/_components/doctor-dashboard-client.tsx",
  "patient/_components/doctor-access-client.tsx",
  "patient/_components/doctor-qr-scanner-modal.tsx",
  "patient/_components/patient-dashboard-quick-access.tsx",
  "patient/_components/ai-journal-client.tsx",
  "patient/(portal)/health-history/journal/_components/journal-history-client.tsx",
  "patient/(portal)/health-history/records/_components/attachment-preview-modal.tsx",
  "patient/(portal)/health-history/records/_components/attachment-preview-dialog.tsx",
];

describe("modal viewport contract", () => {
  it.each(modalFiles)("%s renders modal overlays with the shared viewport portal", (path) => {
    const text = source(path);

    expect(text).toContain("ViewportModal");
  });

  it.each(modalFiles)("%s does not keep local fixed overlay implementations", (path) => {
    const text = source(path);

    expect(text).not.toMatch(/className=["']fixed inset-0 z-(?:50|\[)/);
  });

  it.each(modalFiles)("%s does not bypass the shared viewport panel component", (path) => {
    const text = source(path);

    expect(text).not.toContain('data-viewport-modal-panel=""');
  });

  it("keeps permission modal actions fixed while the modal body scrolls", () => {
    const text = source("patient/_components/doctor-access-client.tsx");

    expect(text).toContain('<ViewportModalPanel as="form"');
    expect(text).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(text).toContain("grid min-h-0 gap-6 overflow-y-auto");
  });
});
