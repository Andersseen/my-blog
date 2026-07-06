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
// 3. data prep (getI18n, collections, etc.)
interface Props {
  title: string;
  compact?: boolean;
}
const { title, compact = false } = Astro.props;
const { locale, messages } = getI18n(Astro.url.pathname);
---

<section>...</section>
```

- No client JS unless required. If required, a plain `<script>` tag in the component, kept small.
- Use `@andersseen/web-components` elements for interactive UI (navbar, drawer, dropdown,
  card, badge) instead of building new interactive widgets.
- New icons: register in `src/scripts/setup-andersseen.ts` from `@andersseen/icon`; never
  paste raw `<svg>` into components.

## i18n rules (most common source of bugs)

1. Every user-visible string is a key in ALL of `src/i18n/locales/es.json`, `en.json`, `ua.json`.
   If you can't translate to Ukrainian, copy the English value and flag it in STATE.md — never
   omit the key.
2. Internal links: `toLocalePath(locale, '/blog')` — never template `/${locale}/blog` (breaks
   for default locale `es`, which has no prefix).
3. Page-level changes must be mirrored in BOTH page trees (`src/pages/...` for es and
   `src/pages/[lang]/...` for en/ua) or extracted to a shared component.
4. `ua` locale → HTML lang `uk`, OG locale `uk_UA` (via `getLangCode` / `getOgLocale`).

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
  locales es/en/ua × themes light/dark.

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
- Service workers (removed deliberately — `fbc27c7`).
- SSR/adapters — the site must remain fully static.
- Committing secrets. Worker secrets go via `wrangler secret put`; local env in `.env`
  (see `.env.example`).
