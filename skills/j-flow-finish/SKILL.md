---
name: j-flow-finish
description: Generate feature README, update CHANGELOG [Unreleased], consolidate agent memory patterns, and create PR to develop. Usage: /j-flow-finish
---

# j-flow-finish

## Required reading

Before finishing, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate cascade rules
2. `.specs/{slug}/gate-context.md` — all accumulated decisions to summarize in README
3. `.specs/{slug}/functional-spec.md` — AC table for the README
4. `.specs/{slug}/tasks.json` — files changed list
5. `CHANGELOG.md` — current [Unreleased] section
6. `.specs/.agents/*.md` — agent memory files to update with new learnings
7. Template: `templates/feature-readme.md` — README format

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[REVIEW] approved` (see `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` for gate format).
If missing or stale: "Gate [REVIEW] not approved. Run /j-flow-review first."

## Process

### Step 1: Generate feature README

Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/feature-readme.md`. Substitute placeholders: slug, today's date, branch name, AC table (from functional-spec.md), key files list (grouped by layer from tasks.json), and patterns introduced. Write to `.specs/{slug}/README.md`.

### Step 2: Update CHANGELOG.md

Read the project root `CHANGELOG.md`. Locate `## [Unreleased]`.
Append the feature's changes under it:

```markdown
### Added
- [{slug}] {brief description of new functionality}

### Fixed
- [{slug}] {brief description of bug fixes, if any}

### Changed
- [{slug}] {brief description of modified behavior, if any}
```

Only include sections (Added/Fixed/Changed) that are non-empty.
Show the diff to the user before writing.

### Step 3: Consolidate agent memory

For each agent that participated in this feature (based on which layers were built):
- Read `.specs/.agents/{agent}.md`
- Identify non-obvious patterns or decisions made in this feature
- Append them to the "Learned Patterns" section with date and slug

Only add genuinely useful context for future features. Never add obvious things.

Example:
```markdown
## Learned Patterns

### 2026-06-12 — user-auth
- MongoDB: Use sparse indexes on optional unique fields to allow multiple null values
- NestJS: Auth guard at controller level (not globally) — admin routes need a different guard
```

### Step 4: Commit finish artifacts

```bash
git add .specs/{slug}/README.md CHANGELOG.md .specs/.agents/
git commit -m "docs({slug}): feature README, changelog entry, and agent memory update"
```

### Step 5: Create PR to develop

```bash
gh pr create \
  --title "feat: {slug}" \
  --body "$(cat .specs/{slug}/README.md)" \
  --base develop \
  --head feature/{slug}
```

If `gh` CLI is not available: print the URL for manual PR creation with recommended title and body.

### Step 6: Output

Print:
```
Feature '{slug}' finished ✓
  README: .specs/{slug}/README.md
  CHANGELOG: updated [Unreleased]
  Agent memory: updated
  PR: {url}

CHANGELOG.md has new [Unreleased] entries.
Run /j-flow-release [major|minor|patch] when ready to cut a release.
```
