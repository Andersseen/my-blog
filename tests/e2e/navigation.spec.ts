import { test, expect } from "@playwright/test";

test.describe("404 Page", () => {
  test("shows custom 404 for unknown routes", async ({ page }) => {
    const response = await page.goto("/non-existent-page");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(/not found|no encontrada|не знайдено/i);
  });

  test("404 page has link back to home", async ({ page }) => {
    await page.goto("/non-existent-page");
    // The 404 page links back to home; wait for it to be visible
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Blog", () => {
  test("blog index loads successfully", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");
    // Wait for the theme toggle web component to hydrate
    // Use .first() because there are two instances (desktop + mobile drawer)
    const toggle = page.locator('[data-theme-switch]').first();
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Get initial theme
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    expect(initialTheme).toMatch(/light|dark/);

    // Click and verify theme changed
    await toggle.click();
    // Small wait for the theme transition
    await page.waitForTimeout(300);
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).toMatch(/light|dark/);
    expect(newTheme).not.toBe(initialTheme);
  });
});
