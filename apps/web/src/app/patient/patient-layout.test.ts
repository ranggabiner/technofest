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
    "(portal)/access-history/page.tsx",
  ];
  const patientLoadingFiles = [
    "(portal)/loading.tsx",
    "(portal)/access/loading.tsx",
    "(portal)/access-history/loading.tsx",
  ];

  it("mounts the shared patient shell in the persistent portal layout", () => {
    const layoutPath = new URL("./(portal)/layout.tsx", import.meta.url);
    const source = readFileSync(layoutPath, "utf8");

    expect(existsSync(layoutPath)).toBe(true);
    expect(source).toContain("PatientLayout");
    expect(source).toContain("children");
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
    expect(dashboardHtml).toContain("Dashboard");
    expect(dashboardHtml).toContain("Jurnal AI");
  });

  it("resolves only patient portal navigation targets for optimistic loading", () => {
    expect(resolvePatientNavigationPath("/patient/chat", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("/patient/access?access_status=granted", "/patient/chat")).toBe("/patient/access");
    expect(resolvePatientNavigationPath("/patient/access-history", "/patient/access")).toBe("/patient/access-history");
    expect(resolvePatientNavigationPath("/patient", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("/doctor", "/patient")).toBeNull();
    expect(resolvePatientNavigationPath("https://example.com/patient/chat", "/patient")).toBeNull();
  });

  it("maps patient portal targets to content-only skeletons without confusing access history with access", () => {
    expect(patientPendingSkeletonKey("/patient")).toBe("dashboard");
    expect(patientPendingSkeletonKey("/patient/chat")).toBeNull();
    expect(patientPendingSkeletonKey("/patient/access")).toBe("access");
    expect(patientPendingSkeletonKey("/patient/access-history")).toBe("history");
    expect(patientPendingSkeletonKey("/patient/access-history/detail")).toBe("history");
    expect(patientPendingSkeletonKey("/patient/unknown")).toBeNull();
  });
});
