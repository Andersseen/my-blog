import { describe, expect, it } from 'vitest';
import { i18n } from '../../src/i18n';
import { getOgLocale } from '../../src/i18n/og-locale';

// Locale-routing behavior (Astro's native `i18n` config, `/ua` -> `uk`,
// localized paths, canonical/hreflang/x-default, language dropdown) is
// exercised against the real production build in tests/e2e — @etyma/astro
// already unit-tests that logic itself, so it is not duplicated here.

describe('Etyma i18n definition', () => {
  it('uses real BCP-47 language codes, never the "ua" URL path', () => {
    expect(i18n.locales).toEqual(['es', 'en', 'uk']);
    expect(i18n.locales).not.toContain('ua');
  });

  it('defaults to Spanish as the source locale', () => {
    expect(i18n.sourceLocale).toBe('es');
  });

  it('exposes every catalog message as a typed, dotted key', () => {
    expect(i18n.keys.length).toBeGreaterThan(0);
    expect(i18n.keys).toContain('nav.home');
    expect(i18n.keys).toContain('footer.rights');
    expect(i18n.keys).toContain('blog.heroImageAlt');
    expect(i18n.keys).toContain('language.uk');
  });
});

describe('getOgLocale', () => {
  it('maps real locale codes to Open Graph underscore locales', () => {
    expect(getOgLocale('es')).toBe('es_ES');
    expect(getOgLocale('en')).toBe('en_US');
    expect(getOgLocale('uk')).toBe('uk_UA');
  });

  it('falls back to Spanish for an unknown locale', () => {
    expect(getOgLocale('fr')).toBe('es_ES');
  });
});
