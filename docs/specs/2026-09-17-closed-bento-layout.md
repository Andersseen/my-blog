# Spec: Closed Bento Layout

- **Status:** Done
- **Date:** 2026-09-17
- **Author:** Codex
- **Branch:** `fix/seo-icons-routes`

## Problem / Motivation

The blog index uses random post-group selection. Its fallback can add posts to a group whose
geometry was calculated for a smaller count, which can leave an unfinished row at the end of the
bento listing. The shared page shell is also constrained to `max-w-6xl`, creating more lateral
space than intended for the navigation and grid on wide screens.

## Goals

- Make every desktop bento group occupy a complete 12-column rectangle.
- Keep the first eligible group as the visually prominent article row.
- Widen the shared content frame modestly so the navigation and bento grid use the viewport more
  comfortably.

## Non-goals

- Redesign article cards, their imagery, or the navigation component's controls.
- Add client-side layout measurement or JavaScript.

## User-visible behavior

On `/blog`, `/en/blog`, and `/ua/blog`, article cards are arranged in deterministic, complete
bento groups. The final group no longer leaves unused columns. The header and content share a
slightly wider aligned frame on large screens.

## Technical plan

| File                              | Change                                                                                                                                      |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/bento-layout.ts`         | Replace random grouping/fallback behavior with deterministic exact-count layout planning and make the six-card pattern fill its second row. |
| `src/layouts/MainLayout.astro`    | Increase the shared desktop content maximum width from `6xl` to `7xl`.                                                                      |
| `tests/unit/bento-layout.test.ts` | Verify every group has its layout's exact post capacity and representative post counts produce only complete groups.                        |
| `docs/ai/STATE.md`                | Record the completed layout adjustment.                                                                                                     |

## i18n impact

- New locale keys: none.
- All three files updated (`es.json`, `en.json`, `ua.json`): no; no visible strings change.
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): yes; both render the shared
  `BlogIndexPage` component.

## Accessibility impact

No interactive changes. Existing links, headings, keyboard flow, and focus behavior remain
unchanged. The same color tokens and card contrast are retained in both themes.

## Performance impact

None. The calculation runs at build time and ships no new JavaScript, dependencies, or images.

## Test plan

- Unit: extend `tests/unit/bento-layout.test.ts` for exact-capacity, closed groups.
- E2E: existing blog navigation/index coverage, rerun against the production build.
- Manual QA matrix: 320/375/390/768/1024 × es/en/ua × light/dark.

## Acceptance criteria

- [ ] Each generated post group contains exactly the number of cards required by its grid pattern.
- [ ] The first group remains featured when at least five posts are present.
- [ ] The shared header and bento grid use the wider `7xl` desktop frame.
- [ ] `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass.
- [ ] `docs/ai/STATE.md` updated.

## Result (fill when Done)

Replaced the random post grouping and its overflow fallback with a deterministic planner. Every
group now receives exactly the number of posts its grid geometry expects, while still avoiding
consecutive repeated layouts and preserving the featured first group. The six-card geometry now
uses a 6+6 first row and a 3+3+3+3 second row, so it is a closed rectangle. The shared shell now
uses `max-w-7xl`; no client JavaScript, dependencies, strings, or accessibility behavior changed.
