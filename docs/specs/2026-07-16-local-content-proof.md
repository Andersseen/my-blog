# Spec: Local Content Pipeline Proof

- **Status:** Done
- **Date:** 2026-07-16
- **Author:** Codex
- **Branch:** `feat/roadmap-improvements`

## Problem / Motivation

The local MDX blog path exists but has no real content, so routing, RSS, sitemap, structured data,
and hero-image behavior are largely unproven. Phase 2 of `docs/roadmap/IMPROVEMENT_PLAN.md`
requires a deliberate proof before local publishing depends on this path. This also clarifies the
initial multilingual behavior for local posts.

## Goals

- Add one real local MDX post that exercises the local content collection.
- Render that post at `/blog/<slug>/`, `/en/blog/<slug>/`, and `/ua/blog/<slug>/`.
- Verify that the blog index mixes local and Medium posts by date.
- Verify hero image rendering, metadata, RSS, sitemap, and JSON-LD for the local post.
- Document the first multilingual strategy for local posts.

## Non-goals

- No language-specific local content model yet.
- No CMS, database, or runtime content fetching.
- No new dependencies or image-processing pipeline.
- No search UX changes; Pagefind result UI remains Phase 3 work.

## User-visible behavior

Visitors see a first local post titled "Building This Blog As A Product" on the blog index. The
same post is available in all locales:

- `/blog/building-this-blog-as-a-product/`
- `/en/blog/building-this-blog-as-a-product/`
- `/ua/blog/building-this-blog-as-a-product/`

For now, local posts are shared across locales. The post body includes short Spanish, English, and
Ukrainian sections so the single-source strategy is explicit to readers.

## Technical plan

| File                                                   | Change                                                                                               |
| :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `src/content/blog/building-this-blog-as-a-product.mdx` | Add the first local MDX post using an existing local hero image.                                     |
| `src/layouts/BlogPost.astro`                           | Keep rendering existing local post metadata and hero image; adjust only if verification finds a bug. |
| `tests/e2e/navigation.spec.ts`                         | Add route coverage for the local post in default and prefixed locales.                               |
| `tests/unit/*.test.ts`                                 | Add focused unit coverage only if a pure helper changes.                                             |
| `docs/ai/STATE.md`                                     | Record that the local content path is now exercised and remove stale debt.                           |
| `docs/specs/README.md`                                 | Add this spec to the index.                                                                          |

## i18n impact

- New locale keys: none.
- All three files updated (`es.json`, `en.json`, `ua.json`): no, because this proof uses post
  content rather than UI strings.
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): yes, existing wrappers should
  render the same local post in all configured locales.

## Accessibility impact

No new interaction. The hero image must keep a non-empty alt generated from existing translated UI
copy plus the post title. Heading order should remain one `h1` followed by post sections.

## Performance impact

No new client JS or dependencies. The hero image uses an existing local asset processed by Astro.

## Test plan

- Unit: `pnpm test`; add a focused test only if implementation changes pure logic.
- E2E: extend navigation/blog routing coverage for the local post routes.
- Build output checks: confirm RSS, sitemap, and page JSON-LD include the local post.
- Manual QA matrix: not required beyond route smoke checks because this adds static article content
  using existing layout styles.

## Acceptance criteria

- [x] One local MDX post renders at the default and prefixed locale routes.
- [x] The blog index includes the local post and can still include Medium posts when available.
- [x] The local post has a local hero image with accessible alt text.
- [x] RSS and sitemap include the local post route.
- [x] Article JSON-LD renders on the local post page.
- [x] `pnpm test`, `pnpm build`, and relevant E2E tests pass.
- [x] `docs/ai/STATE.md` updated.

## Result (fill when Done)

Shipped one local MDX proof post, `building-this-blog-as-a-product`, using an existing local hero
image. The post renders through the existing shared blog-post route wrappers for `es`, `en`, and
`ua`; RSS, sitemap, and article JSON-LD include the local route; and E2E coverage now checks the
three locale routes plus RSS. The first multilingual strategy is documented as shared local posts
across locales until a future spec introduces language-specific content.
