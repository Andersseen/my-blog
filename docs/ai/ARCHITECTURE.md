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

Three owners, one job each (see ADR-007):

| Owner | Owns |
| :--- | :--- |
| **Astro** | Locale routing (`astro.config.mjs` `i18n` block) and static generation |
| **Glossa** | Production translation *content* (`https://glossa.andersseen.dev`, project `my-blog`) |
| **Etyma** | Loading, typing and formatting that content (`@etyma/core` `defineRemoteI18n`, `@etyma/astro`) |

`my-blog` itself only holds integration config and the keys it uses. There is **no local
translation source of truth** — no `src/i18n/locales/*.json`.

Default locale `en` has NO prefix; `es`/`ua` do. The Ukrainian *URL path* is `ua`, but its real
*language code* is `uk` — configured once in `astro.config.mjs`'s `i18n` block via the
`{ path, codes }` form and never reimplemented anywhere else:

```js
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'es', { path: 'ua', codes: ['uk'] }],
}
```

```
/            /blog            /blog/<slug>       ← en (src/pages/index.astro, src/pages/blog/)
/es          /es/blog         /es/blog/<slug>    ← es (src/pages/es/...)
/ua          /ua/blog         /ua/blog/<slug>    ← ua (src/pages/ua/..., language code uk)
```

**Source-locale coupling (do not break):** Etyma's `sourceLocale`, Astro's `i18n.defaultLocale`
and the Glossa project's source locale are all `en`. `@etyma/astro` requires the source locale to
be the unprefixed route (it throws at render time otherwise) and uses it for `x-default`.
Changing the default language means changing all three together and is an SEO-affecting
migration (see STATE.md for the 2026-09-18 flip from `es` and its redirects).

**Page trees are still doubled for routing (`src/pages/...`, `src/pages/es/...`,
`src/pages/ua/...`), but the bodies are NOT duplicated.** Astro's native i18n routing works by
real folders (not a `[lang]` dynamic segment), so `es`/`ua` each get their own folder mirroring
the default's. Home, blog-index, and blog-post pages are thin wrappers around shared components in
`src/components/pages/` (`HomePage.astro`, `BlogIndexPage.astro`, `BlogPostPage.astro`) — no
markup/logic to keep in sync by hand. When adding a new page that needs all three locales, put
the real content in a `src/components/pages/*.astro` component, then add three thin page files
(`src/pages/<page>.astro`, `src/pages/es/<page>.astro`, `src/pages/ua/<page>.astro`).

Everything Etyma-related lives in `src/i18n/` (aliased `@/i18n` → `index.ts`):
- `delivery.ts` — `GLOSSA_I18N_BASE`, the Public Delivery base URL. Shared by `astro.config.mjs`
  and `index.ts`; the only place the URL is written.
- `etyma.generated.ts` — **generated, committed, keys only** (no translation values). The typed
  key contract, produced from Glossa's `en.json` by `etymaRemoteContract()`. Never hand-edit.
- `index.ts` — `i18n = defineRemoteI18n({ locales: ['en', 'es', 'uk'], sourceLocale: 'en',
  contract, loaders })`, with one `createHttpMessageLoader` per locale (all three, source
  included, are remote). `locales` are always real BCP-47 codes; `'ua'` must never appear here,
  only as an Astro route path. It also exports:
  - `getPageI18n(Astro)` → `Promise<BlogI18n>` — call once per page/layout that needs
    translations, via `const etyma = await getPageI18n(Astro);`
  - `etyma.locale` / `etyma.direction` — the real language code (`uk`, never `ua`) and text
    direction, for `<html lang>` / `<html dir>`
  - `etyma.t('namespace.key', params?)` — typed message lookup; a typo fails to compile
  - `etyma.path(bareLogicalPath, locale?)` — locale-aware href for a **bare** path (e.g. `/blog`,
    never the current, already-prefixed `Astro.url.pathname` — it throws, see the gotcha below)
  - `etyma.seo()` — `{ lang, direction, canonical, alternates, xDefault }`, consumed by
    `BaseHead.astro`
  - Types `BlogI18n`, `Translate` (`etyma.t`'s type), `LocalePath` (`etyma.path`'s type),
    `MessageKey` — used to type component props instead of prop-drilling the whole catalog

