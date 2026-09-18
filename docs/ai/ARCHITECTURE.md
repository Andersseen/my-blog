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

Astro owns routing natively; `@etyma/astro` owns messages (see ADR-007). Default locale `es`
has NO prefix; `en`/`ua` do. The Ukrainian *URL path* is `ua`, but its real *language code* is
`uk` — configured once in `astro.config.mjs`'s `i18n` block via the `{ path, codes }` form and
never reimplemented anywhere else:

```js
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en', { path: 'ua', codes: ['uk'] }],
}
```

```
/            /blog            /blog/<slug>       ← es (src/pages/index.astro, src/pages/blog/)
/en          /en/blog         /en/blog/<slug>    ← en (src/pages/en/...)
/ua          /ua/blog         /ua/blog/<slug>    ← ua (src/pages/ua/..., language code uk)
```

**Page trees are still doubled for routing (`src/pages/...`, `src/pages/en/...`,
`src/pages/ua/...`), but the bodies are NOT duplicated.** Astro's native i18n routing works by
real folders (not a `[lang]` dynamic segment), so `en`/`ua` each get their own folder mirroring
`es`'s. Home, blog-index, and blog-post pages are thin wrappers around shared components in
`src/components/pages/` (`HomePage.astro`, `BlogIndexPage.astro`, `BlogPostPage.astro`) — no
markup/logic to keep in sync by hand. When adding a new page that needs all three locales, put
the real content in a `src/components/pages/*.astro` component, then add three thin page files
(`src/pages/<page>.astro`, `src/pages/en/<page>.astro`, `src/pages/ua/<page>.astro`).

Etyma definition in `src/i18n/index.ts` (pure, `@etyma/core` only — safe to import from Vitest):
- `i18n` — `defineI18n({ locales: ['es', 'en', 'uk'], sourceLocale: 'es', source, loaders })`.
  `locales` are always real BCP-47 codes; `'ua'` must never appear here, only as an Astro route
  path.

Astro-bound bridge in `src/i18n/astro.ts` (imports `@etyma/astro`, only importable from `.astro`
files — see "Why two files" below):
- `getPageI18n(Astro)` → `Promise<BlogI18n>` — call once per page/layout that needs
  translations, via `const etyma = await getPageI18n(Astro);`
- `etyma.locale` / `etyma.direction` — the real language code (`uk`, never `ua`) and text
  direction, for `<html lang>` / `<html dir>`
- `etyma.t('namespace.key', params?)` — typed message lookup; a typo fails to compile
- `etyma.path(bareLogicalPath, locale?)` — locale-aware href for a **bare** path (e.g. `/blog`,
  never the current, already-prefixed `Astro.url.pathname` — see the gotcha below)
- `etyma.seo()` — `{ lang, direction, canonical, alternates, xDefault }`, consumed by
  `BaseHead.astro`
- Types `BlogI18n`, `Translate` (`etyma.t`'s type), `LocalePath` (`etyma.path`'s type),
  `MessageKey` — used to type component props instead of prop-drilling the whole catalog

**Why two files:** `@etyma/astro`'s entry point statically imports Astro's `astro:i18n` virtual
module, which only resolves inside Astro's own Vite pipeline. Importing anything from
`@etyma/astro` in plain Vitest throws. `src/i18n/index.ts` (the catalog/definition) has zero
`@etyma/astro` dependency and is safe to unit-test directly; `src/i18n/astro.ts` (the
`createAstroI18n` bridge) is only ever imported from `.astro` files.

**Gotcha:** `etyma.path()` takes an already-*bare* logical path, not `Astro.url.pathname` (which
is already locale-prefixed) — passing the raw pathname double-prefixes the result. To switch the
*current* page to another locale (e.g. in `LanguageDropdown.astro`), use
`etyma.seo().alternates` instead, which already computes the bare path correctly.

Catalogs: `src/i18n/locales/{es,en,uk}.json` (language codes — note `uk.json`, not `ua.json`)
written in MessageFormat 2 (`{$variable}`, `{$year :number useGrouping=never}`). Validate with
`pnpm etyma validate ./src/i18n/locales --source es` — do not hand-check key parity.
Open Graph's `es_ES`/`en_US`/`uk_UA` locale format is a distinct, app-specific concern Etyma does
not own: `getOgLocale()` in `src/i18n/og-locale.ts`.

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
| `src/i18n/index.ts` | Pure Etyma definition (`i18n`, `MessageKey`) — no `@etyma/astro` import |
| `src/i18n/astro.ts` | Astro-bound bridge (`getPageI18n`, `BlogI18n`, `Translate`, `LocalePath`) |
| `src/i18n/og-locale.ts` | App-specific Open Graph locale mapping (`es_ES`/`en_US`/`uk_UA`) |
| `src/i18n/locales/{es,en,uk}.json` | Etyma catalogs (MessageFormat 2) |
| `vendor/etyma/*.tgz` | Packed local `@etyma/*` tarballs (gitignored, pre-release, see ADR-007) |
| `src/store/theme.ts` | Theme state + persistence |
| `src/db/db.ts` | Dexie database (`settingsService`) |
| `src/scripts/setup-andersseen.ts` | Web Components + icon registration |
| `src/styles/global.css` | Design tokens (light + dark) |
| `wrangler.toml` | Medium-sync Worker config |
| `src/components/pages/*.astro` | Shared page bodies (Home, BlogIndex, BlogPost) |

## Tests

- **Unit (Vitest, `tests/unit/`)**: the Etyma definition (`src/i18n/index.ts` — locales,
  sourceLocale, typed keys), `getOgLocale`, theme resolution/behavior, Dexie services, bento
  layout, Worker sync logic. Pure-logic modules must stay unit-testable (no DOM coupling) — this
  is exactly why the Etyma definition and its Astro bridge are two separate files (see "Routing
  & i18n" above). Locale *routing* behavior (canonical, hreflang, x-default, `/ua` → `uk`) is
  Etyma's own responsibility and is verified in E2E against real output instead, not re-tested
  here against @etyma/astro's internals.
- **E2E (Playwright, `tests/e2e/`)**: home, navigation, accessibility (`@axe-core/playwright`),
  and `seo-i18n.spec.ts` (html lang, canonical, hreflang, x-default, language-switch round trip,
  query/hash preservation). Runs against a production build in CI.

## Sitemap & catalog validation

`@astrojs/sitemap` is configured with `i18n: { defaultLocale: 'es', locales: { es: 'es', en:
'en', ua: 'uk' } }` in `astro.config.mjs`, so every sitemap URL carries `xhtml:link` hreflang
alternates keyed by real language code (`uk`, never `ua`). Catalog correctness (missing/extra
keys, MF2 syntax, placeholder mismatches across locales) is checked by `@etyma/cli`, not by a
blog-specific script: `pnpm etyma validate ./src/i18n/locales --source es`.
