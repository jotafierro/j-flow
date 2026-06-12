---
name: j-flow-release
description: Cut a release — semver bump, move CHANGELOG [Unreleased] to versioned section, create git tag, PR to main. Usage: /j-flow-release [major|minor|patch]
---

# j-flow-release

## Usage

```
/j-flow-release patch    # 1.2.3 → 1.2.4  (bug fixes)
/j-flow-release minor    # 1.2.3 → 1.3.0  (new features, backward-compatible)
/j-flow-release major    # 1.2.3 → 2.0.0  (breaking changes)
```

Default if no argument provided: `minor`.

## Prerequisites

Before running, verify:
1. You are on the `develop` branch: `git branch --show-current`
2. `CHANGELOG.md` has non-empty content under `## [Unreleased]`
3. No uncommitted changes: `git status --short`

If any check fails, report the issue and stop.

## Process

### Step 1: Determine new version

Read `package.json` and extract `version`. Apply the semver bump:
- `patch`: increment Z in X.Y.Z
- `minor`: increment Y, reset Z to 0
- `major`: increment X, reset Y and Z to 0

Show: "Bumping version: {current} → {new}"

### Step 2: Update CHANGELOG.md

Move the content of `## [Unreleased]` to a new versioned section:

**Before:**
```markdown
## [Unreleased]
### Added
- [feature-a] New invoice list

## [1.2.0] - 2026-05-01
```

**After:**
```markdown
## [Unreleased]

## [{new_version}] - {today's date}
### Added
- [feature-a] New invoice list

## [1.2.0] - 2026-05-01
```

Show the diff and ask: "Does this CHANGELOG entry look right? Reply 'yes' to proceed."

### Step 3: Update package.json version

Update the `version` field in `package.json` to the new version string.

### Step 4: Commit and tag

```bash
git add CHANGELOG.md package.json
git commit -m "chore: release v{new_version}"
git tag v{new_version}
```

### Step 5: Create PR to main

```bash
gh pr create \
  --title "release: v{new_version}" \
  --body "Release v{new_version}. See CHANGELOG.md for full details." \
  --base main \
  --head develop
```

### Step 6: Output

```
Release v{new_version} prepared ✓
  Tag: v{new_version}
  PR: {url}

After the PR merges:
  git push origin v{new_version}
```
