# Agent Scopes

What each agent reads from agent memory, what it writes back via `/j-flow-finish`.

## j-flow-architect

- **Activated by:** `/j-flow-spec technical`
- **Reads memory:** architectural patterns, API conventions, data model conventions, cross-cutting concerns
- **Writes memory:** new architectural decisions or patterns that future features should follow

## j-flow-backend

- **Activated by:** `/j-flow-build` for `data`, `service`, `api` layers
- **Reads memory:** module structure, service patterns, DTO conventions, Mongoose conventions, E2E test patterns
- **Writes memory:** new module patterns, DTO shapes, query patterns, NestJS E2E setup discovered

## j-flow-frontend

- **Activated by:** `/j-flow-build` for `ui` layer
- **Reads memory:** component patterns, state management, form patterns, API client usage, Storybook conventions
- **Writes memory:** new component patterns, Zustand store structures, custom hooks, Storybook conventions

## j-flow-mobile

- **Activated by:** `/j-flow-build` for `mobile` layer
- **Reads memory:** Riverpod patterns, GoRouter setup, Dio config, widget conventions, Widgetbook patterns
- **Writes memory:** new Riverpod patterns, navigation flows, widget conventions

## j-flow-devops

- **Activated by:** `/j-flow-build` for `infra` layer
- **Reads memory:** CI workflow conventions, Docker patterns, deployment targets, env var inventory
- **Writes memory:** new CI jobs, env vars, deployment config changes

## j-flow-quality

- **Activated by:** `/j-flow-qa`
- **Reads memory:** test framework conventions, NestJS E2E setup, Playwright setup, Flutter integration setup, coverage thresholds
- **Writes memory:** new test setup patterns, helpers, fixtures discovered

## j-flow-reviewer

- **Activated by:** `/j-flow-review`
- **Reads memory:** repo-specific review rules, known anti-patterns, security rules
- **Writes memory:** ONLY by `/j-flow-review` (not by `/j-flow-finish`) — new conformance rules from drift discovered

**Important:** All agent memory files live at `.specs/.agents/{agent-name}.md`. They are populated by `/j-flow-project` (initial templates) and updated by `/j-flow-finish` (after each feature, except j-flow-reviewer which only updates from `/j-flow-review`).

---

## Parallel Dispatch Rules

By default, `/j-flow-build` runs layers **sequentially** (1 → 2 → 3 → 4 → 5 → 6) and dispatches one agent at a time.

### When parallel dispatch is allowed

Two agents may run in parallel only when their layers have no dependency on each other. Looking at the fixed layer order:

| Parallel pair | Condition |
|--------------|-----------|
| `ui` (layer 4) + `mobile` (layer 5) | Both depend only on `api` (layer 3). Neither depends on the other. May run in parallel once layer 3 is committed. |

All other layer pairs have sequential dependencies and must not run in parallel.

### How to dispatch in parallel (j-flow-build)

When `ui` and `mobile` both have tasks and `api` is committed:

1. Dispatch `j-flow-frontend` (ui tasks) and `j-flow-mobile` (mobile tasks) as concurrent sub-agents via the `superpowers:dispatching-parallel-agents` skill.
2. Wait for both to complete before committing.
3. Commit both layers together:

```bash
git add .
git commit -m "feat({slug}): implement ui + mobile layers (parallel)

Tasks: {ui-task-ids}, {mobile-task-ids}
ACs: {ac-ids}"
```

4. In gate-context.md, mark both layers as completed on the same line:
```
[BUILD] completed {date}
  → layers: data ✓ service ✓ api ✓ ui ✓ (parallel) mobile ✓ (parallel) infra ✓
```

### When NOT to parallelize

- Never parallelize `data`, `service`, `api` — each depends on the previous.
- Never parallelize `infra` with anything — it may touch shared files (`.env.example`, CI config) that other agents also read.
- If either `ui` or `mobile` has no tasks, run the one that does sequentially (no benefit to parallel dispatch).
