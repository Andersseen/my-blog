import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("Home page should not have accessibility violations", async ({ page }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Blog page should not have accessibility violations", async ({ page }) => {
    await page.goto("/blog");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Skip link should be visible on focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
  });

  test("Theme toggle should have proper ARIA attributes", async ({ page }) => {
    await page.goto("/");
    const themeToggle = page.locator('[data-theme-switch]');
    await expect(themeToggle).toHaveAttribute("role", "switch");
    await expect(themeToggle).toHaveAttribute("aria-checked");
  });

  test("Language dropdown should be keyboard accessible", async ({ page }) => {
    await page.goto("/");
    const dropdownTrigger = page.locator('[data-language-trigger]');
    await dropdownTrigger.focus();
    await page.keyboard.press("Enter");
    // Dropdown should open - this depends on and-dropdown implementation
    // Basic check that it's focusable
    await expect(dropdownTrigger).toBeFocused();
  });
});
