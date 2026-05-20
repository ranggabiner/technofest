import { expect, test, type Page } from "@playwright/test";

const pages = [
  { path: "/", name: "landing" },
  { path: "/articles", name: "articles" },
] as const;

const viewports = [
  { height: 720, name: "desktop", width: 1280 },
  { height: 844, name: "mobile", width: 390 },
] as const;

async function getHeaderMetrics(page: Page) {
  return page.locator("header").first().evaluate((header) => {
    const rect = header.getBoundingClientRect();
    const style = window.getComputedStyle(header);

    return {
      backgroundColor: style.backgroundColor,
      height: rect.height,
      position: style.position,
      top: rect.top,
      width: rect.width,
      zIndex: Number(style.zIndex),
    };
  });
}

test.describe("shared header scroll behavior", () => {
  for (const viewport of viewports) {
    for (const pageConfig of pages) {
      test(`keeps the ${pageConfig.name} header fixed on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageConfig.path);

        const header = page.locator("header").first();
        const main = page.locator("main").first();

        await expect(header).toBeVisible();
        await expect(main).toBeVisible();

        const beforeScroll = await getHeaderMetrics(page);
        const mainPaddingTop = await main.evaluate((element) =>
          Number.parseFloat(window.getComputedStyle(element).paddingTop),
        );

        expect(beforeScroll.position).toBe("fixed");
        expect(Math.round(beforeScroll.top)).toBe(0);
        expect(beforeScroll.height).toBeGreaterThan(0);
        expect(beforeScroll.width).toBeGreaterThanOrEqual(viewport.width - 1);
        expect(beforeScroll.zIndex).toBeGreaterThanOrEqual(50);
        expect(beforeScroll.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(mainPaddingTop).toBeGreaterThanOrEqual(beforeScroll.height - 1);

        await page.evaluate(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo(0, Math.min(900, Math.max(0, maxScroll)));
        });

        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        await expect.poll(async () => Math.round((await getHeaderMetrics(page)).top)).toBe(0);

        const afterScroll = await getHeaderMetrics(page);

        expect(afterScroll.position).toBe("fixed");
        expect(afterScroll.width).toBeGreaterThanOrEqual(viewport.width - 1);
        expect(afterScroll.height).toBe(beforeScroll.height);
      });
    }
  }
});
