# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **`packages/config`'s `tsconfig.base.json` was not actually inheritable.** It mixed policy (`strict`, `isolatedModules`) with emission flags (`declaration`, `declarationMap`, `sourceMap`) and NestJS-only flags (`experimentalDecorators`, `emitDecoratorMetadata`), so a plain Vite app extending it failed to compile (`declaration: true` makes every inferred type require a portable name — TS2883). The base is now policy-only; emission and decorator flags moved to two conditional overlays, `tsconfig.lib.json` (only if a package publishes `.d.ts` — none do by default today) and `tsconfig.nest.json` (only if `has_api`).
- `layer-web.md`, `layer-admin.md`, `layer-api.md`, `layer-e2e.md`, and `packages-ui.md` now reconcile the tsconfig their official CLI (Vite/NestJS/Storybook/`create-playwright`) generates back onto `packages/config`'s base — previously none of them did, so `apps/web`, `apps/admin`, `apps/api`, `apps/e2e`, and `packages/ui` never actually inherited the shared config despite `SKILL.md` documenting that as the intended design. `apps/e2e` and `packages/ui` gain their first `tsconfig.json` (neither had one).

### Changed
- All internal `tsconfig.json` `extends` (`packages/domain`, `packages/api-client`, `apps/cli`, and the new reconciliation steps above) now consume `packages/config` **by name** (`@{project}/config/tsconfig.base.json` + `"@{project}/config": "workspace:*"`) instead of a relative path or an indirect bounce through the root `tsconfig.json` — consistent with the `workspace:*`-for-internal-deps rule j-flow itself generates for consumers.
- `tests/validate.js` adds a static guard: every scaffold reference that generates a tsconfig must document a reconciliation step pointing at `packages/config`'s base (163 checks total, up from 157).

## [2.3.0] - 2026-08-07

### Added
- **`/j-flow-start {slug} --quick` — fast-track mode.** Sets `fast_track: true` in `meta.md`; every later gate collapses a redundant confirmation on the happy path (replying "approved" to a spec/plan/review gate now also continues to the next command; a non-blocking build/qa result advances without a separate "Continue? 1/2" prompt). `/j-flow-build`'s smoke-check defaults to `skip` on an empty reply in fast-track (logged distinctly from an explicit skip). Never collapses a blocking outcome — QA red, review changes-requested, or unresolved clarification markers always stop and ask regardless. `/j-flow-check` shows `Fast-track: on` when set.
- `.github/ISSUE_TEMPLATE/` (bug report, feature request) and `.github/PULL_REQUEST_TEMPLATE.md`.
- `package.json` now declares an explicit `files` array, so the npm tarball no longer depends on the `.gitignore` fallback.

### Changed
- **`references/gate-rules.md` (8.7 KB, re-read up to ~10× per feature cycle) split into `gate-core.md`, `gate-cascade.md`, `gate-symbols.md`, and `spec-markers.md`** — each skill now reads only what its own gate/reopen/backlog/AC needs, with an explicit "skip if already in context" note on every Required-reading block.
- **`j-flow-scaffold/SKILL.md` (the largest file in the repo, ~18k tokens) now has its own `references/` directory**: each `has_*` layer's generation instructions (api, web, admin, e2e, cli, mobile) and `packages/ui` moved to their own file, loaded only when that layer is selected; `--review` mode moved to `references/review-mode.md`.
- `/j-flow-build`'s ui+mobile parallel dispatch (already documented in `agent-scopes.md`) is now actually wired into the Build Loop, and no longer depends on the third-party `superpowers:dispatching-parallel-agents` skill — it dispatches both agents as concurrent tool calls in the same turn, which the runtime already parallelizes natively.
- `/j-flow-project`'s 14 questions and `/j-flow-spec`'s 6 questions are now asked in ~3 thematic blocks each instead of one at a time, with a one-at-a-time fallback for anything left unanswered in a block's reply.
- `/j-flow-check --repo` consolidates what were 4 separate per-feature-folder scans (meta.md fields, gate-context format, stale markers, backlog-symbol match) into one pass per folder.
- `/j-flow-build --fix`'s test-file grep for stale assertions is now scoped to the scaffold's known test paths instead of the whole repo.
- `npm test` now runs only the structural validator. The scenario runner moved to `npm run scenarios:lint` — it lints YAML fixtures but can't fail on assertions that require a live skill invocation, so it no longer pretends to be a pass/fail test suite.
- `/j-flow-scaffold` now resolves and shows the actual version its first `@latest` CLI will install, and asks for one confirmation before running any of the five official-CLI invocations that follow.
- `docs/FLOW.md` and `README.md` now mention the `cli` layer (Agent Map, `.specs/.agents/` tree, build sequence, project tree, Stack table) — previously undocumented despite shipping in v2.2.0.
- `skills/j-flow-shared/SKILL.md`'s canonical-source table now lists `references/overrides.md`.
- `.github/workflows/ci.yml` no longer triggers on a `develop` branch — this repo doesn't have one (that trigger was copied from the workflow this plugin generates for *target* repos, which do use `develop`).
- The private `## Plans (development tracking)` section moved from the tracked `CLAUDE.md` to the gitignored `CLAUDE.local.md`; the tracked `CLAUDE.md` is now a short contributor-facing pointer to `CONTRIBUTING.md` and the canonical-source index.

