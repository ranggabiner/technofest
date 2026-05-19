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

    await page.getByRole("button", { name: /Ganti ke Bahasa Inggris/i }).click();
    await expect(page.getByRole("heading", { name: /Why Choose\s+MedProof\?/i })).toBeAttached();
    await expectLandingSectionsVisible(page);

    await page.getByRole("button", { name: /Switch to Indonesian/i }).click();
    await expect(page.getByRole("heading", { name: /Tentang\s+MedProof/i })).toBeAttached();
    await expectLandingSectionsVisible(page);
  });
});
