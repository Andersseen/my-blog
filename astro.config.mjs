// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import { etymaRemoteContract } from '@etyma/tooling/vite';

import { GLOSSA_I18N_BASE } from './src/i18n/delivery.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://andersseen.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', { path: 'ua', codes: ['uk'] }],
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', ua: 'uk' },
      },
    }),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      // Keys-only TypeScript contract derived from Glossa's source catalog; committed so
      // typing survives a Glossa outage. Refreshed on every `astro dev` / `astro build`.
      etymaRemoteContract({
        source: `${GLOSSA_I18N_BASE}/en.json`,
        output: path.resolve(__dirname, './src/i18n/etyma.generated.ts'),
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
