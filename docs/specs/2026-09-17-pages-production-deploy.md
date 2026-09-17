# Spec: Pages Production Deploy

- **Status:** Done
- **Date:** 2026-09-17
- **Author:** Codex
- **Branch:** `fix/pages-production-deploy`

## Problem / Motivation

The deployment workflow calls `wrangler pages deploy` with `--branch main`. For a Cloudflare
Pages Direct Upload project, an explicit branch creates a preview deployment, so a successful
GitHub Actions run does not update the production deployment serving `andersseen.dev`. This
explains why CI can pass while production remains on stale assets. The public CSP also omits the
self-hosted Umami origin despite rendering its tracker script.

## Goals

- Publish main-branch artifacts to the Cloudflare Pages production deployment.
- Route internal navigation to the static directory URLs, avoiding the Pages slash redirect.
- Allow the configured Umami script and its telemetry connection under CSP.

## Non-goals

- Change the external compatibility behavior of `/blog`; Cloudflare Pages may keep redirecting it
  to `/blog/`.
- Add Pages Functions, a Worker, dependencies, or client-side routing.

## User-visible behavior

After the next merge, `andersseen.dev` receives the built production artifact. Navigation from
the header, home actions, and article breadcrumbs targets `/blog/`, `/en/blog/`, or `/ua/blog/`
directly. Existing external links to `/blog` remain valid through Cloudflare Pages' redirect.

## Technical plan

| File                                                        | Change                                                                               |
| :---------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `.github/workflows/deploy-pages-on-pr-merge.yml`            | Remove `--branch main` so Wrangler creates a production deployment.                  |
| `public/_headers`                                           | Permit the Umami origin for scripts and connections.                                 |
| `src/i18n/index.ts`                                         | Preserve a deliberate trailing slash passed to `toLocalePath`.                       |
| `src/components/Header.astro`                               | Point the navbar blog item to the directory URL.                                     |
| `src/components/home/*.astro`, `src/layouts/BlogPost.astro` | Use the direct blog directory URL for internal links and breadcrumbs.                |
| `tests/unit/`                                               | Cover the production deploy command, CSP allowlist, and trailing-slash locale paths. |
| `docs/ai/STATE.md`                                          | Record the root cause and fix.                                                       |

## i18n impact

- New locale keys: none.
- All three files updated (`es.json`, `en.json`, `ua.json`): no; no visible strings change.
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): yes; the shared components
  render links for all locales.

## Accessibility impact

No interactive controls or keyboard behavior change. Internal links retain their existing labels
and focus behavior.

## Performance impact

No new JavaScript or dependencies. Avoiding an internal redirect removes one round trip for
normal navigation to the blog listing.

## Test plan

- Unit: extend i18n and static deployment-configuration tests.
- E2E: run the existing navigation suite against the production build.
- Manual QA matrix: 320/375/390/768/1024 x es/en/ua x light/dark.

## Acceptance criteria

- [ ] The deploy command has no `--branch` flag.
- [ ] Umami is permitted by the deployed CSP for its script and telemetry requests.
- [ ] Internal blog links resolve to localized directory URLs with a trailing slash.
- [ ] `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass.
- [ ] `docs/ai/STATE.md` updated.

## Result (fill when Done)

Removed `--branch main` from the direct-upload command, so the workflow now creates a Cloudflare
Pages production deployment instead of a `main` preview deployment. Internal blog links use
localized directory URLs, avoiding the Pages slash redirect for normal navigation. The CSP and
preconnect hints now include the self-hosted Umami origin. No dependencies or client-side routing
were added.
