# Playwright E2E — {Project Name}

End-to-end browser tests in `apps/e2e`. The e2e layer is independent of `web`; its target depends on whether a local web app was scaffolded:

- **With `web`** (local target): runs against the React + Vite web app at `http://localhost:3001`, which `playwright.config.ts` boots automatically via its `webServer` block.
- **Without `web`** (external target): runs against `process.env.BASE_URL` — a deployed/staging URL or another repo's server. There is no `webServer` block; set `BASE_URL` before running (e.g. `BASE_URL=https://staging.example.com pnpm e2e`).

> When generating this doc, keep only the bullet that matches the project (`has_web` vs `!has_web`) and drop the other.

## Run

```bash
pnpm e2e                                     # headless, from the repo root
pnpm --filter @{project}/e2e e2e             # same, this package only
pnpm --filter @{project}/e2e e2e:headed      # headed (visible browser)
pnpm --filter @{project}/e2e report          # open last HTML report
```

**With `web`:** `playwright.config.ts` declares a `webServer` block that boots `pnpm --filter @{project}/web dev` automatically. No need to start the web app separately — locally Playwright reuses a running dev server if one is already up (`reuseExistingServer: !CI`); in CI it starts a fresh one.

**Without `web`:** there is no `webServer` block. `baseURL` is `process.env.BASE_URL` — point it at your running target before invoking the tests.

Note there is deliberately **no `test` script** in `apps/e2e`: the root `pnpm test` stays unit-tests-only, and e2e runs as its own `pnpm e2e` task. That keeps the command your QA gate and CI run on every change fast.

## Where tests live

- `apps/e2e/tests/*.spec.ts` — test specs
- `apps/e2e/lib/` — reusable fixtures, page objects, helpers
- `apps/e2e/playwright.config.ts` — config (baseURL, projects, webServer)
- `apps/e2e/global-setup.ts` — runs once before all tests (seed test data, warm services)

## Adding a test

```ts
import { test, expect } from '@playwright/test';

test('users can sign in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('changeme');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

Prefer semantic selectors (`getByRole`, `getByLabel`, `getByText`) over CSS selectors.

## Browser binaries

Browser binaries are installed during scaffold via `pnpm exec playwright install chromium`. If a fresh clone is missing them:

```bash
cd apps/e2e && pnpm exec playwright install chromium
```

## Debugging

```bash
pnpm --filter @{project}/e2e exec playwright test --debug   # opens Inspector
pnpm --filter @{project}/e2e exec playwright codegen http://localhost:3001  # generate test from interactions
```

Failed runs save traces under `apps/e2e/test-results/`. Open one with:

```bash
pnpm --filter @{project}/e2e exec playwright show-trace test-results/<run>/trace.zip
```

## CI

Playwright runs in the GitHub Actions workflow at `.github/workflows/ci.yml`. CI installs browser binaries and runs `pnpm e2e` as a step of its own, after `pnpm test`, against a fresh web server boot.
