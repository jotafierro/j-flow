---
name: j-flow-scaffold
description: Scaffolds the monorepo using official CLIs (nest new, pnpm create vite, flutter create, npx storybook init) — always latest framework versions. Generates health endpoint, README, CHANGELOG entry, and review-guide for manual verification. Manual approval gate before marking 01-infra-base as done. Auto-triggered by /j-flow-project. Usage: /j-flow-scaffold [--review]
---

# /j-flow-scaffold

## Arguments

`$ARGUMENTS`: empty (generate mode) | `--review` (review-only — detect what's missing or outdated, report, no writes)

## Prerequisites

- `PRODUCT.md` exists in the current directory (run `/j-flow-project` first)
- Current directory is a git repo
- Required tooling installed: `node>=20`, `pnpm>=9`, `flutter` (if mobile chosen)

Print: "Verifying prerequisites..." Check each tool with `--version` and abort with a clear message if missing.

---

## Mode: Review (`--review`)

Read-only. No file writes.

**Detection:** Read existing files and build `detection_map`. Print component statuses:

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

apps/web (React + Vite)
  apps/web/package.json                 ✓ present
  apps/web/src/vite-env.d.ts            ⚠ outdated   (missing css module declaration)

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
.specs/01-infra-base/                   ✓ present / ⚠ outdated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Outdated detection rules:**
- `apps/api/package.json` exists but no `@nestjs/mongoose` in deps → ⚠ outdated
- `apps/api/src/health/health.controller.ts` missing → ⚠ outdated
- `apps/web/package.json` exists but no `vite-env.d.ts` with CSS declaration → ⚠ outdated
- `README.md` missing → ⚠ outdated
- `.specs/01-infra-base/` missing → ⚠ outdated

After the table, print:
```
Suggestions:
  {list any missing or outdated items with concrete actions}

Run /j-flow-scaffold to apply these changes.
```

Stop. Do not write any files.

---

## Mode: Generate (no flag)

### Step 1: Detection

Read existing files and build `detection_map`. Read `PRODUCT.md`:
- **Project name:** read the **Name** field. Use as `{project}` slug (lowercase-hyphenated, e.g. "My App" → "my-app"). Keep original casing as `{Project Name}` for display strings.
- **Admin detection (candidate):** Scan **Audience** and **Core Features** sections for keywords: "admin", "admin panel", "back-office", "dashboard". Record as `admin_hint: detected | not detected`. Do NOT set `wants_admin` yet.

**Always ask the user explicitly before continuing:**

```
Generate apps/admin (React admin panel on port 3002)?
  PRODUCT.md hint: {detected/not detected}

1. Yes — generate apps/admin
2. No — skip
```

Set `wants_admin: true` only if the user answers 1 (yes).

Then show the scaffold plan and ask for final confirmation:

```
Scaffold plan:
  Root config:        package.json, turbo.json, pnpm-workspace.yaml, docker-compose.yml, .github/workflows/ci.yml, .env.example, .gitignore, tsconfig.json
  apps/api:           NestJS (via @nestjs/cli)
  apps/web:           React + Vite (via pnpm create vite)
  apps/admin:         React + Vite (port 3002)   ← only shown if wants_admin: true
  apps/e2e:           Playwright (via pnpm create playwright)
  apps/mobile:        Flutter (via flutter create)
  apps/mobile/widgetbook: Flutter Widgetbook
  packages/ui:        React + Storybook (via npx storybook init)
  packages/domain:    Shared types
  packages/api-client: Typed API client
  packages/config:    Shared tsconfig + eslint

Continue? (yes/no)
```

If user says no, stop.

### Step 2: Create root config FIRST (before running CLIs)

Write these files at the project root:

**`.gitignore`**

Include these patterns (one per line):
- `node_modules/`
- `dist/`
- `.next/`
- `.turbo/`
- `.env`
- `.env.local`
- `.env.*.local`
- `*.log`
- `coverage/`
- `**/.dart_tool/`
- `**/build/`
- `**/.flutter-plugins`
- `**/.flutter-plugins-dependencies`
- `playwright-report/`
- `test-results/`
- `**/.idea/`
- `*.iml`

Note: `.DS_Store` is intentionally omitted — it belongs in the user's global `~/.gitignore_global`, not in project-level `.gitignore`.

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`package.json`** (Turborepo root — name from PRODUCT.md, private, packageManager pnpm@9)
```json
{
  "name": "{project}",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "pnpm": {
    "overrides": {
      "esbuild": "^0.25.0"
    }
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20"
  }
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
# Docker Compose (local dev)
MONGO_INITDB_DATABASE={project}_dev
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=changeme

# Each app has its own .env.example — see apps/{api,web,admin}/.env.example
```

### Step 3: Create packages/config first (other tsconfigs extend from here)

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

Note: Do NOT add `baseUrl` to any tsconfig (root, packages/config, or apps/*). `baseUrl` is deprecated in TypeScript 5+ when using `moduleResolution: "bundler"`. If path aliases are needed, use `paths` directly without `baseUrl`. If a CLI (e.g. NestJS) generates a tsconfig with `baseUrl: "."`, remove it before post-processing is complete.

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

### Step 4: Run official CLIs (one at a time, with clear progress messages)

For each app, ONLY if its directory doesn't exist (idempotent).

**apps/api (NestJS):**
```bash
cd apps && npx -y @nestjs/cli@latest new api --strict --package-manager pnpm --skip-git
cd ..
```

Post-process `apps/api/package.json`:
- Rename to `@{project}/api`
- Add Mongoose deps: `@nestjs/mongoose`, `mongoose`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`, `class-validator`, `class-transformer`
- Set port in `apps/api/src/main.ts`: `app.setGlobalPrefix('api/v1')` and `await app.listen(process.env.PORT ?? 3000)`
- Apply `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`

Generate health module files:

**`apps/api/src/health/health.controller.ts`**
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**`apps/api/src/health/health.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

Import `HealthModule` into `apps/api/src/app.module.ts` and add `MongooseModule.forRoot(process.env.MONGODB_URI!)`.

Write `apps/api/.env.example`:
```
# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/{project}_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=changeme-access-secret
JWT_REFRESH_SECRET=changeme-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# Email (dev: Mailhog, prod: Resend)
EMAIL_PROVIDER=mailhog
SMTP_HOST=localhost
SMTP_PORT=1025
```

Also write `apps/api/.env` as a copy of `apps/api/.env.example` so the API runs out of the box.

**apps/web (React + Vite):**
```bash
cd apps && pnpm create vite@latest web --template react-ts
cd ..
```

Post-process `apps/web/package.json`:
- Rename to `@{project}/web`
- Add deps: `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-router-dom`, `tailwindcss`, `@{project}/ui`, `@{project}/api-client`, `@{project}/domain`
- Add scripts: `lint`, `type-check: tsc --noEmit`, `test: vitest`
- Change `dev` script port to 3001: `vite --port 3001`
- Change `preview` script port to 3001: `vite preview --port 3001`

Edit `apps/web/src/vite-env.d.ts` to add:
```typescript
/// <reference types="vite/client" />
declare module '*.css';
declare module '*.module.css';
```

Write `apps/web/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/web/.env` as a copy of `apps/web/.env.example`.

**apps/admin (only if user confirms — see Detection step):**

Same as apps/web but on port 3002, name `@{project}/admin`.

Write `apps/admin/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/admin/.env` as a copy of `apps/admin/.env.example`.

**apps/e2e (Playwright):**
```bash
cd apps && pnpm create playwright@latest e2e --quiet --browser=chromium --gha=false --install-deps=false
cd ..
```

Post-process `apps/e2e/package.json` — rename to `@{project}/e2e`. Set `baseURL` in `playwright.config.ts` to `http://localhost:3001`.

**apps/mobile (Flutter):**
```bash
cd apps && flutter create mobile --org com.{project} --platforms=ios,android,web --description="{project} mobile app"
cd ..
```

Post-process:
- Edit `apps/mobile/pubspec.yaml` to add deps: `flutter_riverpod: ^2.5.0`, `go_router: ^14.0.0`, `dio: ^5.4.0`
- Edit `apps/mobile/lib/main.dart` to wrap with `ProviderScope`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '{Project Name}',
      home: Scaffold(
        appBar: AppBar(title: const Text('{Project Name}')),
        body: const Center(child: Text('Hello, j-flow!')),
      ),
    );
  }
}
```

- Verify `apps/mobile/analysis_options.yaml` uses `flutter_lints` (default from `flutter create`). Do NOT add custom rules that conflict.

**apps/mobile/widgetbook (Flutter Widgetbook):**
```bash
cd apps/mobile && flutter create widgetbook --template=app --platforms=web,macos --description="Widgetbook catalog" --project-name=widgetbook_app
cd ../..
```

The `--project-name=widgetbook_app` flag sets the pubspec `name:` field to `widgetbook_app` while keeping the directory as `widgetbook/`, preventing a self-reference when adding the `widgetbook` package as a dependency.

If `--project-name` is not supported (older Flutter), fallback: after `flutter create`, immediately edit `apps/mobile/widgetbook/pubspec.yaml` to change `name: widgetbook` → `name: widgetbook_app` BEFORE adding any widgetbook deps.

Post-process `apps/mobile/widgetbook/pubspec.yaml` to add `widgetbook: ^3.0.0`, `widgetbook_annotation: ^3.0.0`, and dev_dep `widgetbook_generator: ^3.0.0`.

Replace `apps/mobile/widgetbook/lib/main.dart` with:
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

Replace `apps/mobile/widgetbook/test/widget_test.dart` with a passing test that matches the new package name:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook_app/main.dart';

void main() {
  testWidgets('WidgetbookApp builds', (WidgetTester tester) async {
    await tester.pumpWidget(const WidgetbookApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
```

**packages/ui (React design system + Storybook):**

Create `packages/ui/package.json` (name `@{project}/ui`, type module, main `src/index.ts`, deps react+react-dom, devDeps typescript), then:
```bash
cd packages/ui && npx -y storybook@latest init --type=react-vite --yes --no-dev --skip-install
cd ../..
```

`storybook init` creates `src/stories/` with examples — keep them (user can see Storybook isn't empty).

Add `packages/ui/src/index.ts`:
```typescript
// Re-export components here
export * from './stories/Button';
```

**packages/domain:**

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

**`packages/domain/tsconfig.json`** — extends root

**`packages/domain/src/index.ts`**
```typescript
export type Cents = number & { readonly __brand: 'Cents' };
export const toCents = (amount: number): Cents => Math.round(amount) as Cents;
export type ID = string;
export type ISODate = string;
export type ISOCurrency = string;
```

**packages/api-client:**

**`packages/api-client/package.json`** (name `@{project}/api-client`, deps `@{project}/domain`)

**`packages/api-client/tsconfig.json`** — extends root

**`packages/api-client/src/index.ts`**
```typescript
export class ApiClient {
  constructor(public baseUrl: string) {}

  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/health`);
    return res.json();
  }
}
```

### Step 5: Generate project-level README.md

If `README.md` exists, prepend a "Local Development" section. If it doesn't exist, create with full template:

````markdown
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
````

### Step 6: Update CHANGELOG.md

Read `CHANGELOG.md`. Under `## [Unreleased]`, append:

```markdown
### Added
- [01-infra-base] Scaffolded monorepo with apps/{api, web, admin, e2e, mobile, mobile/widgetbook} and packages/{ui, domain, api-client, config}
- [01-infra-base] Docker Compose with MongoDB, Redis, Mailhog
- [01-infra-base] GitHub Actions CI pipeline
- [01-infra-base] Health endpoint at GET /api/v1/health
- [01-infra-base] Storybook + Widgetbook catalogs with example stories
- [01-infra-base] Root README.md with local development instructions
```

### Step 7: Initialize .specs/01-infra-base/

Create `.specs/01-infra-base/`. Use the templates:

**`meta.md`:** Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md`. Substitute slug=01-infra-base, branch=main (no feature branch — scaffold runs on main), current date. Set ALL status fields to `pending` initially — they update progressively as user verifies.

**`functional-spec.md`:** Write a short doc describing what was scaffolded.

**`technical-spec.md`:** Write a short doc with the directory tree generated.

**`review-guide.md`:** Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/review-guide.md` and customize for 01-infra-base. Manual Test Steps must include:
1. `pnpm install` succeeds with no errors
2. `docker compose up -d` starts MongoDB, Redis, Mailhog
3. `pnpm --filter @{project}/api dev` starts API
4. `curl http://localhost:3000/api/v1/health` returns `{"status":"ok"}`
5. `pnpm --filter @{project}/web dev` shows page at http://localhost:3001
6. (if admin) `pnpm --filter @{project}/admin dev` shows page at http://localhost:3002
7. `pnpm --filter @{project}/ui storybook` shows Storybook with example stories at http://localhost:6006
8. `cd apps/mobile && flutter pub get && flutter run` runs on emulator/device
9. `cd apps/mobile/widgetbook && flutter pub get && flutter run -d chrome` shows Widgetbook
10. `pnpm --filter @{project}/e2e test` runs Playwright sample
11. `pnpm lint && pnpm type-check` pass with no errors
12. VS Code shows no TypeScript errors when opening the project

**`gate-context.md`:** empty header only — will be written on approval.

### Step 8: MANUAL APPROVAL GATE

Print to user:

```
✓ Scaffolding complete.

Files generated:
  · Root config (turbo, docker compose, CI, env)
  · packages/{ui, domain, api-client, config}
  · apps/{api, web, admin?, e2e, mobile, mobile/widgetbook}
  · README.md (with local development instructions)
  · CHANGELOG.md updated with [Unreleased] entries
  · .specs/01-infra-base/ (meta, specs, review-guide)

Before marking 01-infra-base as DONE, verify everything works manually.
See .specs/01-infra-base/review-guide.md for the full checklist.

Quick verification:
  1. pnpm install
  2. docker compose up -d
  3. pnpm --filter @{project}/api dev   (then: curl http://localhost:3000/api/v1/health)
  4. pnpm --filter @{project}/web dev   (then open http://localhost:3001)

When all checklist items in review-guide.md pass, reply 'approved' to:
  · Mark gates [FUNCTIONAL SPEC], [TECHNICAL SPEC], [TASK PLAN], [BUILD], [QA], [REVIEW] as completed/approved/green
  · Update .specs/README.md to mark 01-infra-base as [✓]
  · Commit everything
  · Trigger /j-flow-recommend

Reply 'approved' when ready, or describe issues to fix.
```

### Step 9: On approval

When user replies 'approved':

1. Update `meta.md`: set all gate fields to approved/green/completed with current date, set `current_phase` to done.

2. Update `gate-context.md` with all 6 gate blocks:
```
# Gate Context — 01-infra-base

> Append-only. Each phase adds one block. Subsequent skills read this file first.

[FUNCTIONAL SPEC] approved {date}
  → key decisions: monorepo scaffold via CLIs

[TECHNICAL SPEC] approved {date}
  → architecture: Turborepo workspaces with apps/* and packages/*

[TASK PLAN] approved {date}
  → 1 implicit task: scaffold via CLIs

[BUILD] completed {date}
  → layers: infra ✓

[QA] green {date}
  → manual checklist completed by user

[REVIEW] approved {date}
  → no findings (CLI-generated code)
```

3. Update `.specs/README.md` symbol for `01-infra-base` from `[ ]` to `[✓]`.

4. Commit:
```bash
git add -A
git commit -m "chore: j-flow-scaffold — 01-infra-base scaffolded and verified"
```

5. Print success and invoke `/j-flow-recommend`:
```
✓ 01-infra-base marked as done.

Loading recommended plugins and tools...
```
Then invoke `/j-flow-recommend`.

---

## Rules

- Always use official CLIs first (`@nestjs/cli`, `pnpm create vite`, `pnpm create playwright`, `flutter create`, `storybook init`) — never hand-roll their setup
- Use `@latest` to always get the newest framework version
- Idempotent: never re-run a CLI if the target directory already has content
- Review mode is read-only — never write any files when `--review` flag is present
- Never run `pnpm install` or `flutter pub get` — those go in the README instructions for the user
- Verify prerequisites (node, pnpm, flutter) before running anything
- Use `--skip-git` flags where supported so we maintain a single commit at the end
- Read PRODUCT.md to detect admin hint (keywords: "admin", "admin panel", "back-office"), then ALWAYS ask the user explicitly before generating apps/admin
- Never add `baseUrl` to any tsconfig — use `paths` only when needed, without `baseUrl`
- Project name derivation: always read from `PRODUCT.md` **Name** field. Convert to lowercase-hyphenated slug for package names (`{project}`). Use original casing for display names in source files (`{Project Name}`).
