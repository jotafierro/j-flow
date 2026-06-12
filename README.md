# j-flow

> Gate-based Spec-Driven Development for MongoDB + NestJS + React + Flutter.

Enforce a consistent workflow across all your projects: spec → plan → build → qa → review → finish → release. Each phase gates the next. QA must be green before review. Review must be approved before finish.

## Install

```bash
# Clone the private repo once
git clone git@github.com:jotafierro/j-flow.git ~/j-flow

# Register as a local marketplace (once per machine)
claude plugin marketplace add ~/j-flow --scope user

# Install globally (available in all projects)
claude plugin install j-flow

# Or install per-project (no conflicts with other plugins)
claude plugin marketplace add ~/j-flow --scope project
claude plugin install j-flow --scope project

# Update later
git -C ~/j-flow pull && claude plugin update j-flow
```

> **Requirement:** `/j-flow-init` requires an existing git repository. Run `git init` first if needed.

## Quick Start

```
/j-flow-init              # one-time project setup (PRODUCT.md, DESIGN.md, Playwright, agent memory)
/j-flow-start {slug}      # begin a new feature
/j-flow-spec              # write functional spec via dialogue
/j-flow-spec technical    # write technical spec via j-flow-architect agent
/j-flow-plan              # generate task plan + review guide
/j-flow-build             # implement by layer (data → service → api → ui → mobile → infra)
/j-flow-qa                # run 6-stage QA gate
/j-flow-review            # code quality audit vs specs
/j-flow-finish            # README + CHANGELOG + PR to develop
/j-flow-release minor     # semver bump + tag + PR to main
```

## Skills

| Skill | Purpose |
|-------|---------|
| `/j-flow-init` | One-time project setup — PRODUCT.md, DESIGN.md, Playwright config, agent memory |
| `/j-flow-start {slug}` | Initialize feature — git branch, `.specs/{slug}/`, gate-context |
| `/j-flow-spec` | Functional spec via dialogue → approval gate |
| `/j-flow-spec technical` | Technical spec via j-flow-architect → approval gate |
| `/j-flow-plan` | Task plan + review guide → approval gate |
| `/j-flow-build` | Layered implementation by domain agent, unit tests per layer |
| `/j-flow-build --fix` | Resolve QA or review findings |
| `/j-flow-qa` | 6-stage QA gate — blocks review if red |
| `/j-flow-review` | Code quality audit vs technical spec |
| `/j-flow-finish` | Feature README + CHANGELOG \[Unreleased\] + PR to develop |
| `/j-flow-release [major\|minor\|patch]` | Semver bump + git tag + PR to main |
| `/j-flow-reopen` | Reopen feature to a prior gate |
| `/j-flow-update` | Update specs mid-feature, mark downstream gates stale |
| `/j-flow-check` | Current feature phase + gate status |
| `/j-flow-check --all` | All features summary |

## Stack

| Layer | Technology |
|-------|-----------|
| Database | MongoDB + Mongoose |
| Backend | NestJS (TypeScript strict) |
| Frontend | React + React Query + Zustand + Tailwind CSS |
| Mobile | Flutter + Riverpod + GoRouter |
| Testing | Jest, `@nestjs/testing` + supertest, flutter_test, Playwright, Storybook, Widgetbook |
| Infra | Docker Compose + GitHub Actions + Railway + Vercel |

## Validate Plugin Structure

```bash
node tests/validate.js
```

Checks all 13 skills and 7 agents have valid structure and frontmatter. No LLM required.
