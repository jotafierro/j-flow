---
name: j-flow-start
description: Initialize a new feature. Creates git branch, .specs/{slug}/ directory, meta.md, and empty gate-context.md. Loads agent memory context. Usage: /j-flow-start {slug}
---

# j-flow-start

Initialize a new feature branch and spec folder.

## Usage

```
/j-flow-start {slug}
```

`{slug}` must be kebab-case (e.g. `user-auth`, `invoice-list`, `dashboard-v2`).

## Prerequisites

- `/j-flow-init` has been run (`.specs/.agents/` directory exists)
- You are on the `develop` branch (or main if no develop exists)

## Process

### Step 1: Validate slug

- Pattern must match: `[a-z0-9][a-z0-9-]*[a-z0-9]` (or single word `[a-z0-9]+`)
- Must not already exist as a directory in `.specs/`
- If invalid: "Invalid slug '{slug}'. Use kebab-case (e.g. user-profile, invoice-list)."
- If already exists: "Feature '{slug}' already exists. Use /j-flow-check to see its status."

### Step 2: Verify agent memory exists

Check `.specs/.agents/` exists. If not:
"Agent memory not found. Run /j-flow-init first."

### Step 3: Create git branch

```bash
git checkout -b feature/{slug}
```

If branch already exists: "Branch feature/{slug} already exists. Delete it first or choose a different slug."

### Step 4: Create feature directory and files

Create `.specs/{slug}/` with two files:

**meta.md:**
```markdown
# Feature: {slug}

**Branch:** feature/{slug}
**Created:** {today's date}
**Stack:** MongoDB + NestJS + React + Flutter

## Gates
- [ ] Functional spec
- [ ] Technical spec
- [ ] Task plan
- [ ] Build
- [ ] QA
- [ ] Review
- [ ] Finish
```

**gate-context.md:**
```markdown
# Gate Context — {slug}

(phases append to this file as they complete)
```

### Step 5: Load and summarize agent memory

Read each file in `.specs/.agents/`. If any contain content under "Learned Patterns", summarize them for the user:
"Agent memory loaded. Patterns from N previous features available to agents."

If all agent memory files are empty: "Agent memory is empty — agents will learn project patterns after /j-flow-finish completes the first feature."

### Step 6: Confirm

Print:
```
Feature '{slug}' initialized ✓
  Branch: feature/{slug}
  Spec folder: .specs/{slug}/

Next step: /j-flow-spec
```

## Output

No gate-context.md entry — start is initialization, not a gate phase.
