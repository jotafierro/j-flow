---
name: j-flow-build
description: Implement tasks from the approved plan. Dispatches domain agents by layer in sequence. --fix mode resolves QA or review findings. Usage: /j-flow-build [--fix]
---

# j-flow-build

## Required reading

Before dispatching any agent, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/layer-order.md` — layer order to respect
3. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/agent-scopes.md` — to pick the right agent per layer
4. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` — implementation constraints for agents to follow
5. `PRODUCT.md` — tech stack reference
6. `DESIGN.md` — REQUIRED to forward to j-flow-frontend and j-flow-mobile dispatches
7. `.specs/{slug}/tasks.json` — the tasks per layer
8. `.specs/{slug}/technical-spec.md` — patterns to enforce
9. `.specs/{slug}/gate-context.md` — accumulated decisions

When dispatching `j-flow-frontend` or `j-flow-mobile`, explicitly include `DESIGN.md` in the agent's context so they can map design tokens to React/Flutter implementation.

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.

**Normal mode:** Require `[TASK PLAN] approved` and not stale.
If missing or stale: "Gate [TASK PLAN] not approved. Run /j-flow-plan first."

**--fix mode:** Require `[QA] red` OR `[REVIEW] changes-requested`.
If neither: "Nothing to fix — QA gate is green and review has no open findings. Run /j-flow-qa to validate."

---

## Mode: Normal Build

### Layer Sequence

Execute layers in the fixed order defined in `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/layer-order.md`. Skip empty layers (no tasks).

1. `data` → **j-flow-backend**
2. `service` → **j-flow-backend**
3. `api` → **j-flow-backend** (also writes `*.e2e-spec.ts`)
4. `ui` → **j-flow-frontend** (also writes Storybook stories)
5. `mobile` → **j-flow-mobile** (also writes Widgetbook entries + integration_test)
6. `infra` → **j-flow-devops**

See `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/agent-scopes.md` for the full layer→agent mapping and each agent's responsibilities.

### Per-Layer Dispatch

For each layer with tasks:

1. Read tasks for this layer from `.specs/{slug}/tasks.json`
2. Read agent memory from `.specs/.agents/{agent}.md`
3. Read relevant section of `.specs/{slug}/technical-spec.md`
4. Dispatch the appropriate agent with:
   - The task list for this layer (id, description, ac, files)
   - The ACs being implemented (from functional-spec.md)
   - The technical patterns for this layer (from technical-spec.md)
   - Agent memory (from .specs/.agents/{agent}.md)
   - Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` for coding conventions
   - Instruction: "Before writing any code, walk the decision ladder for each piece: (1) does this need to exist at all? (2) does the codebase already have this pattern? (3) can stdlib handle it? (4) is there a native platform feature? (5) does an installed dependency already cover it? (6) can it be one line? Only then write the minimum working code. Implement exactly what the tasks require — no extra features or abstractions. Write unit tests in the same pass. Follow the technical spec patterns."
5. After agent completes, commit the layer:

```bash
git add .
git commit -m "feat({slug}): implement {layer} layer

Tasks: {task-id-1}, {task-id-2}
ACs: {ac-id-1}, {ac-id-2}"
```

### After All Layers

Append to `.specs/{slug}/gate-context.md`:
```
[BUILD] completed {today's date}
  → layers: data ✓ service ✓ api ✓ ui ✓ mobile ✓ infra ✓
```
(Only include layers that had tasks.)

Update `.specs/{slug}/meta.md`: set `build_status: completed`, `build_completed_at: {today's date}`, `current_phase: qa`.

Update `.specs/README.md`: find the row where the folder column contains `.specs/{slug}/`, replace its status symbol with `[B]`.

Print:
```
Build complete ✓
  Layers implemented: {list of layers}
  
Next step: /j-flow-qa
```

---

## Mode: --fix

### Determine What to Fix

If `[QA] red` in gate-context.md: read `.specs/{slug}/qa-report.md` for failures.
If `[REVIEW] changes-requested` in gate-context.md: read `.specs/{slug}/review-findings.md` for findings.

### Fix Each Issue

For each failure or finding:
1. Identify which layer owns the affected file
2. Dispatch the appropriate domain agent with:
   - The specific failure/finding (exact error or finding text)
   - The affected file(s)
   - The relevant technical-spec.md section
   - Agent memory
   - Instruction: "Fix only this specific issue. Do not change anything else."
3. After fixing, verify the specific change looks correct

### Commit Fixes

```bash
git add .
git commit -m "fix({slug}): resolve {QA|review} findings

Fixed: {brief list of what was fixed}"
```

Print:
```
Fixes committed ✓
Run /j-flow-qa to re-validate.
```
