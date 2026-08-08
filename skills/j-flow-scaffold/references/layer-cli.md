# Scaffold Layer — cli

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_cli`. Covers `apps/cli` (hand-templated commander CLI — the one exception to "official CLIs first").

**apps/cli (commander CLI) — only if `has_cli`.** There is no official commander scaffolder, so this app is **hand-templated** — the one acknowledged exception to the "official CLIs first" rule (see Rules). Layout depends on `scaffold_profile`: under `apps/cli/` for `minimal-workspace`/`full`, or at the repo root (flat `src/`) for `bare-single-package`. Below, `{cli_root}` = `apps/cli` (workspace) or `.` (bare).

Generate:

1. **`{cli_root}/package.json`** — bundled bin, ESM. In a workspace, name `@{project}/cli` and add `@{project}/domain` (`workspace:*`) always plus `@{project}/api-client` **only if `has_api`** (same rule as apps/web). In `bare-single-package`, name `{project}`, and OMIT all `workspace:*` deps (there are no packages).
```json
{
  "name": "@{project}/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "{project}": "./dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "start": "node dist/index.js",
    "test": "vitest run",
    "lint": "oxlint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "picocolors": "^1.0.0",
    "@{project}/domain": "workspace:*"
  },
  "devDependencies": {
    "@{project}/config": "workspace:*",
    "tsup": "^8.0.0",
    "vitest": "^2.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^22.0.0"
  }
}
```
(In `bare-single-package`, omit `@{project}/config` too — same rule as the other `workspace:*` deps: no packages, nothing to reference by name. Its `tsconfig.json` below stays standalone.)

2. **`{cli_root}/tsup.config.ts`** — bundles `src/index.ts` to a self-contained bin with a shebang banner (do NOT put the shebang in `src/`):
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
});
```

3. **`{cli_root}/tsconfig.json`** — workspace: `{ "extends": "@{project}/config/tsconfig.base.json" }`, by name (matches the `workspace:*` dep added above); bare: a standalone strict config (target ES2022, module ESNext, `moduleResolution: bundler`, strict).

4. **`{cli_root}/.oxlintrc.json`** — workspace: `{ "extends": ["../config/oxlint.base.json"] }`; bare: `{}` (no `packages/config` to extend, same reasoning as its standalone tsconfig).

5. **`{cli_root}/src/index.ts`** — a commander entrypoint with one sample command and a `-y` escape hatch:
```ts
import { Command } from 'commander';
import pc from 'picocolors';

const program = new Command();
program.name('{project}').description('{Project Name} CLI').version('0.1.0');

program
  .command('hello')
  .description('print a greeting')
  .option('-y, --yes', 'skip confirmation')
  .action((opts: { yes?: boolean }) => {
    console.log(pc.green(`Hello from {Project Name}${opts.yes ? '' : ' 👋'}`));
  });

program.parseAsync();
```

6. **`{cli_root}/src/hello.test.ts`** — a vitest unit test for a pure function (proves the test runner is wired). Keep the tested logic pure (parse/format), separate from the command action.

In a workspace, the root `pnpm build`/`test`/`lint`/`type-check` (turbo) pick up `apps/cli` automatically — no CI change needed (the always-on `test` job covers it). In `bare-single-package`, the scripts above are the project's own entrypoints.
