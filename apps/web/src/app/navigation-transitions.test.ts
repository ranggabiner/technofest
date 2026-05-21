import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDir = join(process.cwd(), "src", "app");
const componentDir = join(process.cwd(), "src", "components");

function appSource(path: string) {
  return readFileSync(join(appDir, path), "utf8");
}

function componentSource(path: string) {
  return readFileSync(join(componentDir, path), "utf8");
}

function cssRule(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);

  const end = source.indexOf("\n}", start);
  expect(end).toBeGreaterThan(start);

  return source.slice(start, end + 2);
}

function keyframesRule(source: string, name: string) {
  const start = source.indexOf(`@keyframes ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);

  const nextKeyframes = source.indexOf("\n@keyframes ", start + 1);
  const nextMedia = source.indexOf("\n@media ", start + 1);
  const nextRule =
    [nextKeyframes, nextMedia].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? source.length;

  return source.slice(start, nextRule);
}

describe("navigation transition architecture", () => {
  it("wraps the app in a reusable route transition provider", () => {
    const layout = appSource("layout.tsx");
    const transitionPath = join(componentDir, "route-transition.tsx");

    expect(existsSync(transitionPath)).toBe(true);
    expect(layout).toContain('import { RouteTransitionProvider } from "@/components/route-transition";');
    expect(layout).toContain("<RouteTransitionProvider refreshKey={locale}>");
    expect(layout).toContain("</RouteTransitionProvider>");
    expect(layout).toContain('id="app-shell"');
    expect(layout).toContain("data-app-shell");
  });

  it("centralizes pending delay, link capture, and content-local transition surfaces", () => {
    const source = componentSource("route-transition.tsx");

    expect(source).toContain("pendingSkeletonDelayMs");
    expect(source).toContain("document.addEventListener(\"click\"");
    expect(source).toContain("beginRouteTransition");
    expect(source).toContain("beginRouteRefreshTransition");
    expect(source).toContain("pendingRefreshKey");
    expect(source).toContain("visiblePendingRefreshKey");
    expect(source).toContain("pendingRefreshKey !== refreshKey");
    expect(source).toContain("visiblePendingHref || visiblePendingRefreshKey");
    expect(source).toContain("RouteTransitionSurface");
    expect(source).toContain("data-route-transition-surface");
    expect(source).toContain("data-route-transition-current");
    expect(source).toContain("data-route-transition-skeleton");
    expect(source).toContain("element.style.minHeight");
    expect(source).toContain("DelayedRouteSkeleton");
    expect(source).toContain("showPendingSkeleton");
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
  });

  it("defines subtle route transition CSS with reduced-motion support", () => {
    const css = appSource("globals.css");

    expect(css).toContain("[data-route-transition-page]");
    expect(css).toContain("[data-route-transition-surface]");
    expect(css).toContain("[data-route-transition-skeleton]");
    expect(css).toContain("@keyframes app-route-page-enter");
    expect(css).toContain("@keyframes app-route-content-enter");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("transition: none");
  });

  it("keeps page-level route transitions from creating fixed-position containing blocks", () => {
    const css = appSource("globals.css");

    expect(cssRule(css, "[data-route-transition-page]")).toContain("app-route-page-enter");
    expect(keyframesRule(css, "app-route-page-enter")).not.toContain("transform");
    expect(cssRule(css, "[data-route-transition-current]")).toContain("app-route-content-enter");
    expect(keyframesRule(css, "app-route-content-enter")).toContain("translate3d(0, 4px, 0)");
  });

  it("replaces stale portal content with the delayed skeleton instead of overlaying it", () => {
    const source = componentSource("route-transition.tsx");
    const css = appSource("globals.css");

    expect(source).toContain("fallback={currentContent}");
    expect(source).toContain("const pendingSkeleton = showPendingSkeleton ? renderSkeleton(pendingPath) : null");
    expect(source).toContain("if (!pendingSkeleton) return fallback");
    expect(source).toContain("<div data-route-transition-skeleton=\"\" aria-hidden=\"true\">");
    expect(source).toContain("<div key={pathname} data-route-transition-current=\"\">");

    const skeletonRule = cssRule(css, "[data-route-transition-skeleton]");
    expect(skeletonRule).not.toContain("position: absolute");
    expect(skeletonRule).not.toContain("inset: 0");
    expect(skeletonRule).not.toContain("z-index");
    expect(skeletonRule).not.toContain("transparent");
    expect(skeletonRule).toContain("background: var(--color-warm-canvas)");
  });

  it("uses the shared transition surface for portal content instead of local skeleton timing", () => {
    const portalNavigation = appSource("_components/portal-navigation.tsx");

    expect(portalNavigation).toContain('RouteTransitionSurface');
    expect(portalNavigation).toContain('from "@/components/route-transition"');
    expect(portalNavigation).not.toContain("pendingSkeletonDelayMs");
    expect(portalNavigation).not.toContain("setVisiblePendingPath");
  });
});
