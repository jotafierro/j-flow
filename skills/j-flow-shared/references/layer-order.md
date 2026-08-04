# Build Layer Order

Fixed implementation order for j-flow. Applied by `/j-flow-plan` (task grouping) and `/j-flow-build` (execution sequencing).

| Layer | Type | Content | Agent |
|-------|------|---------|-------|
| 1 | `data` | Mongoose schemas + DTOs + indexes | j-flow-backend |
| 2 | `service` | NestJS services + business logic + unit tests | j-flow-backend |
| 3 | `api` | Controllers + guards + pipes + NestJS E2E specs (`*.e2e-spec.ts`) | j-flow-backend |
| 4 | `ui` | React components + hooks + pages + Storybook stories | j-flow-frontend |
| 5 | `mobile` | Flutter screens + widgets + providers + Widgetbook + `integration_test` | j-flow-mobile |
| 6 | `infra` | Docker + CI/CD + deployment config + env vars | j-flow-devops |

## Execution order

`1 → 2 → 3 → 4 → 5 → 6`

Layers run sequentially. Each layer commits independently. The api layer (3) must complete before ui (4) or mobile (5) start, because they consume API contracts.

## Harness layers (no build row)

Some STACK layers are not build layers — they toggle a test/tooling harness rather than adding an implementation row. They get **no numbered row, no renumber, no dedicated build agent**.

- **`e2e`** — the Playwright end-to-end harness (`apps/e2e`). Owned by `j-flow-quality` (the qa phase, always created), not a build agent. Runs against the local web app when `web` is present, else an external `BASE_URL` target. Its tests live in `apps/e2e/tests/*.spec.ts` and run in QA Stage 5, gated on `has_e2e`.
- **`cli`** — a TypeScript commander app (`apps/cli`, or the repo root in `bare-single-package`). Owned by **`j-flow-cli`** (a dedicated light agent — no NestJS/Mongoose), which runs during `/j-flow-build` for `cli`-layer tasks. It is a client of the api contract like ui/mobile — when `api` is present it consumes `packages/api-client`; it runs sequentially in the client tier and takes **no numbered build-order row and no parallel-dispatch entry**. Unit tests (vitest) live in `apps/cli/**/*.test.ts` (or `src/**/*.test.ts` when bare).

## Skipping layers

Layers with no tasks in `tasks.json` are skipped. Document the omission in `gate-context.md` after build:

```
[BUILD] completed 2026-06-12
  → layers: data ✓ service ✓ api ✓ ui ✓ mobile - infra -
```

Use `-` for skipped layers, `✓` for completed layers.

## Test placement

| Test type | Lives in | Written by |
|-----------|----------|------------|
| Unit (backend) | `apps/api/src/**/*.spec.ts` | j-flow-backend (service layer) |
| Unit (frontend) | `packages/ui/src/**/*.test.tsx`, `apps/web/**/*.test.tsx` | j-flow-frontend (ui layer) |
| Unit (mobile) | `apps/mobile/test/**/*_test.dart` | j-flow-mobile (mobile layer) |
| NestJS E2E | `apps/api/test/*.e2e-spec.ts` | j-flow-backend (api layer) |
| Flutter integration | `apps/mobile/integration_test/*_test.dart` | j-flow-mobile (mobile layer) |
| Playwright E2E | `apps/e2e/tests/*.spec.ts` | j-flow-quality (qa phase) |
| Storybook stories | `packages/ui/src/**/*.stories.tsx` | j-flow-frontend (ui layer) |
| Widgetbook entries | `apps/mobile/widgetbook/lib/**/*.dart` | j-flow-mobile (mobile layer) |
