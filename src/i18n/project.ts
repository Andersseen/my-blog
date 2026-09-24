/**
 * The Etyma catalog project: which locales exist, which one is the source, and where Glossa
 * Public Delivery serves each catalog. The one place these are written — `./index.ts`
 * (runtime) and `astro.config.mjs` (contract generation) both read them from here.
 *
 * Read at build time only; the browser never fetches Glossa. Keep this module import-free:
 * `astro.config.mjs` loads it before anything is built.
 *
 * `locales` are real BCP-47 language codes (`uk`, never the `ua` route path). Astro's `i18n`
 * block describes routes and stays separate; its `defaultLocale` must be the route of
 * `sourceLocale` (see ADR-007).
 */
export const I18N_PROJECT = {
  locales: ['es', 'en', 'uk'],
  sourceLocale: 'es',
  remote: 'https://glossa.andersseen.dev/i18n/my-blog/{locale}.json',
} as const;

export const catalogUrl = (locale: string): string =>
  I18N_PROJECT.remote.replace('{locale}', locale);
