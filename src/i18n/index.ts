import { defineI18n } from '@etyma/core';
import { createAstroI18n, type AstroI18n, type AstroI18nContext } from '@etyma/astro';
import es from './locales/es.json';

/**
 * Etyma owns messages; Astro owns routing (astro.config.mjs `i18n` block).
 * `locales` are real BCP-47 language codes — the Ukrainian *URL path* is `ua`,
 * but its language code is `uk`, and only `uk` may ever appear here.
 */
export const i18n = defineI18n({
  locales: ['es', 'en', 'uk'],
  sourceLocale: 'es',
  source: es,
  loaders: {
    en: () => import('./locales/en.json'),
    uk: () => import('./locales/uk.json'),
  },
});

export type MessageKey = (typeof i18n)['keys'][number];
export type BlogI18n = AstroI18n<MessageKey>;
export type Translate = BlogI18n['t'];
export type LocalePath = BlogI18n['path'];

/** Creates the request-scoped Etyma instance for the current Astro render. */
export const getPageI18n = (astro: AstroI18nContext) => createAstroI18n(astro, i18n);
