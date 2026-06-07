import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://andersseen.dev",
  integrations: [],
  // Pagefind will index the dist folder after build
  // Run: npx pagefind --site dist
});
