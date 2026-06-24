# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial j-flow plugin: gate-based SDD workflow for MongoDB + NestJS + React + Flutter
- 16 user-facing skills: `/j-flow-project`, `/j-flow-scaffold`, `/j-flow-start`, `/j-flow-spec`, `/j-flow-plan`, `/j-flow-build`, `/j-flow-qa`, `/j-flow-review`, `/j-flow-finish`, `/j-flow-release`, `/j-flow-reopen`, `/j-flow-update`, `/j-flow-check`, `/j-flow-doctor`, `/j-flow-eject`, `/j-flow-recommend`
- 1 internal skill `/j-flow-shared` exposing templates and references (collapsed to a 30-line pointer doc)
- 7 domain agents: architect, backend, frontend, mobile, devops, quality, reviewer — each with required-reading section pointing to shared references + DESIGN.md and per-repo memory file
- 13 shared templates under `skills/j-flow-shared/templates/`
- 4 shared references under `skills/j-flow-shared/references/` (gate-rules covers all 7 gates including `[TASK PLAN]` and `[FINISH]` plus complete reopen cascade)
- 10 skills have a "Required reading" section pointing to `references/` and `DESIGN.md`
- `/j-flow-scaffold` uses official CLIs (`@nestjs/cli`, `pnpm create vite`, `pnpm create playwright`, `flutter create`, `npx storybook init`) with a manual approval gate
- `/j-flow-project --from` and `--from-design` flags
- `/j-flow-doctor` — read-only target-repo diagnostics (drift, missing artifacts, backlog vs gate state)
- `/j-flow-eject [path]` — copy templates / references / agents into `.specs/.overrides/` for customization without forking
- React + Vite as the web stack (was Next.js in early designs)
- Health endpoint at `GET /api/v1/health` in scaffolded API
- `apps/api/app.module.ts` imports `ConfigModule.forRoot({ isGlobal: true })` so `.env` actually loads
- `apps/api/package.json` aliases `dev` script (NestJS CLI generates `start:dev` only)
- Internal pnpm workspace deps declared with `workspace:*` protocol (no npm registry 404)
- `docker-compose.yml` reads credentials from root `.env` via `env_file:` + environment vars
- `pnpm.overrides` to pin `esbuild` for Storybook compatibility
- Storybook pinned to v10.x with simplified `main.ts` (`addons: []`) and `.npmrc` hoist patterns for pnpm workspaces
- Widgetbook scaffolded with `--project-name=widgetbook_app` to avoid self-reference
- Scaffold detects default theme from `DESIGN.md` (asks the user if not specified)
- Scaffold generates DESIGN.md-aware welcome screens for web, admin, mobile, widgetbook, storybook
- Scaffold runs `pnpm exec playwright install chromium` after creating apps/e2e
- Scaffold generates smoke tests (vitest) for web and admin so `pnpm test` is green out of the box
- Scaffold replaces Flutter `test/widget_test.dart` to match the replaced `main.dart` (default counter test is broken once main.dart is overwritten)
- Scaffold generates `docs/STORYBOOK.md`, `docs/WIDGETBOOK.md`, and `docs/PLAYWRIGHT.md`; README links to all three
- Playwright config includes a `webServer` block so `pnpm --filter @{project}/e2e test` boots the web app automatically
- Sample E2E test uses body text assertion (`toContainText`) instead of `toHaveTitle` (welcome page sets title in body, not in `<title>`)
- Widgetbook welcome uses `MaterialThemeAddon` + `ViewportAddon` + `TextScaleAddon` and theme-aware `Material` widget (empty addons cause Widgetbook 3 to stay on loading screen)
- Per-app `.env.example` generated separately from root `.env.example` (root only carries docker-compose vars)
- Scaffold generates `apps/api/src/health/health.controller.spec.ts` so `pnpm --filter @{project}/api test` has at least one passing test (Jest exits 1 with 0 tests otherwise)
- Scaffold merges `"types": ["node", "jest"]` into `apps/api/tsconfig.json` so the VS Code TS server resolves `describe`/`it`/`expect` in spec files (ts(2593))
- Scaffold generates `apps/api/test/tsconfig.json` with `noEmit: true` and `rootDir: ".."` to fix ts(2593) and ts(6059) in editor for e2e specs
- Scaffold patches `apps/api/test/app.e2e-spec.ts` `.expect()` callback with explicit type `(res: { body: { status: string } })` to fix `@typescript-eslint/no-unsafe-member-access`
- Widgetbook `initialTheme` now references the same instance from the `themes` list (`themes[index]`) — a new `WidgetbookTheme(...)` object with identical data failed the `themes.contains(initialTheme)` identity assertion at runtime
- TypeScript tsconfigs generated without deprecated `baseUrl` (Plan TS 7.0)
- `plugin.json` author field is an object (Claude Code plugin loader requirement)
- CI uses `actions/checkout@v5`, `actions/setup-node@v5` (Node 24), `pnpm/action-setup@v4` — Node 20 deprecated on GitHub Actions runners
- `pnpm/action-setup@v4` reads version from `packageManager` in `package.json`; no `version:` key in the action step (conflicts in v4)
- CI adds `playwright install --with-deps chromium` before `pnpm test` — local binary not committed, CI must install it
- Flutter CI bumped to `3.41.x` to satisfy Dart `^3.11.5` in pubspec; removed invalid `hashFiles()` job-level `if` on flutter job
- `apps/api/src/main.ts` calls `void bootstrap()` instead of bare `bootstrap()` to silence `@typescript-eslint/no-floating-promises`
- Scaffold generates `CLAUDE.md` at project root with stack overview, dev commands, conventions, and key files — loaded by Claude Code on every session
- Skill files use the `SKILL.md` filename (Claude Code plugin loader requirement)
- `tests/validate.js` structural validator (91 checks)
- 4 YAML scenario test specs under `tests/scenarios/`
- `tests/run-scenarios.js` — scenario test runner with `js-yaml` (file-system assertions; LLM-execution matchers deferred)
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) runs `validate.js` on push and PR
- `[NEEDS CLARIFICATION: {question}]` marker convention in `functional-spec.md` template — lets users flag unresolved questions during spec dialogue without blocking approval
- `/j-flow-plan` clarification check: blocks task generation if any `[NEEDS CLARIFICATION]` markers remain in `functional-spec.md`, listing each unresolved item
- `/j-flow-spec` partial-answer guidance: dialogue now instructs users to use the marker for incomplete answers; warns after approval if markers are present
- `gate-rules.md` documents the clarification marker convention and its behavior across gates
- Given/When/Then format for Acceptance Criteria in `functional-spec.md` template — `### AC-N — {name}` heading with `Given / When / Then:` structure replaces free-form bullets
- `Functional scenarios` section moved to optional (bottom of template) — for complex multi-step flows only
- `/j-flow-spec` dialogue question 4 updated to guide GWT format with example; draft step now converts free-form ACs to GWT before showing draft
- `gate-rules.md` documents GWT AC format and backwards-compatibility with free-form specs
- `templates/system-domain.md` — new template for per-domain living system spec files
- `/j-flow-finish` new Step 3b: asks domain, merges feature ACs into `.specs/_system/{domain}.md`, shows diff before writing
- `/j-flow-spec` now reads `.specs/_system/` as behavioral baseline before drafting; surfaces AC overlaps with existing system behavior
- `README.md` documents `.specs/_system/` convention and purpose
- `templates/constitution.md` — new template for inviolable project principles
- `/j-flow-project` Step 8b: generates `CONSTITUTION.md` during init (with principles dialogue or skip to placeholder)
- `/j-flow-review` principles check: evaluates each principle in `CONSTITUTION.md` against feature code before dispatching reviewer agent; blocks gate on violation; non-blocking when file absent or placeholder
- `[REVIEW]` gate context entry now records constitution check result
- `README.md` documents `CONSTITUTION.md` in project file structure
- `/j-flow-analyze` — new read-only skill with 5 cross-consistency checks: unresolved clarification markers, AC→task coverage, task→AC traceability, AC→test coverage, system spec collision detection against `.specs/_system/`
- `/j-flow-spec --explore` — lightweight scoping mode: 5-question conversational dialogue, no files written, ends with scope summary and offer to transition to formal spec
- All gate skills now update `.specs/README.md` status symbol on approval — `[SF]`, `[TF]`, `[P]`, `[B]`, `[Q]`, `[R]`, `[✓]` were never written before
