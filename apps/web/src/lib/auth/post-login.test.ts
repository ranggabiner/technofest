import { describe, expect, it } from "vitest";

import { postLoginHandoffPath, sanitizePostLoginNextPath } from "./post-login";

describe("post-login handoff paths", () => {
  it("keeps safe role destination paths", () => {
    expect(sanitizePostLoginNextPath("/patient")).toBe("/patient");
    expect(sanitizePostLoginNextPath("/patient/onboarding/step-3")).toBe("/patient/onboarding/step-3");
    expect(sanitizePostLoginNextPath("/doctor/onboarding/step-1")).toBe("/doctor/onboarding/step-1");
    expect(sanitizePostLoginNextPath("/admin/dashboard?tab=doctors#queue")).toBe("/admin/dashboard?tab=doctors#queue");
    expect(sanitizePostLoginNextPath("/superadmin/dashboard")).toBe("/superadmin/dashboard");
    expect(sanitizePostLoginNextPath("/login/role")).toBe("/login/role");
  });

  it("rejects external and non-role destinations", () => {
    for (const rawPath of [
      null,
      "",
      "patient",
      "https://evil.example/patient",
      "//evil.example/patient",
      "/_next/static/chunks/app.css",
      "/api/patient/ai/chat",
      "/login",
      "/articles",
    ]) {
      expect(sanitizePostLoginNextPath(rawPath)).toBe("/login/role");
    }
  });

  it("builds encoded auth completion URLs", () => {
    expect(postLoginHandoffPath("/patient")).toBe("/auth/complete?next=%2Fpatient");
    expect(postLoginHandoffPath("/admin/dashboard?tab=doctors#queue")).toBe(
      "/auth/complete?next=%2Fadmin%2Fdashboard%3Ftab%3Ddoctors%23queue",
    );
    expect(postLoginHandoffPath("https://evil.example/patient")).toBe("/auth/complete?next=%2Flogin%2Frole");
  });
});
