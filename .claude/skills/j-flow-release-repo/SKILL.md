---
name: j-flow-release-repo
description: Release checklist for the j-flow plugin repo itself (version bump, changelog, tag, GitHub release). Use when cutting a new j-flow version — not for /j-flow-release, which is for target projects that consume the plugin.
---

`/j-flow-release` is for target projects. To release j-flow itself:

1. Bump version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (`plugins[0].version`) — all three must match or the installed plugin version drifts from the release (this happened silently for 5 releases, fixed in v1.2.1)
2. In `CHANGELOG.md`: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`, add empty `## [Unreleased]` above it
3. `git add package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md && git commit -m "chore: release vX.Y.Z"`
4. `git tag vX.Y.Z && git push origin main --tags`
5. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/## \[X\.Y\.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')"` (`head -n -1` broken on macOS — use `sed '$d'`)

Semver guide: `patch` = bug fix / rule tweak, `minor` = new skill feature or template, `major` = breaking change to skill interface.
