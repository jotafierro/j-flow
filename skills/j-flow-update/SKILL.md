---
name: j-flow-update
description: Update specs or task plan mid-feature due to changed requirements. Marks downstream gates as stale. Usage: /j-flow-update
---

# j-flow-update

Update a feature's specs or task plan when requirements change mid-feature.

## Required reading

Before updating any spec or plan, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — stale marker rules
2. `.specs/{slug}/meta.md` — current gate states
3. `.specs/{slug}/gate-context.md` — accumulated decisions (will be marked stale)
4. The artifact being updated: `functional-spec.md` / `technical-spec.md` / `tasks.json`

## Process

### Step 1: Find feature and show context

Find the active feature. Show current gate status (same as /j-flow-check).

### Step 2: Ask what changed

```
What needs updating?

1. Functional spec (AC added, removed, or modified)
2. Technical spec (architecture or pattern change)
3. Task plan (new tasks, removed tasks, file paths changed)

Enter number:
```

### Step 3: Make the targeted change

**Option 1 — Functional spec:**
Show current `functional-spec.md`. Ask: "What changed? Describe the AC modification."
Make only the targeted edit (add/remove/modify the affected AC lines).
Show diff. Ask: "Does this look right? Reply 'yes' to save."
Save the updated file.

**Option 2 — Technical spec:**
Show the relevant section of `technical-spec.md`. Ask: "What changed?"
Make the targeted edit. Show diff. Confirm. Save.

**Option 3 — Task plan:**
Show `tasks.json`. Ask: "What changed?"
Make the targeted edit.
Re-validate AC coverage — if `uncovered_acs` becomes non-empty, warn the user before saving.
Show diff. Confirm. Save.

### Step 4: Mark downstream gates stale

Determine which gates are downstream of the changed artifact:
- Functional spec changed → ALL subsequent gates stale: technical spec, task plan, build, QA, review
- Technical spec changed → Task plan, build, QA, review stale
- Task plan changed → Build, QA, review stale

In `gate-context.md`, append ` [stale]` to each affected gate's status line:

Before: `[BUILD] completed 2026-06-10`
After:  `[BUILD] completed 2026-06-10 [stale]`

### Step 5: Commit

```bash
git add .specs/{slug}/
git commit -m "chore({slug}): update {functional-spec|technical-spec|task-plan} — {brief reason}"
```

### Step 6: Output

```
{artifact} updated ✓
Stale gates: {list of gates now marked stale}

These gates must be re-run before /j-flow-finish.
Use /j-flow-check to see current status.
```
