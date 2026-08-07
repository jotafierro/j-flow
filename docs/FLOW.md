# j-flow — Complete Workflow Reference

## Phase Diagram

```
/j-flow-project
  └─ git init -b main if no repo yet, then creates develop branch after first commit
  └─ PRODUCT.md, DESIGN.md, .specs/README.md, CHANGELOG.md, agent memory
  └─ first run: auto-triggers /j-flow-scaffold
  └─ --update: syncs backlog from meta.md + triggers /j-flow-scaffold --review

/j-flow-scaffold
  └─ feature/01-infra-base branch (off develop)
  └─ Right-sized by scaffold_profile from **Layers:** — every layer (web/api/mobile/admin/e2e[/cli]) is independently selectable; apps live under apps/<layer>/
     · minimal-workspace (default): apps/{included} + packages/{config,domain, ui?/api-client? per layer}; scales to the full monorepo as layers are added
     · flutter-only (mobile is the sole layer): apps/mobile only, no TS workspace
     · e2e is a first-class layer: local webServer with web, else external BASE_URL
  └─ Docker Compose: MongoDB + Redis + Mailhog  ← only if api
  └─ GitHub Actions CI  ← test job for TS layers (+ flutter job if mobile)
  └─ Grow later: edit **Layers:** → /j-flow-project --update (backfills agents + scaffold delta, additive)
  └─ On approval: writes .specs/01-infra-base/README.md, marks [✓] in backlog, merges to develop (no PR), sets finish_status: completed in meta.md (skips /j-flow-finish — no tasks.json for a CLI scaffold)
  └─ before /j-flow-recommend: asks whether to cut the initial release (1/2 dialogue → /j-flow-release)
  └─ --review: read-only, reports outdated configs

/j-flow-recommend
  └─ Recommended plugins/skills/tools for the workflow
  └─ ends with a 1/2 dialogue offering to start the next `[ ]` feature in .specs/README.md (→ /j-flow-start)

/j-flow-start {slug}
  └─ feature/{slug} branch
  └─ .specs/{slug}/meta.md + gate-context.md

/j-flow-spec --explore
  └─ scoping dialogue before committing — no files written, ends with summary + offer to start real spec
  └─ use when the feature is still vague or may need splitting

/j-flow-spec
  └─ Dialogue: what/who/trigger/ACs/out-of-scope/constraints
  └─ Writes: .specs/{slug}/functional-spec.md
  └─ [GATE: FUNCTIONAL SPEC approved]

/j-flow-spec technical
  └─ Dispatches: j-flow-architect
  └─ Writes: .specs/{slug}/technical-spec.md
  └─ [GATE: TECHNICAL SPEC approved]
  └─ trivial features (few ACs, no new architecture) get a minimal spec — no fabricated sections

/j-flow-plan
  └─ Parses ACs, maps to layers, validates coverage
  └─ Writes: .specs/{slug}/tasks.json + review-guide.md
  └─ [GATE: TASK PLAN approved]

/j-flow-build
  └─ Layer sequence: data → service → api → ui+stories → mobile+widgetbook → infra (cli is a harness layer — no numbered row, runs in the client tier alongside ui/mobile when present)
  └─ Agents: j-flow-backend (NestJS) / j-flow-frontend (React + Vite) / j-flow-mobile / j-flow-cli / j-flow-devops
  └─ Unit tests written per layer; NestJS E2E specs at api layer
  └─ One commit per layer
  └─ [BUILD completed]

/j-flow-qa                          ← GATE — blocks review if red
  └─ Stage 1: Lint (ESLint + flutter analyze)
  └─ Stage 2: Unit tests (jest/vitest + flutter test)
  └─ Stage 3: NestJS E2E (supertest + @nestjs/testing, real MongoDB)
  └─ Stage 4: Flutter integration_test
  └─ Stage 5: Playwright E2E
  └─ Stage 6: Visual smoke (Storybook CI + Widgetbook headless)
  └─ Stage 7: Manual checklist (from review-guide.md)
  └─ Flutter/Playwright/visual-smoke checks skip automatically when the corresponding layer (mobile/ui) has no tasks in this feature
  └─ Writes: .specs/{slug}/qa-report.md
  └─ [GATE: QA green]

/j-flow-review
  └─ Dispatches: j-flow-reviewer
  └─ Audits: spec conformance, stack patterns, security, performance, speculative code
  └─ Writes: .specs/{slug}/review-findings.md
  └─ [GATE: REVIEW approved]

/j-flow-finish
  └─ Writes: .specs/{slug}/README.md
  └─ Updates: CHANGELOG.md [Unreleased]
  └─ Updates: .specs/.agents/ (learned patterns)
  └─ Creates: PR to develop

/j-flow-release [major|minor|patch]
  └─ Semver bump in package.json
  └─ Moves CHANGELOG [Unreleased] → versioned section
  └─ git tag v{version}
  └─ Creates: PR to main
```

## Support Commands

/j-flow-check
  └─ current feature phase + gate status

/j-flow-check --all
  └─ all features summary

/j-flow-check --repo [--verbose]
  └─ read-only diagnostics: PRODUCT.md / DESIGN.md / agent memory / backlog drift / per-feature integrity
  └─ never writes; reports a punch list and suggests which fix skills to run

/j-flow-check --consistency [--verbose]
  └─ cross-consistency: AC→task, task→AC, AC→test, AC vs _system/ collisions
  └─ read-only; run any time after /j-flow-spec to catch gaps early

