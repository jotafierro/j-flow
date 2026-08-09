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

## Mode dispatch

This skill has two modes; each lives in its own reference so a run only loads the one it needs. Read the matching file and follow it completely, then apply §Rules below.

- **Init** (no `--update`) — read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-project/references/mode-init.md`. Generates PRODUCT.md, DESIGN.md, CONSTITUTION.md, CHANGELOG.md, `.specs/README.md` and agent memory, then auto-invokes `/j-flow-scaffold`.
- **Update** (`--update`) — read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-project/references/mode-update.md`. Syncs backlog statuses from `meta.md`, allows adding or reorganizing features, then auto-invokes `/j-flow-scaffold --review`.

`--from {file}` and `--from-design {file}` are Init-mode inputs; see mode-init.md.

---
## Rules

- Never modify `.specs/{slug}/` directories in init or update mode — only `.specs/README.md` and root-level files
- Exception: `.specs/01-infra-base/` is owned by `/j-flow-scaffold` — do not create or modify it here
- If `PRODUCT.md` already exists in init mode (no `--update`), warn and stop immediately
- Slug numbering always continues from the highest existing number + 1 (never reuse numbers)
- Phase 0 always contains `01-infra-base` and `03-design-system` — do not remove them (slug numbers shift if optional Phase 0 features are skipped, but these two are never skipped); `02-observability`, `04-design-polish`, `05-deploy` are optional but recommended, `06-legal-pages` is optional and offered only when monetization ≠ free
- The `--from` and `--from-design` flags are only used in init mode — they are ignored in update mode
- Agent memory files in `.specs/.agents/` are never overwritten — skip existing files silently
- `**Layers:**` in `PRODUCT.md` (set in Step 2b) is the single source of truth for which apps `/j-flow-scaffold` generates and which agent memory files Step 8 creates — default when absent is all five (web, api, mobile, admin, e2e). Editing this line then running `--update` is the supported way to grow (or shrink) a project's layers: Update-mode Step 2b backfills any newly-included agent memory, and the auto-invoked `/j-flow-scaffold --review` reports the app/package/CI delta to generate.
- Agent memory is layer-scoped: `j-flow-backend` only if `api`, `j-flow-frontend` only if `web` or `admin`, `j-flow-mobile` only if `mobile`. `j-flow-architect`, `j-flow-devops`, `j-flow-quality`, `j-flow-reviewer` are always created — cross-cutting or infra always applies
