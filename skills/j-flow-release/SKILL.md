---
name: j-flow-release
description: Cut a release — semver bump, CHANGELOG, tag, GitHub Release. Standard forward release or retroactive mode for inserting version bumps into git history. Usage: /j-flow-release [major|minor|patch] | /j-flow-release --retroactive
---

# j-flow-release

## Usage

```
/j-flow-release patch         # 1.2.3 → 1.2.4  (bug fixes)
/j-flow-release minor         # 1.2.3 → 1.3.0  (new features, backward-compatible)
/j-flow-release major         # 1.2.3 → 2.0.0  (breaking changes)
/j-flow-release --retroactive # Insert version bumps at historical feature-finish commits
```

Default if no argument provided: `minor`.

---

## Mode A — Standard Forward Release

### Prerequisites

Verify before proceeding:
1. Branch: `git branch --show-current` → should be `develop`
2. `CHANGELOG.md` has non-empty content under `## [Unreleased]`
3. Clean working tree: `git status --short`

If any check fails, report and stop.

### Step 1: Determine new version

Check `git tag --list`. If it's empty, this is the first release: read `package.json` (root) `version` and use it as-is (no bump) — scaffold seeds it at `0.1.0`. Show: "First release detected — using v{version} as-is (no bump)." Skip the rest of this step and continue to Step 2.

Otherwise, read `package.json` (root) and extract `version`. Apply semver bump:
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
```

**After:**
```markdown
## [Unreleased]

## [{new_version}] - {today's date}
### Added
- [feature-a] New invoice list
```

Show the diff and ask: "Does this CHANGELOG entry look right? Reply 'yes' to proceed."

### Step 3: Bump versions in all files

Detect and bump all of the following:

**Node packages** — every `package.json` in the repo with a `version` field:
```bash
find . -name "package.json" -not -path "*/node_modules/*" | while read f; do
  node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('$f','utf8'));if(p.version){p.version='{new_version}';fs.writeFileSync('$f',JSON.stringify(p,null,2)+'\n');}"
done
```

**Flutter apps** — every `pubspec.yaml` with a `version:` line:
```bash
find . -name "pubspec.yaml" -not -path "*/node_modules/*" | while read f; do
  sed -i '' 's/^version: .*/version: {new_version}+{build_number}/' "$f"
done
```
Build number = minor version number (0.1.0 → +1, 0.2.0 → +2, 1.0.0 → +1).

### Step 4: Commit and tag

```bash
git add -u
git commit -m "chore: release v{new_version}"
git tag -a v{new_version} -m "v{new_version}"
```

Check `git remote` — if empty, print: "No git remote configured — skipping push, GitHub Release, and PR. Once you add one: `git push -u origin {current_branch} && git push origin v{new_version}`." and skip straight to Step 7.

Otherwise:
```bash
git push origin {current_branch}
git push origin v{new_version}
```

### Step 5: Create GitHub Release

Extract the versioned section from CHANGELOG.md and create the release:

```bash
gh release create v{new_version} \
  --title "v{new_version}" \
  --notes "$(sed -n '/^## \[{new_version}\]/,/^## \[/p' CHANGELOG.md | grep -v '^## \[' | sed '/^$/d' | head -200)"
```

### Step 6: Create PR to main (if on develop)

```bash
gh pr create \
  --title "release: v{new_version}" \
  --body "Release v{new_version}. See CHANGELOG.md for full details." \
  --base main \
  --head develop
```

### Step 7: Output

```
Release v{new_version} ready ✓
  Tag:     v{new_version}
  Release: {gh_release_url}
  PR:      {pr_url}  (if applicable)
```

---

## Mode B — Retroactive Release (`--retroactive`)

Use when features were already merged without version bumps and you need to insert releases retroactively into git history.

### When to use

- Multiple features are done but no tags exist
- You want each feature-finish commit to have its own version tag
- CHANGELOG items are mixed under `[Unreleased]` with `[feature-label]` prefixes

### Step 1: Gather release plan

Ask the user to provide the release plan as a table:

| Version | After commit (SHA or description) | Date | Feature label |
|---------|-----------------------------------|------|---------------|
| v0.1.0  | `abc1234` (infra-base GWT spec)   | 2026-06-23 | `01-infra-base` |
| v0.2.0  | `def5678` (design-system finish)  | 2026-06-23 | `02-design-system` |
| v0.3.0  | tip of feature/03-auth            | 2026-06-30 | `03-auth` |

If the user doesn't know the commits, run:
```bash
git log --oneline main
```
and help them identify the feature-finish commits.

### Step 2: Show the rebase command

Tell the user to run (using the oldest commit SHA from the plan):

```bash
git rebase -i {oldest_sha}^
```

Explain exactly which lines to change from `pick` to `edit` in the interactive editor — one line per commit that will receive a bump AFTER it.

Wait for the user to confirm they are paused at the first `edit` commit.

### Step 3: For each rebase pause point

Repeat for each version in the plan (oldest → newest):

#### 3a: Reconstruct CHANGELOG

The CHANGELOG may have items from multiple features mixed together. Use the feature labels to separate them.

Check current state first:
```bash
head -30 CHANGELOG.md
```

Then run a Python script to split items by feature label:

```bash
python3 << 'EOF'
content = open('CHANGELOG.md').read()

