# j-flow — Claude Code Plugin

Gate-based Spec-Driven Development workflow for MongoDB + NestJS + React + Flutter.

## Validation

```bash
node tests/validate.js   # structural tests (no LLM needed)
```

## Skill structure

Each skill lives at `skills/{skill-name}/SKILL.md`.
Each agent lives at `agents/{agent-name}.md`.
Shared templates at `skills/j-flow-shared/templates/`.
Shared references at `skills/j-flow-shared/references/`.

## Installation

```bash
git clone git@github.com:jotafierro/j-flow.git ~/j-flow
claude plugin marketplace add ~/j-flow --scope user
claude plugin install j-flow
```
