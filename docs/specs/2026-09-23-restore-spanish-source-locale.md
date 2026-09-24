# Spec: Restore Spanish as the canonical locale

- **Status:** Done
- **Date:** 2026-09-23
- **Author:** Andrii Pap / Codex
- **Branch:** `fix/restore-spanish-source-locale`

## Problem / Motivation

The initial Glossa project used English as its source locale, forcing a temporary English-default
routing model. Glossa Project Settings now supports safely correcting that source locale, so the
blog must restore Spanish as its canonical, unprefixed language without reintroducing local
translation catalogs or a synchronization layer.

## Goals

- Serve Spanish at `/`, English at `/en`, and Ukrainian (`uk`) at `/ua`.
- Keep Glossa as the only production translation-content source and generate the Etyma contract
  from its Spanish source catalog.
- Preserve canonical, hreflang, x-default, sitemap, Open Graph, and language-switch behavior.

## Non-goals

- Changing Glossa, Etyma, the service-worker kill switch, or translation content.
- Adding browser fetching, SSR, polling, a Glossa client, or local production catalogs.

## User-visible behavior

Visitors see Spanish at unprefixed home and blog URLs. `/en/...` is canonical English and
`/ua/...` remains Ukrainian with `lang="uk"`; obsolete `/es/...` URLs permanently redirect to the
equivalent unprefixed Spanish route.

## Technical plan

| File                                   | Change                                                                          |
| :------------------------------------- | :------------------------------------------------------------------------------ |
| `astro.config.mjs`                     | Make Spanish the Astro and sitemap default; derive the contract from `es.json`. |
| `src/i18n/*`                           | Make Spanish the Etyma source and Open Graph fallback.                          |
| `public/_redirects`, `public/_headers` | Retire `/es/*` safely and preserve canonical blog rewrites.                     |
| `tests/unit`, `tests/e2e`              | Prove Spanish source fallback, MF2, routes, SEO, redirects, and switching.      |
| `docs/`                                | Record the restored canonical model and the resolved Glossa limitation.         |

## i18n impact

- New locale keys: none.
- Local production catalogs: none — Glossa remains the only production-content source.
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): routing configuration only; no
  page files change.

## Accessibility impact

No interactive behavior or visual structure changes. The existing language-dropdown keyboard flow
is exercised by E2E; semantic HTML and focus behavior remain unchanged.

## Performance impact

None. The site remains static, with no new dependency or browser-side catalog fetch.

## Test plan

- Unit: update remote-loader fixtures for Spanish fallback, MF2, Open Graph fallback, and redirects.
- E2E: extend `seo-i18n.spec.ts` for Spanish-default routes, SEO metadata, and language switching.
- Manual QA matrix: 320/375/390/768/1024 × es/en/ua × light/dark through the existing Playwright suite.

## Acceptance criteria

- [x] Glossa Public Delivery reports `sourceLocale: es`; `es`, `en`, and `uk` catalogs return 200.
- [x] EN and ES remote catalogs have identical addressable key sets.
- [x] Astro, Etyma, sitemap, and generated contract source use Spanish.
- [x] `/`, `/en`, `/ua`, `/blog`, `/en/blog`, and `/ua/blog` are canonical and emit correct SEO.
- [x] `/es` compatibility URLs redirect to their unprefixed Spanish route without a loop.
- [x] `pnpm astro check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass.
- [x] `docs/ai/STATE.md` and current architecture documents are updated.

## Result (fill when Done)

Spanish is canonical and unprefixed again. The production build generated only the Spanish,
English, and Ukrainian route trees; Etyma's generated contract remained precise and unchanged
because the remote EN/ES source key sets match. Glossa remains the sole production-content source.
Verified with `pnpm astro check`, `pnpm test` (44 tests), `pnpm build`, `pnpm search:build`,
`pnpm test:e2e`, a Cloudflare Pages redirect smoke, and Prettier.
