# IMPROVEMENT_PLAN — Roadmap by phases

> Snapshot: 2026-07-16.
> Goal: improve the project in independent phases so each phase can start in a new session.
> Each phase should begin by reading `docs/ai/HANDOFF_CONTEXT.md` and verifying the current repo
> state before editing.

## North Star

Make `andersseen.dev` a fast, accessible, multilingual personal publishing hub that also proves
the quality of the Andersseen design system. The site should remain static, simple to deploy, and
pleasant to maintain.

## Current Diagnosis

The project is in a healthy but unfinished state:

- Core architecture is solid: Astro SSG, manual i18n, shared page bodies, Medium loader, tests,
  Cloudflare Pages deployment.
- Quality gates are partially active: unit tests and build pass; E2E is wired in CI.
- Type-checking is not clean because Pagefind globals are untyped.
- Performance and Lighthouse work is blocked by external design-system ARIA issues, Medium image
  behavior, and possible GIF-heavy bento heroes.
- Local content exists architecturally but has no real post to exercise the path.
- Some docs and conventions have drifted from code.

## Phase 0 — Baseline And Memory Hygiene

Purpose: make the repo's memory match reality before deeper work.

Scope:

- Update `docs/ai/STATE.md` with findings from the latest verification.
- Fix stale README claims about Service Worker / Workbox and ViewTransitions if still present.
- Decide whether `docs/ai/HANDOFF_CONTEXT.md` should stay as a permanent onboarding file.
- Add this roadmap to any docs index if desired.

Acceptance criteria:

- `STATE.md` no longer claims GIF handling exists unless the code actually has it.
- README performance section matches the current architecture.
- Future sessions know whether to rely on this roadmap and handoff doc.

Suggested verification:

```bash
pnpm test
pnpm build
```

Notes:

- This is documentation-only unless you choose to fix tiny lint/type warnings at the same time.
- No spec is required if limited to docs.

## Phase 1 — Clean Type Health And Small Convention Drift

Purpose: remove current friction so later sessions can trust `astro check`.

Scope:

- Add ambient Pagefind typings or local typed wrappers for:
  - `window.pagefind`
  - `window.__pagefindLoaded`
  - `pagefind.init()`
  - `pagefind.search()`
- Narrow `SearchInput.astro` event target to `HTMLInputElement`.
- Remove unused imports/variables reported by `astro check` where safe.
- Move visible fallbacks in `SearchInput.astro` to i18n or remove them if keys are guaranteed.
- Consider replacing inline search SVG with the icon registry if the design system has the icon.

Acceptance criteria:

- `pnpm astro check` exits successfully, or remaining warnings are documented and non-blocking.
- `pnpm test` passes.
- `pnpm build` passes.
- No hardcoded user-visible fallback strings remain in `SearchInput.astro`.

Suggested verification:

```bash
pnpm astro check
pnpm test
pnpm build
```

Spec requirement:

- Probably no spec if the work stays inside search typings and small hygiene.

## Phase 2 — Content Pipeline Proof

Purpose: prove the local MDX content path before the blog depends on it.

Scope:

- Add a first real local `.mdx` post or a deliberate fixture post strategy.
- Verify local post routing for `/blog/<slug>`, `/en/blog/<slug>`, and `/ua/blog/<slug>`.
- Check hero image handling, alt text, metadata, RSS output, sitemap, and JSON-LD.
- Decide how local posts should behave across languages:
  - same post visible in all locales, or
  - language-specific content model.
- Document the decision in an ADR or spec.

Acceptance criteria:

- At least one local post renders correctly in all configured routes, or the chosen multilingual
  strategy is documented before implementation.
- Blog index mixes local and Medium posts in date order.
- Error states for empty Medium/local content are intentional.

Suggested verification:

```bash
pnpm test
pnpm build
pnpm test:e2e
```

Spec requirement:

- Required. This touches content model, routing behavior, SEO, and user-visible pages.

## Phase 3 — Search UX Completion

Purpose: turn the current lazy Pagefind loader into a real search experience.

Scope:

- Decide expected UX: inline result dropdown, results page, or compact list below input.
- Implement accessible results:
  - keyboard navigation
  - empty state
  - loading state
  - translated labels
  - no layout overlap on mobile
- Ensure search only initializes on built sites and fails gracefully in dev.
- Add E2E coverage against a built site with Pagefind index.

Acceptance criteria:

- Users can search and open results from `/blog`.
- Search UI is translated in `es`, `en`, and `ua`.
- Keyboard and screen-reader behavior is covered by tests or manual QA notes.
- No console-only "results" behavior remains.

Suggested verification:

```bash
pnpm build
pnpm search:build
pnpm test:e2e
```

Spec requirement:

- Required. This is a user-facing interaction.

## Phase 4 — Design System Accessibility Upstream

Purpose: unblock Lighthouse accessibility and remove axe exclusions where possible.

