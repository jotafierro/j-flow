# Scaffold — Review Mode

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded by `/j-flow-scaffold --review`. Read this instead of the generate-mode Step 4 layer references — review mode never writes files.

Read-only. No file writes.

**Detection:** Read existing files and build `detection_map`. Parse `stack_layers` from `PRODUCT.md`'s `**Layers:**` line the same way Generate mode does (Step 1) — default to all four if absent. For any component whose layer is not in `stack_layers`, report it as `— not in scope (Layers)` instead of `✗ missing`; do not suggest generating it. Print component statuses:

```
j-flow-scaffold — Stack Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component                               Status     Notes
─────────────────────────────────────────────────────────
Root / Monorepo
  package.json                          ✓ present
  turbo.json                            ✓ present
  pnpm-workspace.yaml                   ✓ present
  docker-compose.yml                    ✓ present
  .github/workflows/ci.yml              ✓ present
  .env.example                          ✓ present
  tsconfig.json                         ✓ present
  .npmrc                                ✓ present

apps/api (NestJS)
  apps/api/package.json                 ✓ present
  apps/api/src/health/health.controller.ts  ⚠ outdated   (missing health controller)
  apps/api/src/main.ts                  ✓ present
  apps/api/src/app.module.ts            ✓ present
  apps/api (API docs)
    REST: @nestjs/swagger in package.json     ✓ present / ✗ missing
    GraphQL: @nestjs/graphql in package.json  ✓ present / ✗ missing
    (detected mode from PRODUCT.md `**API Style:**` field)

apps/web (React + Vite)
  apps/web/package.json                 ✓ present
  apps/web/src/vite-env.d.ts            ⚠ outdated   (missing css module declaration)
  Styling: {tailwind|plain-css}          (detected from PRODUCT.md `**Styling:**` field)
    Tailwind: @tailwindcss/vite in package.json + used in vite.config.ts   ✓ present / ✗ missing

apps/admin (React + Vite)
  detected from PRODUCT.md: {yes/no}
  apps/admin/package.json               ✓ present / ✗ missing

apps/e2e (Playwright)
  apps/e2e/package.json                 ✓ present
  apps/e2e/playwright.config.ts         ✓ present

apps/mobile (Flutter)
  apps/mobile/pubspec.yaml              ✓ present
  apps/mobile/lib/main.dart             ✓ present
  apps/mobile/widgetbook/               ✓ present

packages/ui (Storybook)
  packages/ui/package.json              ✓ present
  packages/ui/.storybook/               ✓ present

packages/domain                         ✓ present
packages/api-client                     ✓ present
packages/config                         ✓ present

README.md                               ✓ present / ⚠ outdated
CONSTITUTION.md                         ✓ present / ✗ missing
.specs/01-infra-base/                   ✓ present / ⚠ outdated
.specs/02-observability/                ✓ present / [ ] not in backlog (optional Phase 0)
.specs/04-design-polish/                ✓ present / [ ] not in backlog (optional Phase 0)
.specs/05-deploy/                       ✓ present / [ ] not in backlog (optional Phase 0)
.specs/06-legal-pages/                  ✓ present / [ ] not in backlog (optional Phase 0)
.specs/_system/                         ✓ present / ✗ missing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Outdated detection rules:**
- `docker-compose.yml` missing → `✗ missing` only if `has_api`; otherwise `— not in scope (Layers)`
- `apps/api/package.json` exists but no `@nestjs/mongoose` in deps → ⚠ outdated
- `apps/api/src/health/health.controller.ts` missing → ⚠ outdated
- `PRODUCT.md` `**API Style:** rest` but no `@nestjs/swagger` in `apps/api/package.json` → ✗ missing
- `PRODUCT.md` `**API Style:** graphql` but no `@nestjs/graphql` in `apps/api/package.json` → ✗ missing
- `apps/web/package.json` exists but no `vite-env.d.ts` with CSS declaration → ⚠ outdated
- `PRODUCT.md` `**Styling:** tailwind` but no `@tailwindcss/vite` in `apps/web/package.json` (or `apps/admin/package.json` if `has_admin`) → ✗ missing
- `PRODUCT.md` `**Styling:** plain-css` but `tailwindcss` present in `apps/web/package.json` → ⚠ outdated (unused dependency — remove or update `**Styling:**`)
- `README.md` missing → ⚠ outdated
- `CONSTITUTION.md` missing → ✗ missing (run `/j-flow-project` or create manually)
- `.specs/01-infra-base/` missing → ⚠ outdated
- `.specs/02-observability/` present but not in `.specs/README.md` → warn (optional — can be added via `/j-flow-project --update`)
- `.specs/04-design-polish/` present but not in `.specs/README.md` → warn (optional — can be added via `/j-flow-project --update`)
- `.specs/05-deploy/` present but not in `.specs/README.md` → warn (optional — can be added via `/j-flow-project --update`)
- `.specs/06-legal-pages/` present but not in `.specs/README.md` → warn (optional — can be added via `/j-flow-project --update`)
- `.specs/_system/` missing → ✗ missing

After the table, print:
```
Suggestions:
  {list any missing or outdated items with concrete actions}

Run /j-flow-scaffold to apply these changes.
```

Stop. Do not write any files.
