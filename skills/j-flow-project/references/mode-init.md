# /j-flow-project — Init mode

Loaded by `j-flow-project/SKILL.md` when no `--update` flag is given. Follow it completely, then return to SKILL.md §Rules.

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

**If no `--from`:** ask in two thematic blocks — present all questions in a block together, wait for one reply covering all of them. If the reply leaves any question in the block unanswered or too vague to use, ask ONLY that one individually (one at a time) before moving to the next block — don't re-ask questions already answered.

**Block 1 — Identity & audience:**
```
Let's define the product. Answer what you can in one message (skip anything you're unsure of — I'll follow up):

1. Product name and tagline? (one sentence: what it does and for whom)
2. What problem does it solve? (1-3 sentences)
3. Who is the primary user? (role, scale: personal / team / multi-tenant SaaS / public)
4. Is there a secondary user? (admin, manager, support — or "none")
```

**Block 2 — Business model & roadmap:**
```
Now the business model and scope:

5. Monetization model? (free / freemium / subscription / one-time / B2B SaaS)
6. Must-have features for Phase 1 (MVP)? (bullet list)
7. Phase 2 value-add features? (bullet list, or "none yet")
8. Phase 3+ advanced features? (bullet list, or "none yet")
9. What's explicitly out of scope for v1?
10. What makes this product different? (one paragraph)
```

### Step 2b: Determine stack layers

Ask:
```
Which layers does this project need?
  web     — React frontend
  api     — NestJS + MongoDB backend
  mobile  — Flutter app
  admin   — separate React admin panel
  e2e     — Playwright end-to-end tests (local web app if web is selected, else an external URL)
  cli     — TypeScript commander CLI (opt-in; single-package when it's the only layer)

Reply with a comma list (e.g. "web,api,e2e") or "all" for the full stack.
Default: all five. (e2e is recommended whenever web is selected.)
```

If the user replies blank or "all", set `stack_layers = [web, api, mobile, admin, e2e]`. Otherwise parse the comma list (lowercase, trimmed) into `stack_layers`. If the list names `web` but not `e2e`, remind the user that Playwright will not be scaffolded and offer to add `e2e`.

This is the only place layer scope is decided — `/j-flow-scaffold` reads it back from `PRODUCT.md` and skips app generation entirely for any layer not listed.

### Step 2c: Determine workflow mode

Ask:
```
How is this repository worked?
  team  — a develop branch and Pull Requests (default: teams, outside review)
  solo  — trunk-based on main, no Pull Requests (single maintainer)

Enter team or solo (default: team):
```

Set `workflow_mode` from the reply; blank or unrecognized → `team`. See
`${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/workflow-modes.md` for what each
value changes — it is the canonical definition, and the only thing that reads it here is
Step 6b (which writes it down) and Step 9b (which acts on it).

`solo` changes only how work is delivered: no `develop` branch, and `/j-flow-finish`
merges locally instead of opening a PR. It relaxes no gate — say so if the user asks.

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
Ask as one block; if any part comes back unanswered or too vague, follow up on just that one:
```
Three quick design questions — answer what you can in one message:

1. Brand personality? (e.g. "modern corporate", "playful", "minimal", "technical")
2. Primary brand color? (hex value, or description like "deep blue")
3. Typography preference? (e.g. "Inter for sans, JetBrains Mono for code" — or "suggest based on brand")
```

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
  - `05-deploy` (Shared dev environment — Railway API + Vercel web/admin + MongoDB Atlas, deployed on merge to the base branch, connected to the Sentry/GlitchTip cloud project from `02-observability` if included — gives a live URL to hand to early testers) — optional, recommended; needs 01, 03
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

### Step 6b: Generate .specs/config.md

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/config.md`.
Substitute `{Project Name}` from `PRODUCT.md`, and `{team|solo}` with the `workflow_mode`
chosen in Step 2c. Write to `.specs/config.md`.

This is the project's workflow configuration, separate from `PRODUCT.md` on purpose:
`PRODUCT.md` describes the product and is regenerated by `--update`, while this file is
hand-edited policy about how the repo is worked. Step 9's commit picks it up along with
the rest of `.specs/`.

### Step 7: Initialize CHANGELOG.md

If `CHANGELOG.md` does not exist, read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/changelog.md` and write to `CHANGELOG.md` at the project root.

If it already exists, leave it untouched and print "CHANGELOG.md already exists — skipped."

### Step 8: Initialize agent memory

Create `.specs/.agents/` directory if it does not exist.

Filter the 8 agent templates in `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/` by `stack_layers` (from Step 2b):

| Agent | Included when |
|-------|---------------|
| `j-flow-architect.md` | always |
| `j-flow-backend.md` | `api` in `stack_layers` |
| `j-flow-frontend.md` | `web` or `admin` in `stack_layers` |
| `j-flow-mobile.md` | `mobile` in `stack_layers` |
| `j-flow-cli.md` | `cli` in `stack_layers` |
| `j-flow-devops.md` | always (infra/CI layer is generated regardless of app layers) |
| `j-flow-quality.md` | always |
| `j-flow-reviewer.md` | always |

For each agent that passes its filter, read the template, substitute `{project name}` with the name from `PRODUCT.md` and `{date}` with today's ISO date (YYYY-MM-DD). Write to `.specs/.agents/{agent}.md`.

If a file already exists, skip it and print `{agent}.md already exists — skipped.`

For agents filtered out, print `{agent}.md skipped — {layer} not in stack_layers.` Do not create the file.

**Growth (a layer added later):** this step is idempotent and re-runnable — it creates only *missing* agent memory for now-included layers and never touches existing files (per the skip rule above). When a layer is added to `**Layers:**`, `/j-flow-project --update` (Update-mode Step 2b) re-applies the filter table against the current `stack_layers` and backfills the new agent (adding `api` → creates `j-flow-backend.md`; `mobile` → `j-flow-mobile.md`; `web`/`admin` → `j-flow-frontend.md` if absent). Harness/agent-less layers add nothing here (`e2e` is owned by `j-flow-quality`; `cli` brings its own `j-flow-cli` per plan 036).

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

### Step 9b: Ensure the base branch exists

Resolve `{base_branch}` from the `workflow_mode` of Step 2c per
`${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/workflow-modes.md`.

**`team`** — the base branch is `develop`. Check `git show-ref --verify --quiet refs/heads/develop`.
If it does not exist yet, create it from the commit just made and switch to it:
```bash
git checkout -b develop
```
Print: "Created `develop` branch — features branch off `develop` from here on."
If `develop` already exists, switch to it: `git checkout develop`.

**`solo`** — the base branch is `main`. Create nothing and stay where you are.
Print: "Solo mode — features branch off `main` and come back by local merge; no `develop`, no PRs."
Do **not** create `develop` "just in case": a branch nothing merges into is exactly the
stale pointer this mode exists to avoid.

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
