import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  removeSaveStatusToastParams,
  SAVE_STATUS_TOAST_AUTO_DISMISS_MS,
  shouldShowSaveStatusToast,
} from "./_components/save-status-toast";

const componentPath = new URL("./_components/save-status-toast.tsx", import.meta.url);
const source = () => readFileSync(componentPath, "utf8");

describe("shared save status toast", () => {
  it("uses a bounded client toast and clears save params from the URL", () => {
    expect(existsSync(componentPath)).toBe(true);

    const component = source();

    expect(component).toContain('"use client"');
    expect(component).toContain("export const SAVE_STATUS_TOAST_AUTO_DISMISS_MS = 4000");
    expect(component).toContain("export function removeSaveStatusToastParams");
    expect(component).toContain("export function shouldShowSaveStatusToast");
    expect(component).toContain("export function SaveStatusToast");
    expect(component).toContain("window.setTimeout");
    expect(component).toContain("window.clearTimeout");
    expect(component).toContain("window.history.replaceState");
    expect(component).toContain('url.searchParams.delete("saved")');
    expect(component).toContain('url.searchParams.delete("updated")');
    expect(component).toContain('url.searchParams.delete("scope1_status")');
    expect(component).toContain('data-save-status-toast="saved"');
    expect(component).toContain('role="status"');
    expect(component).toContain('aria-live="polite"');
  });

  it("is mounted from the portal layout and doctor dashboard modal flow", () => {
    const portalLayout = readFileSync(new URL("./_components/portal-layout.tsx", import.meta.url), "utf8");
    const doctorClient = readFileSync(new URL("./doctor/_components/doctor-dashboard-client.tsx", import.meta.url), "utf8");
    const grantPage = readFileSync(new URL("./doctor/(portal)/grants/[grantId]/page.tsx", import.meta.url), "utf8");

    expect(portalLayout).toContain("SaveStatusToast");
    expect(portalLayout).toContain("message={copy.common.saveSuccess}");
    expect(doctorClient).toContain("SaveStatusToast");
    expect(doctorClient).toContain("saveToastKey");
    expect(doctorClient).toContain("setSaveToastKey");
    expect(doctorClient).toContain("triggerKey={saveToastKey}");
    expect(grantPage).not.toContain('query.scope1_status === "saved"');
  });

  it("recognizes successful save query params and preserves unrelated URL state", () => {
    expect(SAVE_STATUS_TOAST_AUTO_DISMISS_MS).toBe(4000);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/profile?saved=profile")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/grants/1?scope1_status=saved")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/admin/approval?updated=approved")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/grants/1?scope1_status=failed")).toBe(false);
    expect(
      removeSaveStatusToastParams(
        "https://medproof.test/doctor/grants/1?scope1_status=saved&tab=records&saved=1&updated=approved#latest",
      ),
    ).toBe("/doctor/grants/1?tab=records#latest");
  });
});
