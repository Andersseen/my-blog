# CONVENTIONS — How code is written here

Follow these exactly. When an existing file contradicts this document, prefer this document
for NEW code and do not mass-reformat old code in unrelated commits.

## Formatting & style

- Prettier is the law: 100 char width, 2 spaces, semicolons, **single quotes**, trailing commas,
  `arrowParens: avoid`. Config in `.prettierrc` (includes `prettier-plugin-astro`).
  Some older files use double quotes — do not "fix" them in unrelated changes.
- ESLint: `eslint.config.mjs` (typescript-eslint + eslint-plugin-astro).
- TypeScript strict. No `any` in new code (legacy `any` exists in `medium-loader.ts` cache —
  contain it, don't spread it).

## Naming

- Astro components: `PascalCase.astro`, grouped by domain folder (`components/blog/PostCard.astro`).
- TS modules: `kebab-case.ts` (`bento-layout.ts`, `medium-loader.ts`).
- Tests: `tests/unit/<module>.test.ts`, `tests/e2e/<flow>.spec.ts`.
- Prefer named exports. Pure functions for logic (`generatePostGroups`, `resolveInitialTheme`)
  so they stay unit-testable.

## Astro component pattern

```astro
---
// 1. imports (use @/ aliases)
// 2. Props interface + destructure with defaults
// 3. data prep (getPageI18n, collections, etc.)
import { getPageI18n } from '@/i18n';

interface Props {
  title: string;
  compact?: boolean;
}
const { title, compact = false } = Astro.props;
const etyma = await getPageI18n(Astro);
---

<section>...</section>
```

A component that doesn't create its own `etyma` (most presentational components) takes only
what it needs as a prop — `t: Translate` and/or `path: LocalePath` from `@/i18n` — never
the whole `etyma` object or a raw catalog, unless the component's entire purpose is i18n itself
(e.g. `LanguageDropdown.astro`).

- No client JS unless required. If required, a plain `<script>` tag in the component, kept small.
- Use `@andersseen/web-components` elements for interactive UI (navbar, drawer, dropdown,
  card, badge) instead of building new interactive widgets.
- New icons: register in `src/scripts/setup-andersseen.ts` from `@andersseen/icon`; never
  paste raw `<svg>` into components.

## i18n rules (most common source of bugs)

1. **Glossa owns production translations.** Every user-visible string is a key in the Glossa
   project `my-blog` (`en` source, plus `es` and `uk`), created/edited through the Glossa MCP
   (`set_translation`, `rename_translation`, `delete_translation`) and verified with
   `analyze_translations` (100% coverage, no missing/extra keys). If you can't translate to
   Ukrainian, put the English value and flag it in STATE.md — never omit the key. Never create
   `src/i18n/locales/*.json`, translation sync/pull/push scripts, or a Glossa client; never
   commit `GLOSSA_TOKEN`.
2. **Code only references keys.** Read them with `etyma.t('namespace.key')`; never hardcode UI
   text. `MessageKey` comes from the generated contract `src/i18n/etyma.generated.ts`. After a
   source key is added/renamed/deleted in Glossa, run `pnpm dev` or `pnpm build` once so
   `etymaRemoteContract()` refreshes it, and commit the diff. Never hand-edit or reformat that
   file (it is in `.prettierignore`).
3. Messages use MessageFormat 2: `{$variable}` for interpolation (e.g.
   `"Featured image for {$title}"`, read with `t('key', { title })`), `{$year :number
   useGrouping=never}` for a plain integer (no thousands separator). Do not rewrite message
   syntax when moving content around.
4. Internal links: `etyma.path('/blog')` on a **bare** logical path — never template
   `/${locale}/blog` by hand, and never pass the current, already-prefixed
   `Astro.url.pathname` into `.path()` (it throws). To link to the current page in
   another locale, use `etyma.seo().alternates` instead (see ARCHITECTURE.md).
5. Page-level changes must be mirrored in all three page trees (`src/pages/...` for `en`,
   `src/pages/es/...`, `src/pages/ua/...`) or extracted to a shared component.
6. `ua` is a URL path only. The real language code is always `uk` — `etyma.locale`,
   `<html lang>`, the Glossa catalog name (`uk.json`) and sitemap/hreflang all read `uk`
   directly, never `ua`. Open Graph's `uk_UA` format is a separate, app-specific concern in
   `src/i18n/og-locale.ts`.
7. `en` is the source *and* the unprefixed default locale: Etyma `sourceLocale`, Astro
   `defaultLocale` and the Glossa source locale must change together or not at all.
8. Static site: a translation edit goes live only after the next build + deploy. Never add
   runtime/browser fetching of translations, SSR, or a polling/sync layer to work around that.
9. Unit tests must not use the network or the production catalogs: stub `fetch` and use a tiny
   synthetic fixture (see `tests/unit/i18n.test.ts`). Do not copy production translations into
   fixtures — that recreates a second source of truth.

## Theming rules

- Never hardcode colors (`#hex`, `rgb()`, Tailwind palette classes like `bg-amber-100`).
  Use the semantic tokens: `hsl(var(--background))`, `hsl(var(--primary-600))`, etc.
- Any new token needs values in BOTH `:root` and `[data-theme='dark']` in `src/styles/global.css`.
- Check contrast in both themes (target WCAG AA, 4.5:1 body text).
- Respect `prefers-reduced-motion` for any animation you add.

## Accessibility (non-negotiable, tested by axe in CI)

- Semantic landmarks (`header`, `main`, `nav`, `footer`), one `h1` per page, ordered headings.
- All interactive elements keyboard-reachable; visible focus styles; `Escape` closes overlays.
- Images need `alt` (empty `alt=""` for decorative).
- QA matrix before merging interaction changes: breakpoints 320/375/390/768/1024 ×
  locales en/es/ua × themes light/dark.

## SEO

- Every page renders through `MainLayout` → `BaseHead` (meta, OG, JSON-LD, hreflang, canonical).
  New pages must pass `title` + `description`, translated per locale.
- Site metadata comes from `src/consts.ts` — never inline the site name/URL.

## Testing rules

- New pure logic (i18n, layout, stores, utils) → Vitest unit test in `tests/unit/`.
- New page/flow/interaction → extend Playwright specs in `tests/e2e/`; a11y assertions via
  `@axe-core/playwright` where relevant.
- Run `pnpm test` locally before declaring done; run `pnpm test:e2e` if you touched anything
  a browser can see.

## Git & commits

- Conventional Commits, enforced by commitlint. Types: build, chore, ci, docs, feat, fix,
  perf, refactor, revert, style, test. Scopes: a11y, blog, ci, components, config, deps,
  design-system, e2e, i18n, layout, seo, styles, theme, tests.
  Scope is required by convention here — e.g. `feat(blog): add reading time`.
- `main` is the deploy branch (push to main = production deploy). Work in feature branches,
  merge via PR.

## Forbidden

- Editing `dist/`, `.astro/`, `playwright-report/`, `test-results/`, `pnpm-lock.yaml` (by hand).
- npm/yarn commands (pnpm only).
- New runtime dependencies without stating the size/benefit tradeoff.
- Service workers (removed deliberately — `fbc27c7`). `public/sw.js` is only the self-destructing
  kill-switch for browsers that still run the old one — keep it, never add a `fetch` handler.
- SSR/adapters — the site must remain fully static.
- Committing secrets. Worker secrets go via `wrangler secret put`; local env in `.env`
  (see `.env.example`).
