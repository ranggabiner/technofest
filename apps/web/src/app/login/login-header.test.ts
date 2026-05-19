import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("login header", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const demoSource = readOptionalSource("./demo/page.tsx");
  const realSource = readOptionalSource("./real/page.tsx");
  const authCompleteSource = readFileSync(new URL("../auth/complete/page.tsx", import.meta.url), "utf8");
  const authCompleteLoadingSource = readOptionalSource("../auth/complete/loading.tsx");
  const authCompleteScreenSource = readOptionalSource("../auth/complete/auth-complete-loading-screen.tsx");
  const roleSelectionSource = readFileSync(new URL("./role/page.tsx", import.meta.url), "utf8");
  const sharedSource = readOptionalSource("./_components/login-content.tsx");
  const callbackRouteSource = readFileSync(new URL("../auth/callback/route.ts", import.meta.url), "utf8");
  const actions = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
  const sessionSource = readFileSync(new URL("../../lib/auth/session.ts", import.meta.url), "utf8");
  const loginSurface = [source, sharedSource].join("\n");
  const demoSurface = [demoSource, sharedSource].join("\n");
  const realSurface = [realSource, sharedSource].join("\n");

  it("removes default marketing nav and login action while preserving the public shared header", () => {
    expect(loginSurface).toContain('<SharedHeader authMode="public" navigationItems={[]} showAuthAction={false} />');
  });

  it("keeps the initial login page as a two-option chooser", () => {
    expect(source).toContain("LoginOptionGrid");
    expect(source).toContain("loginDemoHref");
    expect(source).toContain("loginRealHref");
    expect(source).not.toContain("ManualLoginForm");
    expect(source).not.toContain("GoogleLoginForm");
    expect(source).not.toContain("DemoCredentials");
  });

  it("keeps manual demo credentials on the dedicated demo login page", () => {
    expect(demoSurface).toContain("ManualLoginForm");
    expect(demoSurface).toContain("DemoCredentials");
    expect(demoSurface).toContain('type="email"');
    expect(demoSurface).toContain('type="password"');
    expect(demoSource).not.toContain("GoogleLoginForm");
    for (const email of ["dokter@test.com", "pasien@test.com", "superadmin@test.com", "admin@test.com"]) {
      expect(demoSurface).toContain(email);
    }
  });

  it("places demo credentials beside the manual login form on desktop and before it on mobile", () => {
    expect(sharedSource).toContain("desktopAside");
    expect(demoSource).toContain("desktopAside={<DemoCredentials copy={loginCopy} />}");
    expect(demoSource).toContain('desktopBreakpoint="lg"');

    const renderContentStart = demoSource.indexOf("renderContent={(variant)");
    const mobileCredentials = demoSource.indexOf("variant === \"mobile\" ? <DemoCredentials copy={loginCopy} /> : null");
    const manualForm = demoSource.indexOf("<ManualLoginForm copy={loginCopy} />");
    const trailingCredentials = demoSource.indexOf("variant === \"desktop\" ? null : <DemoCredentials copy={loginCopy} />");

    expect(renderContentStart).toBeGreaterThan(-1);
    expect(mobileCredentials).toBeGreaterThan(renderContentStart);
    expect(manualForm).toBeGreaterThan(mobileCredentials);
    expect(trailingCredentials).toBe(-1);
  });

  it("keeps Google OAuth on the dedicated real-account login page", () => {
    expect(realSurface).toContain("GoogleLoginForm");
    expect(realSurface).toContain("startGoogleOAuthAction");
    expect(realSurface).toContain("PendingSubmitButton");
    expect(realSurface).toContain("loadingLabel={loginCopy.oauthSubmitting}");
    expect(realSource).not.toContain("ManualLoginForm");
    expect(realSource).not.toContain("DemoCredentials");
  });

  it("authenticates manual demo login through Supabase password auth without touching OAuth", () => {
    expect(actions).toContain("startGoogleOAuthAction");
    expect(actions).toContain("startManualLoginAction");
    expect(actions).toContain("signInWithOAuth");
    expect(actions).toContain("signInWithPassword");
    expect(actions).toContain("allowedManualDemoEmails");
    expect(actions).toContain("manual_invalid");
    expect(demoSurface).toContain("PendingSubmitButton");
    expect(demoSurface).toContain("loadingLabel={copy.manualSubmitting}");

    for (const email of ["dokter@test.com", "pasien@test.com", "superadmin@test.com", "admin@test.com"]) {
      expect(actions).toContain(email);
    }
  });

  it("routes auth errors back to the matching login surface", () => {
    expect(actions).toContain('redirect("/login/real?error=oauth_start_failed")');
    expect(actions).toContain('redirect("/login/demo?error=manual_invalid")');
    expect(callbackRouteSource).toContain('new URL("/login/real", request.url)');
  });

  it("routes successful auth through a redirect-only completion handoff", () => {
    expect(actions).toContain("postLoginHandoffPath(roleEntryPath(role))");
    expect(callbackRouteSource).toContain("postLoginHandoffPath(redirectPath)");
    expect(roleSelectionSource).toContain("postLoginHandoffPath(roleEntryPath(role))");
    expect(sessionSource).toContain('postLoginHandoffPath(publicRouteRedirectPath(role) ?? "/login/role")');
    expect(sessionSource).toContain("postLoginHandoffPath(roleEntryPath(role))");
    expect(authCompleteSource).toContain("PostLoginRedirect");
    expect(authCompleteSource).not.toContain("AuthCompleteLoadingScreen");
    expect(authCompleteLoadingSource).toBe("");
    expect(authCompleteScreenSource).toBe("");
    const dashboardLoadingCopy = new RegExp(
      ["Menyiapkan", "dashboard"].join(" ") + "|" + ["Preparing", "dashboard"].join(" "),
    );
    expect([authCompleteSource, authCompleteLoadingSource, authCompleteScreenSource].join("\n")).not.toMatch(dashboardLoadingCopy);
  });

  it("removes the card-level copyright from login surfaces while keeping privacy copy", () => {
    for (const surface of [loginSurface, demoSurface, realSurface]) {
      expect(surface).not.toContain("copyright={copy.common.copyright}");
      expect(surface).not.toContain("copyright:");
      expect(surface).toContain("copy.privacy");
    }
  });
});

function readOptionalSource(path: string) {
  const sourceUrl = new URL(path, import.meta.url);
  return existsSync(sourceUrl) ? readFileSync(sourceUrl, "utf8") : "";
}
