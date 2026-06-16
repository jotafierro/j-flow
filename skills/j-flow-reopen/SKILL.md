---
name: j-flow-reopen
description: Reopen a feature to a prior gate. Clears gate-context.md from the chosen gate forward. Does NOT revert commits. Usage: /j-flow-reopen [slug]
---

# j-flow-reopen

Reopen a finished or blocked feature by clearing gates from a chosen point forward.
Does NOT revert commits — only gate status in `gate-context.md` is cleared.

## Required reading

Before reopening any gate, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — cascade rules: reopening at phase X resets X and all downstream gates
2. `.specs/{slug}/meta.md` — current gate states
3. `.specs/{slug}/gate-context.md` — accumulated decisions (will be rewritten by this skill)

## Usage

```
/j-flow-reopen              # active feature
/j-flow-reopen {slug}       # specific feature
```

## Process

### Step 1: Find feature and show current state

Find the feature (see j-flow-shared: "How to Find Active Feature").
Read `gate-context.md` and display the current gate summary (same format as /j-flow-check).

### Step 2: Ask which gate to reopen at

Present a numbered menu with current status for each gate:

```
Reopen '{slug}' at which gate?

1. Functional spec    [{status or "not started"}]
2. Technical spec     [{status or "not started"}]
3. Task plan          [{status or "not started"}]
4. Build              [{status or "not started"}]
5. QA                 [{status or "not started"}]
6. Review             [{status or "not started"}]

Enter number (or 'cancel'):
```

### Step 3: Confirm destructive action

Before making any changes, show exactly what will be cleared:

```
Reopening at [TASK PLAN] will clear these gates:
  - [BUILD] completed 2026-06-10
  - [QA] green 2026-06-10
  - [REVIEW] approved 2026-06-11

Git commits will NOT be reverted.
gate-context.md will be rewritten.

Confirm? (yes / cancel)
```

If user replies 'cancel': stop with "Reopen cancelled."

### Step 4: Rewrite gate-context.md

1. Read current `gate-context.md`
2. Keep the header line and all gate entries UP TO AND INCLUDING the chosen gate
3. Remove all entries after the chosen gate
4. Write the updated file

Example — reopen at "task plan" on a feature with all 6 gates:
- Keep: `[FUNCTIONAL SPEC]`, `[TECHNICAL SPEC]`, `[TASK PLAN]` entries
- Remove: `[BUILD]`, `[QA]`, `[REVIEW]` entries

### Step 5: Update meta.md

Uncheck the cleared gates in the checklist in `meta.md`.

### Step 6: Output

```
Feature '{slug}' reopened at [TASK PLAN] ✓
Gates cleared: BUILD, QA, REVIEW

Next step: /j-flow-build
```
