---
name: j-flow-check
description: Show current feature status and gate progress. Use --all to list all features. Usage: /j-flow-check [--all]
---

# j-flow-check

Show feature status without modifying any files.

## Usage

```
/j-flow-check              # current or only active feature
/j-flow-check --all        # all features summary
/j-flow-check {slug}       # specific feature by slug
```

## Process: Single Feature

### Step 1: Find feature

Use the "How to Find Active Feature" algorithm from j-flow-shared.

### Step 2: Read files

- Read `.specs/{slug}/meta.md` for branch and created date
- Read `.specs/{slug}/gate-context.md` for gate statuses

### Step 3: Parse gate statuses

For each gate type, scan gate-context.md for lines starting with `[GATE NAME]`:
- `[FUNCTIONAL SPEC]` → functional spec gate
- `[TECHNICAL SPEC]` → technical spec gate
- `[TASK PLAN]` → task plan gate
- `[BUILD]` → build gate
- `[QA]` → QA gate
- `[REVIEW]` → review gate

Extract the status word after the gate name (approved / green / completed / red / stale / changes-requested).

### Step 4: Display output

```
Feature: {slug}
Branch:  feature/{slug}
Created: {date}

Gates:
  [✓] Functional spec    approved {date}
  [✓] Technical spec     approved {date}
  [✓] Task plan          approved {date}
  [✓] Build              completed {date}
  [⚠] QA                 red {date} — BLOCKED
  [ ] Review             not started
  [ ] Finish             not started

Next step: /j-flow-build --fix  (resolve QA failures, then re-run /j-flow-qa)
```

Gate icons:
- `✓` = approved / green / completed
- `⚠` = red / stale / changes-requested
- ` ` (space) = not started

**Next step logic:**
- No gates: suggest `/j-flow-spec`
- Functional spec approved, no technical: suggest `/j-flow-spec technical`
- Technical spec approved, no plan: suggest `/j-flow-plan`
- Plan approved, no build: suggest `/j-flow-build`
- Build completed, no QA: suggest `/j-flow-qa`
- QA red: suggest `/j-flow-build --fix`
- QA green, no review: suggest `/j-flow-review`
- Review changes-requested: suggest `/j-flow-build --fix`
- Review approved, no finish: suggest `/j-flow-finish`
- All gates done: suggest `/j-flow-release [major|minor|patch]`

## Process: --all Flag

List all directories in `.specs/` excluding `.agents/`. For each feature:
- Read `meta.md` for branch
- Read last line of `gate-context.md` for current gate and status

Output:
```
Features (3):
  user-auth       feature/user-auth       [review]    approved  2026-06-10
  invoice-list    feature/invoice-list    [qa]        red       2026-06-11
  dashboard       feature/dashboard       [build]     completed 2026-06-12
```

Column widths: auto-pad for alignment.

If `.specs/` is empty or only contains `.agents/`:
"No features found. Run /j-flow-start {slug} to begin."
