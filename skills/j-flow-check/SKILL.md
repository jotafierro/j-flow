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

Always read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-core.md` (gate status interpretation) and `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-symbols.md` ("Backlog symbols") — skip either if already in your session context from earlier this conversation. Then, by mode:

- **status**: `.specs/README.md`; `.specs/{slug}/meta.md` and `.specs/{slug}/gate-context.md` for the target feature.
- **`--repo`**: `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md` (expected fields), `PRODUCT.md`, `DESIGN.md`, `.specs/README.md`, `.specs/.agents/*`.
- **`--consistency`**: `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/spec-markers.md` (clarification markers, AC format), `.specs/{slug}/functional-spec.md`, `technical-spec.md`, `tasks.json`, `.specs/_system/` (all files; skip if absent), `.specs/{slug}/gate-context.md`.

---

## Mode: Status (default / `--all` / `{slug}`)

### Step 1: Find feature

If a `{slug}` argument was given, validate it first per `references/gate-core.md` §"Slug validation (fail-closed)" — fail closed before touching any path. Otherwise use the "How to Find Active Feature" algorithm from `references/gate-core.md`.

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
Fast-track: on   ← only if meta.md has fast_track: true; omit the line otherwise

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

(A bare `Next step:` line is allowed here — this is a read-only status command, per `references/gate-core.md` §"Next-step dialogue".)

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

Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-check/references/mode-repo.md` and follow it completely. Not loaded on the default path.

## Mode: `--consistency` (AC↔task↔test cross-consistency)

Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-check/references/mode-consistency.md` and follow it completely. Not loaded on the default path.
## Rules

- Never write a file. No edits (technically enforced — `allowed-tools` grants no `Write` or `Edit`), and no commits (a rule, not a sandbox: `Bash` is granted for read-only git inspection, so not committing is on you to honor).
- Never run test suites, build commands, or repo commands like `pnpm install` / `docker compose up`.
- Output is the entire deliverable. No background actions.
