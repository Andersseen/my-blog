import { expect, test } from "@playwright/test";

test("home page renders architecture headline", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /propio blog/i }),
  ).toBeVisible();
});

test("mobile header menu toggles and closes with escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menuToggle = page.locator("[data-mobile-nav-toggle]");
  const mobilePanel = page.locator("[data-mobile-nav-panel]");

  await expect(menuToggle).toBeVisible();
  await expect(mobilePanel).toBeHidden();

  await menuToggle.click();
  await expect(mobilePanel).toBeVisible();
  await expect(mobilePanel.getByRole("link", { name: /blog/i })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(mobilePanel).toBeHidden();
});
