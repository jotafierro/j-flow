---
name: j-flow-qa
description: "Run full QA gate across 7 stages: lint, unit tests, NestJS E2E, Flutter integration, Playwright E2E, visual smoke check, manual checklist — layer-aware, skips stages for untouched layers. Blocks /j-flow-review if red. Usage: /j-flow-qa"
---

# j-flow-qa

## Required reading

**Override resolution:** every `${CLAUDE_PLUGIN_ROOT}/…` template or reference this skill reads resolves through `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — if a matching file exists under `.specs/.overrides/`, use it verbatim instead of the plugin default. For dispatching **j-flow-quality**, follow the agent-override dispatch rule in `overrides.md` §"Agent-definition overrides (dispatch)" — session confirmation and tool-scope ceiling included, never widened.

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
- Instruction: "Run all applicable QA stages in order, per the layer-scoping below. Stop on first stage failure and document exact output. Generate qa-report.md following the template: substitute test counts and status per stage, mark skipped stages as N/A with the skip reason, include exact failure output for any red stage. For the manual checklist (stage 7), use the per-layer review docs if present (see Stage 7 instructions below)."

### Determine applicable stages

Read `.specs/{slug}/tasks.json` `layers`. A layer is "in scope" if it has at least one task.

- Stage 4 (Flutter integration) runs only if `mobile` is in scope.
- Stage 5 (Playwright E2E) runs only if the `e2e` harness exists — i.e. `apps/e2e/` is present in the repo (equivalently `has_e2e`). This is a scaffolded harness, not a build-task layer, so gate on its presence rather than on `tasks.json` layers. When `!has_web`, the harness targets an external `BASE_URL`; if `BASE_URL` is unset, skip Stage 5 with the reason "e2e is external-target and BASE_URL is unset."
- Stage 6 (Visual smoke): run the Storybook check only if `ui` is in scope; run the Widgetbook check only if `mobile` is in scope. If neither applies, skip Stage 6 entirely.
- The `cli` layer maps to **Stages 1-2 only** (lint + unit via vitest — already covered by `pnpm lint` / `pnpm test` across the workspace). It triggers no NestJS E2E, Flutter, Playwright, or visual-smoke stage.

Print which stages/halves were skipped and why, alongside the stage results:
```
Skipped: Stage 4 (Flutter integration) — no mobile tasks in this feature.
Skipped: Stage 6 Widgetbook check — no mobile tasks in this feature.
```

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
Requires the target reachable at `baseURL`. When a local web app exists (`has_web`), `playwright.config.ts`'s `webServer` block boots it automatically (plus whatever it depends on — docker compose + backend). When `!has_web`, the harness has no `webServer`: ensure `BASE_URL` points at a running target (staging/deployed URL) before this stage — e.g. `BASE_URL=https://staging.example.com npx playwright test`.

**Stage 6 — Visual smoke:**
Storybook: `pnpm storybook --ci` (or equivalent) — verify it builds without errors.
Widgetbook: `flutter run -d chrome --headless` from widgetbook directory — verify it launches.

**Stage 7 — Manual checklist:**
Check whether `.specs/{slug}/review/` exists.

If `review/` exists (post-016 feature):
  Run layer files in this order: api.md → web.md → mobile.md → admin.md → e2e.md
  For each present file:
    Present the layer's Checklist table to the user. Record PASS or FAIL for each row in qa-report.md.
    For each row recorded PASS: flip that row's `[ ]` to `[x]` in the review file itself.
    Leave FAIL rows as `[ ]` — failure detail is captured in qa-report.md.
  `review/e2e.md` runs last, after all individual layer files pass.
  A layer file is skipped if absent (no tasks for that layer, or infra-only).

If `review/` absent (pre-016 feature):
  Fall back: present each item from `review-guide.md` → Manual Test Steps to the user. Record PASS or FAIL.

## Gate Decision

### If all applicable stages pass (green):

1. Write `.specs/{slug}/qa-report.md` with green status
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [QA] green {today's date}
     → {N} tests passing, checklist {N}/{N}
   ```
3. Advance the **qa** gate per `references/gate-rules.md` §"Advancing a gate" — sets the meta.md fields and recomputes the `.specs/README.md` backlog symbol.
4. Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-review`):
   ```
   QA gate green ✓
   All applicable stages passed.

   Continue to next step?

     1. Yes — run /j-flow-review now
     2. No — stay here, I want to discuss or adjust first

   Enter 1 or 2:
   ```

### If any stage fails (red):

1. Write `.specs/{slug}/qa-report.md` with red status and exact failure output
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [QA] red {today's date}
     → BLOCKED: {stage name} failed — see qa-report.md
   ```
3. Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-build --fix`):
   ```
   QA gate red ✗
   Stage failed: {stage name}
   See .specs/{slug}/qa-report.md for details.

   Continue to next step?

     1. Yes — run /j-flow-build --fix now
     2. No — stay here, I want to discuss or adjust first

   Enter 1 or 2:
   ```
