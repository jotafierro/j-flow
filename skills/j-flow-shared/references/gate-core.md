# Gate Core

Universal gate mechanics — every forward skill needs these. If this reference is
already in your session context from earlier in this conversation, don't re-read it.

## How to Find Active Feature

The single-feature operation target, resolved in order:

1. If the current git branch is `feature/{slug}`, the active feature is `.specs/{slug}/`.
2. Else, scan `.specs/*/meta.md` for features whose state is non-terminal (`finish_status` not `completed`). If exactly one, that is the active feature.
3. Else (zero or multiple candidates), do not guess — list the candidates and ask the user which feature to act on.

Read-only inspectors may operate over ALL features when asked (e.g. `/j-flow-check --all`, `/j-flow-check --repo`); the rule above is for single-feature operations.

## Slug validation (fail-closed)

Every skill that accepts a `{slug}` argument (`/j-flow-start`, `/j-flow-check {slug}`, `/j-flow-reopen`, and any future one) must validate it **before** using it in any path or git command. This is a required step, not best-effort — fail closed, don't fall through to a fuzzy match against `.specs/`:

1. Match against `^[a-z0-9]+(-[a-z0-9]+)*$` — kebab-case, no leading/trailing hyphen, and (by construction of the pattern) no `.`, `/`, `~`, whitespace, or shell metacharacters.
2. If it doesn't match, stop immediately: `Invalid slug '{slug}'. Use kebab-case (e.g. user-profile, invoice-list).`
3. Only after validation, use `{slug}` to build a path (`.specs/{slug}/...`) or a git ref (`feature/{slug}`) — and always double-quote it in any shell command (`"feature/$slug"`, never a bare interpolation), even though step 1 already excludes the characters that would make quoting matter.

This applies to read-only skills too (`/j-flow-check {slug}`) — a slug is untrusted user input regardless of whether the resulting command writes anything.

## Gate Check Algorithm

Before running a gate's work: find the active feature (above), read `.specs/{slug}/gate-context.md`, and require the prior gate's entry to be present, approved, and not `[stale]` (see `gate-cascade.md` for the cascade + status tables). If missing or stale, print the block message and stop.

`gate-context.md` is the source of truth for gate state. `meta.md` `{phase}_status:` fields and `.specs/README.md` backlog symbols are projections of it — when they disagree, gate-context wins and the projections should be recomputed (see `gate-cascade.md` §"Resetting a gate").

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
| `green` | QA automation | All 7 test stages passed |
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

Never print `Next step: {command}` as a bare suggestion — **except** the read-only inspector `/j-flow-check` (all modes: status, `--repo`, `--consistency`), which runs no gate and may print a bare next-step pointer since there is nothing to confirm. For every phase-completion message, ask instead:

```
{completion message}

Continue to next step?

  1. Yes — run {next command} now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```

- Reply `1`: immediately invoke `{next command}`.
- Reply `2`: stop. Do not invoke anything else. Wait for the user's next message.

This applies to every phase-completion message that currently ends in a `Next step:` line (start, spec, plan, build, qa, review, reopen). It does not apply to the three documented auto-chains in `docs/FLOW.md` (`/j-flow-project` → `/j-flow-scaffold`, `/j-flow-project --update` → `/j-flow-scaffold --review`, `/j-flow-scaffold` → `/j-flow-recommend`), which keep running without asking.

## Advancing a gate

When a phase completes and its gate is approved, update ALL THREE stores. This is the single canonical procedure — skills reference it rather than inlining the mechanics.

1. **gate-context.md** — append the phase's `[{GATE NAME}] {status} {date}` section (format below) with the phase's own summary lines.
2. **meta.md** — set the fields for the phase (table below).
3. **.specs/README.md** — recompute the feature's backlog symbol from the updated meta.md per `gate-symbols.md` §"Backlog symbols".

| Phase | meta.md fields to set | current_phase → |
|-------|-----------------------|-----------------|
| functional | `functional_status: approved`, `functional_approved_at: {date}` | `technical` |
| technical  | `technical_status: approved`, `technical_approved_at: {date}` | `planning` |
| task plan  | `tasks_status: approved`, `tasks_approved_at: {date}` | `build` |
| build      | `build_status: completed`, `build_completed_at: {date}` | `qa` |
| qa         | `qa_status: green`, `qa_completed_at: {date}` | `review` |
| review     | `review_status: approved`, `review_approved_at: {date}` | `finish` |
| finish     | `finish_status: completed`, `finish_completed_at: {date}` | `done` |

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
