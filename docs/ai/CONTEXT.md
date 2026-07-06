# CONTEXT — What this project is and why it exists

## What

Personal blog of **Andrii Pap** (alias **Andersseen**), frontend developer.
Live at **https://andersseen.dev**. Articles about frontend, web architecture, and design
systems, written in Spanish, English, and Ukrainian.

## Why it exists

1. **Personal brand hub.** One canonical place that aggregates everything Andrii publishes —
   original posts written here plus articles published on Medium — so readers and recruiters
   see a single, fast, polished site.
2. **Showcase of craft.** The blog itself is a portfolio piece: it must demonstrate the
   practices it writes about (performance, accessibility, i18n, design systems). A slow or
   inaccessible blog would contradict its own content.
3. **Dogfooding the Andersseen design system.** `@andersseen/web-components` and
   `@andersseen/icon` are the author's own packages, shared with his portfolio. The blog is a
   real consumer that validates them.

## What "good" looks like (success criteria)

- **Fast**: static HTML, zero JS by default, Lighthouse scores near 100 (perf work is ongoing —
  see STATE.md; the Lighthouse CI job is currently disabled until issues are fixed).
- **Accessible**: WCAG 2.1 AA. Verified with axe-core in E2E tests, keyboard navigation,
  skip links, `prefers-reduced-motion`.
- **Trilingual**: `es` (default), `en`, `ua` — full parity of UI strings across the three.
- **Self-updating**: publishing on Medium automatically redeploys the site within ~30 minutes
  (Cloudflare Worker cron), with a weekly GitHub Actions fallback.
- **SEO-complete**: Open Graph, Twitter Cards, JSON-LD, hreflang alternates, sitemap, RSS,
  canonical URLs.

## Explicit non-goals

- **No backend / no database server.** Everything is static at build time. Client persistence
  (theme) uses IndexedDB/localStorage only.
- **No CMS.** Local posts are `.md`/`.mdx` files committed to `src/content/blog/`.
- **No auth, no user accounts.** Comments exist (Giscus, GitHub-Discussions-backed, in
  `BlogPost.astro`) but require no account on this site itself — auth happens on GitHub's side.
- **No SSR.** The site is fully prerendered; the only server-side code is the Medium-sync
  Worker, which never serves pages.
- **No client-side frameworks by default.** The Angular integration that used to be wired here
  was removed (2026-07-06, never shipped a component). Any future framework island needs a spec
  that justifies the cost — see docs/specs/.

## Related projects (same author)

- `@andersseen/web-components` — shared Web Components library (navbar, drawer, card, badge…).
- `@andersseen/icon` — icon registry used via `src/scripts/setup-andersseen.ts`.
- Portfolio site — shares the design system; visual consistency between both is a goal.
- Medium profile: https://medium.com/@andriipap — the external content source.

## Constraints to respect

- Hosting is **Cloudflare Pages** (static) + one **Cloudflare Worker** (cron sync). Stay within
  free-tier-friendly patterns.
- Site constants (title, author, URLs) live in `src/consts.ts` — single source of truth.
- The domain is `andersseen.dev` (NOT `www.andersseen.dev` — that was a bug, fixed in `b790e80`).
