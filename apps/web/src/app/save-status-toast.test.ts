import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  removeSaveStatusToastParams,
  resolveSaveStatusToastMessage,
  SAVE_STATUS_TOAST_AUTO_DISMISS_MS,
  shouldShowSaveStatusToast,
} from "./_components/save-status-toast";
import { dictionary } from "@/lib/i18n/dictionary";

const componentPath = new URL("./_components/save-status-toast.tsx", import.meta.url);
const source = () => readFileSync(componentPath, "utf8");

describe("shared save status toast", () => {
  it("uses a bounded client toast and clears save params from the URL", () => {
    expect(existsSync(componentPath)).toBe(true);

    const component = source();

    expect(component).toContain('"use client"');
    expect(component).toContain("export const SAVE_STATUS_TOAST_AUTO_DISMISS_MS = APP_TOAST_AUTO_DISMISS_MS");
    expect(component).toContain("export function removeSaveStatusToastParams");
    expect(component).toContain("export function resolveSaveStatusToastMessage");
    expect(component).toContain("export function shouldShowSaveStatusToast");
    expect(component).toContain("export function SaveStatusToast");
    expect(component).toContain("AppToast");
    expect(component).toContain("window.history.replaceState");
    expect(component).toContain('url.searchParams.delete("saved")');
    expect(component).toContain('url.searchParams.delete("updated")');
    expect(component).toContain('url.searchParams.delete("scope1_status")');
    expect(component).toContain('url.searchParams.delete("access_status")');
    expect(component).toContain('url.searchParams.delete("submitted")');
    expect(component).toContain('data-save-status-toast="saved"');
    expect(component).toContain("messages?: SuccessToastMessages");
  });

  it("is mounted from the portal layout and doctor dashboard modal flow", () => {
    const portalLayout = readFileSync(new URL("./_components/portal-layout.tsx", import.meta.url), "utf8");
    const doctorClient = readFileSync(new URL("./doctor/_components/doctor-dashboard-client.tsx", import.meta.url), "utf8");
    const grantPage = readFileSync(new URL("./doctor/(portal)/grants/[grantId]/page.tsx", import.meta.url), "utf8");

    expect(portalLayout).toContain("SaveStatusToast");
    expect(portalLayout).toContain("messages={copy.common.successToast}");
    expect(doctorClient).toContain("SaveStatusToast");
    expect(doctorClient).toContain("saveToastKey");
    expect(doctorClient).toContain("setSaveToastKey");
    expect(doctorClient).toContain("triggerKey={saveToastKey}");
    expect(doctorClient).toContain("message={copy.common.successToast.medicalRecordSaved}");
    expect(grantPage).not.toContain('query.scope1_status === "saved"');
  });

  it("recognizes successful save query params and preserves unrelated URL state", () => {
    expect(SAVE_STATUS_TOAST_AUTO_DISMISS_MS).toBe(4000);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/profile?saved=profile")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/grants/1?scope1_status=saved")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/admin/approval?updated=approved")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/patient/access?access_status=granted")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/status?submitted=1")).toBe(true);
    expect(shouldShowSaveStatusToast("https://medproof.test/doctor/grants/1?scope1_status=failed")).toBe(false);
    expect(
      removeSaveStatusToastParams(
        "https://medproof.test/doctor/grants/1?scope1_status=saved&tab=records&saved=1&updated=approved&access_status=granted&submitted=1#latest",
      ),
    ).toBe("/doctor/grants/1?tab=records#latest");
  });

  it("resolves contextual success wording from query params", () => {
    const messages = dictionary.en.common.successToast;

    expect(resolveSaveStatusToastMessage("https://medproof.test/doctor/profile?saved=profile", messages)).toBe(
      messages.profileUpdated,
    );
    expect(resolveSaveStatusToastMessage("https://medproof.test/doctor/profile?saved=letters", messages)).toBe(
      messages.documentsUploaded,
    );
    expect(resolveSaveStatusToastMessage("https://medproof.test/doctor/grants/1?scope1_status=saved", messages)).toBe(
      messages.medicalRecordSaved,
    );
    expect(resolveSaveStatusToastMessage("https://medproof.test/patient/access?access_status=revoked", messages)).toBe(
      messages.accessRevoked,
    );
    expect(resolveSaveStatusToastMessage("https://medproof.test/admin/approval?updated=rejected", messages)).toBe(
      messages.doctorRejected,
    );
  });

  it("localizes every standard success toast key", () => {
    for (const locale of ["id", "en"] as const) {
      const messages = dictionary[locale].common.successToast;

      expect(messages.default).toBeTruthy();
      expect(messages.profileUpdated).toBeTruthy();
      expect(messages.changesSaved).toBeTruthy();
      expect(messages.documentUploaded).toBeTruthy();
      expect(messages.documentsUploaded).toBeTruthy();
      expect(messages.medicalRecordSaved).toBeTruthy();
      expect(messages.accessGranted).toBeTruthy();
      expect(messages.accessRevoked).toBeTruthy();
      expect(messages.doctorApproved).toBeTruthy();
      expect(messages.doctorRejected).toBeTruthy();
      expect(messages.adminInvitationCreated).toBeTruthy();
      expect(messages.adminAccessRevoked).toBeTruthy();
      expect(messages.onboardingStepSaved).toBeTruthy();
      expect(messages.onboardingSubmitted).toBeTruthy();
      expect(messages.aiSessionCreated).toBeTruthy();
      expect(messages.aiSessionFinished).toBeTruthy();
      expect(messages.summaryRetryStarted).toBeTruthy();
      expect(messages.blockchainRetryCompleted).toBeTruthy();
    }
  });

  it("adds save status params to onboarding redirects that land outside portal layouts", () => {
    const patientActions = readFileSync(new URL("./patient/onboarding/actions.ts", import.meta.url), "utf8");
    const doctorActions = readFileSync(new URL("./doctor/onboarding/actions.ts", import.meta.url), "utf8");
    const patientStep2 = readFileSync(new URL("./patient/onboarding/step-2/page.tsx", import.meta.url), "utf8");
    const patientStep3 = readFileSync(new URL("./patient/onboarding/step-3/page.tsx", import.meta.url), "utf8");
    const doctorStep2 = readFileSync(new URL("./doctor/onboarding/step-2/page.tsx", import.meta.url), "utf8");
    const doctorStep3 = readFileSync(new URL("./doctor/onboarding/step-3/page.tsx", import.meta.url), "utf8");

    expect(patientActions).toContain('redirect("/patient/onboarding/step-2?save_status=patient_onboarding_step")');
    expect(patientActions).toContain('redirect("/patient/onboarding/step-3?save_status=patient_onboarding_step")');
    expect(patientActions).toContain('redirect("/patient?save_status=patient_onboarding_complete")');
    expect(doctorActions).toContain('redirect("/doctor/onboarding/step-2?save_status=doctor_onboarding_step")');
    expect(patientStep2).toContain("SaveStatusToast");
    expect(patientStep3).toContain("SaveStatusToast");
    expect(doctorStep2).toContain("SaveStatusToast");
    expect(doctorStep3).toContain("SaveStatusToast");
  });
});
