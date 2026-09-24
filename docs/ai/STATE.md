# STATE — Current status of the project

> **Snapshot: 2026-09-23 (Spanish canonical locale restored).**
> This file is the session-to-session memory of the project. If you complete meaningful work
> (fix a known issue, add debt, change status), UPDATE THIS FILE in the same PR — that is how
> the next agent (or the next session) knows where things stand. Keep it honest and short;
> delete resolved items instead of letting the file grow.

## What works today (verified)

- Static build and deploy to Cloudflare Pages via GitHub Actions (push to `main`).
- Trilingual routing (`/` es, `/en`, `/ua`) with correct hreflang (`es`/`en`/`uk`), sitemap
  (with per-URL `xhtml:link` alternates), RSS. Routing is Astro-native (`i18n` block in
  `astro.config.mjs`); messages are `@etyma/astro` (from npm, pre-1.0 — see ADR-007). `/ua` correctly
  resolves to language code `uk` throughout: `<html lang>`, hreflang, canonical, sitemap,
  og:locale.
- **Translations live in Glossa** (project `my-blog`, source `es`, locales `es`/`en`/`uk`), are
  read from Public Delivery at build time via `defineRemoteI18n`, and are baked into static HTML.
  No local catalogs, no sync scripts, no browser fetch. Glossa MCP is configured in `.mcp.json`
  (token from the `GLOSSA_TOKEN` env var, never committed). Edits go live on the next deploy.
- Medium posts fetched at build time with retry + 1h filesystem cache.
- Local MDX content path is exercised by `src/content/blog/building-this-blog-as-a-product.mdx`,
  rendered in all three locale route trees.
- Medium auto-sync Worker (cron every 30 min → GitHub Actions dispatch) + weekly fallback deploy.
- Theme system (light/dark) with anti-FOUC (localStorage) + Dexie persistence.
- Bento grid on blog listing, Pagefind search on built site.
- Home and blog-index page bodies live once in `src/components/pages/` and are reused by all
  three page trees (`es`, `en`, `ua`) — no more copy-pasted markup between them.
- 404/500 pages correctly emit `noindex,nofollow` (was silently dropped before — see below).
- `astro check`, unit tests (offline fixtures), and E2E (including axe accessibility and the
  `seo-i18n.spec.ts` locale/SEO regression suite) are required in the deploy pipeline.
- Giscus comments are wired in `BlogPost.astro` (real feature, not a leftover) but use
  placeholder `data-repo-id` / `data-category-id` — same pattern as the wrangler KV IDs, needs
  real values set out-of-band, don't invent them.

## Fixed this session (2026-09-23)

**Spanish is canonical again.** Glossa Project Settings now permits safe source-locale
correction, so the project source, Etyma `sourceLocale`, Astro `defaultLocale`, sitemap, and
typed-contract source are all `es`. Routes are `/` (Spanish), `/en` (English), and `/ua`
(Ukrainian, language code `uk`). The remote `es.json` and `en.json` catalogs were checked before
the routing change: 48 addressable keys each, with no drift. `/es` and `/es/*` now permanently
redirect to their unprefixed Spanish equivalent; `/en` is canonical again. Production content
remains exclusively in Glossa; no local catalogs, sync layer, browser fetch, or SSR was added.

## Fixed this session (2026-09-19)

