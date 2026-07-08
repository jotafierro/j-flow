# j-flow — Claude Code Plugin

Gate-based Spec-Driven Development workflow for MongoDB + NestJS + React + Flutter.

## Validation

```bash
node tests/validate.js   # structural tests (no LLM needed)
```

## Skill structure

Each skill lives at `skills/{skill-name}/SKILL.md`.
Each agent lives at `agents/{agent-name}.md`.
Shared templates at `skills/j-flow-shared/templates/`.
Shared references at `skills/j-flow-shared/references/`.

## Installation

```bash
git clone git@github.com:jotafierro/j-flow.git ~/j-flow
claude plugin marketplace add ~/j-flow --scope user
claude plugin install j-flow
```

## Plans (development tracking)

`plans/` is gitignored — local only. Execute plans directly from the plan file without any SDD scaffold or `.superpowers/` folders.

- `plans/README.md` — status tracker; mark plan DONE with commit range when finished
- `CHANGELOG.md [Unreleased]` — update manually during plan execution (don't wait for release)
- Pattern: feat commit(s) → validate → `chore(changelog): add unreleased entries for plan NNN`
- `plans/README.md` is gitignored so its edits don't get committed

## Release (this repo)

`/j-flow-release` is for target projects. To release j-flow itself:

1. Bump version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (`plugins[0].version`) — all three must match or the installed plugin version drifts from the release (this happened silently for 5 releases, fixed in v1.2.1)
2. In `CHANGELOG.md`: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`, add empty `## [Unreleased]` above it
3. `git add package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md && git commit -m "chore: release vX.Y.Z"`
4. `git tag vX.Y.Z && git push origin main --tags`
5. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/## \[X\.Y\.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')"` (`head -n -1` broken on macOS — use `sed '$d'`)

Semver guide: `patch` = bug fix / rule tweak, `minor` = new skill feature or template, `major` = breaking change to skill interface.
