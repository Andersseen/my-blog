# Spec: One i18n project constant, and build-time validation of Glossa catalogs

- **Status:** Done
- **Date:** 2026-09-24
- **Author:** Andrii Pap / Claude
- **Branch:** `refactor/i18n-project-constant`

## Problem / Motivation

The Etyma catalog facts — locales `es`/`en`/`uk`, source locale `es`, and the Glossa Public
Delivery URL — are written separately in `src/i18n/index.ts` (runtime) and in
`astro.config.mjs` (contract generation, where the source locale is hidden inside a literal
`/es.json`). Restoring Spanish as the source locale (2026-09-23 spec) had to change each copy by
hand, and nothing would notice if the contract were generated from a different catalog than the
runtime's source. Etyma recommends a plain application module for these values instead of a
config file (`@etyma/tooling` README, "Recommended setup for a remote-catalog project").

## Goals

- `locales`, `sourceLocale` and the Glossa `{locale}` URL template are written once, in
  `src/i18n/project.ts`, and read by `defineRemoteI18n` and `etymaRemoteContract()`.
- The contract's source URL is derived from the source locale, so it cannot drift from the
  runtime's source locale.
- `pnpm build` fails when any Glossa catalog is invalid (missing/extra key, broken
  MessageFormat 2, dropped or invented placeholder) or cannot be fetched, via
  `@etyma/tooling` 0.2.0's `etymaRemoteValidation()` reading the same constant.

## Non-goals

- Changing Astro routing: the `i18n` block keeps its own shape (route `ua`, language `uk`) and
  its literal `defaultLocale: 'es'`. Astro's `defaultLocale` is a _route_, so deriving it from a
  language code is only correct while the two coincide.
- Changing translation content, locales or URLs.

## User-visible behavior

None. Every URL (`/...`, `/en/...`, `/ua/...`), every rendered string and all SEO output are
unchanged. The same three Glossa catalogs are fetched from the same URLs at build time.

## Technical plan

| File                             | Change                                                                                 |
| :------------------------------- | :------------------------------------------------------------------------------------- |
| `src/i18n/project.ts`            | New: `I18N_PROJECT` (`locales`, `sourceLocale`, `remote` template) and `catalogUrl`.   |
| `src/i18n/delivery.ts`           | Removed; superseded by `project.ts`.                                                   |
| `src/i18n/index.ts`              | `defineRemoteI18n` reads `I18N_PROJECT`; one `createHttpMessageLoader(catalogUrl)`.    |
| `astro.config.mjs`               | Contract `source: catalogUrl(I18N_PROJECT.sourceLocale)`; add `etymaRemoteValidation`. |
| `package.json`                   | `@etyma/tooling` `^0.1.0` → `^0.2.0` (dev dependency, not shipped to the browser).     |
| `tests/unit/i18n.test.ts`        | Assert the runtime definition and the catalog URLs come from `I18N_PROJECT`.           |
| `docs/ai/ARCHITECTURE.md`, STATE | Describe `project.ts` and build-time catalog validation.                               |

## i18n impact

- New locale keys: none.
- Local production catalogs: none — Glossa remains the only production-content source.
- Both page trees affected: no.

## Accessibility impact

No interactive or markup changes.

## Performance impact

None for visitors: no new dependency, no client-side JavaScript. The build makes three extra
Glossa requests (one per locale, once per build) for validation.

## Test plan

- Unit: extend `tests/unit/i18n.test.ts` for `I18N_PROJECT` / `catalogUrl`.
- E2E: covered by existing specs (no rendered output changes).
- `pnpm build` regenerates `src/i18n/etyma.generated.ts` with no diff.

## Acceptance criteria

- [x] `locales`, `sourceLocale` and the Glossa URL appear only in `src/i18n/project.ts` among
      Etyma consumers (`index.ts`, `astro.config.mjs`).
- [x] `pnpm test` and `pnpm build` pass; `src/i18n/etyma.generated.ts` is unchanged.
- [x] `pnpm build` logs `[etyma] remote catalogs valid: en, es, uk`, and fails on a broken
      catalog (verified against a wrong template: HTTP 404 for every locale, exit 1).
- [x] `docs/ai/STATE.md` updated.

## Result

Shipped as planned, in two steps on one branch: the project constant first, then
`etymaRemoteValidation()` once `@etyma/tooling` 0.2.0 was published. All three production Glossa
catalogs validate green. With both plugins, the `es` source catalog is fetched once by each
plugin per build; accepted upstream as a known, deliberate duplicate request.
