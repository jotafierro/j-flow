---
name: j-flow-release-repo
description: Release checklist for the j-flow plugin repo itself (version bump, changelog, tag, GitHub release). Use when cutting a new j-flow version — not for /j-flow-release, which is for target projects that consume the plugin.
---

`/j-flow-release` is for target projects. To release j-flow itself:

1. Bump version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (`plugins[0].version`) — all three must match or the installed plugin version drifts from the release
2. `npm install --package-lock-only` — syncs `package-lock.json`'s version to match
3. In `CHANGELOG.md`: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`, add empty `## [Unreleased]` above it
4. `git add package.json package-lock.json .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md && git commit -m "chore: release vX.Y.Z"`
5. `claude plugin tag --dry-run` — verifies `plugin.json`/`marketplace.json` agree on version before tagging (this is a validation-only step: this repo tags as `vX.Y.Z`, not the `{name}--v{version}` format `claude plugin tag` itself would create, so never drop `--dry-run` or add `--push` here)
6. `git tag vX.Y.Z && git push origin main --tags`
7. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/## \[X\.Y\.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')"` (`head -n -1` broken on macOS — use `sed '$d'`)

Semver guide: `patch` = bug fix / rule tweak, `minor` = new skill feature or template, `major` = breaking change to skill interface.
