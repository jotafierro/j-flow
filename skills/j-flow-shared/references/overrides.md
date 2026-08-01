# Override resolution

j-flow ships an opinionated stack, but every template, reference, and domain-agent
definition can be **overridden per target repo** without forking the plugin. A user
runs `/j-flow-eject <asset>`, edits the copy under `.specs/.overrides/`, and the
forward skills use that copy instead of the built-in default.

This file is the single source of truth for how overrides resolve. Skills reference
it; they do not restate the rule.

## The rule

> Before reading a plugin asset at `${CLAUDE_PLUGIN_ROOT}/…/<relative>`, check for an
> override at `.specs/.overrides/<mapped-relative>` (see the table below). If it
> exists, use the override **verbatim** in place of the plugin default. Otherwise use
> the plugin default.

Check for the override once, with a single existence test, at the point of load. Do
not scan `.specs/.overrides/` repeatedly or pre-list it.

## Path mapping

| Plugin default | Override checked first |
|----------------|------------------------|
| `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/<f>` | `.specs/.overrides/templates/<f>` |
| `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/<f>` | `.specs/.overrides/templates/agents/<f>` |
| `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/<f>` | `.specs/.overrides/references/<f>` |
| `${CLAUDE_PLUGIN_ROOT}/agents/<f>` | `.specs/.overrides/agents/<f>` |

## Agent-definition overrides (dispatch)

Forward skills normally dispatch a **named** plugin subagent (e.g. `j-flow-backend`).
To honor an override:

- Before dispatch, check `.specs/.overrides/agents/{agent}.md`.
- If it exists, dispatch a **general-purpose agent** seeded with that file's content as
  its definition/instructions, **instead of** the named plugin subagent.
- If it does not exist, dispatch the named plugin subagent as usual.

Everything else about the dispatch is unchanged: the same task context, the same
`DESIGN.md` forwarding, and the agent's accumulated **memory** at
`.specs/.agents/{agent}.md` are still layered on top. The override replaces the
agent's *definition* (its stack expertise); memory is additive and independent.

## What overrides can and cannot reach

- **Reachable:** templates, references, and the four domain/utility **agent
  definitions**. This is enough to retarget the *specs, conventions, and the code the
  agents write* to a different stack.
- **NOT reachable:** the SKILL.md bodies themselves — including `/j-flow-scaffold`'s
  concrete monorepo generation and `/j-flow-qa`'s stage shell commands
  (`pnpm test`, `flutter test`, …). Those stay opinionated to the default stack.
  A different-stack user brings their own already-scaffolded repo and adapts QA
  expectations manually (layer-aware QA skipping helps). See `docs/adapting-your-stack.md`.
