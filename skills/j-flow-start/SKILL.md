---
name: j-flow-start
description: "Initialize a new feature. Creates git branch, .specs/{slug}/ directory, meta.md, and empty gate-context.md. Loads agent memory context. Usage: /j-flow-start {slug}"
---

# j-flow-start

Initialize a new feature branch and spec folder.

## Required reading

Before initializing a feature, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — for the initial `gate-context.md` format and meta.md field names
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md` — the meta.md template (already used in the existing flow)
3. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/gate-context.md` — the gate-context.md seed
4. `.specs/README.md` — the backlog, to verify the slug exists and isn't already started

## Usage

```
/j-flow-start {slug}
```

`{slug}` must be kebab-case (e.g. `user-auth`, `invoice-list`, `dashboard-v2`).

## Prerequisites

- `/j-flow-project` has been run (`.specs/.agents/` directory exists)
- You are on the `develop` branch (or main if no develop exists)

## Process

### Step 1: Validate slug

- Pattern must match: `[a-z0-9][a-z0-9-]*[a-z0-9]` (or single word `[a-z0-9]+`)
- Must not already exist as a directory in `.specs/`
- If invalid: "Invalid slug '{slug}'. Use kebab-case (e.g. user-profile, invoice-list)."
- If already exists: "Feature '{slug}' already exists. Use /j-flow-check to see its status."

### Step 2: Verify agent memory exists

Check `.specs/.agents/` exists. If not:
"Agent memory not found. Run /j-flow-project first."

### Step 3: Create git branch

```bash
git checkout -b feature/{slug}
```

If branch already exists: "Branch feature/{slug} already exists. Delete it first or choose a different slug."

### Step 4: Create feature directory and files

Create `.specs/{slug}/` with two files:

**meta.md:**
Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md`. Substitute placeholders: `{slug}` with the feature slug, `{today's date}` with today's date in ISO 8601. Write to `.specs/{slug}/meta.md`.

**gate-context.md:**
Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/gate-context.md`. Substitute `{slug}` with the feature slug. Write to `.specs/{slug}/gate-context.md`.

### Step 5: Load and summarize agent memory

Read each file in `.specs/.agents/`. If any contain content under "Learned Patterns", summarize them for the user:
"Agent memory loaded. Patterns from N previous features available to agents."

If all agent memory files are empty: "Agent memory is empty — agents will learn project patterns after /j-flow-finish completes the first feature."

### Step 6: Confirm

Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-spec`):
```
Feature '{slug}' initialized ✓
  Branch: feature/{slug}
  Spec folder: .specs/{slug}/

Continue to next step?

  1. Yes — run /j-flow-spec now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```

## Output

No gate-context.md entry — start is initialization, not a gate phase.
