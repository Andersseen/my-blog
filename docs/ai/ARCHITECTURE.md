# ARCHITECTURE — How the system fits together

## Rendering model

Fully static SSG with Astro 6. Every page is prerendered at build time. There is no runtime
server. The only JavaScript shipped to the client is:

- `src/scripts/setup-andersseen.ts` — registers Web Components + icons (loaded from `MainLayout`)
- Theme bootstrap (anti-FOUC inline script) + theme toggle logic (`src/store/theme.ts`)
- Pagefind search UI (lazy, only on pages with search)

## Content pipeline (the core data flow)

```
src/content/blog/*.{md,mdx}  ──glob loader──┐
                                            ├─→ unifyPosts() ─→ UnifiedPost[] ─→ pages/components
Medium RSS feed ─────mediumLoader()─────────┘
```

1. **Local posts** — collection `blog` in `src/content.config.ts`, Zod-validated frontmatter
   (`title`, `description`, `pubDate`, optional `updatedDate`, `heroImage`, `isExternal`, `link`).
   Currently the folder is EMPTY (only `.gitkeep`) — all visible content comes from Medium.
2. **Medium posts** — collection `medium`, custom loader `src/utils/medium-loader.ts`:
   fetches the RSS feed at build time with 3 retries, 10s timeout, and a 1-hour filesystem
   cache in `.cache/medium-feed.json`. If Medium is down and cache is stale, the build can
   proceed with fewer posts — do not make the build hard-fail on RSS errors.
3. **Unification** — `unifyPosts()` in `src/types/blog.ts` maps both collections to the
   `UnifiedPost` shape. UI components must consume `UnifiedPost`, never raw collection entries.
4. **Bento layout** — `src/lib/bento-layout.ts` groups posts into non-repeating grid layouts
   (FEATURED_LEFT, DUAL, TRIPLE…). Pure function, unit-tested. Change with care.

## Routing & i18n (the most error-prone area)

Manual i18n, no library (see ADR-003). Default locale `es` has NO prefix; `en`/`ua` do:

```
/            /blog            /blog/<slug>       ← es (src/pages/index.astro, src/pages/blog/)
/en          /en/blog         /en/blog/<slug>    ← en (src/pages/[lang]/...)
/ua          /ua/blog         /ua/blog/<slug>    ← ua (src/pages/[lang]/...)
```

**Page trees are still doubled for routing (`src/pages/...` vs `src/pages/[lang]/...`), but the
bodies are NOT duplicated.** Home, blog-index, and blog-post pages are thin wrappers around
shared components in `src/components/pages/` (`HomePage.astro`, `BlogIndexPage.astro`,
`BlogPostPage.astro`). Each `src/pages/...` file only supplies routing (`getStaticPaths` for the
`[lang]` variants) and renders the shared component — no markup/logic to keep in sync by hand.
When adding a new page that needs both an `es` and `en`/`ua` route, follow this pattern: put the
real content in a `src/components/pages/*.astro` component, then add two thin page files.

Helpers in `src/i18n/index.ts` (aliased as `@/i18n`):
- `getI18n(pathname)` → `{ locale, messages }` — the standard way pages get translations
- `toLocalePath(locale, path)` — builds locale-aware hrefs (handles the no-prefix default)
- `getLangCode` / `getOgLocale` — `ua` maps to lang `uk` / OG `uk_UA`, not "ua"

Dictionaries: `src/i18n/locales/{es,en,ua}.json` — keys must exist in all three.

## Theming

- Tokens are **HSL triplets** in CSS custom properties: `--background: 44 52% 90%;` consumed as
  `hsl(var(--background))`. Defined in `src/styles/global.css` for `:root` (light) and
  `[data-theme='dark']`.
- State: nanostores atom in `src/store/theme.ts`. Persistence is dual (ADR-004):
  **localStorage** (`theme-cache` key) for synchronous anti-FOUC read at page load, and
  **IndexedDB via Dexie** (`src/db/db.ts`, `settingsService`) as the durable store.
- The document gets `data-theme="light|dark"` + `style.colorScheme` on `<html>`.

## Layouts & components

- `src/layouts/MainLayout.astro` — shell for all pages (head, header, footer, skip link, theme).
- `src/layouts/BlogPost.astro` — article layout for local MDX posts.
- `src/components/` — grouped by domain: `blog/`, `home/`, `i18n/`, `search/`, `seo/`, `theme/`.
  SEO is componentized: `SeoMetaTags`, `SeoStructuredData`, `SeoFavicons` inside `BaseHead`.
- Interactive UI (navbar, drawer, dropdown, cards, badges) comes from
  `@andersseen/web-components` custom elements (`<and-navbar>`, `<and-card>`, …), registered in
  `src/scripts/setup-andersseen.ts` together with the icon registry. New icons must be added
  to that registry, not inlined as SVG.

## Search

Pagefind indexes `dist/` AFTER the build (`pnpm search:build`). It is not a Vite plugin — the
import `/pagefind/pagefind.js` is marked `external` in `astro.config.mjs`. Search only works on
a built site, never in `pnpm dev`.

## Auto-sync with Medium (deployment trigger)

```
Cloudflare Worker cron (*/30 min)          GitHub Actions (weekly fallback, Sun 00:00)
  └─ fetch Medium RSS                        └─ full redeploy regardless
  └─ compare latest GUID vs KV
  └─ if new → dispatch deploy workflow
```

- Worker: `src/workers/medium-sync/index.ts`, config in `wrangler.toml` (KV binding
  `MEDIUM_SYNC_KV`; the IDs in the repo are placeholders — real ones live in the deployed env).
- Deploy workflow: `.github/workflows/deploy-pages-on-pr-merge.yml` — runs unit tests → build →
  E2E → Pagefind → `wrangler pages deploy`. The Lighthouse job is commented out (see STATE.md).
- Worker deploy workflow: `.github/workflows/deploy-worker.yml`.

## Path aliases (astro.config.mjs + tsconfig)

`@/*` → `src/*`, plus specific: `@/components`, `@/layouts`, `@/lib`, `@/types`, `@/utils`,
`@/i18n` (→ `src/i18n/index.ts`), `@/consts` (→ `src/consts.ts`), `@/styles`. Use them instead
of relative `../../` imports.

## Key files map

| Path | Role |
| :--- | :--- |
| `src/consts.ts` | Site-wide constants (title, author, URLs) |
| `src/content.config.ts` | Content collections + Zod schemas |
| `src/utils/medium-loader.ts` | Medium RSS loader (retry + cache) |
| `src/types/blog.ts` | `UnifiedPost` + `unifyPosts()` |
| `src/lib/bento-layout.ts` | Post grid layout algorithm |
| `src/i18n/index.ts` | All i18n helpers |
| `src/store/theme.ts` | Theme state + persistence |
| `src/db/db.ts` | Dexie database (`settingsService`) |
| `src/scripts/setup-andersseen.ts` | Web Components + icon registration |
| `src/styles/global.css` | Design tokens (light + dark) |
| `wrangler.toml` | Medium-sync Worker config |
| `src/components/pages/*.astro` | Shared page bodies (Home, BlogIndex, BlogPost) |

## Tests

- **Unit (Vitest, `tests/unit/`)**: i18n helpers, theme resolution/behavior, Dexie services,
  bento layout, Worker sync logic. Pure-logic modules must stay unit-testable (no DOM coupling).
- **E2E (Playwright, `tests/e2e/`)**: home, navigation, accessibility (`@axe-core/playwright`).
  Runs against a production build in CI.
