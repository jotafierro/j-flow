# /j-flow-project — Update mode

Loaded by `j-flow-project/SKILL.md` when `--update` is given. Follow it completely, then return to SKILL.md §Rules.

## Mode: Update (`--update`)

Run to sync backlog statuses from actual `meta.md` files, add new features, or reorganize phases. Does NOT touch feature spec directories (except the README.md symbol table).

### Step 1: Read current state

Read `.specs/README.md`. For each feature row in the table, extract the slug (from the Folder column).

For each slug, check if `.specs/{slug}/meta.md` exists. If it does, read the following fields:
- `current_phase`
- `functional_status`
- `technical_status`
- `tasks_status`
- `build_status`
- `qa_status`
- `review_status`
- `finish_status`

Build a truth map: `slug → { meta fields }` vs `slug → displayed symbol`.

### Step 2: Sync symbols

Map each feature's actual state to the correct symbol per `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-symbols.md` §"Backlog symbols" (first matching condition wins, top to bottom).

For each feature where the actual symbol differs from the displayed symbol, update the `.specs/README.md` table row.

### Step 2b: Backfill agent memory for layer changes (growth)

Re-read `PRODUCT.md`'s `**Layers:**` line into `stack_layers`, then re-run Init **Step 8**'s filter table in create-if-missing mode: for any layer added since the last run, write the now-included agent's memory from its template; leave existing files untouched. Print each backfill: `{agent}.md created — {layer} added to stack_layers.` If nothing was added, print nothing.

This closes the growth gap: the full "add a layer later" flow is **edit `**Layers:**` in `PRODUCT.md` → `/j-flow-project --update`** — Step 2b backfills the agent memory and the auto-invoked `/j-flow-scaffold --review` (see Step 4) reports the new app/package/CI artifacts to generate. No file is ever created by hand.

### Step 2c: Backfill .specs/config.md

If `.specs/config.md` does not exist, create it from
`${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/config.md` with `**Workflow mode:** team`
— the documented default for any project that predates the file, so an existing repo keeps
behaving exactly as it did. Print: `.specs/config.md created (Workflow mode: team, Spec language: en, Docs language: en) — edit it to change any of them.`

If the file already exists, **leave it completely untouched**, including a field whose value
you would not have chosen. It is hand-edited policy, not generated state; `--update` fills
gaps and never overwrites. If a field is missing from an existing file, add just that field
at its default and say so.

### Step 3: Show summary and prompt

Show:
```
Status sync complete. {N} rows updated.

  1. Add new features to the backlog
  2. Reorganize phases
  3. Save and exit

Enter 1, 2, or 3:
```

**Option 1 — Add features:**
Ask for each new feature: name, 1-line description, phase, dependencies (slug list). Generate a new slug (increment from highest existing number + 1). Append to `.specs/README.md` in the correct phase section with status `[ ]`.

**Option 2 — Reorganize:**
Show current phase structure. Ask which features to move and where. Rewrite the phase sections accordingly. Slug numbers do not change when features are moved between phases.

**Option 3 — Save and exit:** proceed immediately to Step 4.

### Step 4: Write and confirm

Write the updated `.specs/README.md`. Print:
```
.specs/README.md updated:
  • {N} statuses synced
  • {N} features added
  • {N} features moved
```

If anything changed (statuses synced, features added, or features moved), commit:
```bash
git add .specs/README.md
git commit -m "chore: j-flow-project --update — sync backlog statuses"
```

### Step 5: Auto-invoke scaffold review

Print: "Auto-invoking /j-flow-scaffold --review..."

Then immediately invoke `/j-flow-scaffold --review`.