Scope:

- Fix in `@andersseen/web-components`, not this repo, if source is available:
  - `<and-drawer>` needs accessible dialog name.
  - `aria-controls` should point to a real element.
  - `menuitem` roles need a valid `menu` or `menubar` parent.
- Publish/bump `@andersseen/web-components`.
- Remove or reduce `DESIGN_SYSTEM_EXCLUDES` in `tests/e2e/accessibility.spec.ts`.
- Re-run Lighthouse accessibility locally.

Acceptance criteria:

- Axe tests pass with fewer or no design-system exclusions.
- Lighthouse accessibility reaches configured threshold on `/` and `/blog`.
- Package bump is documented in `STATE.md`.

Suggested verification:

```bash
pnpm install
pnpm test
pnpm build
pnpm test:e2e
```

Spec requirement:

- Required if this repo changes package versions and tests.
- A separate plan may be needed in the design-system repo.

## Phase 5 — Blog Performance And Medium Images

Purpose: make `/blog` consistently fast enough to re-enable performance gates.

Scope:

- Re-verify current `/blog` page weight with live Medium content.
- Fix or implement GIF detection in `src/lib/image-optimization.ts`.
- Decide product behavior for animated GIF heroes:
  - keep animation and accept occasional slow LCP,
  - avoid GIFs as featured heroes,
  - generate static poster frames at build time,
  - proxy/transcode images through own infrastructure.
- Consider using `sharp` for local/generated image derivatives if the approach stays static.
- Avoid adding runtime infra unless the performance gain justifies the complexity.

Acceptance criteria:

- `/blog` LCP is stable enough under realistic Medium content.
- GIF policy is documented.
- Image behavior does not break visual quality or accessibility.

Suggested verification:

```bash
pnpm test
pnpm build
pnpm search:build
pnpm test:e2e
```

Additional verification:

- Run Lighthouse locally against production build.
- Test with a known GIF hero and a normal image hero.

Spec requirement:

- Required. This is a product/performance tradeoff with implementation choices.

## Phase 6 — Medium Image Ownership And Best Practices

Purpose: address Lighthouse best-practices issues caused by hotlinked Medium images.

Scope:

- Investigate static build-time caching vs Cloudflare edge/image proxy.
- Keep Cloudflare free-tier friendliness in mind.
- Update CSP and caching headers if images move to own origin.
- Ensure Medium failure does not hard-fail builds.

Acceptance criteria:

- Third-party cookie issue is gone or explicitly accepted.
- Image URLs are stable and cacheable.
- CSP allows only the required image sources.

Suggested verification:

```bash
pnpm build
pnpm test:e2e
```

Spec requirement:

- Required. This touches content pipeline, deployment, CSP, and performance.

## Phase 7 — Re-Enable Lighthouse CI

Purpose: restore automated performance, accessibility, best-practices, and SEO guardrails.

Scope:

- Re-run Lighthouse locally for `/` and `/blog`.
- Tune thresholds only if they reflect intentional product choices.
- Re-enable the commented Lighthouse job in `.github/workflows/deploy-pages-on-pr-merge.yml`.
- Avoid using global npm install in CI if a local `pnpm exec lhci` path works.

Acceptance criteria:

- CI Lighthouse job passes consistently.
- Thresholds are documented in `lighthouserc.cjs`.
- `STATE.md` removes the disabled-Lighthouse debt.

Suggested verification:

```bash
pnpm build
pnpm exec lhci autorun
```

Spec requirement:

- Required. This changes CI behavior.

## Phase 8 — Product Polish And Publishing Rhythm

Purpose: move from technically functional to clearly useful as a personal brand hub.

Scope:

- Define content categories or editorial taxonomy.
- Improve home page hierarchy after real content exists.
- Add richer local post affordances if needed:
  - reading time
  - tags
  - related posts
  - canonical Medium/local relationship
- Set real Giscus IDs out-of-band and verify comments.
- Review metadata/social cards with real articles.

Acceptance criteria:

- The site communicates Andrii's current expertise clearly.
- Local and Medium content feel like one intentional archive.
- SEO/social previews look correct for representative posts.

Suggested verification:

```bash
pnpm test
pnpm build
pnpm test:e2e
```

Spec requirement:

- Required for new user-visible features.

## How To Start A New Session

Use this prompt shape:

```text
Read docs/ai/HANDOFF_CONTEXT.md and docs/roadmap/IMPROVEMENT_PLAN.md.
Start Phase N: <phase name>.
Verify current state first, then implement only this phase.
Update STATE.md and HANDOFF_CONTEXT.md with durable findings.
```

## Phase Ordering

Recommended order:

1. Phase 0
2. Phase 1
3. Phase 2 or 3, depending on whether content or search matters more next
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7
8. Phase 8

Do not start Phase 7 until the Lighthouse blockers are actually resolved or intentionally
accepted with adjusted thresholds.
