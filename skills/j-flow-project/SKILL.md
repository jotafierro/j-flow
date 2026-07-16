---
name: j-flow-project
description: Define or update the project for a j-flow repo (MongoDB + NestJS + React + Flutter). Init mode generates PRODUCT.md, DESIGN.md, CHANGELOG.md, .specs/README.md (phased feature backlog), and agent memory, then auto-invokes /j-flow-scaffold. Update mode syncs backlog statuses from meta.md files, allows adding or reorganizing features, and then auto-invokes /j-flow-scaffold --review.
allowed-tools: Read Write Bash Glob Grep
---

# /j-flow-project

## Arguments

`$ARGUMENTS`: empty (init) | `--update` | `--from {file}` | `--from-design {file}`

Flags can be combined: `--from PRODUCT.md --from-design DESIGN.md --update`

---

## Mode: Init (no `--update`)

Run once when starting a new project. Creates `PRODUCT.md`, `DESIGN.md`, `CHANGELOG.md`, `.specs/README.md`, `CONSTITUTION.md`, and agent memory.

### Step 1: Verify git repo

If `.git` does not exist in the current directory, initialize one on `main`:
```bash
git init -b main
```
Print: "Initialized git repository (branch: main)."

If `.git` already exists, leave it as-is.

If `PRODUCT.md` already exists in the current directory, stop:
> "PRODUCT.md already exists. Use `--update` to modify the backlog."

### Step 2: Read product description

**If `--from {file}` is provided:**
- Read the file at that path as the product description base.
- Show the content to the user and ask: "Does this product description look right? Reply 'yes' to use as-is, or tell me what to adjust."
- Apply any requested changes before proceeding to Step 3.

**If no `--from`:** ask the following questions ONE AT A TIME (wait for each answer before asking the next):

1. What is the product name and tagline? (one sentence: what it does and for whom)
2. What problem does it solve? (1-3 sentences)
3. Who is the primary user? (role, scale: personal / team / multi-tenant SaaS / public)
4. Is there a secondary user? (admin, manager, support — or "none")
5. What is the monetization model? (free / freemium / subscription / one-time / B2B SaaS)
6. What are the must-have features for Phase 1 (MVP)? (bullet list)
7. What are the Phase 2 value-add features? (bullet list, or "none yet")
8. What are the Phase 3+ advanced features? (bullet list, or "none yet")
9. What is explicitly out of scope for v1?
10. What makes this product different? (one paragraph)

### Step 3: Build PRODUCT.md

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/product.md`.

Substitute all `{placeholders}` with the answers collected in Step 2. Keep the Tech Stack section exactly as in the template (MongoDB + NestJS + React + Flutter stack).

Show the full draft to the user. Ask: "Does this look right? Reply 'yes' to save or tell me what to change."

Iterate until approved. Then write to `PRODUCT.md` at the project root.

### Step 4: Build DESIGN.md

**If `--from-design {file}` is provided:**
- Read the file at that path as the design system base.
- Show the content to the user and ask: "Does this design system look right for the project? Reply 'yes' to use as-is, or tell me what to adjust."
- Apply any requested changes, then save to `DESIGN.md`.

**Otherwise:**
Ask these questions ONE AT A TIME:

1. Brand personality? (e.g. "modern corporate", "playful", "minimal", "technical")
2. Primary brand color? (hex value, or description like "deep blue")
3. Typography preference? (e.g. "Inter for sans, JetBrains Mono for code" — or "suggest based on brand")

Then:
- Generate a full color palette for both light mode and dark mode from the primary color (complementary shades for background, surface, on-surface, secondary, error, outline, etc.)
- Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/design.md`
- Fill in all `{placeholders}` with the brand decisions and derived tokens
- Show the full draft to the user. Ask: "Does this design system look right?"
- Iterate until approved, then write to `DESIGN.md` at the project root.

### Step 5: Propose phased backlog

Based on `PRODUCT.md`, propose a phased backlog.

**Rules:**
- Phase 0 always contains these 4 features in order:
  - `01-infra-base` (Monorepo + Docker + CI/CD)
  - `02-observability` (Error tracking + request tracing + NestJS exception filter + Flutter SDK — GlitchTip cloud dev / Sentry cloud prod, no local docker service) — recommended; ask user before including
  - `03-design-system` (Tokens + Storybook + Widgetbook)
  - `04-design-polish` (Visual fidelity pass + form UX — submit buttons disabled until required fields filled) — recommended; ask user before including
