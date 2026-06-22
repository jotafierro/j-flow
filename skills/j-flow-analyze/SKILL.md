---
name: j-flow-analyze
description: Read-only cross-consistency check for the active feature. Verifies every AC has a task, every task maps to an AC, every AC has a test, and no AC contradicts established system behavior. Usage: /j-flow-analyze [--verbose]
allowed-tools: Read
---

# j-flow-analyze

Read-only consistency check across functional-spec ↔ tasks ↔ tests ↔ system spec. Surfaces gaps; never writes or fixes.

## Required reading

Before running, read:

1. `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/gate-rules.md`
2. `.specs/{slug}/functional-spec.md` — ACs source of truth
3. `.specs/{slug}/technical-spec.md` — architecture decisions (context for task-to-AC mapping)
4. `.specs/{slug}/tasks.json` — task list and changed files
5. `.specs/_system/` — system behavior files for all domains (read ALL; skip if directory absent)
6. `.specs/{slug}/gate-context.md` — current gate state

## Usage

```
/j-flow-analyze           # check active feature
/j-flow-analyze --verbose # also print passing items, not just gaps
```

## Checks

Runs 5 check groups in sequence. If a prerequisite is missing (e.g. `tasks.json` absent because `/j-flow-plan` hasn't run), report `(skipped: {reason})` for that check and continue.

### Check 1: Unresolved clarification markers

Scan `functional-spec.md` for `[NEEDS CLARIFICATION` (case-insensitive).

- If any found: list each with its line context. Mark as `✗ BLOCKING` — note that `/j-flow-plan` will also block on these.
- If none: `✓ No unresolved markers`.

### Check 2: AC → Task coverage

For each `### AC-N` heading in `functional-spec.md`:
- Search `tasks.json` for any task whose `description` or `ac_refs` field references `AC-N` by ID or semantically matches the AC text.
- Report:
  - `✓ AC-N → "{task description}"` if covered.
  - `✗ AC-N — no task found` if uncovered.

Summary line: `{M}/{N} ACs have at least one task.`

### Check 3: Task → AC traceability

For each task in `tasks.json`:
- Check if the task references at least one AC (by `ac_refs` field or mention of `AC-N` in description).
- Report:
  - `✓ "{task}"` if traceable.
  - `⚠ "{task}" — no AC reference (orphan task)` if not.

Orphan tasks are warnings, not errors — some tasks (e.g. "setup CI", "seed database") legitimately have no direct AC. The report flags them for the user to decide.

### Check 4: AC → Test coverage

Requires the feature to have reached the BUILD gate (`build_status` not pending). If not: `(skipped: feature not yet built — run after /j-flow-build)`.

For each `### AC-N` heading in `functional-spec.md`:
- Collect test files from `tasks.json` (files matching `*.spec.ts`, `*.test.ts`, `*_test.dart`, `*.spec.tsx`).
- Search each test file for a `describe` or `it` block whose text references `AC-N` by ID or semantically matches the AC `When`/`Then` description.
- Report:
  - `✓ AC-N → {test file}: "{describe/it text}"` if covered.
  - `✗ AC-N — no test found` if uncovered.

### Check 5: System spec collision detection

Requires `.specs/_system/` to exist (skip with note if absent).

For each `### AC-N` in `functional-spec.md`:
- Compare the AC against all entries in `.specs/_system/{domain}.md` files.
- Flag:
  - `⚠ AC-N may conflict with {domain}/{slug} AC-M: "{existing AC text}"` — when the new AC describes behavior that contradicts or duplicates an existing system AC.
  - `ℹ AC-N extends {domain}/{slug} AC-M` — when it's a deliberate extension (similar but not conflicting).

This check uses LLM judgment. Err on the side of flagging; the user resolves.

## Report format

```
j-flow-analyze — {slug}

▸ Unresolved markers
  ✓ None

▸ AC → Task coverage
  ✓ AC-1 → "Create user endpoint (POST /users)"
  ✓ AC-2 → "Validate email uniqueness in UserService"
  ✗ AC-3 — no task found
  2/3 ACs covered

▸ Task → AC traceability
  ✓ "Create user endpoint" → AC-1
  ⚠ "Seed admin user in migration" — no AC reference (orphan task)

▸ AC → Test coverage
  ✓ AC-1 → users.e2e-spec.ts: "POST /users creates a user"
  ✓ AC-2 → users.service.spec.ts: "should reject duplicate email"
  ✗ AC-3 — no test found

▸ System spec collision
  ⚠ AC-2 may conflict with auth/user-auth AC-5: "email must be unique across all user types"
     → Confirm: is this feature extending or replacing that rule?

Summary: 2 gaps, 1 warning, 1 collision to review.
/j-flow-analyze is read-only — fix gaps in functional-spec.md, tasks.json, or test files directly.
```

In `--verbose` mode, also print `✓` rows that passed cleanly.

## Rules

- Never write a file. No edits, no commits.
- Never run test suites or build commands.
- Output is the entire deliverable. No background actions.
- Semantic matching (checks 2, 3, 4, 5) uses LLM judgment. When uncertain, flag as `⚠` (warning) rather than `✗` (gap).
