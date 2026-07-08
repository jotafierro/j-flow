# {Project Name}

{Tagline from PRODUCT.md}

## Stack

- **Backend:** NestJS 11 + Mongoose (MongoDB)
- **Web:** React + Vite + React Query + Zustand
- **Mobile:** Flutter + Riverpod + GoRouter
- **E2E:** Playwright
- **UI Catalog:** Storybook (React), Widgetbook (Flutter)
- **Infra:** Docker Compose + GitHub Actions + Railway + Vercel

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Flutter dependencies
cd apps/mobile && flutter pub get
cd ../mobile/widgetbook && flutter pub get
cd ../../..

# 3. Copy env file
cp .env.example .env

# 4. Start services (MongoDB, Redis, Mailhog)
docker compose up -d
```

## Run

| Service | Command | URL |
|---------|---------|-----|
| API | `pnpm --filter @{project}/api dev` | http://localhost:3000 |
| Web | `pnpm --filter @{project}/web dev` | http://localhost:3001 |
| Admin | `pnpm --filter @{project}/admin dev` | http://localhost:3002 |
| Mobile | `cd apps/mobile && flutter run` | device/emulator |
| Storybook | `pnpm --filter @{project}/ui storybook` | http://localhost:6006 |
| Widgetbook | `cd apps/mobile/widgetbook && flutter run -d chrome` | browser |
| Mailhog UI | (started by docker compose) | http://localhost:8025 |
| Storybook docs | see [docs/STORYBOOK.md](docs/STORYBOOK.md) | |
| Widgetbook docs | see [docs/WIDGETBOOK.md](docs/WIDGETBOOK.md) | |
| Playwright docs | see [docs/PLAYWRIGHT.md](docs/PLAYWRIGHT.md) | |

## Verify it works

```bash
curl http://localhost:3000/api/v1/health
# → {"status":"ok","timestamp":"..."}
```

## Tests

```bash
pnpm test                                    # all unit tests
pnpm --filter @{project}/api test:e2e        # NestJS E2E
pnpm --filter @{project}/e2e test            # Playwright E2E
cd apps/mobile && flutter test               # Flutter unit
cd apps/mobile && flutter drive --target=integration_test/app_test.dart  # Flutter integration
```

## j-flow workflow

This project uses `j-flow` for Spec-Driven Development. See [.specs/README.md](.specs/README.md) for the feature backlog.

```
/j-flow-check               # current feature status
/j-flow-start {slug}        # begin next feature
```
