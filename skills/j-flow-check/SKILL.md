---
name: j-flow-check
allowed-tools: Read Grep Glob Bash
description: "Read-only inspector. Default shows feature status and gate progress; --repo runs repo health diagnostics (drift, missing artifacts); --consistency runs AC↔task↔test cross-consistency for the active feature. Usage: /j-flow-check [--all | --repo | --consistency] [--verbose]"
---

# j-flow-check

Read-only inspection of j-flow state. Never writes, edits, or commits — the report is the whole deliverable. Three modes:

- **default / `--all` / `{slug}`** — feature status and gate progress.
- **`--repo`** — repo health diagnostics: drift between PRODUCT.md, agent memory, backlog, and feature folders.
- **`--consistency`** — cross-consistency for the active feature: every AC has a task, every task maps to an AC, every AC has a test, no AC contradicts the system spec.

## Usage

```
/j-flow-check                # current or only active feature — status
/j-flow-check --all          # all features summary
/j-flow-check {slug}         # specific feature by slug
/j-flow-check --repo         # repo health diagnostics (drift, missing artifacts)
/j-flow-check --consistency  # AC↔task↔test consistency for the active feature
/j-flow-check --verbose      # with --repo/--consistency: also print healthy/passing rows
```

## Required reading

Always read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` (gate status interpretation and "Backlog symbols"). Then, by mode:

- **status**: `.specs/README.md`; `.specs/{slug}/meta.md` and `.specs/{slug}/gate-context.md` for the target feature.
- **`--repo`**: `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md` (expected fields), `PRODUCT.md`, `DESIGN.md`, `.specs/README.md`, `.specs/.agents/*`.
- **`--consistency`**: `.specs/{slug}/functional-spec.md`, `technical-spec.md`, `tasks.json`, `.specs/_system/` (all files; skip if absent), `.specs/{slug}/gate-context.md`.

---

## Mode: Status (default / `--all` / `{slug}`)

### Step 1: Find feature

Use the "How to Find Active Feature" algorithm from `references/gate-rules.md`.

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

(A bare `Next step:` line is allowed here — this is a read-only status command, per `references/gate-rules.md` §"Next-step dialogue".)

### `--all` Flag

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

---

## Mode: `--repo` (repo health diagnostics)

Surfaces drift between PRODUCT.md, agent memory, backlog, and feature folders across the whole repo. Runs 8 check groups, each producing a report row.

### 1. Project files

For each expected project-level file, report present / missing: `PRODUCT.md`, `DESIGN.md`, `CHANGELOG.md`, `.specs/README.md`, `.specs/.agents/` directory.

### 2. Agent memory

Read `PRODUCT.md`'s `**Layers:**` line to derive `stack_layers` (default: web, api, mobile, admin, e2e if absent). `e2e` adds no agent — the Playwright harness is owned by `j-flow-quality`, which is always expected regardless of layers.

Expected agents: `j-flow-architect`, `j-flow-devops`, `j-flow-quality`, `j-flow-reviewer` always; `j-flow-backend` only if `api` in `stack_layers`; `j-flow-frontend` only if `web` or `admin`; `j-flow-mobile` only if `mobile`; `j-flow-cli` only if `cli`.

For each expected agent, verify `.specs/.agents/{agent}.md` exists — missing files are reported. For each agent NOT expected (its layer isn't in `stack_layers`) whose file exists anyway, report it as `⚠ present but {layer} not in stack_layers — stale from a prior scope change` rather than flagging as healthy.

### 3. Stack consistency

Read PRODUCT.md to extract the declared stack (Backend / Web / Mobile lines). Read each agent memory file's `**Stack:**` line. Report any mismatch.

Expected default: `MongoDB + NestJS + React + Flutter`. If PRODUCT.md uses a non-default stack and agent memory files still reference the default, that is drift.

### 4. Backlog vs feature folders

Read `.specs/README.md` and extract every feature slug listed (lines matching `\.specs/[\w-]+/`). List every directory in `.specs/` (excluding `.agents/` and any starting with `_`).

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
- Read the corresponding `meta.md` and compute the expected symbol per `references/gate-rules.md` §"Backlog symbols" (first matching condition wins)
- Report any mismatch between the displayed symbol and the computed one

### 7. Gate-context format

For each feature folder's `gate-context.md`, verify every gate-status line matches the format from `references/gate-rules.md`:

```
[<GATE NAME>] <status> <YYYY-MM-DD>
```

Report any malformed lines.

### 8. Stale markers

Report every feature with at least one `[stale]` suffix in `gate-context.md`. These need re-runs before `/j-flow-finish`.

### `--repo` report format

```
j-flow-check --repo — repo health report

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

Summary: 6 issues found. /j-flow-check --repo is read-only — run the relevant skills to fix:
  · /j-flow-project --update      (seed CHANGELOG, sync backlog)
  · /j-flow-start 03-auth         (initialize missing feature)
  · /j-flow-build --fix && /j-flow-qa  (resolve stale 04-users)
```

In `--verbose` mode, also print `✓` rows that passed cleanly. If a check cannot be evaluated (e.g. PRODUCT.md is missing so stack consistency can't be checked), report `(skipped: prerequisite missing)` and continue with the remaining checks.

---

## Mode: `--consistency` (AC↔task↔test cross-consistency)

Cross-consistency for the active feature across functional-spec ↔ tasks ↔ tests ↔ system spec. Find the active feature first (algorithm in `references/gate-rules.md`). Runs 5 check groups; if a prerequisite is missing (e.g. `tasks.json` absent because `/j-flow-plan` hasn't run), report `(skipped: {reason})` for that check and continue.

### Check 1: Unresolved clarification markers

Scan `functional-spec.md` for `[NEEDS CLARIFICATION` (case-insensitive).
- If any found: list each with its line context. Mark as `✗ BLOCKING` — note that `/j-flow-plan` will also block on these.
- If none: `✓ No unresolved markers`.

### Check 2: AC → Task coverage

For each `### AC-N` heading in `functional-spec.md`:
- Search `tasks.json` for any task whose `description` or `ac_refs` field references `AC-N` by ID or semantically matches the AC text.
- Report: `✓ AC-N → "{task description}"` if covered; `✗ AC-N — no task found` if uncovered.

Summary line: `{M}/{N} ACs have at least one task.`

### Check 3: Task → AC traceability

For each task in `tasks.json`:
- Check if the task references at least one AC (by `ac_refs` field or mention of `AC-N` in description).
- Report: `✓ "{task}"` if traceable; `⚠ "{task}" — no AC reference (orphan task)` if not.

Orphan tasks are warnings, not errors — some tasks (e.g. "setup CI", "seed database") legitimately have no direct AC. The report flags them for the user to decide.

### Check 4: AC → Test coverage

Requires the feature to have reached the BUILD gate (`build_status` not pending). If not: `(skipped: feature not yet built — run after /j-flow-build)`.

For each `### AC-N` heading in `functional-spec.md`:
- Collect test files from `tasks.json` (files matching `*.spec.ts`, `*.test.ts`, `*_test.dart`, `*.spec.tsx`).
- Search each test file for a `describe` or `it` block whose text references `AC-N` by ID or semantically matches the AC `When`/`Then` description.
- Report: `✓ AC-N → {test file}: "{describe/it text}"` if covered; `✗ AC-N — no test found` if uncovered.

### Check 5: System spec collision detection

Requires `.specs/_system/` to exist (skip with note if absent).

For each `### AC-N` in `functional-spec.md`:
- Compare the AC against all entries in `.specs/_system/{domain}.md` files.
- Flag: `⚠ AC-N may conflict with {domain}/{slug} AC-M: "{existing AC text}"` when the new AC contradicts or duplicates an existing system AC; `ℹ AC-N extends {domain}/{slug} AC-M` when it's a deliberate extension.

This check uses LLM judgment. Err on the side of flagging; the user resolves.

### `--consistency` report format

```
j-flow-check --consistency — {slug}

▸ Unresolved markers
  ✓ None

▸ AC → Task coverage
  ✓ AC-1 → "Create user endpoint (POST /users)"
  ✗ AC-3 — no task found
  2/3 ACs covered

▸ Task → AC traceability
  ⚠ "Seed admin user in migration" — no AC reference (orphan task)

▸ AC → Test coverage
  ✓ AC-1 → users.e2e-spec.ts: "POST /users creates a user"
  ✗ AC-3 — no test found

▸ System spec collision
  ⚠ AC-2 may conflict with auth/user-auth AC-5: "email must be unique across all user types"
     → Confirm: is this feature extending or replacing that rule?

Summary: 2 gaps, 1 warning, 1 collision to review.
/j-flow-check --consistency is read-only — fix gaps in functional-spec.md, tasks.json, or test files directly.
```

In `--verbose` mode, also print `✓` rows that passed cleanly. Semantic matching (checks 2–5) uses LLM judgment; when uncertain, flag as `⚠` (warning) rather than `✗` (gap).

---

## Rules

- Never write a file. No edits, no commits (enforced by `allowed-tools`).
- Never run test suites, build commands, or repo commands like `pnpm install` / `docker compose up`.
- Output is the entire deliverable. No background actions.