**"This site can't be reached" (`ERR_FAILED`) on any URL that redirects (`/en`, `/ua`, `/es`, …).**
Not a routing bug: the service worker removed in `fbc27c7` stayed installed in every browser that
had visited before, because deleting `sw.js` does not unregister it. Its `fetch` handler returns
`fetch(request, {redirect:'follow'})` to navigations, and Chrome rejects a redirected response for a
navigation (console: "a redirected response was used for a request whose redirect mode is not
'follow'"). The `_redirects` rewrites for `/blog` (`5cedf0a`) only dodged one symptom. Fix:
`public/sw.js` is now a self-destructing kill-switch (unregisters, wipes caches, reloads tabs);
reproduced and verified with Playwright against a redirecting server. Browsers heal on their next
`sw.js` update check (≤ 24 h, or immediately via DevTools → Application → Service Workers → Update /
Unregister). **Keep `public/sw.js`** — removing it re-strands anyone who has not healed yet; it is
safe to drop only after months. Guarded by `tests/unit/static-assets.test.ts`.

## Fixed this session (2026-09-18)

**1. Astro-native i18n + `@etyma/astro`** (ADR-007): replaced the hand-rolled `[lang]` system;
Etyma locales are `['en', 'es', 'uk']`, `'ua'` is only an Astro route path; catalogs became
MessageFormat 2 (array leaves flattened to numbered keys); sitemap gained per-URL hreflang;
added `seo-i18n.spec.ts`. Dogfooding fixed two `@etyma/astro` bugs upstream (0.1.1); still open
upstream: `MessageSource` has no array-leaf support.

**2. Glossa cutover** (ADR-007 addendum): production translations moved to Glossa Public
Delivery. Local `es/en/uk.json`, `pnpm i18n:validate` and `@etyma/cli` were removed;
`@etyma/tooling` (dev) generates the committed key contract `src/i18n/etyma.generated.ts`.
Before deletion the three remote catalogs were compared with the local ones structurally
(48 keys each): identical, values and MF2 strings included.

**3. Temporary default locale flipped `es` → `en` (resolved 2026-09-23).** The initial Glossa
project could not yet edit its source locale, so English temporarily became the default and Spanish
lived at `/es/...`. Glossa Project Settings now supports safe source-locale correction; Spanish is
again canonical and unprefixed, while `/es/*` is compatibility-only traffic redirected to `/`.

## Dogfood findings (Glossa cutover)

- **my-blog**: production build now hard-depends on Glossa Public Delivery being reachable
  (verified: a simulated outage fails the build with an `EtymaError` and keeps the committed
  contract — by design, no stale copy). `@etyma/tooling` declares `engines.node >=22.22.0` while
  this repo says `>=22.12.0` — bump `engines`/CI if it ever bites.
- **Etyma → `@etyma/astro`**: (a) catalogs are fetched per rendered page (render-scoped
  registry): 11 pages → 20 Glossa requests (~4 s build), linear in page count — wants a
  build-scoped catalog cache; (b) `etymaRemoteContract` refreshes 3× per build (one per Vite
  pass) — harmless but redundant; (c) **quality gap:** `etyma validate` only takes a local
  directory, so MF2 syntax and placeholder-contract checks across _remote_ catalogs no longer
  run anywhere — needs a supported remote validation path (CLI/`@etyma/tooling` flag or CI step
  reading Public Delivery), deliberately NOT hacked into this repo with a download script;
  (d) the source-locale/`defaultLocale` coupling is enforced with a clear error, but it is what
  forced the URL flip above — worth documenting prominently upstream.
- **Glossa**: Analysis covers completeness (missing/extra keys, coverage) but not MF2
  syntax/placeholder checks — see Etyma (c). Project Settings now resolves the prior editable
  source-locale limitation. The remaining generic follow-up is outbound webhooks / deploy hooks
  (`catalog.updated`, `translation.created/updated/renamed/deleted`) → GitHub
  `repository_dispatch` or a Cloudflare Pages Deploy Hook, so static consumers can republish on
  edit.

## Fixed this session (2026-09-17)

- Replaced the old blue `AP` favicon/app icon set with the current Andersseen “A” mark across
  SVG, PNG, Apple touch, maskable, `.ico`, manifest, and versioned favicon links. This should
  force tools such as Umami to refresh stale branding after the next deploy.
- Added `X-Robots-Tag: noindex, follow` for `/rss.xml` in `public/_headers`, keeping the feed
  crawlable for discovery/readers while telling search engines not to index the XML feed as a
  page. Verified the built `dist/_headers` includes the rule.
- Re-checked production `/blog` on 2026-09-17: it currently responds `308 -> /blog/ -> 200`.
  Added E2E coverage for `/blog/` so trailing-slash access stays covered.
- Replaced random bento grouping with an exact-count planner: every desktop group now fills its
  declared grid rectangle, including the final rows. The shared shell widened from `6xl` to `7xl`
  so the navbar and article grid use wide screens more comfortably.
- Corrected the Pages deployment workflow: `--branch main` creates a preview deployment for a
  Direct Upload project, so it was removed to publish `main` builds to the production deployment
  behind `andersseen.dev`. Internal blog links now use `/blog/` directly; extensionless blog
  routes use a `200` rewrite with canonical headers rather than the Pages redirect. CSP permits
  the configured Umami script and telemetry origin.

## Known issues / tech debt (verify before relying on them — fix + remove entries as you go)

1. **Lighthouse CI stays disabled — do not re-enable yet.** Root causes, found via a local
   Lighthouse run against the production build:
   - **Accessibility (87/100, needs 95): 3 failing audits, all inside `@andersseen/web-components`
     v0.0.2** (a separately published package, not editable from this repo): the `<and-drawer>`
     dialog has no accessible name (`aria-dialog-name`), its `aria-controls` value doesn't match
     any real element ID (`aria-valid-attr-value`), and its `menuitem` roles aren't wrapped in a
     `menu`/`menubar` parent (`aria-required-parent`). Fix these in the web-components repo, then
     bump the version here.
   - **Best-practices (79/100, needs 90): third-party cookie + DevTools "Issues" panel entries**,
     both caused by hotlinking `cdn-images-1.medium.com` images directly — Medium's CDN sets a
     `_cfuvid` cookie on those requests. Only real fix is proxying/caching Medium images through
     our own origin (meaningful infra work: fetch + cache + serve at build or edge time).
   - **Performance on `/blog` (71/100 in the current sample, needs 90): LCP ~14.9s, ~20MB page
     weight** when the bento grid's featured post has an animated GIF hero image. Confirmed by
     hand: Medium's CDN does NOT resize actual animated GIFs — requesting `/max/320/` vs
     `/max/1024/` on the same GIF returns byte-identical files. The current
     `src/lib/image-optimization.ts` does not yet contain the `isGif()` guard that older notes
     claimed existed. Re-verify and implement the GIF policy before relying on this optimization.
     The tradeoff is real: either accept occasional slow LCP when a Medium post's cover is an
     animated GIF, stop rendering GIF heroes at full size in the bento grid, or build a build-time
     image transcoding step (Sharp is already a dependency) to serve a static frame instead. This
     is a product decision, not a quick fix — see if it's worth a spec.
   - Home page alone (no GIF-heavy posts in the top 3) scores: performance 95, seo 100 — so the
     thresholds are close to reachable; the blockers above are what's actually stopping it.
2. **`wrangler.toml` has placeholder KV IDs** (`YOUR_KV_NAMESPACE_ID`). The real namespace is
   configured out-of-band. Don't "fix" the placeholders with invented values.

## Recent history (context for the code you'll see)

- `fbc27c7` — service worker removed.
- `c22d565` — lockfile regenerated after moving build deps to devDependencies.
- `aa3401c` — Lighthouse CI disabled (see issue 1).
- `b790e80` — canonical domain corrected to `andersseen.dev` (no `www`).
- Earlier: test suites expanded, Medium-sync Worker cron added.

## Backlog (candidate next steps, not commitments)

- Upstream follow-ups listed under "Dogfood findings" (Etyma catalog cache + remote validation,
  Glossa deploy webhooks).
- Monitor Search Console after restoring Spanish as the canonical locale; consider redirect/
  hreflang tuning.
- Fix the 3 web-component a11y bugs upstream in `@andersseen/web-components`, bump version here.
- Decide the GIF-hero performance tradeoff (accept slow LCP / drop GIF heroes / build a Sharp
  transcoding step) before attempting to re-enable Lighthouse CI.
- Consider proxying Medium images through own infra to drop the third-party-cookie flag.
- Decide whether future local posts need a language-specific content model, or keep the current
  shared-across-locales strategy.
- Set real Giscus `data-repo-id`/`data-category-id` and real wrangler KV namespace IDs
  (both out-of-band, both currently placeholders).

## How to update this file

- Move fixed items out of "Known issues" (delete them; git history remembers).
- Add new debt you introduce, with file paths and the reason.
- Refresh the snapshot date at the top.
- Keep it under ~100 lines. This file is loaded into every session; brevity is a feature.
