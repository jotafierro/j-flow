---
name: j-flow-scaffold
description: Monorepo scaffolder for j-flow projects (MongoDB + NestJS + React/Vite + Flutter + Widgetbook + Storybook). Generate mode detects existing files, shows what will be created/skipped, writes the full stack, marks .specs/01-infra-base/ as complete (scaffold IS the implementation of that feature), and commits everything. Review mode prints a status table of all components with no file writes.
allowed-tools: Read Write Bash Glob Grep
---

# /j-flow-scaffold

## Arguments

`$ARGUMENTS`: empty (generate mode) | `--review` (review mode only — no file writes)

## Prerequisites

- `PRODUCT.md` exists in the current directory (run `/j-flow-project` first)
- Current directory is a git repo

---

## Detection

Before doing anything, read these files if they exist and build `detection_map`:

**Root files:**
- `package.json` — exists?
- `turbo.json` — exists?
- `pnpm-workspace.yaml` — exists?
- `docker-compose.yml` — exists?
- `.github/workflows/ci.yml` — exists?
- `.env.example` — exists?
- `tsconfig.json` — exists?
- `.npmrc` — exists?

**Apps:**
- `apps/api/package.json` — exists? check `dependencies` for `@nestjs/core` → `api: nestjs`
- `apps/web/package.json` — exists? check `dependencies` for `react` and `vite` → `web: react-vite`
- `apps/admin/package.json` — exists? → `admin: present`
- `apps/e2e/package.json` — exists? + `apps/e2e/playwright.config.ts` exists? → `e2e: playwright`
- `apps/mobile/pubspec.yaml` — exists? → `mobile: flutter`
- `apps/mobile/widgetbook/pubspec.yaml` — exists? → `widgetbook: present`

**Packages:**
- `packages/ui/.storybook/` — exists? → `storybook: present`
- `packages/ui/package.json` — exists?
- `packages/domain/package.json` — exists?
- `packages/api-client/package.json` — exists?
- `packages/config/tsconfig.base.json` — exists?

**PRODUCT.md analysis:**
Read `PRODUCT.md`. Scan the **Audience** and **Core Features** sections for keywords: "admin", "admin panel", "back-office", "dashboard". Set `detected_admin: true` if any found, `detected_admin: false` otherwise.

**Project name:** read `PRODUCT.md` **Name** field. Use as `{project}` slug (lowercase-hyphenated, e.g. "My App" → "my-app"). Keep original casing as `{Project Name}` for display strings in source files.

---

## Mode: Review (`--review`)

Read-only. No file writes.

Print a status table for all components:

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
  apps/api/tsconfig.json                ✓ present
  apps/api/nest-cli.json                ✗ missing
  apps/api/src/main.ts                  ✓ present
  apps/api/src/app.module.ts            ✓ present
  apps/api/Dockerfile                   ✓ present

apps/web (React + Vite)
  apps/web/package.json                 ✓ present
  apps/web/tsconfig.json                ✓ present
  apps/web/vite.config.ts               ✓ present
  apps/web/index.html                   ✓ present
  apps/web/src/main.tsx                 ✓ present
  apps/web/src/App.tsx                  ✓ present
  apps/web/Dockerfile                   ✓ present

apps/admin (React + Vite)
  detected from PRODUCT.md: {yes/no}
  apps/admin/package.json               ✓ present / ✗ missing

apps/e2e (Playwright)
  apps/e2e/package.json                 ✓ present
  apps/e2e/playwright.config.ts         ✓ present
  apps/e2e/global-setup.ts              ✓ present

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

.specs/01-infra-base/
  meta.md                               ✓ complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Fill in actual statuses from `detection_map`. Show ✓ present / ✗ missing for each file. For admin, always show what was detected from PRODUCT.md, plus whether the files are present.

After the table, print:
```
Suggestions:
  {list any missing files that should be generated}

Run /j-flow-scaffold to apply these changes.
```

Stop. Do not write any files.

---

## Mode: Generate (no flag)

### Step 1: Detect and ask about admin

Show the detection result and ask:

```
Admin panel detection:
  PRODUCT.md keywords found: {yes — keywords: "admin", "dashboard" / no}
  apps/admin/ already exists: {yes / no}

Include apps/admin in the scaffold?
  1. Yes — include admin app (port 3002)
  2. No — skip admin

Enter 1 or 2:
```

Set `wants_admin: true` if user answers 1, `wants_admin: false` if user answers 2.

### Step 2: Build file manifest

Enumerate every file in the catalog below. For each:
- Check if it already exists on disk
- Exists → `status: skip`
- Missing → `status: generate`

