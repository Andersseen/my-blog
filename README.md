# My Blog

Astro-based personal blog for Andrii Pap with i18n routing (`es`, `en`, `ua`), shared Andersseen web components, and comprehensive testing.

## Architecture Overview

```
my-blog/
├── src/
│   ├── components/          # Astro components (UI primitives)
│   ├── layouts/             # Page layouts (MainLayout, BlogPost)
│   ├── pages/               # File-based routing
│   ├── content/             # MDX/MD blog posts
│   ├── i18n/                # Manual i18n system (locales + helpers)
│   ├── lib/                 # Business logic (bento layouts, image optimization)
│   ├── store/               # Nanostores for client state (theme)
│   ├── db/                  # Dexie/IndexedDB for persistence
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Utilities (Medium RSS loader)
│   └── scripts/             # Client-side bootstrap (web components, icons)
├── tests/
│   ├── unit/                # Vitest tests (i18n, theme, db, bento)
│   └── e2e/                 # Playwright tests (a11y, navigation)
├── docs/
│   └── adr/                 # Architecture Decision Records
└── public/                  # Static assets, headers config
```

## Development

Run all commands from repository root.

| Command                | Action                                      |
| :--------------------- | :------------------------------------------ |
| `pnpm install`         | Install dependencies                        |
| `pnpm dev`             | Start local dev server                      |
| `pnpm build`           | Build production output                     |
| `pnpm preview`         | Preview production build                    |
| `pnpm test`            | Run Vitest suite with coverage              |
| `pnpm test:e2e`        | Run Playwright E2E suite                    |
| `pnpm test:e2e:ui`     | Run Playwright with UI                      |
| `pnpm search:build`    | Build Pagefind search index                 |
| `pnpm lighthouse:local` | Run Lighthouse against local build          |

## Deployment

Deployed to **Cloudflare Pages** via GitHub Actions. See `.github/workflows/`.

Security headers configured in `public/_headers`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` with strict rules

## SEO & Accessibility

- **SEO**: Open Graph, Twitter Cards, Schema.org JSON-LD, hreflang alternates, sitemap, RSS, canonical URLs
- **Accessibility**: WCAG 2.1 AA compliant, axe-core testing, skip links, landmarks, keyboard navigation, `prefers-reduced-motion` support
- **Performance**: Astro ViewTransitions, Service Worker (Workbox), image srcsets, font preloading, lazy loading

## Internationalization

Supported locales: `es` (default), `en`, `ua`.

To add a new locale:
1. Add to `src/i18n/index.ts` (`LOCALES`, `dictionaries`, `LOCALE_TO_LANG`)
2. Create `src/i18n/locales/{locale}.json`
3. Add static paths in `[lang]/` pages
4. Add OG locale mapping in `getOgLocale()`

## Content

- **Local posts**: Add `.md` or `.mdx` files to `src/content/blog/`
- **Medium posts**: Fetched automatically from RSS feed at build time with retry logic and filesystem caching

## Design System

Uses `@andersseen/web-components` and `@andersseen/icon`.
Icon registry: `src/scripts/setup-andersseen.ts`

## QA Matrix

Required checks before merging interaction changes:

- Breakpoints: `320`, `375`, `390`, `768`, `1024`
- Locales: `es`, `en`, `ua`
- Themes: `light`, `dark`

Core interaction checks:
1. Header open/close/collapse behavior.
2. Locale route correctness.
3. Theme switch behavior without visual flash regressions.
4. Overlay/dropdown clipping at viewport edges.
5. Keyboard flow (`Tab`, `Enter`/`Space`, `Escape`) with visible focus.

## Architecture Decisions

See [docs/adr/README.md](docs/adr/README.md) for detailed ADRs on framework choice, design system, i18n approach, and persistence strategy.

## License

MIT © Andrii Pap
