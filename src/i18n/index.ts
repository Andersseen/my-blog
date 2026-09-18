import { defineI18n } from '@etyma/core';
import es from './locales/es.json';

/**
 * Etyma owns messages; Astro owns routing (astro.config.mjs `i18n` block).
 * `locales` are real BCP-47 language codes — the Ukrainian *URL path* is `ua`,
 * but its language code is `uk`, and only `uk` may ever appear here.
 *
 * This module stays free of any `@etyma/astro` import on purpose: that
 * package's entry point statically imports the `astro:i18n` virtual module,
 * which only exists inside Astro's own Vite pipeline — importing it from
 * plain Vitest throws. The Astro-bound helpers live in `./astro.ts` instead,
 * imported only from `.astro` files.
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
