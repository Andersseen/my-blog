import { test, expect } from "@playwright/test";

test.describe("404 Page", () => {
  test("shows custom 404 for unknown routes", async ({ page }) => {
    const response = await page.goto("/non-existent-page");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(/not found|no encontrada|не знайдено/i);
  });

  test("404 page has link back to home", async ({ page }) => {
    await page.goto("/non-existent-page");
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
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
    const toggle = page.locator('[data-theme-switch]');
    await toggle.click();
    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");
    expect(theme).toMatch(/light|dark/);
  });
});
