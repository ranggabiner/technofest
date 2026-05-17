import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";
import {
  doctorPendingSkeletonKey,
  resolveDoctorNavigationPath,
} from "./doctor/_components/doctor-navigation-transition-model";

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

    expect(client).toContain('role="dialog"');
    expect(client).toContain("openQrModal");
    expect(client).toContain("loadDoctorGrantModalStateAction");
    expect(client).toContain("createScope1RecordFromDashboardAction");
    expect(client).toContain('dataFilter="active"');
    expect(client).toContain('dataFilter="finished"');
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
