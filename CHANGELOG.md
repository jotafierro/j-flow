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
- Widgetbook scaffolded with `--project-name=widgetbook_app` to avoid self-reference
- Scaffold detects default theme from `DESIGN.md` (asks the user if not specified)
- Scaffold generates DESIGN.md-aware welcome screens for web, admin, mobile, widgetbook, storybook
- Scaffold runs `pnpm exec playwright install chromium` after creating apps/e2e
- Scaffold generates smoke tests (vitest) for web and admin so `pnpm test` is green out of the box
- Scaffold replaces Flutter `test/widget_test.dart` to match the replaced `main.dart` (default counter test is broken once main.dart is overwritten)
- Scaffold generates `docs/STORYBOOK.md` and `docs/WIDGETBOOK.md`; README links to both
- Per-app `.env.example` generated separately from root `.env.example` (root only carries docker-compose vars)
- TypeScript tsconfigs generated without deprecated `baseUrl` (Plan TS 7.0)
- `plugin.json` author field is an object (Claude Code plugin loader requirement)
- Skill files use the `SKILL.md` filename (Claude Code plugin loader requirement)
- `tests/validate.js` structural validator (91 checks)
- 4 YAML scenario test specs under `tests/scenarios/`
- `tests/run-scenarios.js` — scenario test runner with `js-yaml` (file-system assertions; LLM-execution matchers deferred)
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) runs `validate.js` on push and PR
