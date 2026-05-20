import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
];

async function mountViewportModalFixture(page: Page) {
  await page.evaluate(() => {
    const hostileContainer = document.createElement("section");
    hostileContainer.id = "hostile-modal-parent";
    hostileContainer.style.cssText = [
      "position: relative",
      "width: 320px",
      "height: 280px",
      "overflow: hidden",
      "transform: translate3d(180px, 120px, 0)",
      "border: 1px solid red",
    ].join(";");

    const overlay = document.createElement("div");
    overlay.setAttribute("data-viewport-modal-overlay", "");
    overlay.className = [
      "fixed inset-0 z-50 grid h-dvh w-screen place-items-center overflow-y-auto",
      "bg-black/35 px-3 py-4 sm:px-4 sm:py-6",
    ].join(" ");

    const panel = document.createElement("section");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("data-viewport-modal-panel", "");
    panel.style.width = "240px";
    panel.style.height = "160px";
    panel.style.background = "white";

    overlay.append(panel);
    document.body.append(hostileContainer, overlay);
  });
}

test.describe("viewport modal geometry", () => {
  for (const viewport of viewports) {
    test(`centers body-level modal overlay in the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await mountViewportModalFixture(page);

      const geometry = await page.locator("[data-viewport-modal-overlay]").evaluate((overlay) => {
        const overlayRect = overlay.getBoundingClientRect();
        const panelRect = overlay.querySelector("[data-viewport-modal-panel]")!.getBoundingClientRect();
        return {
          overlay: {
            x: overlayRect.x,
            y: overlayRect.y,
            width: overlayRect.width,
            height: overlayRect.height,
          },
          panelCenter: {
            x: panelRect.x + panelRect.width / 2,
            y: panelRect.y + panelRect.height / 2,
          },
          parentTag: overlay.parentElement?.tagName,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        };
      });

      expect(geometry.parentTag).toBe("BODY");
      expect(geometry.overlay.x).toBe(0);
      expect(geometry.overlay.y).toBe(0);
      expect(Math.abs(geometry.overlay.width - geometry.viewport.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.overlay.height - geometry.viewport.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.panelCenter.x - geometry.viewport.width / 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.panelCenter.y - geometry.viewport.height / 2)).toBeLessThanOrEqual(1);
    });
  }
});
