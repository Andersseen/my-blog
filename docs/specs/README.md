# Spec-Driven Development (SDD)

Non-trivial changes to this project start with a spec, not with code. The spec is a short
markdown file in this folder that defines WHAT will be built and HOW we'll know it's done,
before any implementation happens.

## When a spec is required

Write a spec if the change involves ANY of:

- A new page, section, or user-facing feature
- Changes to routing, i18n structure, theming tokens, or the content pipeline
- A new dependency or a change to the build/deploy pipeline
- Anything touching more than ~3 files

Skip the spec (but keep the Definition of Done from `AGENTS.md`) for: typos, copy tweaks,
single-file bug fixes, dependency bumps.

## The flow

```
1. SPEC       Copy _TEMPLATE.md → YYYY-MM-DD-short-slug.md. Fill every section.
              Status: Draft.
2. APPROVE    The maintainer (Andrii) reviews scope and marks Status: Approved.
              An AI agent must NOT start implementing a Draft spec on its own.
3. IMPLEMENT  Work through the spec's Technical Plan. Status: In Progress.
              If reality contradicts the spec, STOP and update the spec first —
              the spec is the contract, drift makes it worthless.
4. VERIFY     Walk the Acceptance Criteria one by one; run the Test Plan.
              Check the QA matrix (locales × themes × breakpoints) if UI changed.
5. CLOSE      Status: Done, add a Result section (what shipped, deviations, follow-ups).
              Update docs/ai/STATE.md (resolve/add known issues, refresh backlog).
```

## Rules for agents

- One spec = one branch = one PR. Name the branch after the spec slug.
- Acceptance criteria must be objectively checkable ("the /en/blog page renders the search
  input", not "search works well").
- Every spec must answer the i18n and a11y questions in the template — "N/A" is acceptable
  only with a reason.
- Specs are immutable history once Done: don't rewrite old specs, write a new one that
  supersedes them and link it.

## Index

| Spec                                                              | Status |
| :---------------------------------------------------------------- | :----- |
| [Closed Bento Layout](2026-09-17-closed-bento-layout.md)          | Done   |
| [SEO Icons And Routes](2026-09-17-seo-icons-routes.md)            | Done   |
| [Local Content Pipeline Proof](2026-07-16-local-content-proof.md) | Done   |

Keep this index updated — it's the quickest way to see what's in flight.
