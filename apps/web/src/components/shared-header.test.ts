import { describe, expect, it } from "vitest";

import { MEDPROOF_LOGO_SRC, resolveSharedHeaderAction } from "./shared-header";

describe("shared header state", () => {
  it("uses the copied public MedProof logo asset", () => {
    expect(MEDPROOF_LOGO_SRC).toBe("/medproof-logo.webp");
  });

  it("shows public actions for unauthenticated context", () => {
    expect(resolveSharedHeaderAction({ authMode: "auto", isAuthenticated: false })).toBe("login");
  });

  it("shows logout for authenticated context", () => {
    expect(resolveSharedHeaderAction({ authMode: "auto", isAuthenticated: true })).toBe("logout");
  });

  it("lets page context force public or authenticated actions", () => {
    expect(resolveSharedHeaderAction({ authMode: "public", isAuthenticated: true })).toBe("login");
    expect(resolveSharedHeaderAction({ authMode: "authenticated", isAuthenticated: false })).toBe("logout");
  });
});
