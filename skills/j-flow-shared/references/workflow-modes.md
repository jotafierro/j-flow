# Workflow Modes

Canonical definition of the `**Workflow mode:**` field in `.specs/config.md`.
Skills reference this file rather than restating any of it inline.

## Reading the config

Read `.specs/config.md` from the project root. If the file does not exist, or
the field is absent or unrecognized, assume `team`. Never fail because the file
is missing — every project that predates it is a `team` project by definition,
and no skill should block on its absence.

## The two modes

`**Workflow mode:**` is a **preset over two axes** — the branch model and the
delivery mechanism:

| Axis | | `team` (default) | `solo` |
|---|---|---|---|
| **Branch model** | Base branch | `develop`, with `main` as the release branch | `main` |
| | Feature branch | `feature/{slug}` | `feature/{slug}` — identical |
| **Delivery** | Feature integration | `gh pr create --base {base_branch}` | `git merge --no-ff` locally, then delete the branch |
| | Release integration | `gh pr create --base main` | none — the `vX.Y.Z` tag is the version record |
| *(neither)* | Gates | all seven, blocking | all seven, blocking — identical |

`solo` is for a repository with a single maintainer, where a Pull Request would
have the same person as author, reviewer and merger.

**One field, not two, and it is named for the wrong axis on purpose.** The field
says *who works the repo*; what actually changes is the branch model and how work
is delivered. Naming it `Delivery` would be more literal about the second axis
while leaving the first unnamed — which forces a second field, and two fields
mean every consuming skill evaluates a matrix instead of reading one value. The
two axes move together in every real case we have, so they stay one preset and
the axes are documented here instead.

That makes the bar for a third value explicit: it must specify **both** axes, not
just feel like a new way of working. A team working trunk-based (base branch
`main`, but still PRs) would qualify; "solo but on develop" would not — it is
`team` with an unused ceremony.

## Resolving `{base_branch}`

- `team` → `develop`. If it does not exist, fall back to `main`.
- `solo` → `main`.

## What the mode does NOT change

**Nothing about the gates.** `/j-flow-review` and the QA gate block exactly the
same way in both modes; unresolved `[NEEDS CLARIFICATION]` markers, a
`changes-requested` review and a red QA all still stop the flow. The Pull
Request was never j-flow's quality control — the gates are. `solo` removes a
delivery ceremony, not a check.

**Feature branches stay in both modes.** `gate-core.md` §"How to Find Active
Feature" resolves the active feature from the current branch name first;
without `feature/{slug}` that rule degrades to scanning every `meta.md`, which
has to ask the user as soon as two features are in flight.
