# j-flow — Claude Code Plugin

Gate-based Spec-Driven Development workflow for MongoDB + NestJS + React + Flutter.

## Plans (development tracking)

Plans live outside this repo, at `../plans/j-flow/` (sibling directory) — not inside j-flow itself, so `.gitignore` no longer needs a `plans/` entry. Execute plans directly from the plan file without any SDD scaffold or `.superpowers/` folders.

- `../plans/j-flow/README.md` — status tracker; mark plan DONE with commit range when finished
- `CHANGELOG.md [Unreleased]` — update manually during plan execution (don't wait for release)
- Pattern: feat commit(s) → validate → `chore(changelog): add unreleased entries for plan NNN`

## Release (this repo)

See the `j-flow-release-repo` skill for the full checklist (version bump, changelog, tag, GitHub release).
