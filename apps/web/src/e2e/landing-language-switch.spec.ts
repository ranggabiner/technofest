import { expect, test, type Page } from "@playwright/test";

async function expectRevealGroupVisible(page: Page, group: string, expectedCount: number) {
  const locator = page.locator(`[data-scroll-reveal-group="${group}"]`);

  await expect(locator).toHaveCount(expectedCount);
  await expect
    .poll(
      () =>
        locator.evaluateAll((nodes) =>
          nodes.every((node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();

            return style.opacity === "1" && rect.width > 0 && rect.height > 0;
          }),
        ),
      { message: `${group} reveal nodes are visible` },
    )
    .toBe(true);
}

async function expectLandingSectionsVisible(page: Page) {
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expectRevealGroupVisible(page, "about-section", 1);
  await expectRevealGroupVisible(page, "about-image", 1);
  await expectRevealGroupVisible(page, "about-card", 2);

  await page.locator("#features").scrollIntoViewIfNeeded();
  await expectRevealGroupVisible(page, "features-section", 1);
  await expectRevealGroupVisible(page, "feature-card", 3);

  await page.locator("#workflow").scrollIntoViewIfNeeded();
  await expectRevealGroupVisible(page, "workflow-section", 1);
  await expectRevealGroupVisible(page, "workflow-step", 3);
}

test.describe("landing language switch", () => {
  test("keeps About, Why Choose, and How It Works components visible across supported locales", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Tentang\s+MedProof/i })).toBeAttached();
    await expectLandingSectionsVisible(page);

    await installRoutePendingObserver(page);
    await page.getByRole("button", { name: /Ganti ke Bahasa Inggris/i }).click();
    await expect.poll(() => sawRoutePending(page), { message: "top route loading bar appeared" }).toBe(true);
    await expect(page.getByRole("heading", { name: /Why Choose\s+MedProof\?/i })).toBeAttached();
    await expect(page.locator("[data-route-transition-root]")).not.toHaveAttribute("data-route-transition-pending", "true");
    await expectLandingSectionsVisible(page);

    await installRoutePendingObserver(page);
    await page.getByRole("button", { name: /Switch to Indonesian/i }).click();
    await expect.poll(() => sawRoutePending(page), { message: "top route loading bar appeared" }).toBe(true);
    await expect(page.getByRole("heading", { name: /Tentang\s+MedProof/i })).toBeAttached();
    await expect(page.locator("[data-route-transition-root]")).not.toHaveAttribute("data-route-transition-pending", "true");
    await expectLandingSectionsVisible(page);
  });
});

async function installRoutePendingObserver(page: Page) {
  await page.evaluate(() => {
    const key = "__medproofRoutePendingObserver";
    const previous = (window as Window & { [key]?: MutationObserver })[key];
    previous?.disconnect();

    const root = document.querySelector("[data-route-transition-root]");
    (window as Window & {
      __medproofSawRoutePending?: boolean;
      [key]?: MutationObserver;
    }).__medproofSawRoutePending = root?.getAttribute("data-route-transition-pending") === "true";

    if (!root) return;

    const observer = new MutationObserver(() => {
      if (root.getAttribute("data-route-transition-pending") === "true") {
        (window as Window & { __medproofSawRoutePending?: boolean }).__medproofSawRoutePending = true;
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-route-transition-pending"] });
    (window as Window & { [key]?: MutationObserver })[key] = observer;
  });
}

async function sawRoutePending(page: Page) {
  return page.evaluate(() => Boolean((window as Window & { __medproofSawRoutePending?: boolean }).__medproofSawRoutePending));
}
