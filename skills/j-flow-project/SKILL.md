---
name: j-flow-project
description: Define or update the project for a j-flow repo (MongoDB + NestJS + React + Flutter). Init mode generates PRODUCT.md, DESIGN.md, CHANGELOG.md, .specs/README.md (phased feature backlog), and agent memory, then auto-invokes /j-flow-scaffold. Update mode syncs backlog statuses from meta.md files, allows adding or reorganizing features, and then auto-invokes /j-flow-scaffold --review.
allowed-tools: Read Write Bash Glob Grep
---

# /j-flow-project

## Arguments

`$ARGUMENTS`: empty (init) | `--update` | `--from {file}` | `--from-design {file}`

Flags can be combined: `--from PRODUCT.md --from-design DESIGN.md --update`

**Override resolution:** every `${CLAUDE_PLUGIN_ROOT}/…` template this skill reads (PRODUCT / DESIGN / CONSTITUTION, the agent-memory templates, the backlog/changelog templates) resolves through `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — if a matching file exists under `.specs/.overrides/`, use it verbatim instead of the plugin default.

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

### Step 2b: Determine stack layers

Ask:
```
Which layers does this project need?
  web     — React frontend
  api     — NestJS + MongoDB backend
  mobile  — Flutter app
  admin   — separate React admin panel
  e2e     — Playwright end-to-end tests (local web app if web is selected, else an external URL)

Reply with a comma list (e.g. "web,api,e2e") or "all" for the full stack.
Default: all five. (e2e is recommended whenever web is selected.)
```

If the user replies blank or "all", set `stack_layers = [web, api, mobile, admin, e2e]`. Otherwise parse the comma list (lowercase, trimmed) into `stack_layers`. If the list names `web` but not `e2e`, remind the user that Playwright will not be scaffolded and offer to add `e2e`.

This is the only place layer scope is decided — `/j-flow-scaffold` reads it back from `PRODUCT.md` and skips app generation entirely for any layer not listed.

### Step 3: Build PRODUCT.md

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/product.md`.

Substitute all `{placeholders}` with the answers collected in Step 2. Keep the Tech Stack section's stack descriptions (Backend/API Style/Web/Mobile/Auth/Infra) exactly as in the template — only fill `**Layers:**` with the comma list from Step 2b (e.g. `web, api` or `web, api, mobile, admin`).

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
- Phase 0 always contains these features in order (required ones cannot be skipped):
  - `01-infra-base` (Monorepo + Docker + CI/CD) — required
  - `02-observability` (Error tracking + request tracing + NestJS exception filter + Flutter SDK — GlitchTip cloud dev / Sentry cloud prod, no local docker service) — optional, recommended; needs 01
  - `03-design-system` (Tokens + Storybook + Widgetbook) — required
  - `04-design-polish` (Visual fidelity pass + form UX — submit buttons disabled until required fields filled) — optional, recommended; needs 03
  - `05-deploy` (Shared dev environment — Railway API + Vercel web/admin + MongoDB Atlas, deployed on merge to `develop`, connected to the Sentry/GlitchTip cloud project from `02-observability` if included — gives a live URL to hand to early testers) — optional, recommended; needs 01, 03
  - `06-legal-pages` (Terms of Service + Privacy Policy static pages, linked from web/admin footer and mobile settings) — optional; only offer if `PRODUCT.md`'s **Monetization → Model** is not `free`; needs 03
- Phase 1 = Core / MVP features — slugs start after the highest included Phase 0 slug
- Phase 2+ = value-add and advanced features
- Slug format: `{2-digit number}-{kebab-case-name}` (e.g. `07-auth`, `08-tenants`)
- Each feature has a 1-line description and dependency list (which slugs it needs)

After proposing Phase 0, ask explicitly (only list `06-legal-pages` if monetization ≠ free):

```
Phase 0 has {3 or 4} optional foundation features:
  02-observability   error tracking (GlitchTip cloud dev / Sentry cloud prod), request tracing, NestJS exception filter, Flutter SDK
  04-design-polish   visual fidelity pass once designs are approved; form UX (disable submit until valid)
  05-deploy          shared dev environment (Railway + Vercel + MongoDB Atlas) — a live URL to share with early testers
  06-legal-pages     Terms of Service + Privacy Policy pages — you said this product is "{monetization model}"; line these up before charging anyone   ← only shown if monetization != free

Reply with which to include: numbers comma-separated (e.g. "02,05"), "all", or "none".
```