# Parse header (everything before first ##)
header_end = content.index('## [')
header = content[:header_end]

# Collect all Added lines tagged by feature
import re
all_lines = content.splitlines(keepends=True)
tagged = {}  # label -> [lines]
for line in all_lines:
    m = re.match(r'- \[([^\]]+)\]', line)
    if m:
        label = m.group(1)
        tagged.setdefault(label, []).append(line)

# Build new CHANGELOG: [Unreleased] empty, then versions newest→oldest
sections = []
# v0.N.0 sections — newest first
# REPLACE THIS with actual version/label/date mappings:
plan = [
    ('0.3.0', '2026-06-30', '03-auth'),
    ('0.2.0', '2026-06-23', '02-design-system'),
    ('0.1.0', '2026-06-23', '01-infra-base'),
]
for version, date, label in plan:
    lines = tagged.get(label, [])
    if lines:
        sections.append(f'## [{version}] - {date}\n\n### Added\n' + ''.join(lines))

result = header + '## [Unreleased]\n\n' + '\n'.join(sections) + '\n'
open('CHANGELOG.md', 'w').write(result)
print("Done. Verify with: head -40 CHANGELOG.md")
EOF
```

Instruct the user to verify with `head -40 CHANGELOG.md` before proceeding.

#### 3b: Bump versions in all files

For version `X.Y.Z` at this pause point:

```bash
# All package.json files (skip node_modules)
find . -name "package.json" -not -path "*/node_modules/*" | while read f; do
  node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('$f','utf8'));if(p.version){p.version='X.Y.Z';fs.writeFileSync('$f',JSON.stringify(p,null,2)+'\n');}"
done

# All pubspec.yaml files
find . -name "pubspec.yaml" | while read f; do
  sed -i '' 's/^version: .*/version: X.Y.Z+{build_number}/' "$f"
done
```

#### 3c: Commit and tag

```bash
git add -u
git commit -m "chore: release vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git rebase --continue
```

Wait for the user to confirm rebase completed or report conflicts before proceeding to the next version.

### Step 4: Rebase dependent branches

After main rebase is done:

```bash
git push --force-with-lease origin main
```

For each feature branch that branched off the rewritten commits:
```bash
git checkout {feature-branch}
git rebase main
```

Warn: conflicts are possible if the branch modifies any of the bumped files (`package.json`, `pubspec.yaml`, `CHANGELOG.md`).

### Step 5: Final version bump (if on a feature branch)

For the most recent version (tip of a feature branch), no rebase needed — just commit normally:

```bash
# Bump files
# Restructure CHANGELOG
git add -u
git commit -m "chore: release vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push --force-with-lease origin {feature-branch}
```

### Step 6: Push all tags

```bash
git push origin v0.1.0 v0.2.0 v0.3.0  # all tags from the plan
```

### Step 7: Create GitHub Releases for all versions

For each version (oldest → newest):

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes "$(sed -n '/^## \[X\.Y\.Z\]/,/^## \[/p' CHANGELOG.md | grep -v '^## \[' | sed '/^$/d')"
```

### Step 8: Output

```
Retroactive releases prepared ✓
  v0.1.0 → {release_url}
  v0.2.0 → {release_url}
  v0.3.0 → {release_url}
```

---

## Notes

- **Force push**: `--force-with-lease` is safer than `--force` — it aborts if the remote has commits you haven't fetched.
- **Build numbers** in `pubspec.yaml`: Use the minor version number as the build number (0.1.0 → +1, 0.2.0 → +2, 0.3.0 → +3, 1.0.0 → +1).
- **CHANGELOG separation**: Items must have `[feature-label]` prefix in their bullet text for the Python script to split them correctly. If they don't, show the items and ask the user to categorize manually.
- **Interactive rebase limitation**: Claude cannot control the `git rebase -i` editor directly. Always tell the user which lines to change to `edit` and wait for their confirmation at each pause point.