- Phase 1 = Core / MVP features — slugs start at `05`
- Phase 2+ = value-add and advanced features
- Slug format: `{2-digit number}-{kebab-case-name}` (e.g. `05-auth`, `06-tenants`)
- Each feature has a 1-line description and dependency list (which slugs it needs)

After proposing Phase 0, ask explicitly:

```
Phase 0 includes 2 optional foundation features:
  02-observability  — error tracking (GlitchTip cloud dev / Sentry cloud prod), request tracing, NestJS exception filter, Flutter SDK
  04-design-polish  — visual fidelity pass once designs are approved; form UX (disable submit until valid)

Include them?
  1. Both (recommended)
  2. Only 02-observability
  3. Only 04-design-polish
  4. Neither — skip both
```

Display the proposed backlog as a readable outline:

```
Phase 0 — Foundation
  01-infra-base      Turborepo + Docker + CI/CD
  02-observability   Error tracking + request tracing     (needs: 01)   ← if included
  03-design-system   Tokens + Storybook + Widgetbook
  04-design-polish   Visual fidelity + form UX            (needs: 03)   ← if included

Phase 1 — Core
  05-auth            JWT + refresh + biometrics           (needs: 01, 03)
  06-tenants         Multi-tenant CRUD                    (needs: 05)
  ...

Phase 2 — {Name}
  ...
```

If user skips 02-observability or 04-design-polish, renumber accordingly (e.g. if both skipped, design-system stays 03 and Phase 1 starts at 04).

Ask: "Does this look right? Anything to add, remove, or move?"

Iterate until the user approves.

### Step 6: Generate .specs/README.md

Create `.specs/` directory if it does not exist.

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/specs-index.md`.

Fill in:
- `{Project Name}` — from `PRODUCT.md` **Name** field
- `{One-line product description}` — from `PRODUCT.md` **Tagline** field
- One row per feature in the approved backlog, grouped by phase
- All initial statuses set to `[ ]`
- Phase names as approved (Phase 0 — Foundation, Phase 1 — Core, etc.)
- Phase 0 always has the infra-base and design-system rows without a "Depends on" column
- Phase 1+ rows include "Depends on" column

Write to `.specs/README.md`.

### Step 7: Initialize CHANGELOG.md

If `CHANGELOG.md` does not exist, read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/changelog.md` and write to `CHANGELOG.md` at the project root.

If it already exists, leave it untouched and print "CHANGELOG.md already exists — skipped."

### Step 8: Initialize agent memory

Create `.specs/.agents/` directory if it does not exist.

For each of the 7 agent templates in `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/`:
- `j-flow-architect.md`
- `j-flow-backend.md`
- `j-flow-frontend.md`
- `j-flow-mobile.md`
- `j-flow-devops.md`
- `j-flow-quality.md`
- `j-flow-reviewer.md`

Read each template, substitute `{project name}` with the name from `PRODUCT.md` and `{date}` with today's ISO date (YYYY-MM-DD). Write to `.specs/.agents/{agent}.md`.

If a file already exists, skip it and print `{agent}.md already exists — skipped.`

### Step 8b: Generate CONSTITUTION.md

Read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/constitution.md`.

Ask the user: "Do you want to define project principles now? These will be enforced as a blocking gate in `/j-flow-review`. You can always add them later by editing `CONSTITUTION.md`. (yes / skip)"

**If yes:** Ask the user to provide 1–5 initial principles (free-form). For each principle, ask:
  1. Short name (e.g. "no-business-logic-in-controllers")
  2. Principle text (one or two sentences — be specific enough to evaluate against code)
  3. Rationale (why this principle exists)

Generate `CONSTITUTION.md` substituting each principle into the template (P1, P2, ...). Show the draft before writing. Iterate until approved. Write to `CONSTITUTION.md` at the project root.

**If skip:** Write `CONSTITUTION.md` with the following placeholder content so the file exists and `/j-flow-review` can read it without blocking:

```markdown
# Constitution — {Project Name}

<!-- No principles defined yet. Add principles here before running /j-flow-review.
     /j-flow-review will warn but not block while this placeholder comment is present. -->

## Principles

*(none defined — edit this file to add principles)*

## Change log

