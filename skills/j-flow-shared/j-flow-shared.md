---
name: j-flow-shared
description: Shared patterns, gate-context format, file path conventions, and gate status values used by all j-flow skills. Read this before implementing any j-flow skill.
---

# j-flow Shared Patterns

## File Paths

Feature files live at `.specs/{slug}/`:

```
.specs/{slug}/
├── meta.md               ← slug, branch, stack, created date
├── gate-context.md       ← accumulated phase outputs (append-only)
├── functional-spec.md    ← /j-flow-spec output
├── technical-spec.md     ← /j-flow-spec technical output
├── tasks.json            ← /j-flow-plan output
├── review-guide.md       ← /j-flow-plan output (manual test guide)
├── qa-report.md          ← /j-flow-qa output
├── review-findings.md    ← /j-flow-review output
└── README.md             ← /j-flow-finish output
```

Agent memory lives at `.specs/.agents/`:
```
.specs/.agents/
├── j-flow-architect.md
├── j-flow-backend.md
├── j-flow-frontend.md
├── j-flow-mobile.md
├── j-flow-devops.md
├── j-flow-quality.md
└── j-flow-reviewer.md
```

## gate-context.md Format

Append-only. Each phase adds one block:

```
[FUNCTIONAL SPEC] approved YYYY-MM-DD
  → key decisions: <1-2 line summary>

[TECHNICAL SPEC] approved YYYY-MM-DD
  → architecture: <summary>
  → patterns: <key patterns>

[TASK PLAN] approved YYYY-MM-DD
  → N tasks across N layers, N ACs covered

[BUILD] completed YYYY-MM-DD
  → layers: data ✓ service ✓ api ✓ ui ✓ mobile ✓ infra ✓

[QA] green YYYY-MM-DD
  → N tests passing, checklist N/N

[REVIEW] approved YYYY-MM-DD
  → N findings resolved
```

## Gate Status Values

| Status | Meaning |
|--------|---------|
| `approved` | User explicitly approved this phase output |
| `green` | Automated checks passed (QA gate) |
| `completed` | Phase ran to completion (build) |
| `red` | Automated checks failed (QA gate) |
| `stale` | Downstream of a /j-flow-update change — must re-run |
| `changes-requested` | Review found critical issues |

## Gate Check Pattern

Every skill (except j-flow-init, j-flow-start, j-flow-check) MUST read gate-context.md first and verify required prior gates before doing any work:

```
1. Read .specs/{slug}/gate-context.md
2. Check that the required gate line is present
3. Check that the status is not 'stale' or 'red'
4. If missing or stale: STOP with message:
   "Gate [{GATE NAME}] not approved. Run /j-flow-{skill} first."
```

## How to Find Active Feature

When no slug is provided as an argument:
1. Check if args include a slug (e.g. `/j-flow-build my-feature`)
2. If not, list all directories in `.specs/` (excluding `.agents/`)
3. If exactly one feature directory exists, use it automatically
4. If multiple exist, list them and ask the user: "Which feature? (slug)"
5. If none exist, stop: "No features found. Run /j-flow-start {slug} first."

## CHANGELOG Format

Project CHANGELOG.md follows Keep a Changelog 1.1.0.

`/j-flow-finish` appends to `[Unreleased]`:
```markdown
### Added
- [{slug}] Brief description of new functionality

### Fixed
- [{slug}] Brief description of fixes (if any)
```

`/j-flow-release` moves `[Unreleased]` contents to a new versioned section:
```markdown
## [1.2.0] - YYYY-MM-DD
### Added
- [{slug}] ...
```

## Stack Reference

Default stack for all j-flow projects:
- **Database:** MongoDB (Mongoose)
- **Backend:** NestJS (TypeScript strict)
- **Frontend:** React (TypeScript strict) + Zustand (client state) + React Query (server state)
- **Mobile:** Flutter (Dart null-safe)
- **Infra:** Docker Compose + GitHub Actions + Railway (backend) + Vercel (frontend)
