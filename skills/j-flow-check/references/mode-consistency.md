# /j-flow-check --consistency — AC↔task↔test cross-consistency

Loaded by `j-flow-check/SKILL.md` only when `--consistency` is passed. Read-only: this mode never writes, edits, or commits.

## Mode: `--consistency` (AC↔task↔test cross-consistency)

Cross-consistency for the active feature across functional-spec ↔ tasks ↔ tests ↔ system spec. Find the active feature first (algorithm in `references/gate-core.md`). Runs 5 check groups; if a prerequisite is missing (e.g. `tasks.json` absent because `/j-flow-plan` hasn't run), report `(skipped: {reason})` for that check and continue.

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
