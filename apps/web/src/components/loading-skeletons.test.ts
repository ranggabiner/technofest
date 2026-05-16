import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DoctorGrantPageSkeleton,
  LoadingCard,
  LoadingList,
  PatientChatSkeleton,
  PatientDashboardSkeleton,
} from "./loading-skeletons";
import { Skeleton } from "./ui/skeleton";

describe("loading skeleton components", () => {
  it("renders decorative pulse blocks that inherit caller dimensions", () => {
    const html = renderToStaticMarkup(
      React.createElement(Skeleton, { className: "h-4 w-24" }),
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("animate-pulse");
    expect(html).toContain("h-4");
    expect(html).toContain("w-24");
  });

  it("renders reusable card and list patterns without loading text", () => {
    const cardHtml = renderToStaticMarkup(
      React.createElement(LoadingCard, { lines: 3 }),
    );
    const listHtml = renderToStaticMarkup(
      React.createElement(LoadingList, { rows: 4 }),
    );

    expect(cardHtml.match(/data-skeleton-line/g)).toHaveLength(3);
    expect(listHtml.match(/data-skeleton-row/g)).toHaveLength(4);
    expect(cardHtml.toLowerCase()).not.toContain("loading");
    expect(listHtml.toLowerCase()).not.toContain("loading");
  });

  it("keeps page-level skeletons close to final layouts", () => {
    const patientHtml = renderToStaticMarkup(
      React.createElement(PatientDashboardSkeleton),
    );
    const grantHtml = renderToStaticMarkup(
      React.createElement(DoctorGrantPageSkeleton),
    );

    expect(patientHtml).toContain('data-loading-pattern="patient-dashboard"');
    expect(patientHtml).not.toContain("data-patient-sidebar");
    expect(patientHtml).not.toContain("HeaderSkeleton");
    expect(patientHtml).toContain("min-h-[400px]");
    expect(grantHtml).toContain('data-loading-pattern="doctor-grant"');
    expect(grantHtml.match(/data-skeleton-card/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps patient chat loading header grouped around back navigation", () => {
    const html = renderToStaticMarkup(
      React.createElement(PatientChatSkeleton),
    );

    expect(html).toContain('data-loading-pattern="patient-chat"');
    expect(html).toContain('data-chat-header="navigation-group"');
    expect(html).toContain("h-screen");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("h-full");
    expect(html).toContain("min-h-0");
    expect(html).not.toContain("h-4 w-full max-w-md");
    expect(html.match(/h-\[190px\] rounded-xl/g)).toHaveLength(2);
    expect(html).not.toContain('class="flex items-center justify-between"');
  });
});

describe("route loading skeletons", () => {
  const appDir = join(process.cwd(), "src", "app");
  const routeLoadingFiles = [
    "loading.tsx",
    "login/loading.tsx",
    "login/role/loading.tsx",
    "patient/(portal)/loading.tsx",
    "patient/chat/loading.tsx",
    "patient/(portal)/access/loading.tsx",
    "patient/(portal)/health-history/loading.tsx",
    "patient/(portal)/health-history/records/loading.tsx",
    "patient/onboarding/step-1/loading.tsx",
    "patient/onboarding/step-2/loading.tsx",
    "patient/onboarding/step-3/loading.tsx",
    "doctor/loading.tsx",
    "doctor/status/loading.tsx",
    "doctor/grants/[grantId]/loading.tsx",
    "doctor/onboarding/step-1/loading.tsx",
    "doctor/onboarding/step-2/loading.tsx",
    "doctor/onboarding/step-3/loading.tsx",
    "admin/doctors/loading.tsx",
    "admin/doctors/[doctorId]/loading.tsx",
  ];

  it.each(routeLoadingFiles)("%s uses skeleton UI", (relativePath) => {
    const loadingPath = join(appDir, relativePath);

    expect(existsSync(loadingPath)).toBe(true);
    expect(readFileSync(loadingPath, "utf8")).toMatch(/Skeleton|LoadingCard/);
  });
});