| Date | Change | Author |
|------|--------|--------|
| {today} | Initial constitution (no principles defined) | — |
```

### Step 9: Commit

Stage and commit all created files:

```bash
git add PRODUCT.md DESIGN.md CHANGELOG.md CONSTITUTION.md .specs/
git commit -m "chore: j-flow-project — product definition + backlog"
```

### Step 9b: Ensure `develop` branch exists

Check: `git show-ref --verify --quiet refs/heads/develop`.

If `develop` does not exist yet, create it from the commit just made and switch to it:
```bash
git checkout -b develop
```
Print: "Created `develop` branch — features branch off `develop` from here on."

If `develop` already exists, switch to it: `git checkout develop`.

### Step 10: Print success and invoke scaffold

Print:
```
Project initialized ✓
  PRODUCT.md created
  DESIGN.md created
  CHANGELOG.md ready
  CONSTITUTION.md created
  .specs/README.md created ({N} features across {P} phases)
  Agent memory initialized at .specs/.agents/

Auto-invoking /j-flow-scaffold...
```

Then immediately invoke `/j-flow-scaffold`.

---

## Mode: Update (`--update`)

Run to sync backlog statuses from actual `meta.md` files, add new features, or reorganize phases. Does NOT touch feature spec directories (except the README.md symbol table).

### Step 1: Read current state

Read `.specs/README.md`. For each feature row in the table, extract the slug (from the Folder column).

For each slug, check if `.specs/{slug}/meta.md` exists. If it does, read the following fields:
- `current_phase`
- `functional_status`
- `technical_status`
- `tasks_status`
- `build_status`
- `qa_status`
- `review_status`
- `finish_status`

Build a truth map: `slug → { meta fields }` vs `slug → displayed symbol`.

### Step 2: Sync symbols

Map each feature's actual state to the correct symbol using this table:

| Condition | Symbol |
|-----------|--------|
| `finish_status: completed` | `[✓]` |
| `review_status: approved` | `[R]` |
| `qa_status: green` | `[Q]` |
| `build_status: completed` | `[B]` |
| `tasks_status: approved` | `[P]` |
| `technical_status: approved` | `[TF]` |
| `functional_status: approved` | `[SF]` |
| `functional_status: pending`, spec file exists | `[S]` |
| `functional_status: pending`, no spec started | `[ ]` |

Evaluation order: top-to-bottom (first matching condition wins).

For each feature where the actual symbol differs from the displayed symbol, update the `.specs/README.md` table row.

### Step 3: Show summary and prompt

Show:
```
Status sync complete. {N} rows updated.

  1. Add new features to the backlog
  2. Reorganize phases
  3. Save and exit

Enter 1, 2, or 3:
```

**Option 1 — Add features:**
Ask for each new feature: name, 1-line description, phase, dependencies (slug list). Generate a new slug (increment from highest existing number + 1). Append to `.specs/README.md` in the correct phase section with status `[ ]`.

**Option 2 — Reorganize:**
Show current phase structure. Ask which features to move and where. Rewrite the phase sections accordingly. Slug numbers do not change when features are moved between phases.

**Option 3 — Save and exit:** proceed immediately to Step 4.

### Step 4: Write and confirm

Write the updated `.specs/README.md`. Print:
```
.specs/README.md updated:
  • {N} statuses synced
  • {N} features added
  • {N} features moved
```

If anything changed (statuses synced, features added, or features moved), commit:
```bash
git add .specs/README.md
git commit -m "chore: j-flow-project --update — sync backlog statuses"
```

### Step 5: Auto-invoke scaffold review

Print: "Auto-invoking /j-flow-scaffold --review..."

Then immediately invoke `/j-flow-scaffold --review`.

---

## Rules

- Never modify `.specs/{slug}/` directories in init or update mode — only `.specs/README.md` and root-level files
- Exception: `.specs/01-infra-base/` is owned by `/j-flow-scaffold` — do not create or modify it here
- If `PRODUCT.md` already exists in init mode (no `--update`), warn and stop immediately
- Slug numbering always continues from the highest existing number + 1 (never reuse numbers)
- Phase 0 always contains `01-infra-base` and `03-design-system` — do not remove them; `02-observability` and `04-design-polish` are optional but recommended
- The `--from` and `--from-design` flags are only used in init mode — they are ignored in update mode
- Agent memory files in `.specs/.agents/` are never overwritten — skip existing files silently