Display the proposed backlog as a readable outline:

```
Phase 0 — Foundation
  01-infra-base      Turborepo + Docker + CI/CD
  02-observability   Error tracking + request tracing     (needs: 01)         ← if included
  03-design-system   Tokens + Storybook + Widgetbook
  04-design-polish   Visual fidelity + form UX            (needs: 03)         ← if included
  05-deploy          Shared dev env (Railway/Vercel/Atlas) (needs: 01, 03)    ← if included
  06-legal-pages     ToS + Privacy Policy pages            (needs: 03)        ← if included

Phase 1 — Core
  07-auth            JWT + refresh + biometrics           (needs: 01, 03)
  08-tenants         Multi-tenant CRUD                    (needs: 07)
  ...

Phase 2 — {Name}
  ...
```

Renumber sequentially based on what's actually included — e.g. if only `05-deploy` is included alongside the 2 required features, it becomes `03-deploy` and Phase 1 starts at `04`.

Ask: "Does this look right? Anything to add, remove, or move?"

Iterate until the user approves.

### Step 5b: Business/legal advisory (one-time, non-blocking)

If `PRODUCT.md`'s **Monetization → Model** is not `free`, print once (do not repeat on `--update` runs):

```
Note — this product charges money. A few things worth lining up before your first paying user
(not before your first tester): a payment processor (Stripe et al. can usually onboard you as an
individual before you're a registered company — check your country's requirements), and Terms of
Service + Privacy Policy (06-legal-pages covers the pages; the legal text itself still needs your
review). Company formation and trademark registration are usually worth deferring until you have
real users or revenue — they're jurisdiction-specific, so this isn't advice, just a sequencing tip.
```

This is informational only — never blocks, never writes a file, never asks a follow-up question.

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

Filter the 7 agent templates in `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/` by `stack_layers` (from Step 2b):

| Agent | Included when |
|-------|---------------|
| `j-flow-architect.md` | always |
| `j-flow-backend.md` | `api` in `stack_layers` |
| `j-flow-frontend.md` | `web` or `admin` in `stack_layers` |
| `j-flow-mobile.md` | `mobile` in `stack_layers` |
| `j-flow-devops.md` | always (infra/CI layer is generated regardless of app layers) |
| `j-flow-quality.md` | always |
| `j-flow-reviewer.md` | always |

For each agent that passes its filter, read the template, substitute `{project name}` with the name from `PRODUCT.md` and `{date}` with today's ISO date (YYYY-MM-DD). Write to `.specs/.agents/{agent}.md`.

If a file already exists, skip it and print `{agent}.md already exists — skipped.`

For agents filtered out, print `{agent}.md skipped — {layer} not in stack_layers.` Do not create the file. If a layer is added later (e.g. project re-scoped), the missing agent memory file must be created manually or via a future `--update` layer change — `/j-flow-project --update` does not currently re-run this step.

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

Map each feature's actual state to the correct symbol per `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` §"Backlog symbols" (first matching condition wins, top to bottom).

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
- Phase 0 always contains `01-infra-base` and `03-design-system` — do not remove them (slug numbers shift if optional Phase 0 features are skipped, but these two are never skipped); `02-observability`, `04-design-polish`, `05-deploy` are optional but recommended, `06-legal-pages` is optional and offered only when monetization ≠ free
- The `--from` and `--from-design` flags are only used in init mode — they are ignored in update mode
- Agent memory files in `.specs/.agents/` are never overwritten — skip existing files silently
- `**Layers:**` in `PRODUCT.md` (set in Step 2b) is the single source of truth for which apps `/j-flow-scaffold` generates and which agent memory files Step 8 creates — default when absent is all four (web, api, mobile, admin)
- Agent memory is layer-scoped: `j-flow-backend` only if `api`, `j-flow-frontend` only if `web` or `admin`, `j-flow-mobile` only if `mobile`. `j-flow-architect`, `j-flow-devops`, `j-flow-quality`, `j-flow-reviewer` are always created — cross-cutting or infra always applies
