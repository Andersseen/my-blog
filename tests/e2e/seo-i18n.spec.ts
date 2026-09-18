import { test, expect, type Page } from '@playwright/test';

// Regression coverage for the @etyma/astro migration: Astro's native i18n
// routing (`/ua` URL path -> `uk` language code), and the SEO metadata Etyma
// derives from it (html lang, canonical, hreflang, x-default). The headline
// regression this guards is a real bug that shipped before: hreflang="ua" is
// not a valid BCP-47 language code — it must always be "uk".

type LanguageItem = { text: string; value: string };

const readLanguageItems = (page: Page): Promise<LanguageItem[]> =>
  page.evaluate(() => {
    const dropdown = document.querySelector('[data-language-dropdown]');
    const raw = dropdown?.getAttribute('data-language-items') ?? '[]';
    return JSON.parse(raw) as LanguageItem[];
  });

const switchLanguageTo = async (page: Page, label: 'ES' | 'EN' | 'UA') => {
  const items = await readLanguageItems(page);
  const target = items.find(item => item.text === label);
  if (!target) throw new Error(`No language item labelled "${label}" found on ${page.url()}`);

  await page.evaluate(value => {
    const dropdown = document.querySelector('[data-language-dropdown]');
    dropdown?.dispatchEvent(new CustomEvent('andDropdownSelect', { detail: value }));
  }, target.value);

  await page.waitForURL(url => url.pathname === new URL(target.value, page.url()).pathname);
};

test.describe('html lang', () => {
  for (const [path, lang] of [
    ['/', 'es'],
    ['/en', 'en'],
    ['/ua', 'uk'], // release-critical: never "ua"
  ] as const) {
    test(`${path} renders <html lang="${lang}">`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    });
  }
});

test.describe('canonical, hreflang, x-default', () => {
  for (const path of ['/', '/en', '/ua', '/blog', '/en/blog', '/ua/blog']) {
    test(`${path} emits correct SEO link tags`, async ({ page }) => {
      await page.goto(path);

      const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links =>
        links.map(link => link.getAttribute('hreflang')),
      );

      expect(hreflangs).toContain('es');
      expect(hreflangs).toContain('en');
      expect(hreflangs).toContain('uk');
      expect(hreflangs).not.toContain('ua'); // the historical bug this guards against

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https:\/\/andersseen\.dev\//);

      const xDefault = await page
        .locator('link[rel="alternate"][hreflang="x-default"]')
        .getAttribute('href');
      // x-default must always resolve to the unprefixed Spanish equivalent.
      expect(xDefault).toMatch(/^https:\/\/andersseen\.dev\/(blog\/)?$/);
    });
  }
});

test.describe('language dropdown', () => {
  test('never points the Ukrainian option at /uk/*', async ({ page }) => {
    await page.goto('/blog');
    const items = await readLanguageItems(page);
    for (const item of items) {
      expect(item.value).not.toMatch(/^\/uk\//);
    }
  });

  test('switching language preserves the logical page: ES -> EN -> UA -> ES', async ({ page }) => {
    await page.goto('/blog/building-this-blog-as-a-product');

    await switchLanguageTo(page, 'EN');
    await expect(page).toHaveURL(/\/en\/blog\/building-this-blog-as-a-product\/?$/);

    await switchLanguageTo(page, 'UA');
    await expect(page).toHaveURL(/\/ua\/blog\/building-this-blog-as-a-product\/?$/);

    await switchLanguageTo(page, 'ES');
    await expect(page).toHaveURL(/\/blog\/building-this-blog-as-a-product\/?$/);
  });

  test('preserves query string and hash across a language switch', async ({ page }) => {
    await page.goto('/blog/?tag=angular#latest');

    await switchLanguageTo(page, 'EN');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/en/blog/');
    expect(url.search).toBe('?tag=angular');
    expect(url.hash).toBe('#latest');
  });
});
