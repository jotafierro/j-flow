---
name: j-flow-reopen
description: "Reopen a feature to a prior gate. Clears gate-context.md from the chosen gate forward. Does NOT revert commits. Usage: /j-flow-reopen [slug]"
---

# j-flow-reopen

Reopen a finished or blocked feature by clearing gates from a chosen point forward.
Does NOT revert commits — only gate status in `gate-context.md` is cleared.

## Required reading

Before reopening any gate, read (skip anything already in your session context from earlier this conversation):

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-core.md` — slug validation, how to find the active feature
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-cascade.md` — cascade rules: reopening at phase X resets X and all downstream gates
3. `.specs/{slug}/meta.md` — current gate states
4. `.specs/{slug}/gate-context.md` — accumulated decisions (will be rewritten by this skill)

## Usage

```
/j-flow-reopen              # active feature
/j-flow-reopen {slug}       # specific feature
```

## Process

### Step 1: Find feature and show current state

If a `{slug}` argument was given, validate it first per `references/gate-core.md` §"Slug validation (fail-closed)" — fail closed before touching any path. Otherwise find the feature per `references/gate-core.md` §"How to Find Active Feature".
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

### Step 5: Reset meta.md

For each cleared gate, set its `{phase}_status:` field back to `pending` (phase→field map in `references/gate-cascade.md` §"Resetting a gate"). Set `current_phase` to the reopened gate's phase. Then recompute this feature's `.specs/README.md` backlog symbol per `references/gate-symbols.md`.

### Step 6: Output

Print the completion message, then use the Next-step dialogue from `references/gate-core.md` (next command: the command for the reopened gate, e.g. `/j-flow-build` when reopened at task plan):
```
Feature '{slug}' reopened at [TASK PLAN] ✓
Gates cleared: BUILD, QA, REVIEW

Continue to next step?

  1. Yes — run /j-flow-build now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```
