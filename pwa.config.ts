import { defineConfig } from "vite-plugin-pwa";

export default defineConfig({
  registerType: "autoUpdate",
  manifest: false, // Already have manifest in public/
  workbox: {
    globDirectory: "dist",
    globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg,webp,json}"],
    navigateFallback: "/404.html",
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/cdn-images-1\.medium\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "medium-images",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
          },
        },
      },
      {
        urlPattern: /\.(?:woff|woff2)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
});
