# j-flow — SDD Plugin

Gate-based Spec-Driven Development workflow for MongoDB + NestJS + React + Flutter.
Works with **Claude Code**, **GitHub Copilot CLI**, **Cursor**, and **Codex CLI**.

## Validation

```bash
node tests/validate.js   # structural tests (no LLM needed)
```

## Skill structure

Each skill lives at `skills/{skill-name}/SKILL.md`.
Each agent lives at `skills/j-flow-shared/agents/{agent-name}.md`.
Shared templates at `skills/j-flow-shared/templates/`.
Shared references at `skills/j-flow-shared/references/`.

## Path variables

Both runtimes resolve shared resources via the same relative path:

| Variable | Runtime | Resolves to |
|----------|---------|-------------|
| `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/` | Claude Code (legacy plugin) | shared skill root |
| `${CLAUDE_SKILL_DIR}/../j-flow-shared/` | Copilot CLI / Cursor / Codex | same |

All SKILL.md files use `${CLAUDE_SKILL_DIR}/../` which works in both runtimes.

## Installation

```bash
git clone git@github.com:jotafierro/j-flow.git ~/j-flow

# Copilot CLI / Cursor / Codex
bash ~/j-flow/install.sh --copilot

# Claude Code
bash ~/j-flow/install.sh --claude

# Both
bash ~/j-flow/install.sh --all
```
