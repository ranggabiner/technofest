import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const motionUrl = new URL("./motion.ts", import.meta.url);

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("shared motion utilities", () => {
  it("centralizes subtle transform and opacity transitions", () => {
    expect(existsSync(motionUrl)).toBe(true);

    const motion = readFileSync(motionUrl, "utf8");

    expect(motion).toContain("motion");
    expect(motion).toContain("motion-safe:transition");
    expect(motion).toContain("motion-safe:duration-200");
    expect(motion).toContain("motion-safe:ease-out");
    expect(motion).toContain("motion-reduce:transition-none");
    expect(motion).toContain("hover:-translate-y-0.5");
    expect(motion).toContain("active:scale-[0.98]");
    expect(motion).not.toMatch(new RegExp("transition-(?:\\[)?(?:width|height|margin|padding|left|top)"));
  });

  it("is used by core UI seams instead of repeating bare transition classes", () => {
    const button = source("./button.tsx");
    const card = source("./card.tsx");
    const form = source("./form.tsx");
    const asyncButton = source("./async-action-button.tsx");

    expect(button).toContain('import { motion } from "@/components/ui/motion";');
    expect(button).toContain("motion.button");
    expect(card).toContain('import { motion } from "@/components/ui/motion";');
    expect(card).toContain("motion.card");
    expect(form).toContain('import { motion } from "@/components/ui/motion";');
    expect(form).toContain("motion.input");
    expect(asyncButton).toContain("motion.loadingContent");
  });

  it("is used by shared navigation and high-traffic menus", () => {
    const sharedHeader = readFileSync(new URL("../shared-header.tsx", import.meta.url), "utf8");
    const portalNavigation = readFileSync(new URL("../../app/_components/portal-navigation.tsx", import.meta.url), "utf8");

    expect(sharedHeader).toContain('import { motion } from "@/components/ui/motion";');
    expect(sharedHeader).toContain("motion.menuTrigger");
    expect(sharedHeader).toContain("motion.menuPanel");
    expect(portalNavigation).toContain('import { motion } from "@/components/ui/motion";');
    expect(portalNavigation).toContain("motion.navItem");
  });
});
