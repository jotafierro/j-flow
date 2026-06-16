# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of j-flow plugin: gate-based SDD workflow for MongoDB + NestJS + React + Flutter
- 14 user-facing skills: `/j-flow-project`, `/j-flow-scaffold`, `/j-flow-start`, `/j-flow-spec`, `/j-flow-plan`, `/j-flow-build`, `/j-flow-qa`, `/j-flow-review`, `/j-flow-finish`, `/j-flow-release`, `/j-flow-reopen`, `/j-flow-update`, `/j-flow-check`, `/j-flow-recommend`
- 1 internal skill `/j-flow-shared` exposing templates and references
- 7 domain agents: architect, backend, frontend, mobile, devops, quality, reviewer — each with required-reading section and per-repo memory file
- 13 shared templates under `skills/j-flow-shared/templates/`
- 4 shared references under `skills/j-flow-shared/references/`
- `/j-flow-scaffold` uses official CLIs (`@nestjs/cli`, `pnpm create vite`, `pnpm create playwright`, `flutter create`, `npx storybook init`) and includes a manual approval gate
- `/j-flow-project --from` and `--from-design` flags
- Health endpoint at `GET /api/v1/health` in scaffolded API
- `pnpm.overrides` to pin `esbuild` for Storybook compatibility
- Widgetbook scaffolded with `--project-name=widgetbook_app` to avoid self-reference
- `tests/validate.js` structural validator (85 checks)
- 4 YAML scenario test specs under `tests/scenarios/`
