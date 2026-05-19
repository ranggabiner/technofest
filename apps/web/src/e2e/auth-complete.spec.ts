import { expect, test } from "@playwright/test";

test.describe("auth completion handoff", () => {
  test("renders a styled first frame without the app stylesheet", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.route("**/_next/static/**/*.css", async (route) => {
      await route.fulfill({
        body: "",
        contentType: "text/css",
        status: 200,
      });
    });

    await page.goto("/auth/complete?next=%2Flogin%2Frole");

    const shell = page.locator(".auth-complete-shell, .root-loading-shell").first();
    const card = page.locator(".auth-complete-card, .root-loading-card").first();

    await expect(shell).toBeVisible();
    await expect(card).toBeVisible();

    const shellStyles = await shell.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        display: styles.display,
        minHeight: styles.minHeight,
        placeItems: styles.placeItems,
      };
    });
    const cardStyles = await card.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        textAlign: styles.textAlign,
      };
    });

    expect(shellStyles.display).toBe("grid");
    expect(shellStyles.placeItems).toBe("center");
    expect(shellStyles.minHeight).toMatch(/100(d?vh|%)/);
    expect(shellStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(cardStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(cardStyles.borderRadius).not.toBe("0px");
    expect(cardStyles.textAlign).toBe("center");

    await context.close();
  });

  test("replaces the completion URL with the sanitized next path", async ({ page }) => {
    await page.goto("/auth/complete?next=%2Flogin%2Frole");

    await expect(page).toHaveURL(/\/login$/);
  });
});
