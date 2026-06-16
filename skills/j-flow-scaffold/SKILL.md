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

### Step 1b: Read DESIGN.md theme defaults

Open `DESIGN.md` in the project root. Search for the default theme declaration using these patterns:
- A line containing `**Default mode:** dark` or `**Default mode:** light`
- A line containing `**Default theme:** dark` or `**Default theme:** light`
- A line in the Color Tokens section that says "Light mode" or "Dark mode" first and notes "(default)"

If found: set `default_theme = "dark"` or `"light"` and print `"Detected default theme: {value}"`.

If NOT found (DESIGN.md is absent or doesn't specify a default), ask the user:
```
DESIGN.md does not specify a default theme.

Which mode should the scaffolded apps default to?
  1. Light
  2. Dark

Enter 1 or 2:
```
Store the answer as `default_theme` (`"light"` for 1, `"dark"` for 2).

Also extract color tokens from DESIGN.md for use in generated files. Look for a Color Tokens table with Light and Dark columns. Record:
- `color_bg_light`, `color_fg_light`, `color_primary_light`
- `color_bg_dark`, `color_fg_dark`, `color_primary_dark`

If DESIGN.md is missing or has no color token table, use these fallbacks:
- Light: bg `#ffffff`, fg `#0a0a0a`, primary `#3b82f6`
- Dark: bg `#0a0a0a`, fg `#fafafa`, primary `#60a5fa`

Use `default_theme` and the extracted color tokens in all subsequent steps that generate welcome screens (web, admin, mobile, widgetbook, storybook).

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

**`docker-compose.yml`** — reads credentials from root `.env` (loaded via `env_file`):
```yaml
services:
  mongo:
    image: mongo:7
    env_file:
      - .env
    environment:
      MONGO_INITDB_DATABASE: ${MONGO_INITDB_DATABASE}
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
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

Also write `.env` at root as a copy of `.env.example` (so `docker compose up` works out of the box). Add a note in the post-scaffold output telling the user to change the default credentials before production.

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
- Add deps: `@nestjs/config` (REQUIRED — without it `.env` is never loaded), `@nestjs/mongoose`, `mongoose`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`, `class-validator`, `class-transformer`
- Add a `dev` script alias (NestJS CLI generates `start:dev` only — alias it as `dev` so commands match the root README):
  ```json
  "scripts": {
    "dev": "nest start --watch",
    "start:dev": "nest start --watch",
    ... rest of nest defaults ...
  }
  ```
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

Replace `apps/api/src/app.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/{project}_dev',
      }),
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

`ConfigModule.forRoot({ isGlobal: true })` is what actually loads `.env` — without it, `process.env.MONGODB_URI` is undefined at boot. Substitute `{project}` with the actual project name when writing this file. The fallback URI matches the docker-compose default DB (`MONGO_INITDB_DATABASE={project}_dev`).

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
- Add external deps: `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-router-dom`, `tailwindcss` (use real version ranges)
- Add internal workspace deps with `workspace:*` protocol — REQUIRED for pnpm to link locally instead of trying npm registry:
  ```json
  "dependencies": {
    "@{project}/ui": "workspace:*",
    "@{project}/api-client": "workspace:*",
    "@{project}/domain": "workspace:*",
    ... external deps ...
  }
  ```
- Add scripts: `lint`, `type-check: tsc --noEmit`, `test: vitest`
- Change `dev` script port to 3001: `vite --port 3001`
- Change `preview` script port to 3001: `vite preview --port 3001`

Edit `apps/web/src/vite-env.d.ts` to add:
```typescript
/// <reference types="vite/client" />
declare module '*.css';
declare module '*.module.css';
```

**Replace default Vite welcome content for apps/web:**

DELETE `apps/web/src/App.css` (the default Vite CSS is not aligned with DESIGN.md).

REPLACE `apps/web/src/App.tsx` with:
```tsx
import './index.css';

export default function App() {
  return (
    <main className="app-shell">
      <h1 className="app-title">{Project Name}</h1>
    </main>
  );
}
```

REPLACE `apps/web/src/index.css` with a minimal stylesheet using DESIGN.md color tokens:
```css
:root {
  --color-bg: {color_bg_light};
  --color-fg: {color_fg_light};
  --color-primary: {color_primary_light};
}

[data-theme="dark"] {
  --color-bg: {color_bg_dark};
  --color-fg: {color_fg_dark};
  --color-primary: {color_primary_dark};
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { background: var(--color-bg); color: var(--color-fg); font-family: system-ui, sans-serif; }

.app-shell {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--color-bg);
  color: var(--color-fg);
}

.app-title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
}
```
Substitute `{color_bg_light}`, `{color_fg_light}`, `{color_primary_light}`, `{color_bg_dark}`, `{color_fg_dark}`, `{color_primary_dark}` with actual hex values from DESIGN.md (or fallbacks if missing).

Edit `apps/web/src/main.tsx` to inject the default theme on `<html>` before React renders. Add this line before `ReactDOM.createRoot(...)`:
```ts
document.documentElement.dataset.theme = '{default_theme}';
```

Write `apps/web/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/web/.env` as a copy of `apps/web/.env.example`.

**apps/admin (only if user confirms — see Detection step):**

Same as apps/web but on port 3002, name `@{project}/admin`. Internal deps MUST use `workspace:*` protocol:
```json
"dependencies": {
  "@{project}/ui": "workspace:*",
  "@{project}/api-client": "workspace:*",
  "@{project}/domain": "workspace:*",
  ... external deps ...
}
```

Apply the same welcome-screen replacements as apps/web, except the title text in `App.tsx` must be `{Project Name} — admin`.

Write `apps/admin/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/admin/.env` as a copy of `apps/admin/.env.example`.

**Smoke tests for apps/web (vitest):**

Add `apps/web/src/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the project title', () => {
    render(<App />);
    expect(screen.getByText('{Project Name}')).toBeInTheDocument();
  });
});
```

Add `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup-tests.ts'],
  },
});
```

Add `apps/web/src/setup-tests.ts`:
```ts
import '@testing-library/jest-dom';
```

Add devDeps to `apps/web/package.json`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/ui` (use real version ranges).

