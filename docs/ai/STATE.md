# STATE — Current status of the project

> **Snapshot: 2026-09-18.**
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
- Medium posts fetched at build time with retry + 1h filesystem cache.
- Local MDX content path is exercised by `src/content/blog/building-this-blog-as-a-product.mdx`,
  rendered in all three locale route trees.
- Medium auto-sync Worker (cron every 30 min → GitHub Actions dispatch) + weekly fallback deploy.
- Theme system (light/dark) with anti-FOUC (localStorage) + Dexie persistence.
- Bento grid on blog listing, Pagefind search on built site.
- Home and blog-index page bodies live once in `src/components/pages/` and are reused by all
  three page trees (`es`, `en`, `ua`) — no more copy-pasted markup between them.
- 404/500 pages correctly emit `noindex,nofollow` (was silently dropped before — see below).
- Unit tests (7 suites, 36 tests) and E2E (27 tests incl. axe accessibility and the
  `seo-i18n.spec.ts` locale-routing regression suite) both pass locally and run in the deploy
  pipeline.
- Giscus comments are wired in `BlogPost.astro` (real feature, not a leftover) but use
  placeholder `data-repo-id` / `data-category-id` — same pattern as the wrangler KV IDs, needs
  real values set out-of-band, don't invent them.

## Fixed this session (2026-09-18)

Migrated the custom i18n system to Astro's native `i18n` routing + `@etyma/astro` — the
real-world dogfooding acceptance test for `@etyma/astro` before its first release. Full
rationale in ADR-007. Highlights:

- Developed against packed local tarballs, then switched to the published packages
  (`@etyma/core` ^0.2.0, `@etyma/astro` ^0.1.1, `@etyma/cli` ^0.1.0 — plain npm ranges, no
  overrides). `astro.config.mjs` now owns routing (`i18n.locales: ['es', 'en',
  { path: 'ua', codes: ['uk'] }]`); Etyma's own locale list is `['es', 'en', 'uk']` — `'ua'`
  never appears as an Etyma locale, only as an Astro route path.
- Replaced `src/pages/[lang]/...` (manual dynamic segment, hardcoded `getStaticPaths`) with real
  `src/pages/en/...` / `src/pages/ua/...` folders (Astro's native per-locale-folder routing).
- Renamed `locales/ua.json` → `uk.json`; rewrote parameterized strings to MessageFormat 2.
  Two catalog fields were arrays (`home.editorialPoints`, `about.paragraphs`) — Etyma's
  `MessageSource` doesn't support array leaves, so both became flat numbered keys.
- Deleted dead `src/components/HeaderLink.astro`. Fixed two latent bugs found while touching
  this code: `es.json`'s `footer.rights` was still English, and `PostCard`/`BlogBentoGrid`
  never passed `locale` to `FormattedDate` (dates always rendered in Spanish).
- Sitemap now gets an `i18n` option — every URL carries `xhtml:link` hreflang alternates
  (previously had none). Added `tests/e2e/seo-i18n.spec.ts` (html lang, canonical/hreflang/
  x-default, `hreflang="ua"` regression check, full ES→EN→UA→ES switch incl. query/hash).
  Rewrote `tests/unit/i18n.test.ts` around the Etyma definition itself. New `pnpm i18n:validate`.
- **Etyma findings from dogfooding**: two were fixed upstream in `@etyma/astro` 0.1.1 — (1)
  `etyma.path()` silently double-prefixed an already-prefixed path (it now throws; use
  `etyma.seo().alternates` for "current page in another locale"), and (2) importing the package
  outside Astro's Vite pipeline threw because `astro:i18n` was imported eagerly (now lazy, so
  plain Vitest can import `@/i18n`). Still open: (3) `MessageSource` has no array-leaf support,
  a fairly common i18n catalog shape.

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
