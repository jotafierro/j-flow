# Scaffold Layer — e2e

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_e2e`. Covers `apps/e2e` (Playwright).

**apps/e2e (Playwright) — only if `has_e2e`.** The e2e layer is a first-class, independently-selectable Playwright harness. Its target depends on whether `web` is also present:
- **`has_e2e && has_web`** → Playwright boots the local web dev server (a `webServer` block), today's behavior.
- **`has_e2e && !has_web`** (e2e-only, or e2e+api/mobile/cli) → NO `webServer`; Playwright drives an **external** target at `process.env.BASE_URL` (a deployed URL, a staging env, or another repo's server). This is the "e2e test project against an external target" case.

```bash
cd apps && pnpm create playwright@latest e2e --quiet --browser=chromium --no-browsers
cd ..
```

`--gha` and `--install-deps` are boolean flags with no `=value` form (verified against `create-playwright --help`) — `--gha=false` errors. Omit both entirely; their default is already `false`. `--no-browsers` skips downloading all 3 browser binaries here since only chromium gets installed explicitly below.

Post-process `apps/e2e/package.json` — rename to `@{project}/e2e`.

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

- **`has_web`**: keep the `webServer` block — `pnpm --filter @{project}/e2e test` boots the web dev server on demand and shuts it down afterward (`reuseExistingServer: !CI` reuses a running one locally).
- **`!has_web`**: DELETE the entire `webServer` block. Playwright runs against whatever `BASE_URL` points at; there is no local server to boot. Print in the post-scaffold output: "e2e is external-target — set `BASE_URL` (e.g. `BASE_URL=https://staging.example.com pnpm --filter @{project}/e2e test`)."

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
This downloads only the chromium binary so `pnpm test` works first try without pulling firefox/webkit too. One-time download (~120MB), under 30 seconds.
