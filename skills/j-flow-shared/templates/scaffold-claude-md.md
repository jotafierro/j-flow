# {Project Name}

## Stack

- **Backend:** NestJS (apps/api) — MongoDB/Mongoose, JWT auth, `api/v1` global prefix
- **Web:** React + Vite (apps/web) — React Query, Zustand, Tailwind, port 3001
- **E2E:** Playwright (apps/e2e) — headless Chromium, tests web at localhost:3001
- **Mobile:** Flutter (apps/mobile) — Riverpod, GoRouter, dark default
- **UI catalog:** Storybook (packages/ui), Widgetbook (apps/mobile/widgetbook)
- **Shared:** packages/{domain, api-client, config}
- **Build:** Turborepo + pnpm workspaces

## Commands

```bash
# Dev
pnpm --filter @{project}/api dev          # API  → http://localhost:3000
pnpm --filter @{project}/web dev          # Web  → http://localhost:3001
pnpm --filter @{project}/ui storybook     # UI   → http://localhost:6006
cd apps/mobile && flutter run             # Mobile (emulator/device)
cd apps/mobile/widgetbook && flutter run -d chrome  # Widgetbook

# Quality (all packages)
pnpm lint
pnpm type-check
pnpm test                                 # unit tests: jest (api) + vitest (web)

# Targeted tests
pnpm --filter @{project}/api test:e2e     # NestJS e2e (requires running MongoDB)
pnpm --filter @{project}/e2e test         # Playwright e2e (boots web automatically)
cd apps/mobile && flutter test            # Flutter unit tests

# Infrastructure
docker compose up -d                      # MongoDB + Redis + Mailhog
curl http://localhost:3000/api/v1/health  # Verify API
```

## Conventions

- **TypeScript:** `moduleResolution: bundler`, no `baseUrl`. Use `paths` only when needed.
- **Internal deps:** always `workspace:*` protocol — never bare package names.
- **API prefix:** `api/v1` (set via `app.setGlobalPrefix` in `apps/api/src/main.ts`).
- **Theme:** dark default — toggled via `data-theme` on `<html>` (web) / `ThemeMode.dark` (mobile). Tokens in `DESIGN.md`.
- **CSS tokens:** use `var(--color-*)` CSS custom properties — never hardcode hex.
- **No floating promises:** use `void fn()` for top-level async calls (e.g. `void bootstrap()`).

## Key Files

| File | Purpose |
|------|---------|
| `PRODUCT.md` | Product definition and feature backlog source |
| `DESIGN.md` | Design tokens, component specs, color system |
| `CONSTITUTION.md` | Inviolable project principles — enforced by `/j-flow-review` |
| `.specs/` | SDD feature specs (j-flow workflow) |
| `.specs/_system/` | Living system spec — domain behaviors accumulated across features |
| `docker-compose.yml` | Local infrastructure (MongoDB, Redis, Mailhog) |
| `apps/api/.env` | API env vars (not committed — copy from `.env.example`) |
| `apps/web/.env` | Web env vars (not committed) |
| `.env` | Docker Compose vars (not committed) |

## j-flow Workflow

```bash
/j-flow-check              # current feature status
/j-flow-start {slug}       # begin next feature from backlog
```

Specs live in `.specs/{feature}/`. See `.specs/README.md` for backlog.
