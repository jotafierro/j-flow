---
name: j-flow-release-repo
description: Release checklist for the j-flow plugin repo itself (migration guide, version bump, changelog, tag, GitHub release). Use when cutting a new j-flow version — not for /j-flow-release, which is for target projects that consume the plugin.
---

`/j-flow-release` is for target projects. To release j-flow itself:

0. **Decide whether `docs/migrations/vX.Y.Z.md` is needed, and write it before step 4** so the tag contains it. The test is *not* "were there breaking changes" — it is **does an existing project need to change something the plugin will not change for it?** Read the `[Unreleased]` section against that question. Anything fixed inside `/j-flow-scaffold` qualifies by default: a scaffold runs once, and growth re-runs are create-if-missing with carry-forward, so an old project keeps the bug. So does anything `/j-flow-scaffold --review` cannot see — it reports file presence and never runs `install`, `lint` or `test`, which is exactly the tool a user would reach for first.
   If yes, write it as a **retrofit checklist** — detect → fix → verify per item — and **run every command against a real repo in both states** (a current scaffold and one from the previous version) before shipping them. `docs/migrations/v2.5.0.md` is the worked example; its first two drafts shipped commands that did not work. Add the row to `docs/migrations/README.md`.
   If no, say so out loud in the release summary rather than skipping silently — "no migration needed because X" is the record that the question was asked.

1. Bump version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (`plugins[0].version`) — all three must match or the installed plugin version drifts from the release
2. `npm install --package-lock-only` — syncs `package-lock.json`'s version to match
3. In `CHANGELOG.md`: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`, add empty `## [Unreleased]` above it
4. `git add package.json package-lock.json .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md && git commit -m "chore: release vX.Y.Z"`
5. `claude plugin tag --dry-run` — verifies `plugin.json`/`marketplace.json` agree on version before tagging (this is a validation-only step: this repo tags as `vX.Y.Z`, not the `{name}--v{version}` format `claude plugin tag` itself would create, so never drop `--dry-run` or add `--push` here)
6. `git tag vX.Y.Z && git push origin main --tags`
7. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/## \[X\.Y\.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')"` (`head -n -1` broken on macOS — use `sed '$d'`)

Semver guide: `patch` = bug fix / rule tweak, `minor` = new skill feature or template, `major` = breaking change to skill interface.
