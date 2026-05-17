import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DoctorGrantPageSkeleton,
  HomeSkeleton,
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

  it("keeps home loading state aligned to the landing page sections", () => {
    const html = renderToStaticMarkup(React.createElement(HomeSkeleton));

    expect(html).toContain('data-loading-pattern="home"');
    expect(html).toContain('data-home-skeleton-section="hero"');
    expect(html).toContain('data-home-skeleton-section="about"');
    expect(html).toContain('data-home-skeleton-section="features"');
    expect(html).toContain('data-home-skeleton-section="articles"');
    expect(html).toContain('data-home-skeleton-section="workflow"');
    expect(html).toContain('data-home-skeleton-section="footer"');
    expect(html).not.toContain('data-home-skeleton-section="testimonials"');
    expect(html).not.toContain('data-home-skeleton-section="contact"');
    expect(html.match(/data-home-skeleton-section=/g)).toHaveLength(6);
    expect(html).toContain("lg:grid-cols-[5fr_7fr]");
    expect(html.match(/md:grid-cols-3/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain("md:grid-cols-2");
    expect(html).not.toContain("grid min-h-screen place-items-center");
    expect(html).not.toContain(">Loading<");
  });

  it("keeps home loading state free of light-only landing colors", () => {
    const html = renderToStaticMarkup(React.createElement(HomeSkeleton));

    expect(html).toContain("bg-[var(--color-warm-canvas)]");
    expect(html).toContain("bg-[var(--color-card)]");
    expect(html).toContain("bg-[var(--color-parchment-card)]");
    expect(html).toContain("border-[var(--color-stone-surface)]");

    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(html).not.toContain("bg-white");
    expect(html).not.toContain("text-white");
    expect(html).not.toContain("border-white");
    expect(html).not.toContain("rgba(");
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
    "doctor/(portal)/loading.tsx",
    "doctor/status/loading.tsx",
    "doctor/(portal)/medical-record-library/loading.tsx",
    "doctor/(portal)/grants/[grantId]/loading.tsx",
    "doctor/onboarding/step-1/loading.tsx",
    "doctor/onboarding/step-2/loading.tsx",
    "doctor/onboarding/step-3/loading.tsx",
    "admin/(portal)/dashboard/loading.tsx",
    "admin/(portal)/approval/loading.tsx",
    "admin/(portal)/add-admin/loading.tsx",
    "admin/(portal)/doctors/[doctorId]/loading.tsx",
  ];

  it.each(routeLoadingFiles)("%s uses skeleton UI", (relativePath) => {
    const loadingPath = join(appDir, relativePath);

    expect(existsSync(loadingPath)).toBe(true);
    expect(readFileSync(loadingPath, "utf8")).toMatch(/Skeleton|LoadingCard/);
  });
});
