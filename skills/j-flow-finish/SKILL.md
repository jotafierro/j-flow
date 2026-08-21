---
name: j-flow-finish
description: "Generate feature README, update CHANGELOG [Unreleased], consolidate agent memory patterns, and integrate the feature branch (PR in team mode, local merge in solo). Usage: /j-flow-finish"
---

# j-flow-finish

## Required reading

**Override resolution:** every `${CLAUDE_PLUGIN_ROOT}/…` template or reference this skill reads resolves through `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — if a matching file exists under `.specs/.overrides/`, use it verbatim instead of the plugin default.

**Language:** prose this skill writes follows the project's `**Spec language:**` (and `**Docs language:**` where it writes under `docs/` or the CHANGELOG); headings, gate vocabulary, IDs and code stay English. Canonical: `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/language-contract.md`.

Before finishing, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-core.md` — gate format
2. `.specs/{slug}/gate-context.md` — current gate state (one block per gate) to summarize in README
3. `.specs/{slug}/gate-log.md` — superseded and reopened blocks, for the README's decision history. **Skip if absent** — that means no gate was ever revised or reopened, which is the common case. This is the only skill that reads the log.
4. `.specs/{slug}/functional-spec.md` — AC table for the README
5. `.specs/{slug}/tasks.json` — files changed list
6. `CHANGELOG.md` — current [Unreleased] section
7. `.specs/.agents/*.md` — agent memory files to update with new learnings
8. `.specs/_system/` — system behavior files for the domains this feature touches (read to confirm no regression; not required to exist yet)
9. Template: `templates/feature-readme.md` — README format
10. Template: `templates/system-domain.md` — system domain file format
11. Template: `templates/feature-doc.md` — product feature doc format

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[REVIEW] approved` (see `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-core.md` for gate format).
If missing or stale: "Gate [REVIEW] not approved. Run /j-flow-review first."

## Process

### Step 1: Generate feature README

Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/feature-readme.md`. Substitute placeholders: slug, today's date, branch name, AC table (from functional-spec.md), key files list (grouped by layer from tasks.json), and patterns introduced. Write to `.specs/{slug}/README.md`.

### Step 1b: Generate architecture doc

Read `.specs/{slug}/technical-spec.md`. Extract the `## Architecture Overview` section (including any ASCII diagram) and the `## Design Decisions` section (DD-N list).

Ensure `docs/architecture/` exists in the repo root (create if not).

Write `docs/architecture/{slug}.md`:

```markdown
# Architecture — {Feature Name}

Date: {feature completion date from gate-context.md}
Slug: {slug}

{Architecture Overview section, verbatim}

{Design Decisions section, verbatim}
```

### Step 1c: Generate product feature doc

Read `.specs/{slug}/functional-spec.md`. Extract: Purpose, Feature users, and Acceptance Criteria.

Ensure `docs/features/` exists in the repo root (create if not).

