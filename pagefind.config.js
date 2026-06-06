import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.andriipap.dev",
  integrations: [],
  // Pagefind will index the dist folder after build
  // Run: npx pagefind --site dist
});
