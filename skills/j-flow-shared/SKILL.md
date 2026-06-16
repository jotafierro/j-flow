---
name: j-flow-shared
description: Bundle of shared templates and references for j-flow skills. This skill is not user-invocable — it exposes assets at known paths. Skills and agents read files in `templates/` and `references/` directly via `${CLAUDE_PLUGIN_ROOT}`.
---

# j-flow-shared

This skill does not execute. It bundles shared assets that other j-flow skills read:

- `templates/` — placeholder-bearing markdown and JSON files written into target feature folders. Skills read a template, substitute placeholders, and write the result.
- `references/` — read-only docs that skills and agents consult for canonical rules. Treat these as the single source of truth.

## Canonical sources

| Topic | File |
|-------|------|
| Gate format, status values, cascade rules | `references/gate-rules.md` |
| Build layer order, agent ownership map | `references/layer-order.md` |
| Implementation + spec constraints | `references/code-style.md` |
| Agent scopes (what each agent reads and writes) | `references/agent-scopes.md` |
| meta.md schema | `templates/meta.md` |
| gate-context.md seed and append format | `templates/gate-context.md` + `references/gate-rules.md` |
| CHANGELOG seed | `templates/changelog.md` |
| Feature artifacts: functional/technical spec, tasks, review guide, qa report, review findings, feature README | `templates/<artifact>.md` |
| Project-level templates | `templates/product.md`, `templates/design.md`, `templates/specs-index.md` |
| Agent memory templates | `templates/agents/j-flow-*.md` |

## How to reference

Skills resolve paths as `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/<file>` or `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/<file>`. Never duplicate the content here — edit the canonical file.