For `apps/admin/` files: only include in manifest if `wants_admin: true`.

### Step 3: Show summary and confirm

Show:
```
Ready to scaffold:

  Will generate ({N} files):
    package.json
    turbo.json
    ...

  Will skip ({M} files — already exist):
    apps/api/package.json
    ...

  1. Confirm — generate files now
  2. Cancel
```

Ask user to enter 1 or 2. On 2: stop.

### Step 4: Write all files with `generate` status

Write every file marked `generate`. Full content catalog is below. Never write files with `skip` status.

### Step 5: Create .specs/01-infra-base/ and mark complete

Create `.specs/01-infra-base/` directory if it does not exist.

**Write `.specs/01-infra-base/meta.md`:**

```
feature: 01-infra-base
branch: main
created_at: {today ISO date}
stack: MongoDB + NestJS + React + Flutter

functional_status: approved
functional_approved_at: {today ISO date}

technical_status: approved
technical_approved_at: {today ISO date}

tasks_status: approved
tasks_approved_at: {today ISO date}

build_status: completed
build_completed_at: {today ISO date}

qa_status: green
qa_completed_at: {today ISO date}

review_status: approved
review_approved_at: {today ISO date}

finish_status: completed
finish_completed_at: {today ISO date}

current_phase: done
```

**Write `.specs/01-infra-base/gate-context.md`:**

```
# Gate Context — 01-infra-base

> Append-only. Each phase adds one block. Subsequent skills read this file first.

[FUNCTIONAL SPEC] approved {today ISO date}
  → scaffold IS the implementation of 01-infra-base; no separate spec flow required

[TECHNICAL SPEC] approved {today ISO date}
  → Turborepo monorepo + pnpm workspaces; NestJS API, React/Vite web{, React/Vite admin if wants_admin}, Playwright e2e, Flutter mobile + Widgetbook, packages/ui + Storybook, packages/domain, packages/api-client, packages/config
  → Docker Compose: mongo:7, redis:7, mailhog/mailhog
  → GitHub Actions CI: Node test job + Flutter job

[TASK PLAN] approved {today ISO date}
  → tasks executed directly by /j-flow-scaffold

[BUILD] completed {today ISO date}
  → {N} files generated by /j-flow-scaffold

[QA] green {today ISO date}
  → structural scaffolding verified; pnpm install + flutter pub get required before running tests

[REVIEW] approved {today ISO date}
  → scaffold output reviewed; ready for 02-design-system
```

**Write `.specs/01-infra-base/functional-spec.md`:**

