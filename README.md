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

### Auto-Sync with Medium

The blog automatically stays in sync with your Medium publications through a **two-layer system**:

1. **Cloudflare Worker Cron Trigger** (`src/workers/medium-sync/`)
   - Runs every 30 minutes
   - Fetches your Medium RSS feed
   - Compares the latest post GUID with the previous one stored in KV
   - If a new post is detected, triggers a GitHub Actions redeploy instantly
   - Exposes a status page at your Worker's URL for manual checks

2. **GitHub Actions Scheduled Workflow**
   - Runs weekly on Sundays at midnight as a fallback (`0 0 * * 0`)
   - Ensures maximum 1-week delay even if the Worker misses a detection

### Required Secrets & Setup

For the auto-sync Worker to function, configure these in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with `Cloudflare Workers:Edit` and `Account:Read` permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `GITHUB_TOKEN` (Worker secret) | Personal Access Token with `repo` and `actions` scopes. Set via `wrangler secret put GITHUB_TOKEN` |

And in `wrangler.toml`, replace:
- `YOUR_KV_NAMESPACE_ID` with your production KV namespace ID
- `YOUR_PREVIEW_KV_NAMESPACE_ID` with your preview KV namespace ID
- `GITHUB_REPO` if your username/repo differs

To create the KV namespace:
```bash
wrangler kv:namespace create "MEDIUM_SYNC_KV"
```

### Security Headers

Configured in `public/_headers`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` with strict rules

## SEO & Accessibility

- **SEO**: Open Graph, Twitter Cards, Schema.org JSON-LD, hreflang alternates, sitemap, RSS, canonical URLs
- **Accessibility**: WCAG 2.1 AA compliant, axe-core testing, skip links, landmarks, keyboard navigation, `prefers-reduced-motion` support
- **Performance**: Astro ViewTransitions, Service Worker (Workbox), image srcsets, font preloading, lazy loading

## Internationalization

Supported locales: `en` (default, unprefixed), `es` (`/es`), `ua` (`/ua`, language code `uk`).

Routing is Astro's native i18n; translation content lives in [Glossa](https://glossa.andersseen.dev)
(project `my-blog`) and is read at build time through Etyma — there are no local translation files.
See `docs/ai/ARCHITECTURE.md` for the full flow and how to add or change strings.

To add a new locale:
1. Add the locale to the Glossa project and import/translate its catalog
2. Add it to `astro.config.mjs` (`i18n` and the sitemap `i18n` option) and to `src/i18n/index.ts`
3. Add a `src/pages/<path>/` tree of thin page wrappers
4. Add the OG locale mapping in `getOgLocale()`

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

## Docs for AI Agents

This repo is set up for AI-assisted, spec-driven development:

- [AGENTS.md](AGENTS.md) — operating manual (rules, commands, definition of done). `CLAUDE.md` imports it.
- [docs/ai/CONTEXT.md](docs/ai/CONTEXT.md) — why the project exists, goals, non-goals
- [docs/ai/ARCHITECTURE.md](docs/ai/ARCHITECTURE.md) — system map and data flows
- [docs/ai/CONVENTIONS.md](docs/ai/CONVENTIONS.md) — code style and hard rules
- [docs/ai/STATE.md](docs/ai/STATE.md) — current status, known issues, backlog (keep updated!)
- [docs/specs/](docs/specs/README.md) — spec-driven development workflow + template

## License

MIT © Andrii Pap
