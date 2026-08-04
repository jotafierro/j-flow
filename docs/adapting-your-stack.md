# Adapting j-flow to your own stack

j-flow ships an opinionated stack (MongoDB + NestJS + React + Flutter). The **gate
workflow itself is stack-agnostic** — specs, plans, gates, and traceability don't care
what you build with. What *is* stack-specific are the domain agents (the code they
write), the scaffold, and the QA stage commands.

You don't have to fork the plugin to change the stack-specific parts. j-flow is
**opinionated by default, adaptable by ejecting**: copy an asset into your repo with
`/j-flow-eject`, edit it, and the forward skills use your copy instead of the built-in
default. Nothing you eject affects anyone else's install.

> **Two different axes — don't confuse them.** *Composing* a subset of the built-in
> stack (below) needs no eject — you just select fewer layers. *Adapting* to a
> **foreign** stack (React→Vue, NestJS→Django) is the eject story in the rest of this
> doc. Composition keeps every layer's opinionated framework; adaptation replaces it.

## Using a subset of the stack (no eject needed)

Every layer is independently selectable via the `**Layers:**` line in `PRODUCT.md`
(set by `/j-flow-project`). Valid values: `web`, `api`, `mobile`, `admin`, `e2e`
(and `cli`, when that layer ships). Use one alone or any combination — `mobile` only,
`admin` only, `e2e` only, `e2e,api`, and so on. Omitted layers are simply not scaffolded.

**The scaffold right-sizes itself to your selection** via a derived `scaffold_profile`:

| Selection | Profile | What you get |
|-----------|---------|--------------|
| Any selection with ≥1 TypeScript layer | `minimal-workspace` (default) | pnpm-workspace + turbo + `packages/config`/`domain` + your apps under `apps/<layer>/`. Heavy pieces (`packages/ui`, `api-client`, docker, per-layer CI) appear only when their layer does. Scales to the full monorepo as you add layers. |
| `mobile` as the only layer | `flutter-only` | Just `apps/mobile/` Flutter + widgetbook + a Flutter CI job. **No** TypeScript workspace at all. |

**`e2e` is a first-class layer, not tied to `web`.** With `web` present, Playwright boots
the local dev server automatically. Without `web` (e2e-only, or e2e + api/mobile), it
runs against an **external** target — set `BASE_URL` (a staging or deployed URL):

```bash
BASE_URL=https://staging.example.com pnpm --filter @your-project/e2e test
```

That is the "standalone e2e test project against an external target" case. (Note: the
`e2e` layer is Playwright web/HTTP testing. A CLI's own end-to-end tests are plain
unit-style tests inside the `cli` layer — the two compose, but Playwright doesn't drive
a CLI.)

### Growing into more layers later

Start with one layer and add others **without restructuring**. Because every layer lives
under `apps/<layer>/` from day one, growth is purely additive:

```bash
# 1. add the layer to PRODUCT.md's **Layers:** line (e.g. cli  →  cli, web, mobile)
# 2. re-run project sync — backfills agent memory + shows the scaffold delta
/j-flow-project --update
# 3. generate the newly-included app/packages/CI (existing code is never moved or rewritten)
/j-flow-scaffold
```

Root files are carry-forward (a re-run never clobbers your hand-edits); CI additions are
printed for you to merge rather than rewritten.

> **Live smoke before you rely on a profile.** j-flow is markdown instructions a model
> executes — there's no automated test of generated output. After scaffolding an unusual
> selection (mobile-only, e2e-only, a growth step), run the app/tests once to confirm the
> shape is right.

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
