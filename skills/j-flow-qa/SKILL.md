---
name: j-flow-qa
description: Run full QA gate across 6 stages: unit tests, NestJS E2E, Flutter integration, Playwright E2E, visual smoke check, manual checklist. Blocks /j-flow-review if red. Usage: /j-flow-qa
---

# j-flow-qa

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[BUILD] completed`.
If missing: "Gate [BUILD] not completed. Run /j-flow-build first."

## Process

Dispatch the **j-flow-quality** agent with:
- Full contents of `.specs/{slug}/review-guide.md`
- Instruction: "Run all 6 QA stages in order. Stop on first stage failure and document exact output. Generate qa-report.md. For the manual checklist (stage 6), present each item from review-guide.md to the user and record their pass/fail response."

### Stages the agent runs:

**Stage 1 — Unit tests:**
```bash
pnpm test --passWithNoTests   # or jest / vitest depending on project
flutter test
```

**Stage 2 — NestJS E2E:**
```bash
pnpm test:e2e   # runs *.e2e-spec.ts via @nestjs/testing + supertest
```
Requires MongoDB container. Agent checks `docker compose ps` first.

**Stage 3 — Flutter integration:**
```bash
flutter drive --target=integration_test/app_test.dart
```

**Stage 4 — Playwright E2E:**
```bash
npx playwright test
```
Requires full stack running (docker compose + backend + frontend).

**Stage 5 — Visual smoke:**
Storybook: `pnpm storybook --ci` (or equivalent) — verify it builds without errors.
Widgetbook: `flutter run -d chrome --headless` from widgetbook directory — verify it launches.

**Stage 6 — Manual checklist:**
Present each item from `review-guide.md` → Manual Test Steps to the user. Record PASS or FAIL for each.

## Gate Decision

### If all 6 stages pass (green):

1. Write `.specs/{slug}/qa-report.md` with green status
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [QA] green {today's date}
     → {N} tests passing, checklist {N}/{N}
   ```
3. Print:
   ```
   QA gate green ✓
   All 6 stages passed.
   
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
