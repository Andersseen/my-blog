import { expect, test } from "@playwright/test";

test("home page renders architecture headline", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /propio blog|own blog|власний блог/i }),
  ).toBeVisible();
});

test.describe("navbar", () => {
  // Web components may take time to hydrate in CI
  test.setTimeout(15000);

  test("navbar is visible and contains blog link", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    // Wait for custom elements to hydrate
    await page.waitForSelector("and-navbar", { state: "attached", timeout: 10000 });

    const navbar = page.locator("and-navbar");
    await expect(navbar).toBeVisible();

    // Verify the navbar items attribute contains blog route
    const items = await navbar.getAttribute("items");
    expect(items).toContain("/blog");
  });

  test("navbar has locale-aware routes", async ({ page }) => {
    const localeCases = [
      { path: "/", blogHref: "/blog" },
      { path: "/en", blogHref: "/en/blog" },
      { path: "/ua", blogHref: "/ua/blog" },
    ];

    await page.setViewportSize({ width: 1024, height: 768 });

    for (const localeCase of localeCases) {
      await page.goto(localeCase.path);
      await page.waitForSelector("and-navbar", { state: "attached", timeout: 10000 });

      const navbar = page.locator("and-navbar");
      const items = await navbar.getAttribute("items");
      expect(items).toContain(localeCase.blogHref);
    }
  });
});
