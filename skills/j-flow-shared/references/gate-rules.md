# Gate Rules

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
