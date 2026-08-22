# Scaffold Layer — e2e

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_e2e`. Covers `apps/e2e` (Playwright).

**apps/e2e (Playwright) — only if `has_e2e`.** The e2e layer is a first-class, independently-selectable Playwright harness. Its target depends on whether `web` is also present:
- **`has_e2e && has_web`** → Playwright boots the local web dev server (a `webServer` block), today's behavior.
- **`has_e2e && !has_web`** (e2e-only, or e2e+api/mobile/cli) → NO `webServer`; Playwright drives an **external** target at `process.env.BASE_URL` (a deployed URL, a staging env, or another repo's server). This is the "e2e test project against an external target" case.

```bash
cd apps && pnpm create playwright@1.17.139 e2e --quiet --browser=chromium --no-browsers
cd ..
```

`--gha` and `--install-deps` are boolean flags with no `=value` form (verified against `create-playwright --help`) — `--gha=false` errors. Omit both entirely; their default is already `false`. `--no-browsers` skips downloading all 3 browser binaries here since only chromium gets installed explicitly below.

Post-process `apps/e2e/package.json` — rename to `@{project}/e2e`; add `"@{project}/config": "workspace:*"` to devDependencies and a `"type-check": "tsc --noEmit"` script.

**Write the test scripts, replacing the `npm init` placeholder.** `create-playwright` leaves `"test": "echo \"Error: no test specified\" && exit 1"` behind (see the CLI abort documented below), so this is an overwrite, not an addition:
```json
"scripts": {
  "e2e": "playwright test",
  "e2e:headed": "playwright test --headed",
  "report": "playwright show-report",
  "type-check": "tsc --noEmit"
}
```

**There is deliberately no `test` script here.** Turbo runs a task by matching its name against each package's scripts, so a `test` script in this package would pull Playwright — browsers, and a booted web server — into the root `pnpm test`, which is the command `/j-flow-qa` invokes at every gate and CI runs on every push. It must stay unit-tests-in-seconds. `e2e` is its own turbo task instead (see `SKILL.md`'s `turbo.json`), run as a separate CI step. `e2e:headed` and `report` are not turbo tasks at all, so they only ever run through an explicit `--filter`.

**Ensure `"@playwright/test": "catalog:"` is in devDependencies — create it if absent, don't assume the CLI wrote it.** It resolves from the `catalog["@playwright/test"]` entry in `pnpm-workspace.yaml` (Step 2) instead of drifting independently from whatever `packages/ui` ends up with. The catalog needs both the `playwright` and `@playwright/test` keys — pnpm resolves `catalog:` by exact package name, and these are two different npm packages (see Step 2's catalog block).

Create-if-missing rather than rewrite-the-line, because whether the CLI gets that far depends on context — verified both ways:

- **Inside the workspace** (the normal case, root `pnpm-workspace.yaml` present): the CLI succeeds, and because `@playwright/test` is in the catalog, `pnpm add` writes `"catalog:"` for you. The reconciliation is already done; just confirm it.
- **Standalone** (no workspace root): `create-playwright@1.17.139` writes `devEngines.packageManager.version: "^11.20.0"` into the `package.json` it generates, then runs `pnpm add --save-dev @playwright/test` against it, and pnpm rejects its own generated file — `Invalid package manager specification in package.json (pnpm@^11.20.0); expected a semver version` — so the CLI aborts leaving a stub.

Either way, assert the end state rather than assuming a path. If a `devEngines` block is present, strip it: the workspace already declares `packageManager` at the root, and a range there breaks later pnpm commands in this package.

**The scripts are missing in both cases** — the CLI never writes them here, which is why the scripts step above is an overwrite-or-create, not an edit.

**Create `apps/e2e/tsconfig.json`** — `create-playwright` doesn't generate one, so `apps/e2e` has no tsconfig at all today:
```json
{
  "extends": "@{project}/config/tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "noEmit": true
  },
  "include": ["tests", "playwright.config.ts"]
}
```
`DOM` is required even though specs run in Node — `page.evaluate()` callbacks are serialized and executed inside the browser, so they reference `window`/`document`/`HTMLElement`.

**Configure `apps/e2e/playwright.config.ts`** — `baseURL` always reads `process.env.BASE_URL` with a localhost fallback; the `webServer` block is emitted **only when `has_web`**:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // webServer: ONLY when has_web — boots the local web dev server automatically.
  // Omit this whole block when !has_web; Playwright then drives BASE_URL directly.
  webServer: {
    command: 'pnpm --filter @{project}/web dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- **`has_web`**: keep the `webServer` block — `pnpm --filter @{project}/e2e e2e` boots the web dev server on demand and shuts it down afterward (`reuseExistingServer: !CI` reuses a running one locally).
- **`!has_web`**: DELETE the entire `webServer` block. Playwright runs against whatever `BASE_URL` points at; there is no local server to boot. Print in the post-scaffold output: "e2e is external-target — set `BASE_URL` (e.g. `BASE_URL=https://staging.example.com pnpm e2e`)."

**Replace `apps/e2e/tests/health.spec.ts`** — branch the smoke by whether a local web app exists:

- **`has_web`** (asserts the web welcome page; the default `toHaveTitle` test fails because the welcome page sets the project name in the body, not the `<title>` tag):

```ts
import { test, expect } from '@playwright/test';

test('homepage shows project title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText('{Project Name}');
});
```

Substitute `{Project Name}` with the actual product name from PRODUCT.md.

- **`!has_web`** (target-agnostic reachability smoke — no assumption about the external app's content):

```ts
import { test, expect } from '@playwright/test';

test('target is reachable', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok(), `BASE_URL (${process.env.BASE_URL ?? 'unset'}) did not return a 2xx`).toBeTruthy();
});
```

**Install Playwright browser binaries:**

`--no-browsers` in the create step above skips browser binary downloads entirely. After scaffolding apps/e2e, run:
```bash
cd apps/e2e && pnpm exec playwright install chromium && cd ../..
```
This downloads only the chromium binary so `pnpm e2e` works first try without pulling firefox/webkit too. One-time download (~120MB), under 30 seconds.
