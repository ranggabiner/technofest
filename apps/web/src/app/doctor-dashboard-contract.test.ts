import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";
import {
  doctorPendingSkeletonKey,
  resolveDoctorNavigationPath,
} from "./doctor/_components/doctor-navigation-transition-model";
import { doctorStatusNavItems } from "./doctor/_components/doctor-nav-model";

const route = (path: string) => readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
const lib = (path: string) =>
  readFileSync(new URL(`../lib/${path}`, import.meta.url), "utf8");

describe("doctor dashboard contract", () => {
  const doctorPortalRouteFiles = [
    "doctor/(portal)/page.tsx",
    "doctor/(portal)/medical-record-library/page.tsx",
    "doctor/(portal)/grants/[grantId]/page.tsx",
  ];
  const doctorPortalLoadingFiles = [
    "doctor/(portal)/loading.tsx",
    "doctor/(portal)/medical-record-library/loading.tsx",
    "doctor/(portal)/grants/[grantId]/loading.tsx",
  ];

  it("mounts the shared doctor shell in a persistent portal layout", () => {
    const layoutPath = new URL("./doctor/(portal)/layout.tsx", import.meta.url);
    const layout = route("doctor/(portal)/layout.tsx");
    const doctorLayout = route("doctor/_components/doctor-layout.tsx");
    const sharedLayout = route("_components/portal-layout.tsx");

    expect(existsSync(layoutPath)).toBe(true);
    expect(layout).toContain("DoctorLayout");
    expect(layout).toContain("children");
    expect(doctorLayout).toContain("PortalLayout");
    expect(doctorLayout).toContain("PortalForbiddenLayout");
    expect(doctorLayout).toContain("profileLabel={copy.profile.shell.profile}");
    expect(doctorLayout).not.toContain("copy.doctor.dashboard.editProfile");
    expect(sharedLayout).toContain('data-doctor-layout={role === "doctor" ? "portal-shell"');
    expect(sharedLayout).toContain("data-doctor-sidebar");
  });

  it.each(doctorPortalRouteFiles)("%s keeps route UI content-only", (path) => {
    const source = route(path);

    expect(source).not.toContain("AppShell");
    expect(source).not.toContain("ForbiddenState");
    expect(source).not.toContain("requireRole");
    expect(source).not.toContain("doctorNavItems");
  });

  it.each(doctorPortalLoadingFiles)("%s keeps loading UI content-only", (path) => {
    const source = route(path);

    expect(source).not.toContain("AppShellSkeleton");
    expect(source).not.toContain("data-doctor-sidebar");
    expect(source).not.toContain("HeaderSkeleton");
  });

  it("renders dashboard through a client modal table instead of grant-page table links", () => {
    const page = route("doctor/(portal)/page.tsx");
    const navModel = route("doctor/_components/doctor-nav-model.ts");

    expect(page).toContain("DoctorDashboardClient");
    expect(navModel).toContain("/doctor/medical-record-library");
    expect(page).not.toContain("href={`/doctor/grants/${grant.grantId}`");
  });

  it("has dashboard modal actions, QR modal, and clickable filter controls", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");
    const modalContent = route("doctor/_components/doctor-grant-modal-content.tsx");

    expect(client).toContain('role="dialog"');
    expect(client).toContain("openQrModal");
    expect(client).toContain("loadDoctorGrantModalStateAction");
    expect(modalContent).toContain("createScope1RecordFromDashboardAction");
    expect(client).toContain('dataFilter="active"');
    expect(client).toContain('dataFilter="finished"');
  });

  it("renders doctor status in the portal shell without approved dashboard links", () => {
    const page = route("doctor/status/page.tsx");
    const doctorNavigation = route("doctor/_components/doctor-navigation.tsx");
    const skeleton = route("../components/loading-skeletons.tsx");
    const statusNavItems = doctorStatusNavItems("/doctor/status", dictionary.en);

    expect(page).toContain("PortalLayout");
    expect(page).toContain("DoctorStatusDesktopNavigation");
    expect(page).toContain("DoctorStatusMobileNavigation");
    expect(page).toContain("loadDoctorProfileState");
    expect(page).toContain("showProfileAction={false}");
    expect(page).toContain("data-doctor-status-profile");
    expect(page).toContain("copy.doctor.status.pendingTitle");
    expect(page).not.toContain('href="/doctor/medical-record-library"');
    expect(page).not.toContain("DoctorDashboardClient");
    expect(doctorNavigation).toContain("DoctorStatusDesktopNavigation");
    expect(doctorNavigation).toContain("doctorStatusNavItems");
    expect(statusNavItems).toHaveLength(1);
    expect(statusNavItems[0]?.href).toBe("/doctor/status");
    expect(statusNavItems[0]?.label).toBe(dictionary.en.doctor.status.title);
    expect(skeleton).toContain('data-loading-pattern="doctor-status"');
    expect(skeleton).toContain("md:grid-cols-12");
    expect(skeleton).toContain("md:col-span-3");
  });

  it("renders the medical record library as downloadable authorized files only", () => {
    const page = route("doctor/(portal)/medical-record-library/page.tsx");

    expect(page).toContain("requireApprovedDoctorPortalRole");
    expect(page).toContain("loadDoctorMedicalRecordLibraryState");
    expect(page).toContain("data-doctor-library-file");
    expect(page).toContain("/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/download");
    expect(page).toContain("data-doctor-library-empty");
    expect(page).toContain("copy.doctor.library.emptyTitle");
    expect(page).toContain("copy.doctor.library.noRecords");
    expect(page).toContain("copy.doctor.library.emptyDescription");
    expect(page).toContain('href="/doctor"');
    expect(page).not.toContain("/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/preview");
    expect(page).not.toContain("copy.doctor.dashboard.downloadUnavailable");
    expect(page).not.toContain("Placeholder Sprint 1");
  });

  it("exposes a dedicated service loader for the doctor medical record library", () => {
    const service = lib("doctor-records/service.ts");

    expect(service).toContain("export type DoctorMedicalRecordLibraryState");
    expect(service).toContain("export async function loadDoctorMedicalRecordLibraryState");
    expect(service).toContain("loadScope1Records(grant)");
    expect(service).toContain(".filter((record) => record.attachmentFileId && record.attachmentCanDownload)");
    expect(service).toContain(".filter((grant) => grant.canViewScope1)");
  });

  it("closes and resets the dashboard create-record modal only after a successful save refresh", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");
    const modalContent = route("doctor/_components/doctor-grant-modal-content.tsx");

    expect(client).toContain("async function handleRecordSaved(grantId: string)");
    expect(client).toContain("onSaved={handleRecordSaved}");
    expect(client).toContain("onClose={closeGrantModal}");
    expect(client).toContain("message={copy.common.successToast.medicalRecordSaved}");
    expect(modalContent).toContain("formRef.current?.reset()");
    expect(modalContent).toContain("onClose()");
    expect(modalContent).toContain("const refreshResult = await onSaved(state.grant.grantId)");
    expect(modalContent).toContain("setError(result.error)");
    expect(modalContent).toContain("setError(refreshResult.error)");
  });

  it("shows a spinner with the existing loading text while dashboard modals load", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");

    expect(client).toContain("Loader2");
    expect(client).toContain("<ModalLoadingState message={copy.doctor.dashboard.loadingModal} />");
    expect(client).toContain('role="status"');
    expect(client).toContain('aria-live="polite"');
    expect(client).toContain("animate-spin");
  });

  it("does not render a profile edit shortcut inside the doctor dashboard client", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");

    expect(client).not.toContain('href="/doctor/profile"');
    expect(client).not.toContain("copy.doctor.dashboard.editProfile");
  });

  it("uses mobile session cards and viewport-safe dashboard modals", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");
    const modalContent = route("doctor/_components/doctor-grant-modal-content.tsx");
    const skeleton = route("../components/loading-skeletons.tsx");

    expect(client).toContain("data-doctor-session-cards");
    expect(client).toContain("md:hidden");
    expect(client).toContain("hidden overflow-x-auto md:block");
    expect(client).toContain("max-h-[calc(100dvh-2rem)]");
    expect(client).toContain("size-[min(18rem,70vw)]");
    expect(modalContent).toContain("[overflow-wrap:anywhere]");
    expect(skeleton).toContain("data-doctor-session-skeleton-cards");
    expect(skeleton).toContain("data-doctor-session-skeleton-table");
  });

  it("renders doctor RAG answers as safe Markdown and scrolls only the dashboard modal panel", () => {
    const ragClient = route("doctor/_components/doctor-rag-client.tsx");

    expect(ragClient).toContain('import { AssistantMarkdown } from "@/components/assistant-markdown";');
    expect(ragClient).toContain("<AssistantMarkdown content={answer} />");
    expect(ragClient).not.toContain("\n          {answer}\n");
    expect(ragClient).toContain("getDoctorRagScrollIntent");
    expect(ragClient).toContain("getDoctorRagScrollStateAfterPanelScroll");
    expect(ragClient).toContain("getPanelScrollTopToRevealChildStart");
    expect(ragClient).toContain("isScrollContainerNearBottom");
    expect(ragClient).toContain("shouldRevealAnswerStartRef");
    expect(ragClient).toContain("shouldStickToBottomRef");
    expect(ragClient).toContain("lastObservedScrollHeightRef");
    expect(ragClient).toContain("isAutoScrollingRef");
    expect(ragClient).toContain("answerRef");
    expect(ragClient).toContain('closest("[data-viewport-modal-panel]")');
    expect(ragClient).toContain("panel.scrollTo");
    expect(ragClient).not.toContain("window.scrollTo");
  });

  it("loads dashboard sessions newest grant first with explicit columns and scope flags", () => {
    const service = lib("doctor-records/service.ts");

    expect(service).toContain(
      "grant_id,patient_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,blockchain_status,blockchain_tx_hash,patients(patient_id,full_name,email)",
    );
    expect(service).toContain('.order("granted_at", { ascending: false })');
  });

  it("adds Indonesian and English copy for new dashboard UI", () => {
    for (const locale of ["id", "en"] as const) {
      expect(dictionary[locale].doctor.nav.medicalRecordLibrary).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.sidebarSection).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.sessionTableTitle).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.chatAi).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.viewMedicalRecords).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.createMedicalRecord).toBeTruthy();
    }
  });

  it("keeps doctor navigation path-driven like the patient portal", () => {
    const doctorNavigation = route("doctor/_components/doctor-nav-model.ts");

    expect(doctorNavigation).toContain("activePath");
    expect(doctorNavigation).toContain("/doctor");
    expect(doctorNavigation).toContain("/doctor/medical-record-library");
    expect(doctorNavigation).toContain("isActiveDoctorPath");
    expect(doctorNavigation).not.toContain("DoctorNavKey");
  });

  it("resolves only doctor portal navigation targets for optimistic loading", () => {
    expect(resolveDoctorNavigationPath("/doctor", "/doctor/medical-record-library")).toBe("/doctor");
    expect(resolveDoctorNavigationPath("/doctor/medical-record-library", "/doctor")).toBe("/doctor/medical-record-library");
    expect(resolveDoctorNavigationPath("/doctor/grants/grant-1", "/doctor")).toBe("/doctor/grants/grant-1");
    expect(resolveDoctorNavigationPath("/doctor/onboarding/step-1", "/doctor")).toBeNull();
    expect(resolveDoctorNavigationPath("/doctor/status", "/doctor")).toBeNull();
    expect(resolveDoctorNavigationPath("/patient", "/doctor")).toBeNull();
    expect(resolveDoctorNavigationPath("https://example.com/doctor", "/doctor")).toBeNull();
  });

  it("maps only active doctor portal targets to content-only skeletons", () => {
    expect(doctorPendingSkeletonKey("/doctor")).toBe("dashboard");
    expect(doctorPendingSkeletonKey("/doctor/medical-record-library")).toBe("medical-record-library");
    expect(doctorPendingSkeletonKey("/doctor/grants/grant-1")).toBe("grant");
    expect(doctorPendingSkeletonKey("/doctor/status")).toBeNull();
    expect(doctorPendingSkeletonKey("/doctor/onboarding/step-1")).toBeNull();
    expect(doctorPendingSkeletonKey("/doctor/profile")).toBeNull();
    expect(doctorPendingSkeletonKey("/doctor/unknown")).toBeNull();
  });
});
