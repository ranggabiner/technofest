import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
  { name: "short mobile", width: 390, height: 520 },
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

async function mountLongFixedFooterModalFixture(page: Page) {
  await page.evaluate(() => {
    const overlay = document.createElement("div");
    overlay.setAttribute("data-viewport-modal-overlay", "");
    overlay.className = [
      "fixed inset-0 z-50 grid h-dvh w-screen place-items-center overflow-y-auto",
      "bg-black/35 px-3 py-4 sm:px-4 sm:py-6",
    ].join(" ");

    const panel = document.createElement("form");
    panel.setAttribute("data-viewport-modal-panel", "");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.className = [
      "grid max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-[640px]",
      "grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[18px] bg-white",
    ].join(" ");

    const header = document.createElement("header");
    header.textContent = "Long modal header";
    header.style.cssText = "height: 120px; padding: 16px; box-sizing: border-box;";

    const body = document.createElement("div");
    body.setAttribute("data-long-modal-body", "");
    body.className = "grid min-h-0 gap-6 overflow-y-auto px-4 pb-5";

    const content = document.createElement("div");
    content.style.height = "1200px";
    content.textContent = "Long modal content";
    body.append(content);

    const footer = document.createElement("footer");
    footer.setAttribute("data-long-modal-footer", "");
    footer.textContent = "Cancel Allow";
    footer.style.cssText = "height: 96px; padding: 16px; box-sizing: border-box;";

    panel.append(header, body, footer);
    overlay.append(panel);
    document.body.append(overlay);
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

    test(`keeps fixed-footer modal actions reachable with long content in the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await mountLongFixedFooterModalFixture(page);

      const geometry = await page.locator("[data-viewport-modal-panel]").evaluate((panel) => {
        const panelRect = panel.getBoundingClientRect();
        const body = panel.querySelector("[data-long-modal-body]") as HTMLElement;
        const footer = panel.querySelector("[data-long-modal-footer]") as HTMLElement;
        const footerRect = footer.getBoundingClientRect();

        body.scrollTop = body.scrollHeight;

        return {
          bodyClientHeight: body.clientHeight,
          bodyScrollHeight: body.scrollHeight,
          bodyScrollTop: body.scrollTop,
          footerBottom: footerRect.bottom,
          panelBottom: panelRect.bottom,
          panelTop: panelRect.top,
          viewportHeight: window.innerHeight,
        };
      });

      expect(geometry.panelTop).toBeGreaterThanOrEqual(0);
      expect(geometry.panelBottom).toBeLessThanOrEqual(geometry.viewportHeight);
      expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.viewportHeight);
      expect(geometry.bodyScrollHeight).toBeGreaterThan(geometry.bodyClientHeight);
      expect(geometry.bodyScrollTop).toBeGreaterThan(0);
    });
  }
});
