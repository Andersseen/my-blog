# Spec: SEO Icons And Routes

- **Status:** Done
- **Date:** 2026-09-17
- **Author:** Codex
- **Branch:** `fix/seo-icons-routes`

## Problem / Motivation

The blog still exposes the old blue `AP` icon in favicon/PWA metadata, so external tools such as
Umami can keep showing stale branding. Production access to `/blog` must stay verifiable because
the public site is the source of truth. Google Search Console is also surfacing `/rss.xml` as
crawled but not indexed; the feed should remain crawlable for readers and discovery, but it should
send an explicit no-index signal so Google does not treat that as a page indexing issue.

## Goals

- Replace the old blog icons with the current Andersseen mark everywhere favicon metadata points.
- Keep `/blog` and `/blog/` working in static builds and production.
- Keep RSS crawlable while preventing it from being indexed as a search result.
- Add checks so this does not quietly regress.

## Non-goals

- Change article content, Medium ingestion, or the multilingual routing model.
- Block Google from crawling actual blog articles.
- Fix Search Console rows for unrelated subdomains; each subdomain must handle its own robots
  policy.

## User-visible behavior

Visitors and tools see the current Andersseen “A” mark in browser tabs, PWA metadata, Apple touch
icons, and default favicon lookups. `/blog` redirects/normalizes to the existing blog index and
renders successfully. `/rss.xml` remains accessible, but search engines receive a no-index header.

## Technical plan

| File                                   | Change                                                          |
| :------------------------------------- | :-------------------------------------------------------------- |
| `public/favicon.svg`                   | Replace old `AP` SVG with the current Andersseen mark.          |
| `public/*.png`, `public/favicon.ico`   | Regenerate raster icons from the current mark.                  |
| `public/site.webmanifest`              | Point manifest icons at versioned icon URLs and current colors. |
| `src/components/seo/SeoFavicons.astro` | Version favicon URLs to bust stale third-party caches.          |
| `public/_headers`                      | Add `X-Robots-Tag: noindex, follow` for `/rss.xml`.             |
| `tests/e2e/navigation.spec.ts`         | Assert `/blog`, `/blog/`, RSS body, and RSS no-index header.    |
| `docs/ai/STATE.md`                     | Record the fix.                                                 |

## i18n impact

- New locale keys: none
- All three files updated (`es.json`, `en.json`, `ua.json`): no, no new strings
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): no direct route changes

## Accessibility impact

No interactive changes. The SVG favicon keeps an accessible label for tooling, but it is not page
content.

## Performance impact

No new client JavaScript or dependencies. Icon files stay tiny static assets. Versioned icon URLs
only affect metadata fetches.

## Test plan

- Unit: none, no new pure logic
- E2E: extend `tests/e2e/navigation.spec.ts`
- Manual: verify build output headers and production `/blog` status via HTTP checks

## Acceptance criteria

- [ ] Favicon, PNG icons, `.ico`, Apple touch icon, and manifest icons use the new mark.
- [ ] `/blog` and `/blog/` return successful pages in the built site.
- [ ] `/rss.xml` returns feed XML with `X-Robots-Tag: noindex, follow`.
- [ ] `pnpm test` and `pnpm build` pass.
- [ ] `docs/ai/STATE.md` updated.

## Result

Shipped the current Andersseen “A” mark across SVG, PNG, Apple touch, maskable, `.ico`, favicon
links, and manifest metadata. Added versioned icon URLs to force external tools to refresh stale
favicons, added `X-Robots-Tag: noindex, follow` for `/rss.xml` in Cloudflare Pages headers, and
covered `/blog/` plus static SEO assets with tests. Production `/blog` was checked on
2026-09-17 and responded `308 -> /blog/ -> 200`; no code-side route outage was reproducible.