```markdown
# Functional Spec — 01-infra-base

> This feature was implemented directly by /j-flow-scaffold. No spec-first flow was run.

## What Was Scaffolded

- Turborepo monorepo root with pnpm workspaces (`apps/*`, `packages/*`)
- `apps/api` — NestJS 11 app with Mongoose (MongoDB), ValidationPipe, JWT-ready structure
- `apps/web` — React + Vite SPA with Tailwind CSS, React Query, Zustand, Zod
{- `apps/admin` — React + Vite admin SPA on port 3002 (only if wants_admin)}
- `apps/e2e` — Playwright test suite targeting web app
- `apps/mobile` — Flutter app with Riverpod + GoRouter
- `apps/mobile/widgetbook` — Widgetbook component explorer for Flutter
- `packages/ui` — React design system with Storybook
- `packages/domain` — Shared TypeScript domain types (Cents, ID, ISODate, etc.)
- `packages/api-client` — Typed API client stub
- `packages/config` — Shared tsconfig.base.json and ESLint config
- `docker-compose.yml` — MongoDB, Redis, Mailhog services
- `.github/workflows/ci.yml` — GitHub Actions CI (Node + Flutter)

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | Root monorepo with turbo.json + pnpm-workspace.yaml | ✓ |
| AC-2 | NestJS API boots and exposes /api/v1 | ✓ |
| AC-3 | React/Vite web renders at localhost:3001 | ✓ |
| AC-4 | Playwright config targets localhost:3001 | ✓ |
| AC-5 | Flutter app runs on device/emulator | ✓ |
| AC-6 | Widgetbook app builds | ✓ |
| AC-7 | Storybook runs at localhost:6006 | ✓ |
| AC-8 | Docker Compose starts MongoDB, Redis, Mailhog | ✓ |
| AC-9 | GitHub Actions CI passes on clean checkout | ✓ |
```

**Write `.specs/01-infra-base/technical-spec.md`:**

```markdown
# Technical Spec — 01-infra-base

> Generated by /j-flow-scaffold. Describes the actual scaffold output.

## Architecture

Turborepo monorepo managed with pnpm@9 workspaces.

### Apps

| App | Framework | Port | Notes |
|-----|-----------|------|-------|
| `apps/api` | NestJS 11 + Mongoose | 3000 | setGlobalPrefix api/v1, ValidationPipe |
| `apps/web` | React 18 + Vite | 3001 | Tailwind, React Query, Zustand, Zod |
{| `apps/admin` | React 18 + Vite | 3002 | Admin panel — only if wants_admin |}
| `apps/e2e` | Playwright | — | Targets web at localhost:3001 |
| `apps/mobile` | Flutter 3.24+ | device | Riverpod v2, GoRouter v14 |
| `apps/mobile/widgetbook` | Widgetbook 3 | device | Component explorer |

### Packages

| Package | Purpose |
|---------|---------|
| `packages/ui` | React components + Storybook |
| `packages/domain` | Branded types: Cents, ID, ISODate, ISOCurrency |
| `packages/api-client` | ApiClient class stub |
| `packages/config` | Shared tsconfig.base.json + ESLint flat config |

### Infrastructure

- **MongoDB** — mongo:7, port 27017, volume `mongo_data`
- **Redis** — redis:7, port 6379
- **Mailhog** — mailhog/mailhog, SMTP :1025, UI :8025

### CI (GitHub Actions)

- `test` job: ubuntu, MongoDB service, pnpm install, lint, type-check, test
- `flutter` job: conditional on `apps/mobile/pubspec.yaml`, flutter test

## Key Decisions

- pnpm@9 (not npm/yarn) — enforced via `.npmrc`
- Node >=20 engines constraint
- `moduleResolution: bundler` in tsconfig.base.json — required for ESNext + Vite interop
- `experimentalDecorators: true` + `emitDecoratorMetadata: true` — required for NestJS
- Storybook 8 with `@storybook/react-vite` framework
- Widgetbook 3 for Flutter component isolation
- React + Vite (not Next.js) — SPA with client-side routing
```

**Write `.specs/01-infra-base/README.md`:**

```markdown
# Monorepo & Infra Base

**Slug:** 01-infra-base
**Branch:** main
**PR:** N/A (scaffold committed directly)
**Merged:** {today ISO date}

## Summary

Full monorepo scaffolded by /j-flow-scaffold. Sets up Turborepo + pnpm workspaces with NestJS API, React/Vite web, Playwright E2E, Flutter mobile + Widgetbook, React UI package with Storybook, shared domain/api-client/config packages, Docker Compose (MongoDB + Redis + Mailhog), and GitHub Actions CI.

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | Turborepo root with pnpm workspaces | ✓ |
| AC-2 | NestJS API with global prefix + ValidationPipe | ✓ |
| AC-3 | React/Vite web at port 3001 | ✓ |
| AC-4 | Playwright config targeting web | ✓ |
| AC-5 | Flutter + Riverpod + GoRouter | ✓ |
| AC-6 | Widgetbook component explorer | ✓ |
| AC-7 | Storybook at port 6006 | ✓ |
| AC-8 | Docker Compose: MongoDB, Redis, Mailhog | ✓ |
| AC-9 | GitHub Actions CI | ✓ |

## Files Added / Modified

| File | Change |
|------|--------|
| `package.json` | Turborepo root |
| `turbo.json` | Task pipeline |
| `pnpm-workspace.yaml` | Workspace definition |
| `apps/api/` | NestJS app |
| `apps/web/` | React + Vite app |
| `apps/e2e/` | Playwright suite |
| `apps/mobile/` | Flutter app + Widgetbook |
| `packages/ui/` | React design system + Storybook |
| `packages/domain/` | Shared domain types |
| `packages/api-client/` | API client stub |
| `packages/config/` | Shared configs |
| `docker-compose.yml` | Local dev services |
| `.github/workflows/ci.yml` | CI pipeline |

## Patterns Introduced

- pnpm workspaces with `apps/*` + `packages/*` glob pattern
- Turborepo task pipeline: build depends on ^build, dev is persistent + no-cache
- NestJS global prefix `api/v1` + ValidationPipe with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- React + Vite SPA with workspace package imports via `vite.config.ts` resolve.alias
- Playwright `globalSetup` pattern for test infrastructure

## Test Coverage

- Unit: `pnpm --filter @{project}/api test`
- E2E (NestJS): `pnpm --filter @{project}/api test:e2e`
- E2E (Playwright): `pnpm --filter @{project}/e2e test`
- Mobile: `flutter test` (from `apps/mobile/`)
- Widgetbook: `flutter run` (from `apps/mobile/widgetbook/`)
```

### Step 6: Update .specs/README.md

Read `.specs/README.md`. Find the row for `01-infra-base`. Change its status symbol from `[ ]` to `[✓]`. Write the updated file.

### Step 7: Commit

```bash
git add .
git commit -m "chore: j-flow-scaffold — {summary of stack scaffolded}"
```

Where `{summary of stack scaffolded}` describes what was generated, e.g.:
`NestJS + React/Vite + Flutter + Widgetbook + Storybook + MongoDB + Redis + GitHub CI`

### Step 8: Print success report

```
✓ {N} files generated
✓ .specs/01-infra-base/ marked as complete in backlog
✓ Committed: chore: j-flow-scaffold — {summary}

Next steps:
  1. pnpm install                              (project root)
  2. cd apps/mobile && flutter pub get
  3. cd apps/mobile/widgetbook && flutter pub get
  4. docker compose up -d                      (MongoDB, Redis, Mailhog)
  5. /j-flow-start 02-design-system           (begin next foundation feature)
```

---

## File Content Catalog

Write each file with the following content. Replace `{project}` with the lowercase-hyphenated project name from `PRODUCT.md`. Replace `{Project Name}` with the display name.

---

### Root files

**`package.json`**
```json
{
  "name": "{project}",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {}
  }
}
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`.gitignore`**
```
node_modules/
dist/
.turbo/
.env
.env.local
.env.*.local
*.log
coverage/
.dart_tool/
build/
playwright-report/
test-results/
.DS_Store
```

**`docker-compose.yml`**
```yaml
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  mongo_data:
```

**`.github/workflows/ci.yml`**
```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  flutter:
    runs-on: ubuntu-latest
    if: ${{ hashFiles('apps/mobile/pubspec.yaml') != '' }}

    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.24.x"
          channel: "stable"

      - run: flutter pub get
        working-directory: apps/mobile

      - run: flutter test
        working-directory: apps/mobile
```

**`.env.example`**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/{project}
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
VITE_API_URL=http://localhost:3000/api/v1
```

**`tsconfig.json`** (root)
```json
{
  "extends": "./packages/config/tsconfig.base.json"
}
```

**`.npmrc`**
```
auto-install-peers=true
strict-peer-dependencies=false
```

---

### apps/api (NestJS)

**`apps/api/package.json`**
```json
{
  "name": "@{project}/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/mongoose": "^11.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "mongoose": "^8.4.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.5",
    "typescript": "^5.4.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

**`apps/api/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "module": "commonjs",
    "moduleResolution": "node"
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`apps/api/nest-cli.json`**
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

**`apps/api/src/main.ts`**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
```

**`apps/api/src/app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/{project}',
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

**`apps/api/test/.gitkeep`**
(empty file)

**`apps/api/Dockerfile`**
```dockerfile
# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

---

### apps/web (React + Vite)

**`apps/web/package.json`**
```json
{
  "name": "@{project}/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.6.0",
    "@tanstack/react-query": "^5.45.0",
    "@{project}/api-client": "workspace:*",
    "@{project}/domain": "workspace:*",
    "@{project}/ui": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

**`apps/web/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**`apps/web/vite.config.ts`**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
});
```

**`apps/web/index.html`**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{Project Name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`apps/web/src/main.tsx`**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**`apps/web/src/App.tsx`**
```typescript
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{Project Name}</h1>
    </main>
  );
}

export default App;
```

**`apps/web/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`apps/web/postcss.config.js`**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`apps/web/tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**`apps/web/Dockerfile`**
```dockerfile
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### apps/admin (React + Vite — only if `wants_admin: true`)

**`apps/admin/package.json`**
```json
{
  "name": "@{project}/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite --port 3002",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.6.0",
    "@tanstack/react-query": "^5.45.0",
    "@{project}/api-client": "workspace:*",
    "@{project}/domain": "workspace:*",
    "@{project}/ui": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

**`apps/admin/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**`apps/admin/vite.config.ts`**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
  },
});
```

**`apps/admin/index.html`**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{Project Name} — Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`apps/admin/src/main.tsx`**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**`apps/admin/src/App.tsx`**
```typescript
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{Project Name} — Admin</h1>
    </main>
  );
}

export default App;
```

**`apps/admin/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`apps/admin/postcss.config.js`**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`apps/admin/tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**`apps/admin/Dockerfile`**
```dockerfile
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### apps/e2e (Playwright)

**`apps/e2e/package.json`**
```json
{
  "name": "@{project}/e2e",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "typescript": "^5.4.0"
  }
}
```

**`apps/e2e/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './global-setup.ts',
});
```

**`apps/e2e/global-setup.ts`**
```typescript
import { FullConfig } from '@playwright/test';

// Global setup runs once before all tests.
// Use this to seed data, authenticate, etc.
async function globalSetup(_config: FullConfig): Promise<void> {
  // TODO: add setup logic here
}

export default globalSetup;
```

**`apps/e2e/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "lib": ["esnext"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

**`apps/e2e/tests/.gitkeep`**
(empty file)

**`apps/e2e/lib/.gitkeep`**
(empty file)

---

### apps/mobile (Flutter)

**`apps/mobile/pubspec.yaml`**
```yaml
name: mobile
description: {Project Name} mobile app
publish_to: "none"

environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.24.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0
  go_router: ^14.0.0
  dio: ^5.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  build_runner: ^2.4.0
  riverpod_generator: ^2.4.0

flutter:
  uses-material-design: true
```

**`apps/mobile/lib/main.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: '{Project Name}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const Scaffold(
        appBar: AppBar(title: Text('{Project Name}')),
        body: Center(child: Text('Welcome to {Project Name}')),
      ),
    );
  }
}
```

**`apps/mobile/analysis_options.yaml`**
```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_widgets: true
```

**`apps/mobile/integration_test/.gitkeep`**
(empty file)

---

### apps/mobile/widgetbook (Flutter Widgetbook)

**`apps/mobile/widgetbook/pubspec.yaml`**
```yaml
name: widgetbook_app
description: Widgetbook component explorer for {Project Name}
publish_to: "none"

environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.24.0"

dependencies:
  flutter:
    sdk: flutter
  widgetbook: ^3.0.0
  widgetbook_annotation: ^3.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  widgetbook_generator: ^3.0.0
  build_runner: ^2.4.0

flutter:
  uses-material-design: true
```

**`apps/mobile/widgetbook/lib/main.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

void main() {
  runApp(const WidgetbookApp());
}

class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Widgetbook.material(
      directories: const [],
      addons: const [],
    );
  }
}
```

---

### packages/ui (React design system + Storybook)

**`packages/ui/package.json`**
```json
{
  "name": "@{project}/ui",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "exports": {
    "./*": "./src/*"
  },
  "scripts": {
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "storybook": "^8.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**`packages/ui/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`packages/ui/.storybook/main.ts`**
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

**`packages/ui/.storybook/preview.ts`**
```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**`packages/ui/src/index.ts`**
```typescript
// Re-export components here.
// Example: export { Button } from './Button/Button';
```

---

### packages/domain

**`packages/domain/package.json`**
```json
{
  "name": "@{project}/domain",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**`packages/domain/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**`packages/domain/src/index.ts`**
```typescript
// Branded primitive types shared across all apps and packages.

/** Monetary value in cents (avoid floating-point errors). */
declare const __cents: unique symbol;
export type Cents = number & { readonly [__cents]: true };
export const toCents = (amount: number): Cents => Math.round(amount * 100) as Cents;

