---
name: j-flow-qa
description: Run full QA gate across 6 stages: unit tests, NestJS E2E, Flutter integration, Playwright E2E, visual smoke check, manual checklist. Blocks /j-flow-review if red. Usage: /j-flow-qa
---

# j-flow-qa

## Required reading

Before running QA, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format and red/green semantics
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/agent-scopes.md` — j-flow-quality scope and what to test
3. `.specs/{slug}/review-guide.md` — environment setup and layer file index
4. `.specs/{slug}/review/` — per-layer manual testing docs (if present)
5. `.specs/{slug}/tasks.json` — to understand the feature scope
6. `.specs/{slug}/gate-context.md` — accumulated decisions
7. Template: `templates/qa-report.md` — output format

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[BUILD] completed`.
If missing: "Gate [BUILD] not completed. Run /j-flow-build first."

## Process

Dispatch the **j-flow-quality** agent with:
- Full contents of `.specs/{slug}/review-guide.md`
- Contents of each present file in `.specs/{slug}/review/` (api.md, web.md, mobile.md, admin.md, e2e.md)
- Template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/qa-report.md` for the output structure
- Instruction: "Run all 7 QA stages in order. Stop on first stage failure and document exact output. Generate qa-report.md following the template: substitute test counts and status per stage, include exact failure output for any red stage. For the manual checklist (stage 7), use the per-layer review docs if present (see Stage 7 instructions below)."

### Stages the agent runs:

**Stage 1 — Lint:**
```bash
pnpm lint          # ESLint across all JS/TS packages
flutter analyze    # Dart analyzer for mobile
```
Any `error`-level ESLint finding or Dart analyzer error is a stage failure. Warnings are logged but do not block.

**Stage 2 — Unit tests:**
```bash
pnpm test --passWithNoTests   # or jest / vitest depending on project
flutter test
```

**Stage 3 — NestJS E2E:**
```bash
pnpm test:e2e   # runs *.e2e-spec.ts via @nestjs/testing + supertest
```
Requires MongoDB container. Agent checks `docker compose ps` first.

**Stage 4 — Flutter integration:**
```bash
flutter drive --target=integration_test/app_test.dart
```

**Stage 5 — Playwright E2E:**
```bash
npx playwright test
```
Requires full stack running (docker compose + backend + frontend).

**Stage 6 — Visual smoke:**
Storybook: `pnpm storybook --ci` (or equivalent) — verify it builds without errors.
Widgetbook: `flutter run -d chrome --headless` from widgetbook directory — verify it launches.

**Stage 7 — Manual checklist:**
Check whether `.specs/{slug}/review/` exists.

If `review/` exists (post-016 feature):
  Run layer files in this order: api.md → web.md → mobile.md → admin.md → e2e.md
  For each present file:
    Present the layer's Checklist table to the user. Record PASS or FAIL for each row.
  `review/e2e.md` runs last, after all individual layer files pass.
  A layer file is skipped if absent (no tasks for that layer, or infra-only).

If `review/` absent (pre-016 feature):
  Fall back: present each item from `review-guide.md` → Manual Test Steps to the user. Record PASS or FAIL.

## Gate Decision

### If all 7 stages pass (green):

1. Write `.specs/{slug}/qa-report.md` with green status
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [QA] green {today's date}
     → {N} tests passing, checklist {N}/{N}
   ```
3. Update `.specs/{slug}/meta.md`: set `qa_status: green`, `qa_completed_at: {today's date}`, `current_phase: review`.
4. Update `.specs/README.md`: find the row where the folder column contains `.specs/{slug}/`, replace its status symbol with `[Q]`.
5. Print:
   ```
   QA gate green ✓
   All 7 stages passed.
   
   Next step: /j-flow-review
   ```

### If any stage fails (red):

1. Write `.specs/{slug}/qa-report.md` with red status and exact failure output
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [QA] red {today's date}
     → BLOCKED: {stage name} failed — see qa-report.md
   ```
3. Print:
   ```
   QA gate red ✗
   Stage failed: {stage name}
   See .specs/{slug}/qa-report.md for details.
   
   Next step: /j-flow-build --fix
   ```
