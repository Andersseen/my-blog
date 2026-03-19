import { expect, test } from "@playwright/test";

test("home page renders architecture headline", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /propio blog/i }),
  ).toBeVisible();
});
