import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckCircle2 } from "lucide-react";

import { AppToast, APP_TOAST_AUTO_DISMISS_MS } from "./app-toast";

describe("shared app toast", () => {
  const source = readFileSync(new URL("./app-toast.tsx", import.meta.url), "utf8");
  const globals = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  it("uses a non-blocking top-right container with the existing visual style", () => {
    expect(source).toContain('"use client"');
    expect(APP_TOAST_AUTO_DISMISS_MS).toBe(4000);
    expect(source).toContain("fixed right-4 top-4 z-50");
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("pointer-events-auto");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("shadow-[var(--shadow-elevated)]");
  });

  it("schedules auto-dismiss from the effect each time the toast trigger is active", () => {
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).not.toContain("previousTriggerKeyRef");
  });

  it("supports the standard success, error, warning, and info variants", () => {
    expect(source).toContain('"success" | "warning" | "danger" | "error" | "info"');
    expect(source).toContain('tone === "info"');
    expect(source).toContain('tone === "error" || tone === "danger"');
  });

  it("allows manual dismissal from the shared toast implementation", () => {
    expect(source).toContain("setDismissedToast");
    expect(source).toContain('aria-label="Dismiss notification"');
  });

  it("uses the shared toast motion hook with reduced-motion support", () => {
    expect(source).toContain("data-app-toast");
    expect(globals).toContain("[data-app-toast]");
    expect(globals).toContain("app-toast-enter");
    expect(globals).toContain("translate3d(0, -8px, 0)");
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globals).toContain("[data-app-toast]");
  });

  it("renders success tone with the check icon", () => {
    const html = renderToStaticMarkup(
      React.createElement(AppToast, {
        message: "Changes saved successfully",
        triggerKey: 1,
        icon: React.createElement(CheckCircle2),
      }),
    );

    expect(html).toContain("Changes saved successfully");
  });
});
