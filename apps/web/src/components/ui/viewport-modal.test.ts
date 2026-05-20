import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentUrl = new URL("./viewport-modal.tsx", import.meta.url);

describe("ViewportModal", () => {
  it("renders modal overlays through document.body", () => {
    expect(existsSync(componentUrl)).toBe(true);

    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("createPortal");
    expect(source).toContain("document.body");
    expect(source).toContain("data-viewport-modal-overlay");
    expect(source).toContain("data-viewport-modal-state");
    expect(source).toContain("data-viewport-modal-panel");
  });

  it("defines fixed viewport centering independent of parent layout", () => {
    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain("fixed inset-0");
    expect(source).toContain("h-dvh");
    expect(source).toContain("w-screen");
    expect(source).toContain("grid");
    expect(source).toContain("place-items-center");
    expect(source).toContain("overflow-y-auto");
  });

  it("keeps panel height and scroll behavior safe by default", () => {
    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain('as?: "article" | "div" | "form" | "section"');
    expect(source).toContain("max-h-[calc(100dvh-2rem)]");
    expect(source).toContain("min-h-0");
    expect(source).toContain("overflow-y-auto");
  });

  it("locks body scroll with ref counting for nested modals", () => {
    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain("activeScrollLocks");
    expect(source).toContain("previousBodyOverflow");
    expect(source).toContain('document.body.style.overflow = "hidden"');
    expect(source).toContain("Math.max(0, activeScrollLocks - 1)");
  });

  it("keeps modal enter and exit animation hooks inside the viewport portal seam", () => {
    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain("ViewportModalPanel");
    expect(source).toContain("isExiting");
    expect(source).toContain("modalExitDurationMs");
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("motion.modalOverlay");
    expect(source).toContain("motion.modalPanel");
  });
});
