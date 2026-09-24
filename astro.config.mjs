// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import { etymaRemoteContract, etymaRemoteValidation } from '@etyma/tooling/vite';

import { catalogUrl, I18N_PROJECT } from './src/i18n/project.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://andersseen.dev',
  // Routing, not catalogs: route paths here (`ua`), language codes in src/i18n/project.ts (`uk`).
  // `defaultLocale` is the route of I18N_PROJECT.sourceLocale — @etyma/astro throws otherwise.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', { path: 'ua', codes: ['uk'] }],
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es', en: 'en', ua: 'uk' },
      },
    }),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      // Keys-only TypeScript contract derived from Glossa's source catalog; committed so
      // typing survives a Glossa outage. Refreshed on every `astro dev` / `astro build`.
      etymaRemoteContract({
        source: catalogUrl(I18N_PROJECT.sourceLocale),
        output: path.resolve(__dirname, './src/i18n/etyma.generated.ts'),
      }),
      // Every Glossa catalog through @etyma/tooling's validateCatalogs(): a missing/extra key,
      // broken MessageFormat 2 or a dropped placeholder fails `astro build` (warns in dev).
      etymaRemoteValidation({
        remote: I18N_PROJECT.remote,
        locales: I18N_PROJECT.locales,
        sourceLocale: I18N_PROJECT.sourceLocale,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/layouts': path.resolve(__dirname, './src/layouts'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/i18n': path.resolve(__dirname, './src/i18n/index.ts'),
        '@/consts': path.resolve(__dirname, './src/consts.ts'),
        '@/styles': path.resolve(__dirname, './src/styles'),
      },
    },
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
});
