import { expect, test } from "@playwright/test";

test("home page renders architecture headline", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /propio blog/i }),
  ).toBeVisible();
});

test("navbar mobile menu toggles and closes with escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const navbar = page.locator("[data-main-navbar]");
  const menuToggle = navbar.locator("button.mobile-toggle-btn");
  const mobileBlogLink = navbar.locator('and-drawer a[href="/blog"]');

  await expect(navbar).toBeVisible();
  await expect(menuToggle).toBeVisible();
  await expect(menuToggle).toHaveAttribute("data-state", "closed");

  await menuToggle.focus();
  await page.keyboard.press("Enter");
  await expect(menuToggle).toHaveAttribute("data-state", "open");
  await expect(mobileBlogLink).toBeVisible();

  await mobileBlogLink.focus();

  await page.keyboard.press("Escape");
  await expect(menuToggle).toHaveAttribute("data-state", "closed");
  await expect(menuToggle).toBeVisible();
});

test("navbar keeps locale-safe blog/about routes", async ({ page }) => {
  const escapeForRegex = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const localeCases = [
    { path: "/", blogHref: "/blog", aboutHref: "/about" },
    { path: "/en", blogHref: "/en/blog", aboutHref: "/en/about" },
    { path: "/ua", blogHref: "/ua/blog", aboutHref: "/ua/about" },
  ];

  await page.setViewportSize({ width: 1024, height: 768 });

  for (const localeCase of localeCases) {
    await page.goto(localeCase.path);

    const navbar = page.locator("[data-main-navbar]");
    const blogHrefPattern = new RegExp(
      `\"href\":\"${escapeForRegex(localeCase.blogHref)}\"`,
    );
    const aboutHrefPattern = new RegExp(
      `\"href\":\"${escapeForRegex(localeCase.aboutHref)}\"`,
    );

    await expect(navbar).toBeVisible();
    await expect(navbar).toHaveAttribute("items", blogHrefPattern);
    await expect(navbar).toHaveAttribute("items", aboutHrefPattern);
  }
});
