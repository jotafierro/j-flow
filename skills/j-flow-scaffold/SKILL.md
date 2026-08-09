---
name: j-flow-scaffold
description: "Scaffolds the monorepo using official CLIs (nest new, pnpm create vite, flutter create, npx storybook init) at pinned, known-good versions. Generates health endpoint, README, CHANGELOG entry, and review-guide for manual verification. Manual approval gate before marking 01-infra-base as done. Auto-triggered by /j-flow-project. Usage: /j-flow-scaffold [--review]"
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

Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/review-mode.md` and follow it completely — it is read-only and never writes a file. Stop after printing its report; do not fall through to Generate mode.

---

## Mode: Generate (no flag)

### Step 1: Detection

Read existing files and build `detection_map`. Read `PRODUCT.md`:
- **Project name:** read the **Name** field. Use as `{project}` slug (lowercase-hyphenated, e.g. "My App" → "my-app"). Keep original casing as `{Project Name}` for display strings.
- **Stack layers:** find the `**Layers:**` line in the Tech Stack section. Parse as a comma list into `stack_layers` (lowercase, trimmed — valid values: `web`, `api`, `mobile`, `admin`, `e2e`, `cli`). If the line is missing or blank, default `stack_layers = [web, api, mobile, admin, e2e]` and print: "No `**Layers:**` field in PRODUCT.md — defaulting to full stack (web, api, mobile, admin, e2e). Add a `**Layers:**` line to customize." (The absent-line default includes `e2e` so existing full-stack scaffolds keep Playwright — back-compat. It does **not** include `cli`: the CLI layer is opt-in, added explicitly to `**Layers:**`.)

Derive flags from `stack_layers`: `has_web`, `has_api`, `has_mobile`, `has_admin`, `has_e2e`, `has_cli` (each `true` iff present in the list).

**Scaffold profile (derived — right-sizes the generated shell):**

TS/Node layers are `web`, `api`, `admin`, `e2e`, `cli`; `mobile` is Dart. Let `ts_layers` = the TS/Node layers present in `stack_layers`. Derive `scaffold_profile`:

- **`flutter-only`** — `stack_layers == [mobile]` (mobile is the ONLY layer): emit **no** TypeScript root shell (no `pnpm-workspace.yaml`, `turbo.json`, root `package.json`/`tsconfig.json`/`.npmrc`, no `packages/*`). Scaffold only `apps/mobile/` (Flutter) + widgetbook + a Flutter-only `ci.yml` + README. Flutter is not a pnpm package, so a workspace around a lone Dart app is inert noise. Mobile still lives at `apps/mobile/`, so a later TS layer drops a workspace beside it additively.
- **`bare-single-package`** — `ts_layers == [cli]` AND the user declares the project **terminal** (see the terminal prompt below): a flat single-package repo (`src/` at root, `package.json` with `bin`, tsup, vitest — no workspace). For a published npm-leaf CLI that will never grow.

**Terminal prompt — only when `ts_layers == [cli]` (cli is the sole TypeScript layer):** ask the user:
```
This is a CLI-only project. Will it grow into web/mobile/api later?
  1. Might grow — use a minimal workspace (apps/cli/, adding a layer later is additive)   (recommended)
  2. Terminal — a single-package npm-leaf CLI (flat src/, no workspace)

Enter 1 or 2 (default: 1):
```
Default (option 1) → `minimal-workspace`; option 2 → `bare-single-package`. If `cli` is NOT the sole TS layer (e.g. `cli,api`), skip this prompt — the project is already a workspace.
- **`minimal-workspace`** — the DEFAULT for any selection with ≥1 TS/Node layer: emit the TS root shell (`pnpm-workspace.yaml` + `turbo.json` + root `package.json`/`tsconfig.json`/`.npmrc` + `packages/config` + `packages/domain`), each app under `apps/<layer>/`, with heavy contents deferred to their triggering layer (`packages/api-client` only `has_api`, `packages/ui` only `has_web`/`has_admin`, `docker-compose` only `has_api`, per-layer CI jobs). This same emitter scales to the full 4-app monorepo as more layers turn on — **`full` is not a separate profile, just minimal-workspace with more layers enabled**.

**Growth invariant:** every layer lives under `apps/<layer>/` from day one (never at repo root), so growth is purely additive — the `apps/*` glob discovers a newly-added app and nothing moves. The workspace manifests (`pnpm-workspace.yaml` + `turbo.json`, ~20 lines) are the cheap tax paid up front; the expensive migration (single-package → workspace) is what this avoids.

Note: `packages/config` and `packages/domain` are **always present in a workspace** — a trivial, always-safe shared seam (`apps/web`/`apps/admin` declare a `workspace:*` dep on `domain`). Only the heavy packages (`api-client`, `ui`) and app/CI blocks are deferred. (This keeps single-TS-layer projects working without making the domain dep conditional.)

**API style question — only if `has_api`:**

Scan PRODUCT.md `## Audience` and `## Core Features` for API style signals:
- GraphQL hints: "multi-tenant", "B2B SaaS", "analytics", "feed", "dashboard with aggregated data", "developer API", "external integration partner"
- REST hints: "CRUD", "mobile-first", "Flutter", "personal", "team product", "simple API"

Set `api_hint: 'graphql' | 'rest'` based on match (REST is default when no strong signal).

Ask the user:

```
API style for apps/api?
  PRODUCT.md hint: {REST / GraphQL} — {one line reason, e.g. "mobile-first Flutter app, simple CRUD"}

1. REST  — controllers, DTOs, Swagger at /api/docs           (recommended: {yes/no})
2. GraphQL — resolvers, @ObjectType, Apollo Playground at /graphql  (recommended: {yes/no})

Enter 1 or 2 (default: {1 or 2}):
```

Set `api_style: 'rest' | 'graphql'` from the user's response.

After the user answers, write `api_style` back to `PRODUCT.md`:
Find the line `**API Style:** {rest|graphql}` and replace with `**API Style:** rest` or `**API Style:** graphql`.
If `PRODUCT.md` does not have the `**API Style:**` line, insert it under `**Backend:**` in the Tech Stack section.

If `!has_api`, skip this question entirely — no api_style is set, and nothing is written back to PRODUCT.md.

**Styling question — only if `has_web` or `has_admin`:**

Ask the user:

```
Styling for apps/web{admin}?
  ({admin} = " / apps/admin" if has_admin, else omit)

1. Tailwind CSS — utility classes, @tailwindcss/vite plugin, no separate config file (v4)  (recommended: no)
2. Plain CSS    — CSS custom properties from DESIGN.md tokens, no extra dependency          (recommended: yes)

Enter 1 or 2 (default: 2):
```

Set `styling: 'tailwind' | 'plain-css'` from the user's response (default `plain-css` if the user just presses enter).

If `!has_web && !has_admin`, skip this question entirely — no `styling` is set, and nothing is written back to `PRODUCT.md`.

After the user answers, update `PRODUCT.md`:
Find the line `**Styling:** {tailwind|plain-css}` and replace `{tailwind|plain-css}` with the chosen value.
If `PRODUCT.md` does not yet have the `**Styling:**` line (older project), insert it under `**Web:**` in the Tech Stack section.

Then show the scaffold plan (only listing components for included layers) and ask for final confirmation:

```
Scaffold plan (layers: {stack_layers.join(', ')} · profile: {scaffold_profile}):
  Root config:        package.json, turbo.json, pnpm-workspace.yaml, tsconfig.json, .npmrc  ← workspace profiles only (omitted for flutter-only)
  CI + meta:          .github/workflows/ci.yml, .env.example, .gitignore
  docker-compose.yml: MongoDB, Redis, Mailhog                     ← only if has_api
  apps/api:           NestJS — REST (controllers + Swagger)       ← only if has_api, api_style: rest
  apps/api:           NestJS — GraphQL (resolvers + Playground)   ← only if has_api, api_style: graphql
  apps/web:           React + Vite (via pnpm create vite)          ← only if has_web
  apps/web:           Styling — Tailwind CSS (utility classes)     ← only if has_web, styling: tailwind
  apps/web:           Styling — Plain CSS (DESIGN.md tokens)       ← only if has_web, styling: plain-css
  apps/admin:         React + Vite (port 3002)                     ← only if has_admin
  apps/e2e:           Playwright (via pnpm create playwright)      ← only if has_e2e (local webServer if has_web, else external BASE_URL)
  apps/cli:           commander + tsup + vitest (hand-templated)   ← only if has_cli (flat src/ if bare-single-package)
  apps/mobile:        Flutter (via flutter create)                 ← only if has_mobile
  apps/mobile/widgetbook: Flutter Widgetbook                       ← only if has_mobile
  packages/ui:        React + Storybook (via npx storybook init)   ← only if has_web or has_admin
  packages/domain:    Shared types
  packages/api-client: Typed API client                            ← only if has_api
  packages/config:    Shared tsconfig + eslint

Continue? (yes/no)
```

If user says no, stop.

### Step 1b: Read DESIGN.md theme defaults

Skip this entire step if `!has_web && !has_admin && !has_mobile` (no layer renders UI, so there's no theme to seed).

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

### Step 1c: Create feature branch

Check current branch: `git branch --show-current`.

- If already on `feature/01-infra-base` (re-running after an interruption), stay on it.
- Otherwise: `git checkout -b feature/01-infra-base`. This branches off `develop` when `/j-flow-project` created it (Step 9b of that skill); if `develop` doesn't exist (repo pre-dates that flow), it branches off whatever is current and print: "No `develop` branch found — branching `feature/01-infra-base` from `{current branch}`."
- If `feature/01-infra-base` already exists as a branch (not checked out), check it out instead of erroring.

All file writes and the Step 9 approval commit happen on this branch.

### Step 2: Create root config FIRST (before running CLIs)

**Profile gate (from Step 1's `scaffold_profile`):**
- **`minimal-workspace` / `full`** — run this step in full (the TypeScript workspace shell below).
- **`flutter-only`** — SKIP the entire TS shell. Emit only: a Flutter-appropriate `.gitignore` (the `**/.dart_tool/`, `**/build/`, `**/.flutter-plugins*` patterns below — drop the `node_modules/`/`.turbo/`/`dist/` TS lines) and the `ci.yml` with the **`flutter` job only** (omit the `test` job — there is no pnpm/TS to lint or test). No `pnpm-workspace.yaml`, `turbo.json`, root `package.json`/`tsconfig.json`/`.npmrc`, no `docker-compose.yml`, no `packages/*`. Ensure `apps/` exists (`mkdir -p apps`) before Step 4's `flutter create`.
- **`bare-single-package`** — the workspace shell is replaced by a single-package `package.json` with `bin`; see the `cli` layer (plan 036).

Write these files at the project root (workspace profiles):

**Re-run / growth safety (create-if-missing, never clobber):** On a first scaffold these files don't exist, so write them. On a **growth re-run** (a layer was added to `**Layers:**` and scaffold runs again) they already exist and may be **hand-edited** — so for every root file below: if it does NOT exist, create it; if it DOES exist, treat it as authoritative and only **merge in** the additive bits a newly-enabled layer needs (e.g. a new `workspace:*` dep, a new `.env.example` block), never rewrite the file wholesale. `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.npmrc` are carry-forward — do not overwrite a user's edits. For `ci.yml` specifically, see the print-and-merge rule in its section below.

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

**`pnpm-workspace.yaml`** — versions come from the pinned-tool-versions table (see below Step 3, before Step 4). `catalog` only if `has_e2e` (the only layer that reliably needs a pinned Playwright version) — and needs **both** `playwright` and `@playwright/test` keys: pnpm resolves `catalog:` by exact package name, and `apps/e2e` depends on `@playwright/test` while `packages/ui` (if it later adds `@storybook/addon-vitest` by hand) depends on plain `playwright` — two different npm packages that happen to need the same version. `overrides` and `allowBuilds` replace what used to live under `package.json > pnpm` — pnpm 11 no longer reads that field at all (`[WARN] The "pnpm" field in package.json is no longer read by pnpm`), and pnpm ≥10 doesn't run dependency install scripts unless explicitly allowed:
```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  playwright: 1.62.1
  "@playwright/test": 1.62.1

overrides:
  esbuild: "^0.25.0"

allowBuilds:
  esbuild: true
```
Without `has_e2e`, omit the `catalog` block entirely. `overrides` and `allowBuilds` are unconditional — the `esbuild` override pins the version Storybook needs for compatibility (not a security advisory), not tied to any specific layer flag. Judge every future addition to `allowBuilds` on its own — it's explicitly allow-listing a third-party package's install script (arbitrary code) to run unsandboxed; don't add an entry by reflex just because pnpm asked.

**`package.json`** (Turborepo root — name from PRODUCT.md, private, packageManager pnpm@11)
```json
{
  "name": "{project}",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.20.0",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "2.10.9",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```
No `pnpm` field here — see the `overrides`/`allowBuilds` move to `pnpm-workspace.yaml` above. `turbo` is pinned (was `"latest"`) — same reasoning as every other tool in this skill (see Rules and the pinned-versions table): a build-graph tool silently jumping major versions on every fresh scaffold is exactly the kind of drift this plan (042) exists to stop.

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
public-hoist-pattern[]=*storybook*
public-hoist-pattern[]=@storybook/*
```

The `public-hoist-pattern` lines are REQUIRED for Storybook to work inside a pnpm workspace — without them, the `storybook` CLI cannot resolve `@storybook/core` from a hoisted location. Confirmed against Storybook 10.x docs.

**`docker-compose.yml`** — only if `has_api`. Skip entirely if `!has_api` (nothing backend-side needs Mongo/Redis/Mailhog). Reads credentials from root `.env` (loaded via `env_file`):
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
      - "127.0.0.1:27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7
    ports:
      - "127.0.0.1:6379:6379"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "127.0.0.1:1025:1025"
      - "127.0.0.1:8025:8025"

volumes:
  mongo_data:
```

All three services bind to `127.0.0.1` — loopback-only, not `0.0.0.0` — so Mongo/Redis/Mailhog aren't reachable from other machines on the same network by default. A user who deliberately wants LAN access can widen the binding themselves.

Also write `.env` at root as a copy of `.env.example`, only when `has_api` — but replace `MONGO_INITDB_ROOT_PASSWORD=changeme` with a freshly generated value: run `openssl rand -hex 32` and substitute its output. `docker compose up` still works out of the box; the real `.env` never carries the literal `changeme` placeholder. Add a note in the post-scaffold output that this dev secret is randomly generated per scaffold and must not be reused in production.

**`.github/workflows/ci.yml`** — the `test` job runs whenever there is a TS/JS workspace (`minimal-workspace`/`full`); it is **omitted entirely for `flutter-only`** (no pnpm/TS to lint or test), leaving only the `flutter` job. Include the `mongodb` service and the Playwright install step only if `has_api` / `has_e2e` respectively. Include the `flutter` job only if `has_mobile`.

```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:                        # only if has_api
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm --filter @{project}/e2e exec playwright install --with-deps chromium   # only if has_e2e
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  flutter:                            # entire job omitted if !has_mobile
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v7

      - uses: subosito/flutter-action@v2.23.0
        with:
          flutter-version: "3.41.x"
          channel: "stable"

      - run: flutter pub get
        working-directory: apps/mobile

      - run: flutter test
        working-directory: apps/mobile
```

CI notes:
- **Growth (print-and-merge, no automated YAML surgery):** `ci.yml` is one file with interleaved `has_*`-conditional jobs the user may have hand-edited. On a first scaffold, write it. On a growth re-run where a newly-added layer needs a CI change (e.g. adding `mobile` needs the `flutter` job; adding `api` needs the `mongodb` service; adding `e2e` needs the Playwright install step), do NOT rewrite the file — **print the exact job/step block to add and ask the user to merge it** into their `ci.yml`. This keeps hand-edited workflows safe.
- `pnpm/action-setup@v4` reads the version from `packageManager` in `package.json` — do NOT add a `version:` key, it conflicts.
- `hashFiles()` is invalid in a job-level `if` (only works in step contexts) — since the flutter job is only written to the file at all when `has_mobile`, no runtime conditional is needed.
- `playwright install --with-deps chromium` must run in CI before `pnpm test`; the local binary installed during scaffold is not committed. Omit this step (and the `mongodb` service block) from the generated YAML when the corresponding layer is absent — don't leave a no-op step in.
- `flutter-version: "3.41.x"` matches Dart `^3.11.5` from pubspec. Update this when bumping Flutter in the project.
- Third-party actions (`actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `subosito/flutter-action`) are pinned by a plain major-version tag (`@vN`) — deliberate choice for readability and zero-friction bumping over commit-SHA pinning (this repo has no Dependabot config to automate SHA bumps, so a SHA pin would mean a manual `gh api` lookup on every update). Resolve the current major tag with `gh api repos/{owner}/{repo}/tags --jq '.[].name'` (look for a bare `vN` entry; `subosito/flutter-action` has none, so it's pinned to its latest full release tag instead, e.g. `v2.23.0`) before bumping any of them.

**`.env.example`** — the Mongo block only if `has_api`:
```
# Docker Compose (local dev)          ← only if has_api
MONGO_INITDB_DATABASE={project}_dev
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=changeme

# Each app has its own .env.example — see apps/{api,web,admin}/.env.example  (list only the layers actually generated)
```

### Step 3: Create packages/config first (other tsconfigs extend from here)

**Workspace profiles only** (`minimal-workspace`/`full`). Skip Step 3 entirely for `flutter-only` (no `packages/*`). `packages/config` and `packages/domain` are always created in a workspace; `packages/api-client` (if `has_api`) and `packages/ui` (if `has_web`/`has_admin`) are deferred to their layers.

**`packages/config/package.json`** — `exports` always lists `tsconfig.base.json`; add `./eslint.base.js` only if `has_api`, `./tsconfig.nest.json` only if `has_api`, and `./tsconfig.lib.json` only if the overlay below is actually generated (see condition there). `oxlint.base.json` is NOT listed here — oxlint configs `extends` each other by relative path, not by package name (see `references/layer-web.md`'s reconciliation step), so it needs no `exports` entry:
```json
{
  "name": "@{project}/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json"
  }
}
```

**`packages/config/tsconfig.base.json`** — policy only. No emission flags, no framework-specific flags — every TS consumer in the workspace, including a plain Vite app that does `noEmit`, can extend this without error:
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
    "forceConsistentCasingInFileNames": true
  }
}
```

**`packages/config/tsconfig.nest.json`** — only if `has_api`. Adds the two decorator flags NestJS needs; nothing else in the workspace should carry them:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**`packages/config/tsconfig.lib.json`** — only if some generated package actually publishes `.d.ts` (i.e. its own `package.json` sets `"declaration": true` or ships a `types`/`exports["./package.json"].types` field for outside consumption). None of this scaffold's default packages do — `domain`, `api-client`, and `ui` are all `noEmit` and consumed by source via `exports`. In a fresh scaffold this file is therefore **not generated**; it exists so a future package that does need to publish types has somewhere to extend from instead of reinventing emission flags:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Note: Do NOT add `baseUrl` to any tsconfig (root, packages/config, or apps/*). `baseUrl` is deprecated in TypeScript 5+ when using `moduleResolution: "bundler"`. If path aliases are needed, use `paths` directly without `baseUrl`. If a CLI (e.g. NestJS) generates a tsconfig with `baseUrl: "."`, remove it before post-processing is complete.

**`packages/config/eslint.base.js`** — only if `has_api`. This is consumed exclusively by `apps/api` (see `references/layer-api.md` — the NestJS CLI's own generated ESLint config extends it, it does NOT switch to oxlint). No other layer in the workspace uses ESLint; generating this file unconditionally used to leave it orphaned in any project without a backend:
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

**`packages/config/oxlint.base.json`** — generated for any workspace profile (`packages/domain` alone guarantees at least one consumer; `web`/`admin`/`ui`/`api-client`/`cli` add more when present). Equivalent ruleset to `eslint.base.js` above (`no-explicit-any` as warn) plus the two React rules already added by hand in real scaffolds (`me`, `horus`) — now centralized instead of copy-pasted per app:
```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "typescript/no-explicit-any": "warn",
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

### Pinned tool versions (last reviewed: 2026-08-08 · next review: 2027-02-08)

Every official CLI this skill invokes, plus every tool version this skill's own templates hardcode, runs at a **pinned, known-good version** — not `@latest`. A moving target means this skill's own post-processing steps (written against one CLI's output shape) silently drift out of sync with what actually gets installed — the exact root cause of plans 039–041 (Vite switched its default lint tool, Storybook changed a flag, pnpm 11 changed its config format — all discovered by a real scaffold breaking, not by reading a changelog).

| Tool | Pinned version | Installs into |
|---|---|---|
| `@nestjs/cli` | `11.0.24` | scaffold-time only (not a project dependency) |
| `create-vite` | `9.1.2` | scaffold-time only (`apps/web`, `apps/admin`) |
| `storybook` (init CLI) | `10.5.7` | scaffold-time only — the `storybook` *package* left in `packages/ui/package.json` devDependencies still uses a real semver range, unaffected |
| `create-playwright` | `1.17.139` | scaffold-time only |
| `pnpm` (`packageManager`) | `11.20.0` | project dependency — every `pnpm install` going forward |
| `playwright` / `@playwright/test` (catalog) | `1.62.1` | project dependency |
| `turbo` (root devDependency) | `2.10.9` | project dependency |

**Review procedure (every 3–6 months, or immediately on a security advisory for any row above):**
1. `npm view <package> version` for each row — diff against the pinned value.
2. If any differ, scaffold a throwaway test repo with the new version(s) and run the full cycle live: `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm test` — not just `npm test` in this repo, which only validates template text and cannot catch a runtime install/build break.
3. Update this table + every pinned-version site in `references/layer-*.md`/`packages-ui.md` **together** — same commit, so the table is never the only thing that changed.
4. Bump "last reviewed" / "next review" above. If nothing changed, still bump "next review" so the cadence doesn't silently stop.

### Step 4: Run official CLIs (one at a time, with clear progress messages)

For each app, ONLY if its directory doesn't exist (idempotent) AND its layer is included (`has_api`/`has_web`/`has_admin`/`has_mobile`/`has_e2e` from Step 1). Skip a component's entire section — CLI run, post-processing, generated files — when its layer flag is false.

**Before running the first CLI in this step:** print what will be installed, from the pinned-versions table above — no confirmation needed, the versions are already fixed and known:
```
This scaffold runs {N} official CLIs at pinned versions (last reviewed {date} — see the Rules section / pinned-versions table above Step 4).
```
**If today's date is past the table's "next review" date**, print instead:
```
Note: pinned tool versions were last reviewed {date}, more than 6 months ago. Scaffolding will proceed with the pinned versions as-is — this is not a blocker, just a reminder that a review is due (see the "Pinned tool versions" section above for the procedure).
```
and continue without asking — a stale pin is a maintenance reminder, not a reason to stop a scaffold in progress.

**Growth (idempotent by layer-artifact, not just by directory):** on a re-run after a layer was added to `**Layers:**`, generate every artifact the newly-included layer needs that is still MISSING — its `apps/<layer>/` dir (as above), any package it newly unlocks (`packages/api-client` when `api` was just added; `packages/ui` when the first of `web`/`admin` was just added), its `docker-compose.yml` (when `api` was just added), and its CI job/step (print-and-merge, see `ci.yml`). Existing apps and packages are left untouched. This makes "start with one layer, add more later" purely additive — nothing that already exists moves or is rewritten.

**Order matters: create packages/domain, packages/api-client (if `has_api`), and packages/ui (if `has_web` or `has_admin`; read `references/packages-ui.md`, including `storybook init`) BEFORE running any app CLI.** apps/web and apps/admin `package.json` declare `workspace:*` deps on these packages. If `pnpm create playwright`, `pnpm exec`, or any other pnpm-aware command runs while those packages don't exist yet on disk, pnpm's workspace resolution fails trying to link them. Sequence: packages/config (Step 3) → packages/domain → packages/api-client → packages/ui (`references/packages-ui.md`) → THEN whichever of apps/api, apps/web, apps/admin, apps/e2e, apps/mobile, apps/mobile/widgetbook are included via their `references/layer-*.md` file (any order among the apps).

- **apps/api — only if `has_api`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-api.md` and follow it completely before moving to the next included app.
- **apps/web — only if `has_web`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-web.md` and follow it completely before moving to the next included app.
- **apps/admin — only if `has_admin`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-admin.md` and follow it completely before moving to the next included app.
- **apps/e2e — only if `has_e2e`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-e2e.md` and follow it completely before moving to the next included app.
- **apps/cli — only if `has_cli`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-cli.md` and follow it completely before moving to the next included app.
- **apps/mobile (+ widgetbook) — only if `has_mobile`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/layer-mobile.md` and follow it completely before moving to the next included app.
- **packages/ui — only if `has_web` or `has_admin`:** read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-scaffold/references/packages-ui.md` and follow it completely. Do this BEFORE the apps/web or apps/admin sections above run their CLI — see the ordering note earlier in this step.

**packages/domain:**

**`packages/domain/package.json`** — no official CLI opinion here, so `lint` is added directly:
```json
{
  "name": "@{project}/domain",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "oxlint"
  },
  "devDependencies": {
    "@{project}/config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

**`packages/domain/tsconfig.json`** — extends the base directly, by name (not the root, not a relative path):
```json
{
  "extends": "@{project}/config/tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

**`packages/domain/.oxlintrc.json`**:
```json
{ "extends": ["../config/oxlint.base.json"] }
```

**`packages/domain/src/index.ts`**
```typescript
export type ID = string;
export type ISODate = string;
```

Note: Only base primitives live here at scaffold time. Domain types (KarmaScore, Level, Streak, etc.) are added as product features are built. Financial types (Cents, ISOCurrency) are added only when billing features are scoped.

**packages/api-client — only if `has_api`:**

**`packages/api-client/package.json`** — name `@{project}/api-client`, with workspace deps:
```json
{
  "name": "@{project}/api-client",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "lint": "oxlint"
  },
  "dependencies": {
    "@{project}/domain": "workspace:*"
  },
  "devDependencies": {
    "@{project}/config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

**`packages/api-client/tsconfig.json`** — extends the base directly, by name:
```json
{
  "extends": "@{project}/config/tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

**`packages/api-client/.oxlintrc.json`**:
```json
{ "extends": ["../config/oxlint.base.json"] }
```

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

If `README.md` exists, prepend a "Local Development" section. If it doesn't exist, create with the full template: read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/scaffold-readme.md` and substitute `{Project Name}`, `{Tagline from PRODUCT.md}`, `{project}`.

The template assumes the full stack — when a layer isn't in `stack_layers`, delete its lines before writing: the `Backend` bullet (if `!has_api`), `Mobile` bullet (if `!has_mobile`), `Setup` step 2/flutter pub get (if `!has_mobile`), `Setup` step 4/docker compose (if `!has_api`), the corresponding `Run` table rows (API/Admin/Mobile/Widgetbook, and Mailhog UI if `!has_api`), the `Verify it works` curl block (if `!has_api`), and the matching `Tests` lines (NestJS E2E if `!has_api`, Flutter lines if `!has_mobile`). Docs links (Storybook/Widgetbook/Playwright) only for docs actually written in Step 5b.

### Step 5b: Generate docs/STORYBOOK.md, docs/WIDGETBOOK.md, and docs/PLAYWRIGHT.md

Create a `docs/` directory if it doesn't exist. Write only the docs whose layer was generated:

- `docs/STORYBOOK.md` — only if `has_web` or `has_admin`. Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/scaffold-storybook.md`, substitute `{Project Name}`, `{default_theme}`.
- `docs/WIDGETBOOK.md` — only if `has_mobile`. Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/scaffold-widgetbook.md`, substitute `{Project Name}`, `{default_theme}`.
- `docs/PLAYWRIGHT.md` — only if `has_e2e`. Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/scaffold-playwright.md`, substitute `{Project Name}`, `{project}`. The template branches on `has_web` (local webServer vs external `BASE_URL`) — strip the branch that does not apply.

### Step 5c: Generate CLAUDE.md

Write `CLAUDE.md` at the project root: read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/scaffold-claude-md.md`, substitute `{project}` and `{Project Name}`. This file is read by Claude Code on every session — keep it factual and command-focused, no prose.

Same layer-stripping as Step 5: delete Stack/Commands/Key Files lines for layers not in `stack_layers` (Backend/api if `!has_api`, Mobile/flutter lines if `!has_mobile`, E2E if `!has_e2e`) — don't document commands for apps that weren't generated.

Also add `CLAUDE.md` to the review detection table in `--review` mode: `CLAUDE.md ✓ present / ✗ missing`.

### Step 6: Update CHANGELOG.md

Read `CHANGELOG.md`. Under `## [Unreleased]`, append only the bullets for layers actually generated:

```markdown
### Added
- [01-infra-base] Scaffolded monorepo with apps/{included layers only} and packages/{ui and api-client only if their layer is included; domain, config always}
- [01-infra-base] Docker Compose with MongoDB, Redis, Mailhog                          ← only if has_api
- [01-infra-base] GitHub Actions CI pipeline
- [01-infra-base] Health endpoint at GET /api/v1/health                                ← only if has_api
- [01-infra-base] Storybook + Widgetbook catalogs with Welcome component (DESIGN.md tokens)  ← only the ones generated
- [01-infra-base] Root README.md with local development instructions
- [01-infra-base] Default theme detection from DESIGN.md (asks user if missing)        ← only if any UI layer included
- [01-infra-base] Centered welcome screens for web, admin, mobile, widgetbook, storybook (DESIGN.md tokens)  ← list only generated ones
- [01-infra-base] Smoke tests (vitest) for web and admin                               ← only for layers generated
- [01-infra-base] Playwright browser auto-install on scaffold                          ← only if has_e2e
- [01-infra-base] CLAUDE.md with stack overview, commands, and conventions for Claude Code sessions
- [01-infra-base] docs/STORYBOOK.md, docs/WIDGETBOOK.md, and docs/PLAYWRIGHT.md         ← list only the ones written in Step 5b
```

### Step 7: Initialize .specs/01-infra-base/

Create `.specs/01-infra-base/`. Use the templates:

**`meta.md`:** Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/meta.md`. Substitute slug=01-infra-base, branch=feature/01-infra-base, current date. Set ALL status fields to `pending` initially — they update progressively as user verifies.

**`functional-spec.md`:** Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/infra-base-functional-spec.md` and substitute `{today}`. This is a fixed doc otherwise (AC-2 and AC-3 wording never changes) — the only per-project variance is which ACs are included: keep AC-1 only if `has_api`, AC-2 only if `has_web`, AC-4 only if `has_mobile`, AC-5 only if `has_web` or `has_admin` or `has_mobile`. AC-3 (quality gates) always applies. Renumber the kept ACs sequentially. Update the `Scope` and `Edge cases` sections to list only the apps/packages actually generated.

**`technical-spec.md`:** Write a short doc with the directory tree generated.

**`review-guide.md`:** Read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/review-guide.md` and customize for 01-infra-base. Manual Test Steps: include only the steps for layers actually generated, renumbered sequentially:
1. `pnpm install` succeeds with no errors
2. `docker compose up -d` starts MongoDB, Redis, Mailhog                              ← only if has_api
3. `pnpm --filter @{project}/api dev` starts API                                      ← only if has_api
4. `curl http://localhost:3000/api/v1/health` returns `{"status":"ok"}`               ← only if has_api
5. `pnpm --filter @{project}/web dev` shows page at http://localhost:3001             ← only if has_web
6. `pnpm --filter @{project}/admin dev` shows page at http://localhost:3002           ← only if has_admin
7. `pnpm --filter @{project}/ui storybook` shows Storybook with example stories at http://localhost:6006  ← only if has_web or has_admin
8. `cd apps/mobile && flutter pub get && flutter run` runs on emulator/device         ← only if has_mobile
9. `cd apps/mobile/widgetbook && flutter pub get && flutter run -d chrome` shows Widgetbook  ← only if has_mobile
10. `pnpm --filter @{project}/e2e test` runs Playwright sample                        ← only if has_e2e
11. `pnpm lint && pnpm type-check` pass with no errors
12. VS Code shows no TypeScript errors when opening the project

**`gate-context.md`:** empty header only — will be written on approval.

Create `.specs/_system/.gitkeep` so the system spec directory exists from the start. The full `_system/infra.md` entry is written on approval (Step 9).

### Step 8: MANUAL APPROVAL GATE

Print to user:

```
✓ Scaffolding complete. (layers: {stack_layers.join(', ')} · profile: {scaffold_profile})

Files generated:
  · Root config (turbo, workspace, CI, env, docker compose ← only if has_api)   ← workspace profiles; for flutter-only only .gitignore + CI (flutter job)
  · packages/{domain, config, ui ← if has_web/has_admin, api-client ← if has_api}   ← workspace profiles only (none for flutter-only)
  · apps/{only the layers included: api, web, admin, e2e, mobile, mobile/widgetbook}
  · README.md (with local development instructions)
  · CLAUDE.md (stack, commands, conventions for Claude Code sessions)
  · CHANGELOG.md updated with [Unreleased] entries
  · .specs/01-infra-base/ (meta, specs, review-guide)

Before marking 01-infra-base as DONE, verify everything works manually.
See .specs/01-infra-base/review-guide.md for the full checklist.

Quick verification (only the lines for included layers):
  1. pnpm install                                                                 ← workspace profiles (skip for flutter-only)
  2. docker compose up -d                                                          ← only if has_api
  3. pnpm --filter @{project}/api dev   (then: curl http://localhost:3000/api/v1/health)  ← only if has_api
  4. pnpm --filter @{project}/web dev   (then open http://localhost:3001)           ← only if has_web

When all checklist items in review-guide.md pass, reply 'approved' to:
  · Mark gates [FUNCTIONAL SPEC], [TECHNICAL SPEC], [TASK PLAN], [BUILD], [QA], [REVIEW] as completed/approved/green
  · Generate .specs/01-infra-base/README.md
  · Update .specs/README.md to mark 01-infra-base as [✓]
  · Commit, then merge feature/01-infra-base into develop
  · Trigger /j-flow-recommend

Reply 'approved' when ready, or describe issues to fix.
```

### Step 9: On approval

When user replies 'approved':

1. Update `meta.md`: set all gate fields to approved/green/completed with current date, set `finish_status: completed` and `finish_completed_at: {today's date}` (01-infra-base skips `/j-flow-finish` — this step is its equivalent), set `current_phase` to done.

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

3. Write `.specs/_system/infra.md` using the system-domain template. Initialize with the 01-infra-base ACs verbatim (Given/When/Then format) under a `### 01-infra-base` entry. This seeds the living system spec that `/j-flow-finish` will append to on future feature completions.

4. Generate `.specs/01-infra-base/README.md`: read `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/feature-readme.md` (same template `/j-flow-finish` uses), substitute slug=01-infra-base, branch=feature/01-infra-base, PR=none (merged locally, no PR — see step 6), AC table from `functional-spec.md`, key files from the generated directory tree in `technical-spec.md`, and "Patterns Introduced" = "Initial monorepo scaffold — see technical-spec.md for the full layout."

5. Update `.specs/README.md` symbol for `01-infra-base` from `[ ]` to `[✓]`.

6. Commit:

   Before staging anything, verify no real secret file gets swept in: for every `.env` file written in this run (root `.env` if `has_api`, `apps/api/.env` if `has_api`, and any other per-app `.env`), run `git check-ignore <path>`. If any path is NOT reported as ignored — e.g. a pre-existing, hand-edited `.gitignore` doesn't cover it — **abort loudly and do not commit**: "REFUSING TO COMMIT: {path} is not covered by .gitignore and would be committed with real secrets. Add it to .gitignore and re-run this step." A pre-existing `.gitignore` is treated as authoritative and is never auto-corrected by this skill, so this check is the only thing standing between a real secret and the commit.

   Only once every `.env` passes, stage explicitly — never `git add -A` / `git add .`, which would also catch anything `.gitignore` fails to cover:
   ```bash
   git add apps/ docs/ .specs/ .github/ README.md CHANGELOG.md CLAUDE.md .gitignore .env.example
   git add packages/ package.json turbo.json pnpm-workspace.yaml tsconfig.json .npmrc docker-compose.yml   # workspace profiles only — skip for flutter-only
   git commit -m "chore: j-flow-scaffold — 01-infra-base scaffolded and verified"
   ```
   Adjust the path list to whatever this run actually generated (per the scaffold profile and enabled layers) — the point is naming every generated top-level path explicitly, never a wildcard that could also match an uncovered `.env`.

7. Merge into `develop` and drop the feature branch (no PR — this is the bootstrap feature, nothing to review remotely):
```bash
git checkout develop 2>/dev/null || git checkout main
git merge --no-ff feature/01-infra-base -m "merge: 01-infra-base scaffold"
git branch -d feature/01-infra-base
```
If neither `develop` nor `main` exists as a fallback (shouldn't happen post `/j-flow-project`), stay on `feature/01-infra-base` and warn the user to merge manually.

8. Offer initial release. Read the root `package.json` `version` field (scaffold seeds it at `0.1.0`). Ask:
```
01-infra-base done — this is usually the first shippable checkpoint.

Cut the initial release (v{version})?

  1. Yes — run /j-flow-release now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```
- Reply `1`: invoke `/j-flow-release` with no argument. Mode A detects there are no existing git tags and uses the current root `package.json` version as-is (no semver bump) — see `j-flow-release/SKILL.md` Step 1. Wait for it to finish before continuing to item 9.
- Reply `2`: skip release, continue to item 9.

9. Print success and invoke `/j-flow-recommend`:
```
✓ 01-infra-base marked as done.

Loading recommended plugins and tools...
```
Then invoke `/j-flow-recommend` (it ends with its own dialogue offering to start the next backlog feature — nothing further to do here).

---

## Rules

- Always use official CLIs first (`@nestjs/cli`, `pnpm create vite`, `pnpm create playwright`, `flutter create`, `storybook init`) — never hand-roll their setup
- Official CLIs run at a **pinned, known-good version** — not `@latest`. Pins live in the "Pinned tool versions" table above Step 4 and are reviewed on a 3–6 month cadence (or immediately if a pinned tool ships a security advisory), each time verified by actually running the scaffold end-to-end (`pnpm install` + `pnpm build` + `pnpm test`, not just `npm test`'s static validator) before the new pin is committed. This is a direct lesson from plans 039–042: a moving target (`@latest`, or "resolve the real version live") means this skill's own post-processing steps — written against one CLI's output shape — silently drift out of sync with what actually gets installed.
- Idempotent: never re-run a CLI if the target directory already has content
- Review mode is read-only — never write any files when `--review` flag is present
- Never run `pnpm install` or `flutter pub get` — those go in the README instructions for the user
- Verify prerequisites (node, pnpm, flutter) before running anything
- Generate mode always works on `feature/01-infra-base` (Step 1c), never commits scaffold output directly to `main`/`develop`
- Use `--skip-git` flags where supported so we maintain a single commit at the end
- Read `**Layers:**` from `PRODUCT.md` (default: all four — web, api, mobile, admin — if missing) to determine `stack_layers`. Skip an app/package's entire generation section — CLI run, post-processing, docs, CHANGELOG bullets, review-guide steps — when its layer isn't included. Never ask a separate per-layer Y/N question; the scaffold plan confirmation (Step 1) is the single gate.
- Never add `baseUrl` to any tsconfig — use `paths` only when needed, without `baseUrl`
- Project name derivation: always read from `PRODUCT.md` **Name** field. Convert to lowercase-hyphenated slug for package names (`{project}`). Use original casing for display names in source files (`{Project Name}`).
