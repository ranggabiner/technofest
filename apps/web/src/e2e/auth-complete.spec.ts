import { expect, test } from "@playwright/test";

test.describe("auth completion handoff", () => {
  test("replaces the completion URL with the sanitized next path", async ({ page }) => {
    await page.goto("/auth/complete?next=%2Flogin%2Frole");

    await expect(page).toHaveURL(/\/login$/);
  });
});
