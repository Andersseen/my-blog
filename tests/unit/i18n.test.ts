import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCatalogRegistry, createMessageFormatter, createTranslator } from '@etyma/core';
import { i18n, type MessageKey } from '../../src/i18n';
import { getOgLocale } from '../../src/i18n/og-locale';

// Locale-routing behavior (Astro's native `i18n` config, `/ua` -> `uk`,
// localized paths, canonical/hreflang/x-default, language dropdown) is
// exercised against the real production build in tests/e2e — @etyma/astro
// already unit-tests that logic itself, so it is not duplicated here.
//
// Production translations live in Glossa and are read at build time. These tests
// never touch the network: `fetch` is stubbed and serves a tiny synthetic catalog
// per locale — not a copy of the production content.

const GLOSSA = 'https://glossa.andersseen.dev/i18n/my-blog';

const FIXTURES: Record<string, Record<string, unknown>> = {
  en: {
    nav: { home: 'Home', blog: 'Blog' },
    post: { title: 'Post: {$title}', since: 'Since {$year :number useGrouping=never}' },
  },
  // Deliberately partial: `nav.blog` and `post.*` must fall back to the source locale.
  es: { nav: { home: 'Inicio' } },
  uk: { nav: { home: 'Головна' } },
};

const stubGlossa = () => {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const locale = url.slice(`${GLOSSA}/`.length).replace(/\.json$/, '');
    const body = FIXTURES[locale];
    return body
      ? new Response(JSON.stringify(body), { status: 200 })
      : new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Etyma i18n definition', () => {
  it('uses real BCP-47 language codes, never the "ua" URL path', () => {
    expect(i18n.locales).toEqual(['en', 'es', 'uk']);
    expect(i18n.locales).not.toContain('ua');
  });

  it('uses English as the source locale, matching the Glossa project and Astro default', () => {
    expect(i18n.sourceLocale).toBe('en');
  });

  it('exposes the generated key contract as typed, dotted keys', () => {
    expect(i18n.keys.length).toBeGreaterThan(0);
    expect(i18n.keys).toContain('nav.home');
    expect(i18n.keys).toContain('footer.rights');
    expect(i18n.keys).toContain('blog.heroImageAlt');
    expect(i18n.keys).toContain('language.uk');
  });

  it('rejects unknown translation keys at compile time', () => {
    // Enforced by `astro check` (tests are part of the tsconfig program): if
    // `MessageKey` ever widened to `string`, the directive below would itself error.
    const known: MessageKey = 'nav.home';
    // @ts-expect-error — not a key in the Glossa source catalog contract
    const unknown: MessageKey = 'nav.doesNotExist';

    expect(known).toBe('nav.home');
    expect(unknown).toBe('nav.doesNotExist');
  });
});

describe('remote loading from Glossa Public Delivery', () => {
  it('has no synchronous source catalog: every locale, source included, is fetched', () => {
    expect(i18n.sourceCatalog).toBeUndefined();
    for (const locale of ['en', 'es', 'uk']) {
      expect(i18n.loaderFor(locale)).toBeTypeOf('function');
    }
  });

  it('requests exactly one Glossa catalog URL per locale (uk, not ua)', async () => {
    const fetchMock = stubGlossa();
    const registry = createCatalogRegistry(i18n);

    await Promise.all(['en', 'es', 'uk'].map(locale => registry.load(locale)));

    expect(fetchMock.mock.calls.map(([url]) => String(url)).sort()).toEqual([
      `${GLOSSA}/en.json`,
      `${GLOSSA}/es.json`,
      `${GLOSSA}/uk.json`,
    ]);
  });

  it('fails loudly, rather than rendering empty text, when a catalog is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    );
    const registry = createCatalogRegistry(i18n);

    await expect(registry.load('en')).rejects.toThrow();
  });

  it('translates from the loaded locale and falls back to the source locale', async () => {
    stubGlossa();
    const registry = createCatalogRegistry(i18n);
    const [en, es] = await Promise.all([registry.load('en'), registry.load('es')]);
    const translate = createTranslator({
      locale: 'es',
      catalog: es,
      sourceLocale: i18n.sourceLocale,
      sourceCatalog: en,
      formatter: createMessageFormatter(),
    });

    expect(translate.translate('nav.home')).toBe('Inicio');
    expect(translate.translate('nav.blog')).toBe('Blog'); // absent in es -> source (en)
  });

  it('renders MessageFormat 2 placeholders and number formatting', async () => {
    stubGlossa();
    const registry = createCatalogRegistry(i18n);
    const en = await registry.load('en');
    const translate = createTranslator({
      locale: 'en',
      catalog: en,
      sourceLocale: i18n.sourceLocale,
      sourceCatalog: en,
      formatter: createMessageFormatter(),
    });

    expect(translate.translate('post.title', { title: 'Hello' }).replace(/[⁨⁩]/g, '')).toBe(
      'Post: Hello',
    );
    expect(translate.translate('post.since', { year: 2026 }).replace(/[⁨⁩]/g, '')).toBe(
      'Since 2026',
    );
  });
});

describe('getOgLocale', () => {
  it('maps real locale codes to Open Graph underscore locales', () => {
    expect(getOgLocale('es')).toBe('es_ES');
    expect(getOgLocale('en')).toBe('en_US');
    expect(getOgLocale('uk')).toBe('uk_UA');
  });

  it('falls back to the source locale (English) for an unknown locale', () => {
    expect(getOgLocale('fr')).toBe('en_US');
  });
});
