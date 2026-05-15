import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("patient dashboard header", () => {
  const source = readFileSync(new URL("./(portal)/layout.tsx", import.meta.url), "utf8");
  const layoutSource = readFileSync(new URL("./_components/patient-layout.tsx", import.meta.url), "utf8");

  it("renders the shared authenticated header instead of an empty header shell", () => {
    expect(source).toContain("PatientLayout");
    expect(layoutSource).toContain('import { SharedHeader } from "@/components/shared-header";');
    expect(layoutSource).toContain("<SharedHeader");
    expect(layoutSource).toContain('authMode="authenticated"');
    expect(layoutSource).toContain("isAuthenticated");
    expect(source).not.toContain("<header className=");
  });
});
