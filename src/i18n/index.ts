import { createHttpMessageLoader, defineRemoteI18n } from '@etyma/core';
import { createAstroI18n, type AstroI18n, type AstroI18nContext } from '@etyma/astro';
import { GLOSSA_I18N_BASE } from './delivery';
import contract from './etyma.generated';

/**
 * Glossa owns translation content, Etyma loads/types/formats it, Astro owns routing
 * (astro.config.mjs `i18n` block). This is a static build: every catalog is fetched from
 * Glossa Public Delivery while Astro prerenders, and the result is baked into the HTML.
 *
 * `locales` are real BCP-47 language codes — the Ukrainian *URL path* is `ua`,
 * but its language code is `uk`, and only `uk` may ever appear here.
 *
 * `sourceLocale` must equal Astro's `i18n.defaultLocale` (the unprefixed route), and is
 * also the source locale of the Glossa project.
 */
const loadFromGlossa = createHttpMessageLoader(locale => `${GLOSSA_I18N_BASE}/${locale}.json`);

export const i18n = defineRemoteI18n({
  locales: ['en', 'es', 'uk'],
  sourceLocale: 'en',
  contract,
  loaders: {
    en: loadFromGlossa,
    es: loadFromGlossa,
    uk: loadFromGlossa,
  },
});

export type MessageKey = (typeof i18n)['keys'][number];
export type BlogI18n = AstroI18n<MessageKey>;
export type Translate = BlogI18n['t'];
export type LocalePath = BlogI18n['path'];

/** Creates the request-scoped Etyma instance for the current Astro render. */
export const getPageI18n = (astro: AstroI18nContext) => createAstroI18n(astro, i18n);