### Fixed
- `tests/validate.js` now parses actual YAML frontmatter (`js-yaml`) instead of substring-matching, and fails on orphaned or undeclared `skills/`/`agents/` entries. This caught invalid frontmatter in 14 `SKILL.md` files (an unquoted `Usage: /command` inside a single-line YAML scalar) — fixed by quoting.
- The scaffold/product.md stack-layer consistency guard now compares exact tokens instead of substrings (it previously treated `has_api` as present inside `has_api_client`).
- `tests/run-scenarios.js` no longer crashes and leaks its fixture tmpdir when a scenario omits `gate_context`; assertion failures are now reported as `fail` instead of an uncaught exception.
- **`/j-flow-scaffold` no longer writes literal `changeme*` secrets into real `.env` files.** The Mongo root password and the two JWT secrets are now generated with `openssl rand -hex 32` at scaffold time; `changeme*` placeholders remain only in `.env.example`.
- The scaffolded `docker-compose.yml` now binds Mongo, Redis, and Mailhog to `127.0.0.1` instead of all interfaces.
- `/j-flow-scaffold`'s bootstrap commit and `/j-flow-build --fix`'s commit no longer use `git add -A` / `git add .` — both stage an explicit path list instead. The scaffold commit also refuses to proceed (loudly) if any `.env` it wrote isn't covered by `.gitignore`.
- `/j-flow-release`'s Node/Flutter version-bump loops no longer interpolate a file path into a `node -e` script body, no longer scan the whole repo tree, and are now filename-safe (`find -print0` / `read -r -d ''`) instead of a bare `while read`.
- `package-lock.json`'s version was frozen at `1.0.0` while everything else moved to `2.2.0`; synced.

