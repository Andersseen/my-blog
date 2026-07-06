# STATE — Current status of the project

> **Snapshot: 2026-07-06.**
> This file is the session-to-session memory of the project. If you complete meaningful work
> (fix a known issue, add debt, change status), UPDATE THIS FILE in the same PR — that is how
> the next agent (or the next session) knows where things stand. Keep it honest and short;
> delete resolved items instead of letting the file grow.

## What works today (verified)

- Static build and deploy to Cloudflare Pages via GitHub Actions (push to `main`).
- Trilingual routing (`/` es, `/en`, `/ua`) with correct hreflang (`es`/`en`/`uk`), sitemap, RSS.
- Medium posts fetched at build time with retry + 1h filesystem cache.
- Medium auto-sync Worker (cron every 30 min → GitHub Actions dispatch) + weekly fallback deploy.
- Theme system (light/dark) with anti-FOUC (localStorage) + Dexie persistence.
- Bento grid on blog listing, Pagefind search on built site.
- Home and blog-index page bodies live once in `src/components/pages/` and are reused by
  both the `es` and `[lang]` page trees — no more copy-pasted markup between them.
- 404/500 pages correctly emit `noindex,nofollow` (was silently dropped before — see below).
- Unit tests (6 suites, 33 tests) and E2E (12 tests incl. axe accessibility) both pass locally
  and run in the deploy pipeline.
- Giscus comments are wired in `BlogPost.astro` (real feature, not a leftover) but use
  placeholder `data-repo-id` / `data-category-id` — same pattern as the wrangler KV IDs, needs
  real values set out-of-band, don't invent them.

## Fixed this session (2026-07-06)

- Removed dead PWA leftovers: `pwa.config.ts` (never imported), `vite-plugin-pwa` dependency,
  stale "re-enable service worker" comment in `MainLayout.astro`. No service worker is planned;
  `site.webmanifest` + icon `<link>`s in `SeoFavicons.astro` are unrelated and were kept (they're
  normal favicon/PWA-icon metadata, not tied to a service worker).
- Removed the dormant Angular integration end-to-end (user-confirmed removal): dropped
  `@analogjs/astro-angular`, all `@angular/*` packages, and `rxjs` from `package.json`; removed
  the `angular()` integration from `astro.config.mjs`; deleted `tsconfig.app.json` (existed only
  to feed that integration). Cut ~112 packages from `node_modules`, build got faster
  (~5s → ~1.5s). If Angular islands are wanted later, write a spec first (see docs/specs/).
  Also corrected `home.description`/`about.paragraphs` copy in all 3 locales that explicitly
  claimed "Angular is configured for dynamic islands" — that claim was live, user-facing text
  and would have been false post-removal.
- Fixed a real SEO bug found via Lighthouse: `hreflang="ua"` is not a valid language code (ISO
  code for Ukrainian is `uk`). `BaseHead.astro` now uses `getLangCode()` instead of the raw
  locale. SEO score on Lighthouse went 92 → 100.
- Fixed a real bug found via `astro check`: `noindex` was accepted as a prop by `404.astro` /
  `500.astro` but `MainLayout.astro` never declared or forwarded it to `BaseHead`, so error pages
  were silently indexable. Now forwarded end-to-end; verified `<meta name="robots" content="noindex,nofollow,noarchive">` renders on `/404` and `/500` in the built output.
- Added the missing `blog.heroImageAlt` i18n key (all 3 locales) — `BlogPost.astro` referenced
  it with a hardcoded Spanish-only fallback, so translated locales would have silently shown
  Spanish alt text on hero images once local posts exist.
- Fixed a flaky local E2E test (`navigation.spec.ts` 404 test): the locator was an unscoped
  `h1`, which also matches Astro's dev-toolbar overlay elements (`Audit`, `Settings`, etc.) when
  running against `pnpm dev`. Scoped to `getByRole('heading', ...)`. Only affected local runs
  (CI uses `pnpm preview`, no dev toolbar) but was worth fixing since it was already found.
- Refactored the duplicated page trees for home and blog-index: extracted
  `src/components/pages/{HomePage,BlogIndexPage,BlogPostPage}.astro`; the `src/pages/...` (es)
  and `src/pages/[lang]/...` (en/ua) files are now thin wrappers that just supply routing
  (`getStaticPaths`) and render the shared component. Verified all 3 locales still render
  correctly translated output post-refactor.

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
     `/max/1024/` on the same GIF returns byte-identical files. `generateMediumSrcSet()` in
     `src/lib/image-optimization.ts` already knows this and skips srcset generation for GIFs
     (`isGif()` check) — that logic is correct, not a bug. The tradeoff is real: either accept
     occasional slow LCP when a Medium post's cover is an animated GIF, or stop rendering GIF
     heroes at full size in the bento grid (visual regression), or build a build-time image
     transcoding step (Sharp is already a dependency) to serve a static frame instead. This is a
     product decision, not a quick fix — see if it's worth a spec.
   - Home page alone (no GIF-heavy posts in the top 3) scores: performance 95, seo 100 — so the
     thresholds are close to reachable; the blockers above are what's actually stopping it.
2. **`wrangler.toml` has placeholder KV IDs** (`YOUR_KV_NAMESPACE_ID`). The real namespace is
   configured out-of-band. Don't "fix" the placeholders with invented values.
3. **No local posts yet.** `src/content/blog/` is empty; 100% of content comes from Medium.
   The local-post path (BlogPost layout, frontmatter schema) is built but largely unexercised —
   expect rough edges the first time a real `.mdx` post lands.
4. **Pagefind's `window.pagefind` isn't typed.** `astro check` reports 7 TS errors in
   `SearchInput.astro` (`Property 'pagefind' does not exist on type 'Window'`, etc.). Pagefind
   works correctly at runtime (it's loaded dynamically); this is a missing `declare global`
   ambient type, not a functional bug. Cosmetic — fix by adding a `.d.ts` if it starts blocking
   a stricter CI type-check step.

## Recent history (context for the code you'll see)

- `fbc27c7` — service worker removed.
- `c22d565` — lockfile regenerated after moving build deps to devDependencies.
- `aa3401c` — Lighthouse CI disabled (see issue 1).
- `b790e80` — canonical domain corrected to `andersseen.dev` (no `www`).
- Earlier: test suites expanded, Medium-sync Worker cron added.

## Backlog (candidate next steps, not commitments)

- Fix the 3 web-component a11y bugs upstream in `@andersseen/web-components`, bump version here.
- Decide the GIF-hero performance tradeoff (accept slow LCP / drop GIF heroes / build a Sharp
  transcoding step) before attempting to re-enable Lighthouse CI.
- Consider proxying Medium images through own infra to drop the third-party-cookie flag.
- Write the first local `.mdx` post to exercise the local-content path end to end.
- Set real Giscus `data-repo-id`/`data-category-id` and real wrangler KV namespace IDs
  (both out-of-band, both currently placeholders).

## How to update this file

- Move fixed items out of "Known issues" (delete them; git history remembers).
- Add new debt you introduce, with file paths and the reason.
- Refresh the snapshot date at the top.
- Keep it under ~100 lines. This file is loaded into every session; brevity is a feature.
