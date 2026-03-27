// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import angular from '@analogjs/astro-angular';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://www.andriipap.dev',
  integrations: [
    mdx(),
    sitemap(),
    angular({
      vite: {
        tsconfig: new URL('./tsconfig.app.json', import.meta.url).pathname,
        transformFilter: (_code, id) =>
          id.endsWith('.component.ts') || id.endsWith('.pipe.ts') || id.endsWith('.directive.ts'),
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
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
  },
});