/** Opaque string ID (MongoDB ObjectId as string). */
declare const __id: unique symbol;
export type ID = string & { readonly [__id]: true };

/** ISO 8601 date-time string. */
export type ISODate = string;

/** ISO 4217 currency code (e.g. "USD", "EUR"). */
export type ISOCurrency = string;
```

---

### packages/api-client

**`packages/api-client/package.json`**
```json
{
  "name": "@{project}/api-client",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@{project}/domain": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**`packages/api-client/tsconfig.json`**
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**`packages/api-client/src/index.ts`**
```typescript
// Typed API client. Expanded as features are added.

export class ApiClient {
  constructor(public readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, init);
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}
```

---

### packages/config

**`packages/config/package.json`**
```json
{
  "name": "@{project}/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./eslint.base.js": "./eslint.base.js"
  }
}
```

**`packages/config/tsconfig.base.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**`packages/config/eslint.base.js`**
```javascript
// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [...tseslint.configs.recommended],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
});
```

---

## Rules

- **Idempotent** — never overwrite files with `skip` status in generate mode. Check existence before writing every file.
- **Review mode is read-only** — never write any files when `--review` flag is present.
- **Never run `pnpm install` or `flutter pub get`** — instruct the user to run them in the success report.
- **Admin confirmation** — always show detection result and ask user to confirm whether to include `apps/admin/`. Detection is informational, not automatic.
- **`.specs/01-infra-base/` ownership** — this skill owns that folder entirely. No other j-flow skill should create or modify it.
- **Project name derivation** — always read from `PRODUCT.md` **Name** field. Convert to lowercase-hyphenated slug for package names (`{project}`). Use original casing for display names in source files (`{Project Name}`).
