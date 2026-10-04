import { createHttpMessageLoader, defineRemoteI18n } from '@etyma/core';
import { createAstroI18n, type AstroI18nContext } from '@etyma/astro';
import { catalogUrl, I18N_PROJECT } from './project';
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
const loadFromGlossa = createHttpMessageLoader(catalogUrl);

export const i18n = defineRemoteI18n({
  locales: I18N_PROJECT.locales,
  sourceLocale: I18N_PROJECT.sourceLocale,
  contract,
  loaders: {
    es: loadFromGlossa,
    en: loadFromGlossa,
    uk: loadFromGlossa,
  },
});

/** Creates the request-scoped Etyma instance for the current Astro render. */
export const getPageI18n = (astro: AstroI18nContext) => createAstroI18n(astro, i18n);

export type MessageKey = (typeof i18n)['keys'][number];
/**
 * Inferred from the factory, not spelled `AstroI18n<MessageKey>`: that form defaults the
 * second generic and silently drops the per-key params the generated contract declares.
 */
export type BlogI18n = Awaited<ReturnType<typeof getPageI18n>>;
export type Translate = BlogI18n['t'];
export type LocalePath = BlogI18n['path'];