**Gotcha:** `etyma.path()` takes an already-*bare* logical path, not `Astro.url.pathname` (which
is already locale-prefixed) — passing the raw pathname throws an `EtymaError` (`@etyma/astro`
>= 0.1.1; 0.1.0 silently double-prefixed instead). To switch the *current* page to another
locale (e.g. in `LanguageDropdown.astro`), use `etyma.seo().alternates` instead, which already
computes the bare path correctly.

Messages are MessageFormat 2 (`{$variable}`, `{$year :number useGrouping=never}`), authored in
Glossa. Open Graph's `es_ES`/`en_US`/`uk_UA` locale format is a distinct, app-specific concern
Etyma does not own: `getOgLocale()` in `src/i18n/og-locale.ts`.

## Translation content: Glossa → Etyma → Astro SSG (build time)

```
   Glossa Public Delivery   https://glossa.andersseen.dev/i18n/my-blog/{en,es,uk}.json
            │  (unauthenticated JSON, fetched during `astro build` / `astro dev`)
            ▼
   Etyma defineRemoteI18n + createHttpMessageLoader
            │
            ▼
   @etyma/astro (createAstroI18n — render-scoped catalog registry)
            │
            ▼
   Astro static generation  →  translated static HTML in dist/
            │
            ▼
   Cloudflare Pages
```

The browser never talks to Glossa; the deployed HTML already contains the translated text.
The key contract takes a second, separate path from the same source:

```
Glossa en.json ──etymaRemoteContract() (Vite buildStart)──▶ src/i18n/etyma.generated.ts ──▶ MessageKey
```

If Glossa is unreachable when refreshing the contract, the plugin keeps the last committed file
(with a warning) so typing, editor autocomplete, `astro check` and fresh checkouts keep working.
If Glossa is unreachable when *rendering*, the build **fails** with an `EtymaError` — the site
cannot be correctly rendered without translation content, and it must never publish untranslated
or key-only HTML. There is deliberately no stale local copy to hide that failure.

**Agents use a different surface — never the site's:**

```
Agent ──▶ Glossa MCP (https://glossa.andersseen.dev/mcp, Bearer GLOSSA_TOKEN) ──▶ Glossa
```

The static website never calls MCP. Tools: `get_project`, `list_catalogs`, `get_catalog`,
`get_translation`, `set_translation`, `rename_translation`, `delete_translation`,
`analyze_translations`, `get_delivery_urls`. Config: `.mcp.json` reads the token from the
`GLOSSA_TOKEN` environment variable (`${GLOSSA_TOKEN}` interpolation); the token itself is never
committed. Codex users configure the same server in their user config
(`~/.codex/config.toml`: `[mcp_servers.glossa]`, `url = "https://glossa.andersseen.dev/mcp"`,
`bearer_token_env_var = "GLOSSA_TOKEN"`).

### Static publishing semantics (read this before promising a translation fix)

Editing a translation in Glossa does **not** change the deployed site. Already-published HTML
keeps the old text until the next **Astro build + Cloudflare Pages deploy** (push to `main`,
manual `workflow_dispatch`, the Medium-sync Worker dispatch, or the weekly Sunday fallback).
Glossa Public Delivery responses also allow shared caches to hold them for ~30 s
(`Cache-Control: s-maxage=30`), so a build started right after an edit can briefly see the old
text. Immediate
publication would need outbound Glossa webhooks / deploy hooks (a generic future Glossa
capability, intentionally not built in this repo), and never a runtime fetch or SSR.

### Build-time request volume