Write `docs/features/{slug}.md` using template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/feature-doc.md`:
- Substitute slug, today's date, feature name from meta.md
- Rewrite the Purpose section in user-facing language (no technical jargon — no "JWT", "MongoDB", "HTTP 302", "DTO"). **This rewrite crosses languages as well as register**: `docs/` follows `**Docs language:**`, while the feature README and `_system/` entry this same run writes follow `**Spec language:**`. When the two differ, translating here is part of the step, not an afterthought.
- Rewrite Feature users as plain personas
- Rewrite each AC as a user capability bullet: "you can now X", "the system does Y for you", "users see Z"
- Link to the architecture doc generated in Step 1b

### Step 1d: Upsert docs/features/README.md

Check if `docs/features/README.md` exists.

If it exists, check if a row for `{slug}` is already present — if so, skip (do not duplicate).

If not present, append a new row to the table:
```
| [{Feature Name}]({slug}.md) | {one-sentence capability summary from feature-doc} | {today's date} |
```

If the file does not exist, create it:
```markdown
# Product Features

A catalog of all shipped features and what they enable.

| Feature | What it does | Added |
|---------|-------------|-------|
| [{Feature Name}]({slug}.md) | {one-sentence capability summary} | {today's date} |
```

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

### Step 3b: Merge ACs to system spec

Ask the user: "Which domain does this feature belong to? (e.g. `auth`, `users`, `notifications`, `billing`). Press Enter to skip system-spec update."

If the user provides a domain name `{domain}`:

1. Check if `.specs/_system/{domain}.md` exists.
   - If not: read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/system-domain.md`. Initialize it substituting `{domain}` as the domain name. Write to `.specs/_system/{domain}.md`.
2. Read `.specs/{slug}/functional-spec.md`. Extract all Acceptance Criteria (sections matching `### AC-N`).
3. Read `.specs/_system/{domain}.md`. Locate the `<!-- next feature entries are appended above this line -->` marker.
4. Insert the following block *above* the marker:

```markdown
### {slug} — {one-line description from functional-spec Purpose section} ({today's date})

{all AC sections verbatim, preserving Given/When/Then formatting}

```

5. Update the `Last updated:` line at the top of the file.
6. Show the diff to the user before writing.
7. Write the updated `.specs/_system/{domain}.md`.

If the user skips: print `System spec update skipped.` and continue.

### Step 4: Commit finish artifacts

```bash
git add .specs/{slug}/README.md CHANGELOG.md .specs/.agents/ .specs/_system/ \
        docs/architecture/{slug}.md docs/features/{slug}.md docs/features/README.md
git commit -m "docs({slug}): feature README, changelog entry, agent memory, system spec, architecture and feature docs"
```

### Step 4b: Update meta.md

Update `.specs/{slug}/meta.md` for the **finish** gate per `references/gate-core.md` §"Advancing a gate" (`finish_status: completed`, `finish_completed_at`, `current_phase: done`).

```bash
git add .specs/{slug}/meta.md
git commit -m "chore({slug}): mark feature done in meta"
```

### Step 5: Integrate the feature branch

Resolve `workflow_mode` and `{base_branch}` per `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/workflow-modes.md`. Run Step 4b's commit **before** this step in either mode — `meta.md` must be committed on the feature branch, not after it is gone.

**`team` — open a Pull Request:**
```bash
gh pr create \
  --title "feat: {slug}" \
  --body "$(cat .specs/{slug}/README.md)" \
  --base {base_branch} \
  --head feature/{slug}
```

If `gh` CLI is not available: print the URL for manual PR creation with recommended title and body.

**`solo` — merge locally, no PR:**
```bash
git checkout {base_branch}
git merge --no-ff "feature/{slug}" -m "merge: {slug}"
git branch -d "feature/{slug}"
```

`--no-ff` is deliberate: it keeps the feature's shape in history, which is what makes the spec→commits trail auditable without a PR to document it.

Then check `git remote` — if it is empty, print "No git remote configured — merged locally, nothing to push." and continue. Otherwise:
```bash
git push origin {base_branch}
git push origin --delete "feature/{slug}"   # only if the remote branch exists
```

There is no review step being skipped here: `/j-flow-review` already gated this feature and QA is green, which is why `/j-flow-finish` was allowed to run at all. See `workflow-modes.md` §"What the mode does NOT change".

Recompute the feature's `.specs/README.md` backlog symbol from meta.md per `references/gate-symbols.md` §"Backlog symbols" (finish → `[✓]`).

### Step 6: Output

Print:
```
Feature '{slug}' finished ✓
  README: .specs/{slug}/README.md
  CHANGELOG: updated [Unreleased]
  Agent memory: updated
  Architecture doc: docs/architecture/{slug}.md
  Feature doc: docs/features/{slug}.md
  Feature catalog: docs/features/README.md
  PR: {url}                        (team mode)
  Merged: feature/{slug} → {base_branch}   (solo mode)

CHANGELOG.md has new [Unreleased] entries.
Run /j-flow-release [major|minor|patch] when ready to cut a release.
```
