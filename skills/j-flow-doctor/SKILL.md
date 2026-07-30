---
name: j-flow-doctor
allowed-tools: Read Grep Glob Bash
description: Read-only diagnostic that checks a target j-flow repo for drift, missing artifacts, and inconsistency. Reports findings; never writes or auto-fixes. Use when returning to a stale repo or cloning a project that uses j-flow. Usage: /j-flow-doctor [--verbose]
---

# j-flow-doctor

Read-only health check for a target j-flow repo. Surfaces drift between PRODUCT.md, agent memory, backlog, and feature folders. Never writes a single file.

## Required reading

Before running diagnostics, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format, status values
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md` — expected meta.md fields
3. `PRODUCT.md` — the declared product and stack
4. `DESIGN.md` — declared design system
5. `.specs/README.md` — the backlog
6. `.specs/.agents/*` — agent memory files

## Usage

```
/j-flow-doctor              # standard checks
/j-flow-doctor --verbose    # also print healthy items, not just issues
```

## Checks

The skill runs 8 check groups, each producing a report row:

### 1. Project files

For each expected project-level file, report present / missing:
- `PRODUCT.md`
- `DESIGN.md`
- `CHANGELOG.md`
- `.specs/README.md`
- `.specs/.agents/` directory

### 2. Agent memory

Read `PRODUCT.md`'s `**Layers:**` line to derive `stack_layers` (default: all four — web, api, mobile, admin — if absent).

Expected agents: `j-flow-architect`, `j-flow-devops`, `j-flow-quality`, `j-flow-reviewer` always; `j-flow-backend` only if `api` in `stack_layers`; `j-flow-frontend` only if `web` or `admin`; `j-flow-mobile` only if `mobile`.

For each expected agent, verify `.specs/.agents/{agent}.md` exists — missing files are reported. For each agent NOT expected (its layer isn't in `stack_layers`) whose file exists anyway, report it as `⚠ present but {layer} not in stack_layers — stale from a prior scope change` rather than flagging as healthy.

### 3. Stack consistency

Read PRODUCT.md to extract the declared stack (Backend / Web / Mobile lines). Read each agent memory file's `**Stack:**` line. Report any mismatch.

Expected default: `MongoDB + NestJS + React + Flutter`. If PRODUCT.md uses a non-default stack and agent memory files still reference the default, that is drift.

### 4. Backlog vs feature folders

Read `.specs/README.md` and extract every feature slug listed (lines matching `\.specs/[\w-]+/`).
List every directory in `.specs/` (excluding `.agents/` and any starting with `_`).

Report:
- Slugs in backlog with no corresponding folder
- Folders with no entry in the backlog (orphans)

### 5. Per-feature integrity

For each feature folder under `.specs/`:
- Verify `meta.md` exists. If not, report and skip the rest of this check for that folder.
- Verify `meta.md` contains all expected fields from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md`. Report missing fields.
- Verify `gate-context.md` exists (may be empty header for new features).

### 6. Backlog symbol vs gate state

For each feature in `.specs/README.md` with a status symbol (`[ ]`, `[SF]`, `[TF]`, `[P]`, `[B]`, `[Q]`, `[R]`, `[✓]`):
- Read the corresponding `meta.md` and infer the actual phase from gate status fields
- Map actual phase to the expected symbol
- Report any mismatch

Mapping table:

| meta.md state | Expected symbol |
|---------------|-----------------|
| no meta.md | `[ ]` |
| `current_phase: functional` + `functional_status: pending` | `[ ]` |
| `functional_status: approved` only | `[SF]` |
| `technical_status: approved` only | `[TF]` |
| `tasks_status: approved` only | `[P]` |
| `build_status: completed` only | `[B]` |
| `qa_status: green` | `[Q]` |
| `review_status: approved` | `[R]` |
| `finish_status: completed` | `[✓]` |

### 7. Gate-context format

For each feature folder's `gate-context.md`, verify every gate-status line matches the format from `references/gate-rules.md`:

```
[<GATE NAME>] <status> <YYYY-MM-DD>
```

Report any malformed lines.

### 8. Stale markers

Report every feature with at least one `[stale]` suffix in `gate-context.md`. These need re-runs before `/j-flow-finish`.

## Report format

```
j-flow-doctor — repo health report

▸ Project files
  ✓ PRODUCT.md
  ✓ DESIGN.md
  ✗ CHANGELOG.md (missing — run /j-flow-project to seed)
  ...

▸ Agent memory
  ✓ all expected agent memory files present (4 of 7 — stack_layers: api, web)

▸ Stack consistency
  ⚠ PRODUCT.md declares Backend: Express, but .specs/.agents/j-flow-backend.md says NestJS

▸ Backlog vs feature folders
  ⚠ 02-design-system listed in backlog but no .specs/02-design-system/ folder
  ⚠ .specs/old-experiment/ exists but not listed in backlog

▸ Per-feature integrity
  ✓ 01-infra-base
  ✗ 03-auth: missing meta.md
  ⚠ 04-users: meta.md missing field 'build_status'

▸ Backlog symbol vs gate state
  ⚠ 01-infra-base shows [✓] in backlog but finish_status is pending

▸ Gate-context format
  ✓ all gate-context.md files well-formed

▸ Stale markers
  ⚠ 04-users has 2 stale gates: BUILD, QA

Summary: 6 issues found. /j-flow-doctor is read-only — run the relevant skills to fix:
  · /j-flow-project --update      (seed CHANGELOG, sync backlog)
  · /j-flow-start 03-auth         (initialize missing feature)
  · /j-flow-build --fix && /j-flow-qa  (resolve stale 04-users)
```

In `--verbose` mode, also print `✓` rows that passed cleanly.

## Rules

- Never write a file. No edits, no commits.
- Never run repo commands like `pnpm install` or `docker compose up`.
- Output is the entire deliverable. No background actions.
- If a check cannot be evaluated (e.g. PRODUCT.md is missing so stack consistency can't be checked), report `(skipped: prerequisite missing)` and continue with the remaining checks.
