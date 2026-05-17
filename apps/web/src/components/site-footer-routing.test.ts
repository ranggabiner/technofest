import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readApp(path: string) {
  return readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
}

function readComponent(path: string) {
  return readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
}

function readLoginSurface(path: string) {
  return `${readApp(path)}\n${readApp("login/_components/login-content.tsx")}`;
}

describe("site footer route coverage", () => {
  it("uses the shared site footer on public and auth pages", () => {
    for (const source of [
      readApp("page.tsx"),
      readLoginSurface("login/page.tsx"),
      readLoginSurface("login/demo/page.tsx"),
      readLoginSurface("login/real/page.tsx"),
      readApp("login/role/page.tsx"),
      readApp("articles/page.tsx"),
      readApp("articles/[slug]/page.tsx"),
    ]) {
      expect(source).toContain('import { SiteFooter');
      expect(source).toContain("<SiteFooter");
      expect(source).not.toContain("MarketingFooter");
      expect(source).not.toContain("function LandingFooter");
      expect(source).not.toContain("FooterList");
    }
  });

  it("adds the shared footer through authenticated route shells", () => {
    for (const path of [
      "onboarding-shell.tsx",
      "../app/_components/portal-layout.tsx",
      "../app/patient/onboarding/_components/patient-onboarding-shell.tsx",
    ]) {
      const source = path.startsWith("../app/")
        ? readFileSync(new URL(path, import.meta.url), "utf8")
        : readComponent(path);

      expect(source).toContain("SiteFooter");
      expect(source).not.toContain("MarketingFooter");
    }
  });

  it("keeps standalone patient chat outside the patient portal shell but still renders the shared footer", () => {
    const source = readApp("patient/chat/page.tsx");

    expect(source).not.toContain("PatientLayout");
    expect(source).toContain("SiteFooter");
  });

  it("keeps the shared footer below the first viewport on sparse pages", () => {
    expect(readLoginSurface("login/page.tsx")).toContain('className="flex min-h-screen flex-1 flex-col"');
    expect(readApp("login/role/page.tsx")).toContain('className="flex min-h-screen flex-1 items-center justify-center');
    expect(readComponent("onboarding-shell.tsx")).toContain("mx-auto flex min-h-screen w-full max-w-[1100px] flex-1 flex-col px-6 py-20");
    expect(readFileSync(new URL("../app/_components/portal-layout.tsx", import.meta.url), "utf8")).toContain(
      "mx-auto grid min-h-screen max-w-[1400px]",
    );
    expect(readFileSync(new URL("../app/patient/onboarding/_components/patient-onboarding-shell.tsx", import.meta.url), "utf8")).toContain(
      "flex min-h-screen flex-1 items-center justify-center",
    );
  });
});
