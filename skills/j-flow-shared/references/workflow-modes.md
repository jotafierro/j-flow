# Workflow Modes

Canonical definition of the `**Workflow mode:**` field in `.specs/config.md`.
Skills reference this file rather than restating any of it inline.

## Reading the config

Read `.specs/config.md` from the project root. If the file does not exist, or
the field is absent or unrecognized, assume `team`. Never fail because the file
is missing — every project that predates it is a `team` project by definition,
and no skill should block on its absence.

## The two modes

| | `team` (default) | `solo` |
|---|---|---|
| Base branch | `develop`, with `main` as the release branch | `main` |
| Feature branch | `feature/{slug}` | `feature/{slug}` — identical |
| Feature integration | `gh pr create --base {base_branch}` | `git merge --no-ff` locally, then delete the branch |
| Release integration | `gh pr create --base main` | none — the `vX.Y.Z` tag is the version record |
| Gates | all seven, blocking | all seven, blocking — identical |

`solo` is for a repository with a single maintainer, where a Pull Request would
have the same person as author, reviewer and merger.

This is a closed preset, not a set of independent knobs. If a genuinely new
combination shows up (a team working trunk-based, say), add a third value here
rather than turning the two rows into a matrix every skill has to evaluate.

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