If apps/admin was generated, add the same smoke test files there too. The test title text must be `'{Project Name} — admin'` to match the admin App.tsx.

**apps/e2e (Playwright):**
```bash
cd apps && pnpm create playwright@latest e2e --quiet --browser=chromium --gha=false --install-deps=false
cd ..
```

Post-process `apps/e2e/package.json` — rename to `@{project}/e2e`. Set `baseURL` in `playwright.config.ts` to `http://localhost:3001`.

**Install Playwright browser binaries:**

`pnpm create playwright` with `--install-deps=false` skips OS-level deps (apt-get) but does NOT download browser binaries. After scaffolding apps/e2e, run:
```bash
cd apps/e2e && pnpm exec playwright install chromium && cd ../..
```
This downloads the chromium binary so `pnpm test` works first try without a manual browser install step. It is a one-time download (~120MB) and takes under 30 seconds.

**apps/mobile (Flutter):**
```bash
cd apps && flutter create mobile --org com.{project} --platforms=ios,android,web --description="{project} mobile app"
cd ..
```

Post-process:
- Edit `apps/mobile/pubspec.yaml` to add deps: `flutter_riverpod: ^2.5.0`, `go_router: ^14.0.0`, `dio: ^5.4.0`
- REPLACE `apps/mobile/lib/main.dart` with a DESIGN.md-aligned welcome screen:

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
      themeMode: ThemeMode.{themeMode},
      theme: ThemeData.light(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color({primaryLightHex})),
      ),
      darkTheme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color({primaryDarkHex}),
          brightness: Brightness.dark,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Center(
        child: Text(
          '{Project Name}',
          style: theme.textTheme.displayMedium?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
```

Substitution rules for the mobile main.dart:
- `{themeMode}`: `dark` if `default_theme === 'dark'`, otherwise `light`
- `{primaryLightHex}`: `color_primary_light` as `0xFF` + 6 uppercase hex digits (e.g. `0xFF3B82F6`)
- `{primaryDarkHex}`: `color_primary_dark` as `0xFF` + 6 uppercase hex digits (e.g. `0xFF60A5FA`)

REPLACE `apps/mobile/test/widget_test.dart` with a test that matches the new app (replaces the broken counter test):
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots and shows project title', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));
    expect(find.text('{Project Name}'), findsOneWidget);
  });
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

Replace `apps/mobile/widgetbook/lib/main.dart` with a DESIGN.md-aligned catalog:
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
      directories: [
        WidgetbookCategory(
          name: 'Foundation',
          children: [
            WidgetbookComponent(
              name: 'Welcome',
              useCases: [
                WidgetbookUseCase(
                  name: 'Default',
                  builder: (context) => Scaffold(
                    backgroundColor: const Color({bgHex}),
                    body: Center(
                      child: Text(
                        '{Project Name}',
                        style: const TextStyle(
                          color: Color({primaryHex}),
                          fontSize: 36,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
      addons: const [],
    );
  }
}
```

Substitution rules for the widgetbook main.dart:
- `{bgHex}`: use `color_bg_dark` if `default_theme === 'dark'`, else `color_bg_light`, formatted as `0xFF` + 6 uppercase hex digits
- `{primaryHex}`: use `color_primary_dark` if `default_theme === 'dark'`, else `color_primary_light`, same format

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

`storybook init` creates `src/stories/` with default Button/Header/Page examples — DELETE that directory entirely:
```bash
rm -rf packages/ui/src/stories
```

Generate a DESIGN.md-aligned Welcome component instead.

Write `packages/ui/src/components/Welcome.tsx`:
```tsx
import './welcome.css';

export type WelcomeProps = {
  projectName: string;
  variant?: 'light' | 'dark';
};

export function Welcome({ projectName, variant = '{default_theme}' }: WelcomeProps) {
  return (
    <div className={`welcome welcome--${variant}`}>
      <h1 className="welcome__title">{projectName}</h1>
      <p className="welcome__tag">Design System Starter</p>
    </div>
  );
}
```
(Substitute `{default_theme}` with the actual value, e.g. `'dark'` or `'light'`.)

Write `packages/ui/src/components/welcome.css`:
```css
.welcome {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
}

.welcome--light {
  --bg: {color_bg_light};
  --fg: {color_fg_light};
  --primary: {color_primary_light};
  background: var(--bg);
  color: var(--fg);
}

.welcome--dark {
  --bg: {color_bg_dark};
  --fg: {color_fg_dark};
  --primary: {color_primary_dark};
  background: var(--bg);
  color: var(--fg);
}

.welcome__title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700;
  color: var(--primary);
  text-align: center;
}

.welcome__tag {
  font-size: 1rem;
  opacity: 0.6;
  text-align: center;
  margin-top: 0.5rem;
}
```
(Substitute color token hex values from DESIGN.md or fallbacks.)

Write `packages/ui/src/components/Welcome.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Welcome } from './Welcome';

const meta: Meta<typeof Welcome> = {
  component: Welcome,
  parameters: { layout: 'fullscreen' },
  args: { projectName: '{Project Name}' },
};
export default meta;

type Story = StoryObj<typeof Welcome>;

export const Light: Story = { args: { variant: 'light' } };
export const Dark: Story = { args: { variant: 'dark' } };
```

Update `packages/ui/.storybook/preview.ts` to set the default background per `default_theme`. If `default_theme === 'dark'`, add:
```ts
parameters: {
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'light', value: '{color_bg_light}' },
      { name: 'dark', value: '{color_bg_dark}' },
    ],
  },
},
```
If `default_theme === 'light'`, set `default: 'light'` instead.

Write `packages/ui/src/index.ts`:
```typescript
export * from './components/Welcome';
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

**`packages/api-client/package.json`** — name `@{project}/api-client`, with workspace dep:
```json
{
  "name": "@{project}/api-client",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "dependencies": {
    "@{project}/domain": "workspace:*"
  }
}
```

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
| Storybook docs | see [docs/STORYBOOK.md](docs/STORYBOOK.md) | |
| Widgetbook docs | see [docs/WIDGETBOOK.md](docs/WIDGETBOOK.md) | |

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

### Step 5b: Generate docs/STORYBOOK.md and docs/WIDGETBOOK.md

Create a `docs/` directory if it doesn't exist. Write these two documentation files into the TARGET repo.

Write `docs/STORYBOOK.md`:
````markdown
# Storybook — {Project Name}

Storybook 8 catalog for the React design system in `packages/ui`.

## Run

```bash
pnpm --filter @{project}/ui storybook
# Opens http://localhost:6006
```

## Where stories live

- `packages/ui/src/components/*.tsx` — components
- `packages/ui/src/components/*.stories.tsx` — stories co-located with components

## Adding a story

```tsx
// MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = { component: MyComponent };
export default meta;
export const Default: StoryObj<typeof MyComponent> = { args: { ... } };
```

## Design tokens

Tokens live in [`DESIGN.md`](../DESIGN.md). Use CSS variables exposed via the design-system stylesheet; never hardcode colors.

## Default theme

This project's default theme is **{default_theme}** (configured in `packages/ui/.storybook/preview.ts`).
````

Write `docs/WIDGETBOOK.md`:
````markdown
# Widgetbook — {Project Name}

Widgetbook 3 catalog for the Flutter app in `apps/mobile`.

## Run

```bash
cd apps/mobile/widgetbook
flutter pub get
flutter run -d chrome   # or -d macos
```

## Where entries live

- `apps/mobile/widgetbook/lib/main.dart` — root Widgetbook app
- `apps/mobile/widgetbook/lib/components/*.dart` — component catalog entries

## Adding an entry

```dart
WidgetbookComponent(
  name: 'MyWidget',
  useCases: [
    WidgetbookUseCase(
      name: 'Default',
      builder: (context) => MyWidget(...),
    ),
  ],
)
```

## Design tokens

Tokens live in [`DESIGN.md`](../DESIGN.md). The mobile theme is in `apps/mobile/lib/main.dart` — derived from the same tokens.

## Default theme

This project's default theme is **{default_theme}**.
````

(Substitute `{Project Name}`, `{project}`, and `{default_theme}` with actual values when writing these files.)

### Step 6: Update CHANGELOG.md

Read `CHANGELOG.md`. Under `## [Unreleased]`, append:

```markdown
### Added
- [01-infra-base] Scaffolded monorepo with apps/{api, web, admin, e2e, mobile, mobile/widgetbook} and packages/{ui, domain, api-client, config}
- [01-infra-base] Docker Compose with MongoDB, Redis, Mailhog
- [01-infra-base] GitHub Actions CI pipeline
- [01-infra-base] Health endpoint at GET /api/v1/health
- [01-infra-base] Storybook + Widgetbook catalogs with Welcome component (DESIGN.md tokens)
- [01-infra-base] Root README.md with local development instructions
- [01-infra-base] Default theme detection from DESIGN.md (asks user if missing)
- [01-infra-base] Centered welcome screens for web, admin, mobile, widgetbook, storybook (DESIGN.md tokens)
- [01-infra-base] Smoke tests (vitest) for web and admin
- [01-infra-base] Playwright browser auto-install on scaffold
- [01-infra-base] docs/STORYBOOK.md and docs/WIDGETBOOK.md
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
