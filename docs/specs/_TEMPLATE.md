# Spec: <short title>

- **Status:** Draft | Approved | In Progress | Done
- **Date:** YYYY-MM-DD
- **Author:** <human or model name>
- **Branch:** `feature/<slug>`

## Problem / Motivation

<What is wrong or missing today, and why it matters for this blog. 2–5 sentences.
Link to docs/ai/STATE.md items or ADRs if relevant.>

## Goals

- <objective, user-visible outcome>

## Non-goals

- <what this spec deliberately does NOT cover, to keep scope tight>

## User-visible behavior

<Describe exactly what a visitor sees/does after this ships. Include the affected URLs
(remember: `/...` for es, `/en/...`, `/ua/...`). Screenshots/sketches optional.>

## Technical plan

<Files to create/modify with paths, and the approach. Short — this is a plan, not the code.>

| File | Change |
| :--- | :--- |
| `src/...` | ... |

## i18n impact

- New locale keys: <list keys, or "none">
- All three files updated (`es.json`, `en.json`, `ua.json`): yes / no + reason
- Both page trees affected (`src/pages/` and `src/pages/[lang]/`): yes / no

## Accessibility impact

<Keyboard flow, focus management, landmarks, contrast in both themes, reduced motion.
"No interactive changes" is a valid answer if true.>

## Performance impact

<New JS shipped to the client? New dependency? Image weight? "None — static markup only"
is the expected answer for most changes.>

## Test plan

- Unit: <which tests/files in tests/unit/, or "none — no new pure logic">
- E2E: <which specs in tests/e2e/ to add/extend, or "covered by existing">
- Manual QA matrix (if UI changed): breakpoints 320/375/390/768/1024 × es/en/ua × light/dark

## Acceptance criteria

- [ ] <objectively checkable statement>
- [ ] `pnpm test` and `pnpm build` pass
- [ ] `docs/ai/STATE.md` updated

## Result (fill when Done)

<What actually shipped, deviations from the plan and why, follow-ups created.>
