# Gate Rules

## How to Find Active Feature

The single-feature operation target, resolved in order:

1. If the current git branch is `feature/{slug}`, the active feature is `.specs/{slug}/`.
2. Else, scan `.specs/*/meta.md` for features whose state is non-terminal (`finish_status` not `completed`). If exactly one, that is the active feature.
3. Else (zero or multiple candidates), do not guess — list the candidates and ask the user which feature to act on.

Read-only inspectors may operate over ALL features when asked (e.g. `/j-flow-check --all`, `/j-flow-doctor`); the rule above is for single-feature operations.

## Gate Check Algorithm

Before running a gate's work: find the active feature (above), read `.specs/{slug}/gate-context.md`, and require the prior gate's entry to be present, approved, and not `[stale]` (see the cascade + status tables below). If missing or stale, print the block message and stop.

`gate-context.md` is the source of truth for gate state. `meta.md` `{phase}_status:` fields and `.specs/README.md` backlog symbols are projections of it — when they disagree, gate-context wins and the projections should be recomputed (see "Resetting a gate").

## Approval gates

| Gate | meta.md field | Required before |
|------|--------------|-----------------|
| Functional spec approved | `functional_status: approved` | `/j-flow-spec technical` |
| Technical spec approved | `technical_status: approved` | `/j-flow-plan` |
| Task plan approved | `tasks_status: approved` | `/j-flow-build` |
| Build completed | `build_status: completed` | `/j-flow-qa` |
| QA green | `qa_status: green` | `/j-flow-review` |
| Review approved | `review_status: approved` | `/j-flow-finish` |
| Finish completed | `finish_status: completed` | (terminal — proceed to `/j-flow-release`) |

## Gate status values

| Status | Set by | Meaning |
|--------|--------|---------|
| `approved` | User confirms | Spec or plan approved by user |
| `green` | QA automation | All 6 test stages passed |
| `completed` | Build / Finish | Phase ran to completion |
| `red` | QA automation | At least one test stage failed |
| `changes-requested` | Review | Critical findings require fixes |
| `stale` | /j-flow-update | Invalidated by upstream spec change |

## Approval dialogue (display to user before each gate)

```
Ready to approve [{Phase}]?

  1. Approve — proceed to {next phase}
  2. Request changes — iterate on {artifact}
  3. Reopen previous phase — /j-flow-reopen

Enter 1, 2, or 3:
```

Always show numbered options. Never auto-approve.

## Next-step dialogue (display whenever a phase finishes and a next command exists)

Never print `Next step: {command}` as a bare suggestion — **except** read-only status/diagnostic skills (`/j-flow-check`, `/j-flow-doctor`, `/j-flow-analyze`), which run no gate and may print a bare next-step pointer since there is nothing to confirm. For every phase-completion message, ask instead:

```
{completion message}

Continue to next step?

  1. Yes — run {next command} now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```

- Reply `1`: immediately invoke `{next command}`.
- Reply `2`: stop. Do not invoke anything else. Wait for the user's next message.

This applies to every phase-completion message that currently ends in a `Next step:` line (start, spec, plan, build, qa, review, reopen). It does not apply to the three documented auto-chains in `FLOW.md` (`/j-flow-project` → `/j-flow-scaffold`, `/j-flow-project --update` → `/j-flow-scaffold --review`, `/j-flow-scaffold` → `/j-flow-recommend`), which keep running without asking.

## Cascade rules for /j-flow-reopen

Reopening at phase X resets X and all downstream gates back to `pending`. Commits are NOT reverted.

| Reopen at | Resets |
|-----------|--------|
| functional | functional + technical + tasks + build + qa + review + finish |
| technical | technical + tasks + build + qa + review + finish |
| tasks | tasks + build + qa + review + finish |
| build | build + qa + review + finish |
| qa | qa + review + finish |
| review | review + finish |
| finish | finish |

## Resetting a gate (reopen / update)

When a gate is cleared (`/j-flow-reopen`) or invalidated (`/j-flow-update`), update ALL THREE stores for each affected gate, in this order:

1. **gate-context.md** — reopen: remove the gate's entry (truncate after the last kept gate). update: append ` [stale]` to the gate's status line.
2. **meta.md** — set the gate's `{phase}_status:` field: reopen → `pending`; update → `stale`. On reopen, also set `current_phase` to the earliest reopened phase.
3. **.specs/README.md** — recompute the feature's backlog symbol from the updated meta.md (first matching condition wins; a `stale`/`pending` field falls through to the earlier symbol).

Phase → meta field: functional→`functional_status`, technical→`technical_status`, task plan→`tasks_status`, build→`build_status`, qa→`qa_status`, review→`review_status`, finish→`finish_status`. Downstream sets are in "Cascade rules" above.

## gate-context.md format (append-only)

Each phase appends ONE section. Never rewrite existing sections.

```
[{GATE NAME}] {status} {YYYY-MM-DD}
  → {summary line 1}
  → {summary line 2}
```

Examples:
```
[FUNCTIONAL SPEC] approved 2026-06-12
  → key decisions: invoice CRUD with email notification

[TECHNICAL SPEC] approved 2026-06-12
  → architecture: NestJS module + Mongoose schema + React Query hooks
  → patterns: repository pattern, zod DTOs

[TASK PLAN] approved 2026-06-12
  → N tasks across N layers, N ACs covered

[BUILD] completed 2026-06-12
  → layers: data ✓ service ✓ api ✓ ui ✓ mobile ✓ infra ✓

[QA] green 2026-06-12
  → 47 tests passing, checklist 8/8

[REVIEW] approved 2026-06-12
  → 2 findings resolved

[FINISH] completed 2026-06-12
  → README + CHANGELOG + PR to develop
```

## Stale marker (from /j-flow-update)

Mark downstream gates by appending ` [stale]`:
- `[BUILD] completed 2026-06-12 [stale]`
- `[QA] green 2026-06-12 [stale]`

Stale gates block subsequent skills the same as missing gates.

## Clarification markers

**`[NEEDS CLARIFICATION: {question}]`** — marker for unresolved questions in `functional-spec.md`. A functional spec may be approved with markers present (progress is saved). However, the PLAN gate will block until all markers are resolved. Markers in a technical spec are not recognized — resolve them at the functional level before running `/j-flow-spec technical`.

## AC format

Acceptance Criteria in `functional-spec.md` use Given/When/Then structure (`### AC-N — {name}` heading, `**Given** / **When** / **Then:**` lines). Free-form ACs from pre-013 specs are accepted but degrade traceability in `/j-flow-analyze` and `/j-flow-qa`.
