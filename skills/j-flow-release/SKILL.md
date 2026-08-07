---
name: j-flow-release
description: "Cut a release — semver bump, CHANGELOG, tag, GitHub Release. Usage: /j-flow-release [major|minor|patch]"
---

# j-flow-release

## Usage

```
/j-flow-release patch         # 1.2.3 → 1.2.4  (bug fixes)
/j-flow-release minor         # 1.2.3 → 1.3.0  (new features, backward-compatible)
/j-flow-release major         # 1.2.3 → 2.0.0  (breaking changes)
```

Default if no argument provided: `minor`.

---

## Release steps

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

Detect and bump all of the following. Both loops below are scoped to this monorepo's declared workspaces (root + `apps/*` + `packages/*`) — never the whole tree, which could otherwise pick up an unrelated `package.json`/`pubspec.yaml` nested somewhere incidental. Both use `-print0` / `read -r -d ''` for filename safety, and pass the path as an **argument**, never interpolated into the `node -e` script body.

**Node packages** — every `package.json` under root, `apps/*`, or `packages/*` with a `version` field:
```bash
find package.json apps packages -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" -print0 2>/dev/null | while IFS= read -r -d '' f; do
  node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));if(p.version){p.version='{new_version}';fs.writeFileSync(process.argv[1],JSON.stringify(p,null,2)+'\n');}" "$f"
done
```

**Flutter apps** — every `pubspec.yaml` under `apps/*` with a `version:` line:
```bash
find apps -maxdepth 2 -name "pubspec.yaml" -not -path "*/node_modules/*" -print0 2>/dev/null | while IFS= read -r -d '' f; do
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