### Security
- **Agent-definition overrides no longer dispatch an unrestricted `general-purpose` agent.** An override is now gated by a one-time-per-session confirmation (path + content hash) and seeded with a tool-scope ceiling matching the plugin agent it replaces — `j-flow-reviewer` and `j-flow-architect` (no `Bash` in their declared scope) can no longer gain `Bash` by being overridden. This is a behavior change for anyone relying on an override to gain tools beyond the original agent's scope — that was the actual bug.
- `/j-flow-eject` now rejects `..`, absolute, and home-relative (`~`) paths before the prefix check, and verifies the resolved source/destination stay contained under the expected plugin/`.specs/.overrides/` directories.
- `/j-flow-check {slug}` and `/j-flow-reopen [slug]` now validate the slug (fail-closed, kebab-case) before touching any path — previously only `/j-flow-start` did.
- `.specs/**` content forwarded into an agent dispatch (memory, specs, tasks) is now explicitly documented as observed project state, never instructions — `/j-flow-check --repo` adds a narrow heuristic check that flags memory files containing directives addressed at the agent itself (not ordinary imperative-sounding project notes).
- `README.md` and `.github/SECURITY.md` now state that `.specs/.overrides/` is a trust surface equivalent to executable code.
- Both `.github/workflows/ci.yml` (this repo's own, and the template `/j-flow-scaffold` generates) now declare `permissions: contents: read` and pin third-party actions by commit SHA (with a `# vN` comment) instead of a mutable version tag.
- CI now also runs `claude plugin validate . --strict`.

## [2.2.0] - 2026-08-04

### Added
- **Optional `cli` layer** — a TypeScript commander CLI (`apps/cli`) with a dedicated, light `j-flow-cli` agent (commander + tsup + vitest + picocolors). Opt-in via `**Layers:**`. A CLI-only project starts as a growth-safe minimal workspace by default (add web/mobile later without restructuring) or, if declared terminal, a flat single-package for a published npm-leaf tool. Consumes `packages/api-client` when an `api` layer is present; QA runs lint + unit (vitest) only.
- **`e2e` is now a first-class, independently-selectable layer.** Choose `e2e` on its own or in any combination (`e2e` only, `e2e,api`, …). When `web` is also present, Playwright boots the local dev server automatically; otherwise it drives an external target via `BASE_URL` (a staging/deployed URL). QA Stage 5 gates on the presence of the e2e harness rather than the web/mobile build layers.
- **Right-sized scaffold profiles.** `/j-flow-scaffold` derives a `scaffold_profile` from the selected layers: `minimal-workspace` (the default for any TypeScript layer — workspace manifests + `packages/config`/`domain`, with heavy contents deferred to the layer that needs them) that scales seamlessly to the full monorepo as layers are added; and `flutter-only` (mobile as the sole layer) which emits no TypeScript shell at all.
- **Additive layer growth.** Start a project with a single layer and add more later without restructuring: edit `**Layers:**` in `PRODUCT.md` and run `/j-flow-project --update` — agent memory is backfilled and `/j-flow-scaffold --review` reports the app/package/CI delta to generate. Every layer lives under `apps/<layer>/` from day one, so growth never moves existing code.
- The `j-flow-backend` agent now documents the in-process scripts/seeders/migrations pattern (NestFactory standalone context / nest-commander) — the right tool for backend one-offs and cron, distinct from a standalone CLI.

### Changed
- The absent-`**Layers:**` default now includes `e2e`, so existing full-stack scaffolds keep Playwright. An explicit `**Layers:**` list that names `web` without `e2e` intentionally scaffolds no Playwright.
- Root scaffold files are written create-if-missing / carry-forward: a growth re-run never clobbers hand-edited `package.json`, `turbo.json`, or `ci.yml` (CI additions are print-and-merge).

## [2.1.0] - 2026-07-31

### Added
- **Stack adaptability.** Ejected overrides are now resolved by the forward skills — edit an ejected agent / template / reference under `.specs/.overrides/` and j-flow uses it instead of the built-in default (see `references/overrides.md`). Lets you retarget the opinionated stack without forking. New guide: `docs/adapting-your-stack.md`. Previously `/j-flow-eject` copied assets but they were inert.
- MIT `LICENSE` file (the plugin already declared MIT in its manifest).
- Public marketplace install: `claude plugin marketplace add https://github.com/jotafierro/j-flow`.
- `.github/CONTRIBUTING.md` and `.github/SECURITY.md`.
- README: "What problem does it solve?", "How it works" (gate diagram), and a "Your first feature" walkthrough.

### Changed
- Moved `FLOW.md` → `docs/FLOW.md` and `MIGRATION.md` → `docs/migrations/v2.0.0.md`; added a migrations index.
- `package.json`: added `license`, `author`, `repository`, `homepage`, `keywords`.

### Fixed
- QA gate was documented as "6 stages" in `FLOW.md` / `gate-rules.md`; corrected to the canonical 7 (adds the Stage 1 Lint step).

## [2.0.0] - 2026-07-30

> **Breaking:** two slash commands were removed (folded into `/j-flow-check`) and `/j-flow-release --retroactive` was dropped. No feature-data migration needed — see [docs/migrations/v2.0.0.md](docs/migrations/v2.0.0.md) for the command-rename table.

### Changed
- **Consolidated the 3 read-only inspectors into one command.** `/j-flow-doctor` → `/j-flow-check --repo`; `/j-flow-analyze` → `/j-flow-check --consistency`; default `/j-flow-check` still shows feature status. Both old skills removed.
- **Single canonical gate-write procedure.** The 3-file gate-advance write (meta.md field + gate-context append + README symbol) and the backlog-symbol map were copy-pasted across `spec/plan/build/qa/review/finish` and duplicated in `project`/`doctor`. Now one "Advancing a gate" procedure + one "Backlog symbols" table in `gate-rules.md`; all callers reference them.

### Removed
- **`/j-flow-doctor` and `/j-flow-analyze`** as standalone commands — merged into `/j-flow-check --repo` and `/j-flow-check --consistency`.
- `/j-flow-release --retroactive` mode (rewrote git history via interactive rebase to insert past version bumps — speculative, high blast radius on the release path). Standard forward release unchanged.
- Dead `[S]` backlog symbol — was defined differently in `j-flow-project` vs `j-flow-doctor` and unreachable in both. `functional_status: pending` now maps to `[ ]`.

### Fixed
- `j-flow-reopen` targeted a nonexistent meta.md "checklist" and left cleared gates reading as approved/green/completed; `j-flow-update` marked `gate-context.md` stale but never touched `meta.md`, so `/j-flow-check` and `/j-flow-doctor` disagreed. Both now reset the real `{phase}_status` fields via one canonical "Resetting a gate" procedure in `gate-rules.md`.
- `FLOW.md` §"Shared Patterns" pointed at four things in `j-flow-shared/SKILL.md` that lived elsewhere or nowhere; pointers corrected.

### Added
- `docs/migrations/v2.0.0.md` — 1.7.0 → 2.0.0 command-rename guide.
- `gate-rules.md`: canonical "How to Find Active Feature" and "Gate Check Algorithm" sections — previously referenced by 10 skills but defined nowhere.
- Per-agent `model:` selection: `opus` for `j-flow-architect`/`j-flow-reviewer`, `sonnet` for the implementation agents.
- `allowed-tools` (read-only: `Read Grep Glob Bash`) on the read-only inspectors to mechanically enforce their read-only contract.

## [1.7.0] - 2026-07-26

### Added
- `j-flow-scaffold`: Styling question (Tailwind CSS v4 or plain CSS, default plain CSS) asked alongside API style, only when `web`/`admin` layers are included. Choice is written to `PRODUCT.md` `**Styling:**` and drives conditional dependency/config wiring for `apps/web` and `apps/admin`. `--review` mode detects styling mismatches.

### Changed
- `j-flow-scaffold`: Tailwind is no longer added to generated projects unconditionally — previously it was declared as a dependency but never actually configured (no Tailwind config, no PostCSS/Vite plugin, no `@tailwind` directive). When selected, it's now wired properly via `@tailwindcss/vite`.

## [1.6.2] - 2026-07-24

### Changed
- `j-flow-build`: normal-build mode now builds every layer with tasks first (no per-layer commit), then runs one combined smoke-check gate covering every touched layer's ACs and review files, then commits per layer. Previously each layer was smoke-checked and committed individually before the next layer was built, which meant testing sometimes ran against a partial build.

## [1.6.1] - 2026-07-22

### Added
- `j-flow-project`: Step 8 (agent memory init) now filters by `stack_layers` — `j-flow-backend` only if `api`, `j-flow-frontend` only if `web`/`admin`, `j-flow-mobile` only if `mobile`; `j-flow-architect`/`j-flow-devops`/`j-flow-quality`/`j-flow-reviewer` always created.
- `j-flow-doctor`: Agent memory check is layer-aware — reads `stack_layers` from `PRODUCT.md` before flagging missing/stale agent memory files.

## [1.6.0] - 2026-07-21

### Added
- `j-flow-project`: init mode adds Step 2b — asks which stack layers (web/api/mobile/admin) the project needs, default all four. Stored as `**Layers:**` in `PRODUCT.md`.
- `j-flow-scaffold`: reads `**Layers:**` back from `PRODUCT.md` and skips generation entirely (CLI run, docker-compose, CI jobs/services, docs, changelog bullets, review-guide steps, functional-spec ACs) for any layer not declared. Missing `**Layers:**` field defaults to the full stack (backward compatible with existing projects).
- `j-flow-scaffold`: replaces the old per-run "Generate apps/admin?" Y/N prompt with the declarative `Layers` field — one confirmation (the scaffold plan) instead of a separate question.
- `j-flow-scaffold`: `--review` reports layers omitted via `**Layers:**` as "not in scope (Layers)" instead of flagging them as missing.

## [1.5.0] - 2026-07-18

### Added
- `j-flow-project`: Phase 0 gains 2 new optional foundation features, offered the same way as `02-observability`/`04-design-polish` — `05-deploy` (shared dev environment: Railway API + Vercel web/admin + MongoDB Atlas, connected to the Sentry/GlitchTip cloud project if `02-observability` was included, so early testers get a live URL) and `06-legal-pages` (Terms of Service + Privacy Policy static pages, offered only when `PRODUCT.md`'s monetization model isn't `free`). The optional-features prompt is now a single checklist reply (numbers/`all`/`none`) instead of a fixed 4-option menu, since there can now be up to 4 optional items.
- `j-flow-project`: init mode prints a one-time, non-blocking business/legal advisory (payment processor, ToS/Privacy Policy timing, deferring company formation/trademark) when the product's monetization model isn't `free`.
- `j-flow-scaffold`: `--review` drift check now also flags `.specs/05-deploy/` and `.specs/06-legal-pages/` if present on disk but missing from `.specs/README.md`.

## [1.4.0] - 2026-07-16

### Changed
- `j-flow-project`: init mode now runs `git init -b main` automatically if no repo exists (previously stopped and told the user to run it manually), and creates a `develop` branch after the initial commit so every project has `main`+`develop` from the start.
- `j-flow-scaffold`: generate mode now works on a `feature/01-infra-base` branch (branched from `develop`) instead of committing straight to `main`/`develop`. On approval it generates `.specs/01-infra-base/README.md` (previously missing — only `/j-flow-finish` produced feature READMEs), sets `finish_status: completed` in `meta.md` (01-infra-base intentionally never runs `/j-flow-finish` — no `tasks.json` to read), and merges the branch into `develop` locally (no PR — nothing to review remotely for CLI-generated scaffolding). Before invoking `/j-flow-recommend`, it now asks (1/2 dialogue, same pattern as every other gate) whether to cut the initial release.
- `j-flow-release`: Mode A now detects a fresh repo (no git tags yet) and uses the root `package.json` version as-is instead of bumping it — lets the first release be exactly `v0.1.0` as seeded by scaffold. Push/GitHub-Release/PR steps now skip gracefully (with manual-push instructions) when no git remote is configured, instead of failing.
- `j-flow-recommend`: now ends with a 1/2 dialogue offering to start the next `[ ]` (not-yet-started) feature from `.specs/README.md`, instead of ending silently with no next-step prompt.

## [1.3.0] - 2026-07-15

### Changed
- Every phase-completion message that used to end in a bare `Next step: /j-flow-x` suggestion (start, spec, plan, build, qa, review, reopen — 11 sites) now asks a 1/2 question instead: run the next command now, or stay and discuss/adjust first. Canonical pattern lives in `references/gate-rules.md` under "Next-step dialogue". The three documented auto-chains (project→scaffold, project --update→scaffold --review, scaffold→recommend) are unchanged — they still run without asking.

## [1.2.5] - 2026-07-15

### Fixed
- `j-flow-scaffold`: `pnpm create playwright` used invalid `--gha=false`/`--install-deps=false` syntax (boolean flags, no `=value` form) — current CLI errors on this; replaced with omitting both flags plus `--no-browsers`
- `j-flow-scaffold`: `storybook init --type=react-vite` no longer valid (current CLI rejects `react-vite` as a `--type` choice) — flag removed, relies on auto-detect from existing vite+react deps; `--no-features` now used instead of hand-rewriting `.storybook/main.ts` to suppress the CLI's newer default addons (addon-vitest/a11y/docs/mcp), which pulled in Playwright + browser binary downloads even with `--skip-install`
- `j-flow-scaffold`: `.storybook/preview.ts` reference corrected to `.storybook/preview.tsx` (current CLI's actual output filename)
- `j-flow-scaffold`: packages/domain, packages/api-client, and packages/ui must now be created before any app CLI runs — apps/web and apps/admin declare `workspace:*` deps on them, and pnpm-aware commands (e.g. `pnpm create playwright`) fail resolving the workspace if those packages don't exist yet

## [1.2.4] - 2026-07-12

### Changed
- `02-observability` feature now defaults error tracking to managed cloud free tier (GlitchTip cloud dev / Sentry cloud prod, DSN swap only) instead of leaving self-hosted vs. cloud undecided — no local docker-compose service is added for it
- `code-style.md` gained a design constraint: third-party infra defaults to cloud free tier over self-hosted docker when self-hosting adds disproportionate dev complexity

## [1.2.3] - 2026-07-10

### Fixed
- `/j-flow-build` smoke-check and `/j-flow-qa` Stage 7 now flip `review/{layer}.md` checklist rows to `[x]` on approval — previously stayed at `[ ]` forever regardless of pass/fail (gap left by plan 016)

### Changed
- `/j-flow-spec technical` now permits a minimal spec for trivial features (bugfixes, config tweaks, small additions following an existing pattern) instead of forcing every template section to be filled with invented content
- `/j-flow-qa` now skips Stage 4 (Flutter integration), Stage 5 (Playwright), and each half of Stage 6 (Storybook/Widgetbook) when the corresponding layer has no tasks in the feature — previously all 7 stages ran unconditionally regardless of scope

## [1.2.2] - 2026-07-08

### Fixed
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` were stuck at version `1.0.0` since initial scaffold — never bumped across 5 releases (1.0.1..1.2.1). Marketplace/plugin install now reports the correct version. Release process (`CLAUDE.md`) updated to bump all three version fields going forward.

## [1.2.1] - 2026-07-08

### Changed
- `j-flow-scaffold`'s six static file templates (project README, docs/STORYBOOK.md, docs/WIDGETBOOK.md, docs/PLAYWRIGHT.md, CLAUDE.md, 01-infra-base functional-spec) moved to `skills/j-flow-shared/templates/` — cuts SKILL.md from 1848 to 1475 lines, no behavior change
- `j-flow-recommend`'s "Useful tools" list now points to Gemini CLI (bulk-reads) and GitHub Copilot (mechanical boilerplate) for delegating work outside Claude

## [1.2.0] - 2026-07-06

### Added
- Per-layer manual testing docs generated at plan time: `.specs/{slug}/review/api.md`, `review/web.md`, `review/mobile.md`, `review/e2e.md` — real curl commands, actual routes, and AC-keyed checklists from technical-spec (no generic prose)
- `review-guide.md` becomes an index pointing to per-layer files; per-layer files are passed to QA and review agents
- GraphQL review template `templates/review-api-graphql.md` — POST `/graphql` with query/mutation bodies, Apollo Playground setup, introspection check
- `/j-flow-scaffold` now asks REST vs GraphQL at scaffold time and reads `PRODUCT.md` `**API Style:**` field; writes choice back to PRODUCT.md
- REST scaffold: installs `@nestjs/swagger` + `swagger-ui-express`; `main.ts` wires `DocumentBuilder` + `SwaggerModule` at `/api/docs`
- GraphQL scaffold: installs `@nestjs/graphql` + `@apollo/server` + `@as-integrations/express` + `graphql`; `app.module.ts` wires `GraphQLModule.forRoot<ApolloDriverConfig>` with Apollo Playground enabled in dev
- `/j-flow-scaffold --review` detects Swagger vs GraphQL presence from `apps/api/package.json` and reports against `PRODUCT.md` `**API Style:**` field
- `j-flow-backend` agent: `## GraphQL Mode` section — resolver pattern (`@Resolver`, `@Query`, `@Mutation`, `@Args`, `@ObjectType`, `@InputType`, `@Field`), GraphQL E2E spec pattern (POST to `/graphql`)
- `j-flow-backend` agent: Swagger annotation rule — REST mode annotates controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` and DTOs with `@ApiProperty`
- `j-flow-plan` selects `review/api.md` template based on `api_style` — REST uses curl with `/api/v1/{route}`, GraphQL uses POST to `/graphql`
- `j-flow-finish` now generates `docs/architecture/{slug}.md` (verbatim Architecture Overview + Design Decisions from technical-spec) and `docs/features/{slug}.md` (user-facing rewrite of functional-spec: no jargon, AC-keyed capability bullets)
- `docs/features/README.md` capability catalog auto-upserted on each finish — one row per shipped feature, append-only
- `feature-doc.md` template added to `skills/j-flow-shared/templates/`
- `j-flow-review` Swagger coverage check: flags `@Get`/`@Post`/`@Patch`/`@Delete` methods without `@ApiOperation` and DTO properties without `@ApiProperty` as low-severity findings (REST mode only; skipped when `@nestjs/graphql` is present)

## [1.1.1] - 2026-07-03

### Changed
- `/j-flow-build` smoke check now appends result to `gate-context.md` before each layer commit — `ok` logs confirmed ACs with date (`✓ smoke check {layer} {date} — ACs confirmed: …`), `skip` logs a warning (`⚠ smoke check {layer} {date} — skipped by user`)

## [1.1.0] - 2026-07-02

### Changed
- `/j-flow-build` per-layer smoke check gate: after each agent completes a layer and before committing, skill pauses to show relevant ACs and manual test steps from `review-guide.md`; user replies `ok` to commit, `fix: <desc>` to fix inline (re-dispatches domain agent and re-shows checklist), or `skip` to bypass with a warning logged to `gate-context.md`

## [1.0.1] - 2026-07-01

### Changed
- `/j-flow-release` skill rewritten with Mode B (retroactive) — inserts version bumps into git history via `git rebase -i`; adds multi-file bump (all workspace `package.json` + `pubspec.yaml`), CHANGELOG label-split Python script, and `gh release create` step to both modes

## [1.0.0] - 2026-07-01

### Added
- All gate skills (`spec`, `plan`, `build`, `qa`, `review`, `finish`) now update `meta.md` with status, date, and `current_phase` on gate approval — previously only `scaffold` did this
- Phase 0 backlog expanded to 4 features: `01-infra-base`, `02-observability`, `03-design-system`, `04-design-polish`; `02-observability` and `04-design-polish` are optional/recommended; Phase 1 slugs start at `05`
- `packages/domain` scaffold template stripped to `ID` + `ISODate` only; financial types removed — add when billing is scoped
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
- `ponytail` (DietrichGebert) added to `/j-flow-recommend` as a complementary plugin — lazy senior developer enforcement that walks a 6-question decision ladder before generating code
- `/j-flow-review` optional over-engineering check: invokes `/ponytail-review` after constitution check and before reviewer agent dispatch; advisory (non-blocking), findings forwarded to `review-findings.md` under `## Over-engineering`; gate entry records ponytail outcome or `skipped — not installed`
- `/j-flow-build` per-layer agent instruction extended with ponytail decision ladder: 6 questions (exist? pattern? stdlib? native? dep? one-liner?) required before writing any code
- `/j-flow-build --fix` agent instruction now requires grepping all test files (`*.spec.ts`, `*.e2e-spec.ts`, `*.test.tsx`, `*_test.dart`, Playwright `apps/e2e/**`) for any assertion referencing the changed value/behavior and updating them — prevents cross-layer test drift when error codes, status codes, or return shapes change
- `/j-flow-review` approval gate now blocks if the most recent `[QA] green` entry in `gate-context.md` predates the last `[REVIEW] changes-requested` entry — forces re-run of `/j-flow-qa` after every `--fix` cycle before accepting 'approved'
- `/j-flow-qa` Stage 1 — Lint added (`pnpm lint` + `flutter analyze`); error-level findings block the gate, warnings are logged only; previous stages renumbered 2–7 (7 stages total)
