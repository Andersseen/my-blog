// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import angular from "@analogjs/astro-angular";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://www.andriipap.dev",
  integrations: [
    mdx(),
    sitemap(),
    angular({
      vite: {
        tsconfig: new URL("./tsconfig.app.json", import.meta.url).pathname,
        transformFilter: (_code, id) =>
          id.endsWith(".component.ts") ||
          id.endsWith(".pipe.ts") ||
          id.endsWith(".directive.ts"),
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
