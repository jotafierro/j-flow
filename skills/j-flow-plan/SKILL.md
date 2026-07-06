---
name: j-flow-plan
description: Generate task plan (tasks.json) and review guide (review-guide.md) from approved specs. Validates AC coverage before saving. Usage: /j-flow-plan
---

# j-flow-plan

## Required reading

Before generating the task plan, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/layer-order.md` — layer definitions and execution order
3. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/agent-scopes.md` — to know which agent owns which layer
4. `PRODUCT.md` — tech stack reference
5. `DESIGN.md` — required when planning ui or mobile tasks
6. `.specs/{slug}/functional-spec.md` — extract every AC
7. `.specs/{slug}/technical-spec.md` — implementation patterns to plan against
8. `.specs/{slug}/gate-context.md` — accumulated decisions
9. Templates: `templates/tasks.json`, `templates/review-guide.md`, `templates/review-api.md`, `templates/review-web.md`, `templates/review-mobile.md`, `templates/review-e2e.md`

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[TECHNICAL SPEC] approved` and not stale.
If missing or stale: "Gate [TECHNICAL SPEC] not approved. Run /j-flow-spec technical first."

## Clarification check (blocking)

After confirming the gate, read `.specs/{slug}/functional-spec.md`.

Search for any occurrence of `[NEEDS CLARIFICATION` (case-insensitive).

If any are found:
- List each occurrence with its line context.
- Print:
  ```
  [PLAN] BLOCKED — unresolved clarification markers found in functional-spec.md:

    line {N}: {marker text}
    ...

  Resolve each [NEEDS CLARIFICATION] item (replace with the actual answer) before running /j-flow-plan.
  ```
- Stop. Do not generate tasks.

If none found: continue to task generation.

## Process

### Step 1: Parse ACs

Read `.specs/{slug}/functional-spec.md`. Extract every line starting with `- AC`:
```
AC1: Given {context}, when {action}, then {outcome}
AC2: ...
```

Read `.specs/{slug}/technical-spec.md` for implementation details per layer.

### Step 2: Map ACs to layers

For each AC, determine which build layers implement it:
- `data` — Mongoose schema or DTO changes
- `service` — NestJS business logic
- `api` — HTTP endpoint
- `ui` — React component or page
- `mobile` — Flutter screen or widget
- `infra` — CI/CD, Docker, deployment config

One AC can map to multiple layers (e.g. a create-user feature touches data + service + api + ui + mobile).

### Step 3: Generate tasks.json

Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/tasks.json`. Use it as the structural baseline. Populate `layers`, `ac_coverage`, and `uncovered_acs` from the actual feature (slug, today's date, tasks per layer, AC mapping).

Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/layer-order.md` for the correct layer sequence and which agent handles each layer.

**Coverage validation:** If `uncovered_acs` is not empty, stop:
"Warning: the following ACs have no tasks assigned: {list}. Add tasks before proceeding."

### Step 4: Generate review-guide.md and per-layer review docs

**review-guide.md (index):**
Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/review-guide.md`.
Substitute: slug, today's date, env vars needed by this feature, seed data, and the layer table (one row per layer with tasks, listing AC ids covered).

**Per-layer review docs:**
For each layer with tasks in `tasks.json`, generate a file in `.specs/{slug}/review/`:

- `api` or `service` tasks → `review/api.md` (template: `templates/review-api.md`)
  - Write real curl commands: actual HTTP methods, routes from technical-spec API Layer table, real request body shapes, expected response shapes
  - One section per AC covered by this layer
  - Include DB or header verification steps for each AC
- `ui` tasks → `review/web.md` (template: `templates/review-web.md`)
  - Use actual page paths, form field names, cookie names, redirect targets from technical-spec
- `mobile` tasks → `review/mobile.md` (template: `templates/review-mobile.md`)
  - Use actual screen names, navigation routes, storage keys from technical-spec
- `ui` tasks + admin in scope → `review/admin.md` (template: `templates/review-web.md`, port 3002)
- Always generate `review/e2e.md` (template: `templates/review-e2e.md`) if 2+ layers have tasks
  - Identify cross-layer flows from the AC list (e.g. register on web → verify email → login on mobile)
  - One section per flow that spans the API and at least one client layer
  - This file is checked last in QA, after individual layer checks pass

Only generate layer files for layers with tasks. Infra layer has no review file.

Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` for gate format.

### Step 5: Show and confirm

Display `tasks.json`, `review-guide.md` (index), and the generated per-layer review docs. Ask:
"Does this plan look right? Reply 'approved' to proceed, or tell me what to change."

### Step 6: Approval

When approved:
1. Write `.specs/{slug}/tasks.json`
2. Write `.specs/{slug}/review-guide.md`
3. Write per-layer review docs: create `.specs/{slug}/review/` and write each generated layer file (api.md, web.md, mobile.md, admin.md, e2e.md as applicable)
4. Append to `.specs/{slug}/gate-context.md`:
   ```
   [TASK PLAN] approved {today's date}
     → {N} tasks across {N} layers, {N} ACs covered
   ```
5. Update `.specs/{slug}/meta.md`: set `tasks_status: approved`, `tasks_approved_at: {today's date}`, `current_phase: build`.
6. Update `.specs/README.md`: find the row where the folder column contains `.specs/{slug}/`, replace its status symbol with `[P]`.
7. Print:
   ```
   Task plan approved and saved ✓
   Next step: /j-flow-build
   ```
