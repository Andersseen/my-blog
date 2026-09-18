/**
 * Glossa Public Delivery for this project. Read at build time only: `astro.config.mjs`
 * derives the key contract from it and `./index.ts` loads every locale's catalog from it
 * while Astro prerenders. The browser never fetches it.
 */
export const GLOSSA_I18N_BASE = 'https://glossa.andersseen.dev/i18n/my-blog';
