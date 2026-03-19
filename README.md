# My Blog

Astro-based personal blog for Andrii Pap with i18n routing (`es`, `en`, `ua`), shared Andersseen web components, and Playwright/Vitest coverage.

## Development

Run all commands from repository root.

| Command         | Action                         |
| :-------------- | :----------------------------- |
| `pnpm install`  | Install dependencies           |
| `pnpm dev`      | Start local dev server         |
| `pnpm build`    | Build production output        |
| `pnpm preview`  | Preview production build       |
| `pnpm test`     | Run Vitest suite with coverage |
| `pnpm test:e2e` | Run Playwright E2E suite       |

## UI Conventions (Source of Truth)

### Icon registration

Primary file: `src/scripts/setup-andersseen.ts`

Rules:

1. Always register `COMPONENT_ICONS` for internal `@andersseen/web-components` dependencies.
2. Register only project icons needed by UI surfaces (no global `registerAllIcons()` in production).
3. Keep registry deterministic (single object allowlist, no ad-hoc registration in components).
4. In development, missing icon registrations are reported via console warnings by bootstrap validation.

Current project icon allowlist:

- `compass`
- `external-link`
- `sun`
- `moon`
- `menu`
- `close`

Icon size tiers:

- `12-14`: micro actions and metadata
- `16`: standard UI actions
- `20-24`: navigation and emphasis

Semantic color mapping:

- `neutral`: default text/metadata
- `primary`: key actions
- `success`: confirmed state
- `warning`: cautionary state
- `error`: destructive/invalid state

### Component adoption order

Priority path:

1. `and-navbar`
2. `and-button` + `and-tooltip`
3. `and-breadcrumb`
4. `and-badge`
5. `and-input` + `and-pagination`
6. `and-toast`

Deferred unless explicitly needed:

- `and-sidebar`
- `and-context-menu`
- `and-carousel`

### Header implementation

Primary file: `src/components/Header.astro`

Notes:

1. Header navigation is driven by `and-navbar` items generated from locale-safe routes.
2. Active section (`home`, `blog`, `about`) is derived from current path to keep route highlighting stable.
3. Language and theme controls are slotted into navbar end section and remain available through responsive stages.
4. Mobile toggle aria-label is synchronized to localized open/close strings.

## QA Matrix

Required checks before merging interaction changes:

- Breakpoints: `320`, `375`, `390`, `768`, `1024`
- Locales: `es`, `en`, `ua`
- Themes: `light`, `dark`

Core interaction checks:

1. Header open/close/collapse behavior.
2. Locale route correctness.
3. Theme switch behavior without visual flash regressions.
4. Overlay/dropdown clipping at viewport edges.
5. Keyboard flow (`Tab`, `Enter`/`Space`, `Escape`) with visible focus.

## PR Sequencing

1. PR-01: icon conventions + registry hardening.
2. PR-02: header migration to `and-navbar`.
3. PR-03: blog UX components (`and-breadcrumb`, `and-badge`, `and-tooltip`).
4. PR-04: blog filter/search + pagination.
5. PR-05: layout/motion polish with reduced-motion support.
6. PR-06: E2E + accessibility + documentation finalization.
