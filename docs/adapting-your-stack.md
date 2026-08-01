# Adapting j-flow to your own stack

j-flow ships an opinionated stack (MongoDB + NestJS + React + Flutter). The **gate
workflow itself is stack-agnostic** — specs, plans, gates, and traceability don't care
what you build with. What *is* stack-specific are the domain agents (the code they
write), the scaffold, and the QA stage commands.

You don't have to fork the plugin to change the stack-specific parts. j-flow is
**opinionated by default, adaptable by ejecting**: copy an asset into your repo with
`/j-flow-eject`, edit it, and the forward skills use your copy instead of the built-in
default. Nothing you eject affects anyone else's install.

## What you can and cannot change

| Layer | Stack-specific? | Overridable via eject? |
|-------|-----------------|------------------------|
| Gate workflow, `gate-context.md`, specs, tasks, backlog | No — stack-agnostic | n/a (works as-is for any stack) |
| **Domain agents** (`j-flow-backend`, `j-flow-frontend`, `j-flow-mobile`, `j-flow-devops`, `j-flow-architect`, `j-flow-reviewer`, `j-flow-quality`) | Yes | ✅ Yes |
| **Templates** (spec, technical-spec, tasks, review-guide, product, design, constitution, …) | Partly | ✅ Yes |
| **References** (code-style, agent-scopes, layer-order, gate-rules) | Partly | ✅ Yes |
| `/j-flow-scaffold` monorepo generation | Yes | ❌ No — bring your own repo |
| `/j-flow-qa` stage commands (`pnpm test`, `flutter test`, …) | Yes | ❌ No — see boundary below |

How resolution works is documented once in
[`skills/j-flow-shared/references/overrides.md`](../skills/j-flow-shared/references/overrides.md):
before reading any built-in asset, a skill checks `.specs/.overrides/<same-path>` and
uses your copy if it exists.

## The adapt workflow

```bash
/j-flow-eject agents/j-flow-backend.md        # copies it to .specs/.overrides/agents/j-flow-backend.md
# edit .specs/.overrides/agents/j-flow-backend.md for your stack
# commit the override; from now on /j-flow-build uses it
```

`/j-flow-eject` with no argument lists everything you can eject. One asset per run; it
never overwrites an existing override.

## Worked example: swap the backend from NestJS to Django

1. **Eject the backend agent and the technical-spec template:**
   ```bash
   /j-flow-eject agents/j-flow-backend.md
   /j-flow-eject templates/technical-spec.md
   ```
2. **Rewrite `.specs/.overrides/agents/j-flow-backend.md`** for your stack: replace the
   NestJS + Mongoose expertise with Django + Django REST Framework + your ORM, the test
   tooling (pytest instead of Jest/supertest), and the file/layout conventions. Keep the
   agent's *contract* the same — it still owns the data/service/api layers and writes
   unit tests in the same pass.
3. **Adjust `.specs/.overrides/templates/technical-spec.md`** so the architecture
   sections match your stack's concepts (models/serializers/viewsets instead of
   schemas/services/controllers).
4. Optionally eject `references/code-style.md` and `references/agent-scopes.md` to
   restate the conventions and the layer→agent mapping for your stack.
5. Run the flow normally: `/j-flow-spec technical` and `/j-flow-build` now use your
   overrides.

The same pattern applies to swapping the frontend (`agents/j-flow-frontend.md`) or
mobile (`agents/j-flow-mobile.md`) agent.

## The honest boundary

Overrides reach the **agents, templates, and references** — enough to retarget *what
the agents know and the code they write*. They do **not** reach:

- **`/j-flow-scaffold`.** It generates a specific NestJS + React + Flutter monorepo. A
  different-stack project should **skip scaffold** and bring its own already-set-up
  repo. Run `/j-flow-project` to define PRODUCT/DESIGN/agents, then go straight to
  `/j-flow-start` for your first feature.
- **`/j-flow-qa` stage commands.** The 7 QA stages run concrete shell commands
  (`pnpm lint`, `pnpm test`, `flutter test`, `playwright test`, …). These live in the
  skill body and aren't overridable. Layer-aware QA skipping helps (stages skip for
  layers you don't touch), but if your stack's test commands differ you'll run the
  equivalent checks yourself until a future release makes QA commands configurable.

This boundary is deliberate: j-flow stays a sharp, opinionated tool for its default
stack, and becomes *adaptable* — not a generic, stack-parametrized generator.