`@etyma/astro` creates a render-scoped catalog registry, so each rendered page fetches its own
locale's catalog plus the `en` source catalog. Measured on the 2026-09-18 cutover: 11 pages →
20 requests to Glossa (14 `en`, 3 `es`, 3 `uk`, the `en` count including 3 contract refreshes),
~4 s total build. Fine at this size; it grows linearly with page count. No my-blog cache layer
was added — a build-scoped catalog cache is an `@etyma/astro` follow-up (see STATE.md).

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
  E2E → Pagefind → `wrangler pages deploy`. The build (and E2E in dev mode) reads Glossa Public
  Delivery, so CI needs outbound network, but no secrets for it. The Lighthouse job is commented
  out (see STATE.md). Any redeploy also picks up the latest Glossa translations.
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
| `src/i18n/index.ts` | Remote Etyma definition + bridge (`i18n`, `getPageI18n`, `BlogI18n`, `Translate`, `LocalePath`, `MessageKey`) |
| `src/i18n/delivery.ts` | `GLOSSA_I18N_BASE` — Glossa Public Delivery URL |
| `src/i18n/etyma.generated.ts` | Generated, committed key-only contract (Etyma-owned, never hand-edit) |
| `src/i18n/og-locale.ts` | App-specific Open Graph locale mapping (`es_ES`/`en_US`/`uk_UA`) |
| `.mcp.json` | Glossa MCP server entry (token via `${GLOSSA_TOKEN}`, never committed) |
| `src/store/theme.ts` | Theme state + persistence |
| `src/db/db.ts` | Dexie database (`settingsService`) |
| `src/scripts/setup-andersseen.ts` | Web Components + icon registration |
| `src/styles/global.css` | Design tokens (light + dark) |
| `wrangler.toml` | Medium-sync Worker config |
| `src/components/pages/*.astro` | Shared page bodies (Home, BlogIndex, BlogPost) |

## Tests

- **Unit (Vitest, `tests/unit/`)**: the Etyma definition (`src/i18n/index.ts` — locales,
  sourceLocale, typed keys incl. a `@ts-expect-error` compile-time check enforced by
  `astro check`), remote loading with **stubbed `fetch` and a tiny synthetic catalog** (URL per
  locale, source fallback, MF2 interpolation, loud failure on 503), `getOgLocale`, theme
  resolution/behavior, Dexie services, bento layout, Worker sync logic. Unit tests must never
  hit the network or Glossa, and must not carry a copy of the production translations.
  `@etyma/astro` can be imported from plain Vitest since 0.1.1 (it loads `astro:i18n` lazily,
  only when `createAstroI18n` is actually called). Locale *routing* behavior (canonical, hreflang,
  x-default, `/ua` → `uk`) is Etyma's own responsibility and is verified in E2E against real
  output instead, not re-tested here against @etyma/astro's internals.
- **E2E (Playwright, `tests/e2e/`)**: home, navigation, accessibility (`@axe-core/playwright`),
  and `seo-i18n.spec.ts` (html lang, canonical, hreflang, x-default, og:locale, language-switch
  round trip, query/hash preservation). Runs against a production build in CI. It reads real
  Glossa content through the build/dev server.

## Sitemap, redirects & catalog validation

`@astrojs/sitemap` is configured with `i18n: { defaultLocale: 'en', locales: { en: 'en', es:
'es', ua: 'uk' } }` in `astro.config.mjs`, so every sitemap URL carries `xhtml:link` hreflang
alternates keyed by real language code (`uk`, never `ua`). `public/_redirects` 301-redirects the
retired `/en/*` prefix to the unprefixed English routes.

Catalog *completeness* (missing/extra keys, coverage) is checked with Glossa's
`analyze_translations`. There is currently **no** repo-side check of MessageFormat 2 syntax or
placeholder contracts across remote catalogs (`etyma validate` only reads a local directory,
which no longer exists) — recorded as an upstream Etyma/Glossa follow-up in STATE.md, deliberately
not solved with a download-and-validate script in this repo.
