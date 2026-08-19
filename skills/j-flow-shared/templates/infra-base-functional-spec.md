# Functional Spec — 01-infra-base
Date: {today}

## Purpose

Establish the monorepo scaffold so all subsequent features have a working, runnable base.

## Feature users

Engineering team — every developer who runs, tests, or builds this project.

## Trigger

/j-flow-scaffold run by the project lead at project initialization.

## Acceptance criteria

### AC-1 — API health endpoint responds

**Given** MongoDB is running via `docker compose up -d`
**When** `curl http://localhost:3000/api/v1/health` is called
**Then:**
- Returns `{"status":"ok","timestamp":"<ISO string>"}` with HTTP 200

### AC-2 — Web app renders

**Given** `pnpm install` has completed
**When** `pnpm --filter @{project}/web dev` is run
**Then:**
- App is reachable at http://localhost:3001
- Page body contains the project title

### AC-3 — Quality gates pass

**Given** the scaffolded monorepo with no user changes
**When** `pnpm lint && pnpm type-check && pnpm test` are run
**Then:**
- All commands exit with code 0
- Zero TypeScript errors across all packages

### AC-4 — Mobile app boots

**Given** Flutter SDK is installed and `flutter pub get` has run
**When** `flutter run` is executed in `apps/mobile`
**Then:**
- App boots on emulator or device
- Home screen displays the project title

### AC-5 — UI catalogs are reachable

**Given** all dependencies are installed
**When** Storybook and Widgetbook are started
**Then:**
- Storybook shows the Welcome story at http://localhost:6006
- Widgetbook catalog renders in Chrome with theme toggle working

## Scope

**In scope:**
- Root monorepo config (turbo, pnpm workspaces, CI, Docker Compose)
- apps/{api, web, e2e, mobile, mobile/widgetbook} and packages/{ui, domain, api-client, config}
- Health endpoint, smoke tests, welcome screens

**Out of scope:**
- Any product feature (auth, users, etc.)
- Production deployment config

## Dependencies

None — this is the foundation feature.

## Edge cases

- apps/admin only scaffolded if user explicitly confirms
- Default theme falls back to asking user if DESIGN.md has no default specified

## Risks

- CLI version drift: scaffolding CLIs run at pinned, known-good versions (never `@latest`) so post-processing steps stay in sync with what the CLI actually generates; pin flutter-version in CI to match pubspec
- Dependency version drift across packages: every dependency shared by two or more workspace packages is declared once in `pnpm-workspace.yaml`'s `catalog` and referenced as `catalog:`, including the versions the official CLIs generate — so a shared version is one edit, not one per package, and the workspace cannot resolve two majors of the same dependency
