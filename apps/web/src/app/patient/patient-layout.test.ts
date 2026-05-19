import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

import { PatientLayout } from "./_components/patient-layout";
import {
  patientPendingSkeletonKey,
  resolvePatientNavigationPath,
} from "./_components/patient-navigation-transition-model";

describe("patient layout shell", () => {
  const patientRouteFiles = [
    "(portal)/page.tsx",
    "(portal)/access/page.tsx",
    "(portal)/health-history/page.tsx",
    "(portal)/health-history/records/page.tsx",
  ];
  const patientLoadingFiles = [
    "(portal)/loading.tsx",
    "(portal)/access/loading.tsx",
    "(portal)/health-history/loading.tsx",
    "(portal)/health-history/records/loading.tsx",
  ];

  it("mounts the shared patient shell in the persistent portal layout", () => {
    const layoutPath = new URL("./(portal)/layout.tsx", import.meta.url);
    const source = readFileSync(layoutPath, "utf8");
    const patientLayoutSource = readFileSync(new URL("./_components/patient-layout.tsx", import.meta.url), "utf8");
    const sharedLayoutSource = readFileSync(new URL("../_components/portal-layout.tsx", import.meta.url), "utf8");

    expect(existsSync(layoutPath)).toBe(true);
    expect(source).toContain("PatientLayout");
    expect(source).toContain("children");
    expect(patientLayoutSource).toContain("PortalLayout");
    expect(patientLayoutSource).toContain("PortalForbiddenLayout");
    expect(sharedLayoutSource).toContain("data-portal-layout");
    expect(sharedLayoutSource).toContain("data-portal-sidebar");
    expect(patientLayoutSource).toContain("profileLabel={copy.profile.shell.profile}");
    expect(patientLayoutSource).not.toContain("copy.patient.dashboard.editProfile");
  });

  it.each(patientRouteFiles)("%s keeps route UI content-only", (relativePath) => {
    const source = readFileSync(new URL(`./${relativePath}`, import.meta.url), "utf8");

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).not.toContain('from "@/components/app-shell"');
  });

  it.each(patientLoadingFiles)("%s keeps loading UI content-only", (relativePath) => {
    const source = readFileSync(new URL(`./${relativePath}`, import.meta.url), "utf8");

    expect(source).not.toContain("AppShellSkeleton");
    expect(source).not.toContain("PatientPortalShellSkeleton");
    expect(source).not.toContain("HeaderSkeleton");
    expect(source).not.toContain("data-patient-sidebar");
  });

  it("does not back patient route loading states with a full portal shell skeleton", () => {
    const source = readFileSync(new URL("../../components/loading-skeletons.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("export function PatientPortalShellSkeleton");
    expect(source).not.toContain("data-patient-sidebar");
  });

  it("keeps patient chat as a standalone full-screen route outside the portal shell", () => {
    expect(existsSync(new URL("./chat/page.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./chat/loading.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./(portal)/chat/page.tsx", import.meta.url))).toBe(false);
    expect(existsSync(new URL("./(portal)/chat/loading.tsx", import.meta.url))).toBe(false);
  });

  it("keeps sidebar markup stable while active route changes", () => {
    const baseProps = {
      title: dictionary.id.patient.dashboard.title,
      copy: dictionary.id,
      header: React.createElement("header", { "data-test-header": true }),
      patientName: "Budi Santoso",
      patientEmail: "budi@example.com",
      children: React.createElement("section", null, "Konten halaman"),
    };

    const dashboardHtml = renderToStaticMarkup(
      React.createElement(PatientLayout, {
        ...baseProps,
      }),
    );

    expect(dashboardHtml).toContain('data-patient-layout="portal-shell"');
    expect(dashboardHtml).toContain('data-patient-sidebar="profile"');
    expect(dashboardHtml).toContain('data-patient-sidebar="mobile-profile"');
    expect(dashboardHtml).toContain("Dashboard");
    expect(dashboardHtml).toContain("Jurnal AI");
    expect(dashboardHtml).toContain("Akses Dokter");
    expect(dashboardHtml).toContain("Riwayat Kesehatan");
    expect(dashboardHtml).toContain("Keluar akun");
    expect(dashboardHtml).not.toContain("Riwayat Akses");
  });

  it("keeps profile logout in a soft red tone instead of gray while loading", () => {
    const source = readFileSync(new URL("../_components/portal-layout.tsx", import.meta.url), "utf8");

    expect(source).toContain("border border-[color-mix(in_srgb,var(--color-error-red)_55%,white)] bg-[color-mix(in_srgb,var(--color-error-red)_8%,transparent)]");
    expect(source).toContain("text-[var(--color-error-red)] transition hover:bg-[color-mix(in_srgb,var(--color-error-red)_14%,transparent)]");
    expect(source).toContain("loadingLabel={logoutLabel}");
    expect(source).not.toContain("border border-transparent");
    expect(source).not.toContain("hover:border-[var(--color-stone-surface)]");
    expect(source).not.toContain("text-[var(--color-ash)] transition hover:bg-[var(--color-stone-surface)]");
    expect(source).not.toContain("gap-2 rounded-full bg-[var(--color-midnight)] px-4 py-2 text-xs font-semibold uppercase");
  });

  it("uses compact mobile portal spacing with comfortable touch targets", () => {
    const source = readFileSync(new URL("../_components/portal-layout.tsx", import.meta.url), "utf8");
    const buttonSource = readFileSync(new URL("../../components/ui/button.tsx", import.meta.url), "utf8");

    expect(source).toContain("gap-5 px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-[100px]");
    expect(source).toContain("col-span-1 flex flex-col gap-5 md:col-span-9 md:gap-8");
    expect(source).toContain("inline-flex min-h-11 w-full cursor-pointer");
    expect(buttonSource).toContain("inline-flex min-h-11 max-w-full cursor-pointer");
    expect(buttonSource).toContain("text-center transition");
    expect(buttonSource).toContain("typography.button");
  });

  it("resolves only patient portal navigation targets for optimistic loading", () => {
    expect(resolvePatientNavigationPath("/patient/chat", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("/patient/access?access_status=granted", "/patient/chat")).toBe("/patient/access");
    expect(resolvePatientNavigationPath("/patient/health-history", "/patient")).toBe("/patient/health-history");
    expect(resolvePatientNavigationPath("/patient/health-history/records", "/patient/health-history")).toBe("/patient/health-history/records");
    expect(resolvePatientNavigationPath("/patient/access-history", "/patient/access")).toBeNull();
    expect(resolvePatientNavigationPath("/patient", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("/doctor", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("https://example.com/patient/chat", "/patient")).toBeNull();
  });

  it("maps only active patient portal targets to content-only skeletons", () => {
    expect(patientPendingSkeletonKey("/patient")).toBe("dashboard");
    expect(patientPendingSkeletonKey("/patient/chat")).toBeNull();
    expect(patientPendingSkeletonKey("/patient/access")).toBe("access");
    expect(patientPendingSkeletonKey("/patient/health-history")).toBe("health-history");
    expect(patientPendingSkeletonKey("/patient/health-history/records")).toBe("health-history-records");
    expect(patientPendingSkeletonKey("/patient/health-history/journal")).toBe("health-history-journal");
    expect(patientPendingSkeletonKey("/patient/health-history/detail")).toBeNull();
    expect(patientPendingSkeletonKey("/patient/access-history")).toBeNull();
    expect(patientPendingSkeletonKey("/patient/access-history/detail")).toBeNull();
    expect(patientPendingSkeletonKey("/patient/unknown")).toBeNull();
  });

  it("removes the retired access history route from the patient portal", () => {
    expect(existsSync(new URL("./(portal)/access-history/page.tsx", import.meta.url))).toBe(false);
    expect(existsSync(new URL("./(portal)/access-history/loading.tsx", import.meta.url))).toBe(false);
  });
});
