# AGENTS.md — Operating Manual for AI Agents

You are working on **my-blog**: the personal blog of Andrii Pap (@Andersseen), deployed at
https://andersseen.dev. Static Astro site, trilingual (es/en/ua), content from local MDX +
Medium RSS, deployed to Cloudflare Pages.

## Read this first (in order)

| File | When to read |
| :--- | :--- |
| [docs/ai/CONTEXT.md](docs/ai/CONTEXT.md) | Always — why this project exists, goals, non-goals |
| [docs/ai/ARCHITECTURE.md](docs/ai/ARCHITECTURE.md) | Before touching any code — how the pieces fit |
| [docs/ai/CONVENTIONS.md](docs/ai/CONVENTIONS.md) | Before writing any code — style, patterns, hard rules |
| [docs/ai/STATE.md](docs/ai/STATE.md) | Always — current status, known issues, backlog |
| [docs/specs/README.md](docs/specs/README.md) | Before starting a non-trivial feature — spec-driven workflow |
| [docs/adr/README.md](docs/adr/README.md) | When questioning an architectural choice — the decision is probably recorded |

## Quick facts

- **Stack**: Astro 6 (SSG), Tailwind CSS 4, TypeScript strict, nanostores, Dexie (IndexedDB), Pagefind,
  Etyma (typed remote i18n), Glossa (translation content)
- **Design system**: `@andersseen/web-components` + `@andersseen/icon` (external packages, do not fork locally)
- **Package manager**: `pnpm` ONLY (v10, Node >= 22.12). Never use npm or yarn.
- **Deploy**: Cloudflare Pages via GitHub Actions on push to `main`. A Cloudflare Worker (`src/workers/medium-sync/`) triggers redeploys when Medium publishes a new post.
- **i18n**: `en` is default (no URL prefix), `es` and `ua` are prefixed (`/es/...`, `/ua/...`).
  Three owners, never mix them: **Astro** owns routing (`astro.config.mjs` `i18n` block),
  **Glossa** owns production translation *content*, **Etyma** (`@etyma/core` + `@etyma/astro`, from
  npm, pre-1.0 — expect minor-version API changes) owns loading, typing and formatting.
  The Ukrainian URL path is `ua`, its real language code is `uk` — never confuse the two.
  Etyma's `sourceLocale`, Astro's `defaultLocale` and the Glossa project's source locale must all
  be `en` (`@etyma/astro` throws if the source locale is served from a prefixed URL). See ADR-007.
- **No Angular.** The `@analogjs/astro-angular` integration was removed (2026-07-06, zero components ever shipped). If islands are needed later, write a spec first — see docs/specs/.

## Commands

```bash
pnpm install          # install deps (--frozen-lockfile in CI)
pnpm dev              # dev server at localhost:4321
pnpm build            # production build to dist/ (reads Glossa Public Delivery — needs network)
pnpm test             # Vitest unit tests with coverage  ← must pass before done
pnpm test:e2e         # Playwright E2E (needs a build; includes axe a11y checks)
pnpm search:build     # Pagefind index (run after build)
```

## Hard rules (violating these = broken PR)

1. **Never edit** `dist/`, `playwright-report/`, `test-results/`, `.astro/`, `pnpm-lock.yaml`, or
   `src/i18n/etyma.generated.ts` by hand.
2. **Production translations are owned by Glossa** (https://glossa.andersseen.dev, project
   `my-blog`, source locale `en`, locales `en`/`es`/`uk`). Never hardcode UI text in components; read
   it with `etyma.t('namespace.key')`. For every new user-visible string:
   1. use the Glossa MCP (`.mcp.json`; needs `GLOSSA_TOKEN` exported in your shell);
   2. create the source `en` value with `set_translation`, then the `es` and `uk` values;
   3. run `analyze_translations` — coverage must be 100% with no missing/extra keys;
   4. reference the key from code with `etyma.t(...)`;
   5. run `pnpm dev` or `pnpm build` once when the *source key set* changed (added/renamed/
      deleted): `etymaRemoteContract()` refreshes `src/i18n/etyma.generated.ts`. Commit that diff;
      never hand-edit it.

   **Do not** recreate `src/i18n/locales/*.json`, add translation pull/push/sync scripts, or
   build a Glossa client. **Never commit `GLOSSA_TOKEN`** (only the variable *name* may appear in
   the repo). The static site and the build need no token — Public Delivery is unauthenticated.
   Translation edits reach production only after the next build + deploy (see ARCHITECTURE.md).
3. **Every internal link** must use `etyma.path(path)` — never concatenate locale prefixes by
   hand. Get `etyma` via `getPageI18n(Astro)` from `@/i18n` in a page/layout, or as a prop
   in a component that receives it from its parent.
4. **Colors only via CSS custom properties** (HSL triplets) defined in `src/styles/global.css`.
   Any new token must be defined in BOTH `:root` (light) and `[data-theme='dark']`.
5. **Zero client-side JS by default.** Astro components stay static; adding a `<script>` or an island needs a reason (state, interaction) — say it in the PR/commit.
6. **Commits**: Conventional Commits enforced by commitlint. Allowed types and scopes are in
   `commitlint.config.js` — check it before committing (e.g. `feat(blog): ...`, `fix(i18n): ...`).
7. **Do not add dependencies** without checking bundle impact and noting it. This site's core value is speed.
8. **Do not reintroduce a service worker** (removed in commit `fbc27c7`). The one exception is
   `public/sw.js`: a self-destructing kill-switch (no `fetch` handler) that unregisters the old
   worker still installed in visitors' browsers, which otherwise breaks every redirecting URL with
   `ERR_FAILED`. Never delete it or give it caching logic; a unit test guards this.

## Definition of Done

- [ ] `pnpm test` passes (unit + coverage)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:e2e` passes if you touched pages, layouts, navigation, or theme
- [ ] New UI strings exist in Glossa for `en`, `es` and `uk` (`analyze_translations` = 100%)
- [ ] Works in both `light` and `dark` themes (toggle via header button)
- [ ] Works on the default locale (`/`) AND prefixed locales (`/es`, `/ua`) — page trees are
      duplicated per Astro-native locale folder (`src/pages/`, `src/pages/es/`, `src/pages/ua/`),
      see ARCHITECTURE.md
- [ ] Keyboard navigation works, focus is visible (this site targets WCAG 2.1 AA)
- [ ] `docs/ai/STATE.md` updated if you changed status, fixed a known issue, or added debt

## Workflow for non-trivial changes

Follow the spec-driven flow in [docs/specs/README.md](docs/specs/README.md):
write a spec from the template → confirm scope → implement → verify against the spec → update STATE.md.
For one-line fixes and typos, skip the spec but keep the Definition of Done.
