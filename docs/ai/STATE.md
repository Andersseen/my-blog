# STATE — Current status of the project

> **Snapshot: 2026-07-06.**
> This file is the session-to-session memory of the project. If you complete meaningful work
> (fix a known issue, add debt, change status), UPDATE THIS FILE in the same PR — that is how
> the next agent (or the next session) knows where things stand. Keep it honest and short;
> delete resolved items instead of letting the file grow.

## What works today (verified)

- Static build and deploy to Cloudflare Pages via GitHub Actions (push to `main`).
- Trilingual routing (`/` es, `/en`, `/ua`) with hreflang, sitemap, RSS.
- Medium posts fetched at build time with retry + 1h filesystem cache.
- Medium auto-sync Worker (cron every 30 min → GitHub Actions dispatch) + weekly fallback deploy.
- Theme system (light/dark) with anti-FOUC (localStorage) + Dexie persistence.
- Bento grid on blog listing, Pagefind search on built site.
- Unit tests (6 suites) and E2E incl. axe accessibility run in the deploy pipeline.

## Known issues / tech debt (verify before relying on them — fix + remove entries as you go)

1. **Lighthouse CI is disabled.** The job in `.github/workflows/deploy-pages-on-pr-merge.yml`
   is commented out with a TODO (commit `aa3401c`) because a11y/perf issues made it fail.
   Nobody has re-audited since. Re-enabling it requires fixing the underlying findings first.
2. **PWA leftovers.** `sw.js` was removed (`fbc27c7`), but `vite-plugin-pwa` is still in
   devDependencies and `pwa.config.ts` still exists at the root, and `MainLayout.astro` still
   references pwa/manifest bits. Decide: remove the leftovers (likely) or rebuild PWA properly.
   Until decided, don't reintroduce a service worker.
3. **`wrangler.toml` has placeholder KV IDs** (`YOUR_KV_NAMESPACE_ID`). The real namespace is
   configured out-of-band. Don't "fix" the placeholders with invented values.
4. **No local posts yet.** `src/content/blog/` is empty; 100% of content comes from Medium.
   The local-post path (BlogPost layout, frontmatter schema) is built but largely unexercised —
   expect rough edges the first time a real `.mdx` post lands.
5. **Angular integration is dormant.** `@analogjs/astro-angular` + Angular 21 packages are
   installed and configured, but zero `.component.ts` files exist. It adds install weight and
   config surface. Either a first island ships or the integration should be dropped.
6. **Duplicated page trees** (`src/pages/...` vs `src/pages/[lang]/...`) mean every page change
   is a two-place edit. Known consequence of ADR-003; a shared-component refactor would reduce
   the risk of the trees drifting apart.

## Recent history (context for the code you'll see)

- `fbc27c7` — service worker removed.
- `c22d565` — lockfile regenerated after moving build deps to devDependencies.
- `aa3401c` — Lighthouse CI disabled (see issue 1).
- `b790e80` — canonical domain corrected to `andersseen.dev` (no `www`).
- Earlier: test suites expanded, Medium-sync Worker cron added.

## Backlog (candidate next steps, not commitments)

- Fix a11y/perf findings and re-enable the Lighthouse CI job.
- Clean up PWA leftovers (`pwa.config.ts`, `vite-plugin-pwa`, manifest references).
- Write the first local `.mdx` post to exercise the local-content path end to end.
- Decide the fate of the Angular integration (first island vs removal).
- Reduce page-tree duplication by extracting shared page bodies into components.

## How to update this file

- Move fixed items out of "Known issues" (delete them; git history remembers).
- Add new debt you introduce, with file paths and the reason.
- Refresh the snapshot date at the top.
- Keep it under ~80 lines. This file is loaded into every session; brevity is a feature.
