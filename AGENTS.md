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

- **Stack**: Astro 6 (SSG), Tailwind CSS 4, TypeScript strict, nanostores, Dexie (IndexedDB), Pagefind
- **Design system**: `@andersseen/web-components` + `@andersseen/icon` (external packages, do not fork locally)
- **Package manager**: `pnpm` ONLY (v10, Node >= 22.12). Never use npm or yarn.
- **Deploy**: Cloudflare Pages via GitHub Actions on push to `main`. A Cloudflare Worker (`src/workers/medium-sync/`) triggers redeploys when Medium publishes a new post.
- **i18n**: `es` is default (no URL prefix), `en` and `ua` are prefixed (`/en/...`, `/ua/...`). Manual system in `src/i18n/`.
- **Angular**: the `@analogjs/astro-angular` integration is configured but there are **zero Angular components today**. Do not add one without a spec that justifies it.

## Commands

```bash
pnpm install          # install deps (--frozen-lockfile in CI)
pnpm dev              # dev server at localhost:4321
pnpm build            # production build to dist/
pnpm test             # Vitest unit tests with coverage  ← must pass before done
pnpm test:e2e         # Playwright E2E (needs a build; includes axe a11y checks)
pnpm search:build     # Pagefind index (run after build)
```

## Hard rules (violating these = broken PR)

1. **Never edit** `dist/`, `playwright-report/`, `test-results/`, `.astro/`, or `pnpm-lock.yaml` by hand.
2. **Every user-visible string** goes through i18n: add the key to ALL THREE files
   `src/i18n/locales/{es,en,ua}.json`. Never hardcode UI text in components.
3. **Every internal link** must use `toLocalePath(locale, path)` from `@/i18n` — never concatenate locale prefixes by hand.
4. **Colors only via CSS custom properties** (HSL triplets) defined in `src/styles/global.css`.
   Any new token must be defined in BOTH `:root` (light) and `[data-theme='dark']`.
5. **Zero client-side JS by default.** Astro components stay static; adding a `<script>` or an island needs a reason (state, interaction) — say it in the PR/commit.
6. **Commits**: Conventional Commits enforced by commitlint. Allowed types and scopes are in
   `commitlint.config.js` — check it before committing (e.g. `feat(blog): ...`, `fix(i18n): ...`).
7. **Do not add dependencies** without checking bundle impact and noting it. This site's core value is speed.
8. **Do not reintroduce a service worker** (`sw.js` was deliberately removed in commit `fbc27c7`).

## Definition of Done

- [ ] `pnpm test` passes (unit + coverage)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:e2e` passes if you touched pages, layouts, navigation, or theme
- [ ] New UI strings exist in `es`, `en`, and `ua` locale files
- [ ] Works in both `light` and `dark` themes (toggle via header button)
- [ ] Works on the default locale (`/`) AND prefixed locales (`/en`, `/ua`) — page trees are duplicated, see ARCHITECTURE.md
- [ ] Keyboard navigation works, focus is visible (this site targets WCAG 2.1 AA)
- [ ] `docs/ai/STATE.md` updated if you changed status, fixed a known issue, or added debt

## Workflow for non-trivial changes

Follow the spec-driven flow in [docs/specs/README.md](docs/specs/README.md):
write a spec from the template → confirm scope → implement → verify against the spec → update STATE.md.
For one-line fixes and typos, skip the spec but keep the Definition of Done.
