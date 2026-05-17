import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("patient dashboard header", () => {
  const source = readFileSync(new URL("./(portal)/layout.tsx", import.meta.url), "utf8");
  const layoutSource = readFileSync(new URL("./_components/patient-layout.tsx", import.meta.url), "utf8");
  const sharedLayoutSource = readFileSync(new URL("../_components/portal-layout.tsx", import.meta.url), "utf8");

  it("renders the shared authenticated header instead of an empty header shell", () => {
    expect(source).toContain("PatientLayout");
    expect(layoutSource).toContain("PortalLayout");
    expect(sharedLayoutSource).toContain('import { SharedHeader } from "@/components/shared-header";');
    expect(sharedLayoutSource).toContain("<SharedHeader");
    expect(sharedLayoutSource).toContain('authMode="authenticated"');
    expect(sharedLayoutSource).toContain("isAuthenticated");
    expect(sharedLayoutSource).toContain("showAuthAction={false}");
    expect(source).not.toContain("<header className=");
  });
});
