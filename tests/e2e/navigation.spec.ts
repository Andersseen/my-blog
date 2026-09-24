import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
  test('shows custom 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: /not found|no encontrada|не знайдено/i }),
    ).toBeVisible();
  });

  test('404 page has link back to home', async ({ page }) => {
    await page.goto('/non-existent-page');
    // The 404 page links back to home; wait for it to be visible
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Blog', () => {
  const localPostSlug = 'building-this-blog-as-a-product';

  test('blog index loads successfully', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Ultimos articulos|Latest articles|Останні статті/i }),
    ).toBeVisible();
  });

  test('blog index works with trailing slash', async ({ page }) => {
    const response = await page.goto('/blog/');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Ultimos articulos|Latest articles|Останні статті/i }),
    ).toBeVisible();
  });

  test('local post renders in all locales', async ({ page }) => {
    const routes = [
      `/blog/${localPostSlug}`,
      `/en/blog/${localPostSlug}`,
      `/ua/blog/${localPostSlug}`,
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      await expect(
        page.getByRole('heading', { name: 'Building This Blog As A Product' }),
      ).toBeVisible();
      await expect(
        page.getByRole('img', { name: /Building This Blog As A Product/i }),
      ).toBeVisible();

      const html = await page.content();
      expect(html).toContain('"@type":"BlogPosting"');
      expect(html).toContain('Building This Blog As A Product');
    }
  });

  test('rss includes the local post', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    expect(response?.status()).toBe(200);
    expect(response).toBeTruthy();

    const body = await response!.text();
    expect(body).toContain('Building This Blog As A Product');
    expect(body).toContain(`/blog/${localPostSlug}/`);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    // Wait for the theme toggle web component to hydrate
    // Use .first() because there are two instances (desktop + mobile drawer)
    const toggle = page.locator('[data-theme-switch]').first();
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Get initial theme
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    expect(initialTheme).toMatch(/light|dark/);

    // Click and verify theme changed
    await toggle.click();
    // Small wait for the theme transition
    await page.waitForTimeout(300);
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).toMatch(/light|dark/);
    expect(newTheme).not.toBe(initialTheme);
  });
});
