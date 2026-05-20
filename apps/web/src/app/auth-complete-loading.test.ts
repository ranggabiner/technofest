import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PostLoginDestinationSkeleton } from "./auth/complete/post-login-destination-skeleton";

describe("auth completion loading skeleton", () => {
  it.each([
    ["/patient", "patient-dashboard"],
    ["/doctor", "doctor-dashboard"],
    ["/admin/dashboard", "admin-dashboard"],
    ["/superadmin/dashboard", "superadmin-dashboard"],
  ])("renders the dashboard skeleton for %s", (nextPath, loadingPattern) => {
    const html = renderToStaticMarkup(
      React.createElement(PostLoginDestinationSkeleton, { nextPath }),
    );

    expect(html).toContain(`data-loading-pattern="${loadingPattern}"`);
    expect(html).not.toContain("data-loading-pattern=\"auth\"");
  });

  it("keeps unresolved role handoff on the role selection skeleton", () => {
    const html = renderToStaticMarkup(
      React.createElement(PostLoginDestinationSkeleton, { nextPath: "/login/role" }),
    );

    expect(html).toContain("min-h-screen");
    expect(html).not.toContain("data-loading-pattern=\"patient-dashboard\"");
  });
});