/j-flow-eject [path]
  └─ copy templates/references/agent files into .specs/.overrides/ so you can customize without forking
  └─ stages the file; does not commit
  └─ forward skills resolve overrides from `.specs/.overrides/` — see `references/overrides.md`

## QA Fix Loop

When `/j-flow-qa` returns red:
```
/j-flow-qa → red
  → /j-flow-build --fix  (reads qa-report.md, dispatches domain agent per failure)
  → /j-flow-qa           (re-run all 7 stages)
  → repeat until green
  → /j-flow-review
```

When `/j-flow-review` returns changes-requested:
```
/j-flow-review → changes-requested
  → /j-flow-build --fix  (reads review-findings.md, dispatches domain agent per finding)
  → /j-flow-review       (re-run audit)
  → repeat until approved
  → /j-flow-finish
```

## Gate Status Values

| Status | Set by | Meaning |
|--------|--------|---------|
| `approved` | User confirms | Spec or plan approved by user |
| `green` | QA automation | All 7 test stages passed |
| `completed` | Build | All layers implemented |
| `red` | QA automation | At least one test stage failed |
| `changes-requested` | Review | Critical findings require fixes |
| `stale` | /j-flow-update | Invalidated by upstream spec change |

## Agent Map

| Agent | Dispatched by | Expertise |
|-------|--------------|-----------|
| j-flow-architect | `/j-flow-spec technical` | Full-stack technical specs |
| j-flow-backend | `/j-flow-build` (data, service, api layers) | NestJS + MongoDB + supertest E2E |
| j-flow-frontend | `/j-flow-build` (ui layer) | React + Zustand + React Query + Storybook |
| j-flow-mobile | `/j-flow-build` (mobile layer) | Flutter + Riverpod + Widgetbook + integration_test |
| j-flow-cli | `/j-flow-build` (cli layer) | commander + tsup + vitest — light client of the api layer, no NestJS/Mongoose |
| j-flow-devops | `/j-flow-build` (infra layer) | Docker + GitHub Actions + Railway + Vercel |
| j-flow-quality | `/j-flow-qa` | Test execution + manual checklist |
| j-flow-reviewer | `/j-flow-review` | Code quality audit vs specs |

## Feature File Reference

```
{project-root}/
├── .specs/
│   ├── .agents/                    ← agent memory (updated by /j-flow-finish)
│   │   ├── j-flow-architect.md
│   │   ├── j-flow-backend.md
│   │   ├── j-flow-frontend.md
│   │   ├── j-flow-mobile.md
│   │   ├── j-flow-cli.md
│   │   ├── j-flow-devops.md
│   │   ├── j-flow-quality.md
│   │   └── j-flow-reviewer.md
│   └── {slug}/
│       ├── meta.md                 ← slug, branch, stack, gate checklist
│       ├── gate-context.md         ← accumulated gate statuses (append-only)
│       ├── review/                 ← per-layer manual test docs (plan 016); checklist rows flip to [x] on layer/QA approval
│       ├── functional-spec.md      ← /j-flow-spec output
│       ├── technical-spec.md       ← /j-flow-spec technical output
│       ├── tasks.json              ← /j-flow-plan output
│       ├── review-guide.md         ← /j-flow-plan output (manual test guide)
│       ├── qa-report.md            ← /j-flow-qa output
│       ├── review-findings.md      ← /j-flow-review output
│       └── README.md               ← /j-flow-finish output
├── CHANGELOG.md                    ← Keep a Changelog format, updated by /j-flow-finish
├── PRODUCT.md                      ← generated by /j-flow-project
├── DESIGN.md                       ← design system tokens, generated by /j-flow-project
├── apps/                           ← generated by /j-flow-scaffold
│   ├── api/                        ← NestJS (port 3000)
│   ├── web/                        ← React + Vite (port 3001)
│   ├── admin/                      ← React + Vite (port 3002, optional)
│   ├── e2e/                        ← Playwright
│   ├── cli/                        ← commander + tsup + vitest (optional, opt-in via **Layers:**)
│   └── mobile/                     ← Flutter + Widgetbook
└── packages/                       ← generated by /j-flow-scaffold
    ├── ui/                         ← React + Storybook
    ├── domain/                     ← Shared TypeScript types
    ├── api-client/                 ← Typed API client stub
    └── config/                     ← Shared tsconfig + ESLint
```

## Shared Patterns

- Gate-context.md format, status values, gate-check algorithm, "How to Find Active Feature", slug validation → `skills/j-flow-shared/references/gate-core.md`
- Reopen/update cascade rules, resetting a gate, stale markers → `skills/j-flow-shared/references/gate-cascade.md`
- Backlog symbol lookup → `skills/j-flow-shared/references/gate-symbols.md`
- Clarification markers, AC format → `skills/j-flow-shared/references/spec-markers.md`
- CHANGELOG format → `skills/j-flow-shared/templates/changelog.md`
- Canonical-source index (which file owns what) → `skills/j-flow-shared/SKILL.md`

Templates at `skills/j-flow-shared/templates/` — referenced by skills at runtime via `${CLAUDE_PLUGIN_ROOT}`.
References at `skills/j-flow-shared/references/` — gate-core, gate-cascade, gate-symbols, spec-markers, layer-order, code-style, agent-scopes, overrides.
