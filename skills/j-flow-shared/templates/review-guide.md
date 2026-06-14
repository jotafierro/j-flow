# Review Guide — {slug}
Generated: {YYYY-MM-DD}

## Requirements

{Each AC from functional-spec.md as a numbered requirement.}

1. **AC-1** — {full text}
2. **AC-2** — {full text}
3. **AC-3** — {full text}

## Environment Setup

**Services running:**
- `docker compose up -d` → MongoDB :27017, Redis :6379, Mailhog :8025

**Apps to run:**
- Backend: `pnpm --filter @{project}/api dev` → :3000
- Web: `pnpm --filter @{project}/web dev` → :3001
- Admin (if used): `pnpm --filter @{project}/admin dev` → :3002
- Mobile: `flutter run` from `apps/mobile/`

**Required env vars:**
- `{VAR}` — {description, or "none new for this feature"}

**Seed data:**
- {fixtures needed, or "none"}

## Manual Test Steps

### AC-1: {brief title}

1. {action — be specific}
2. {observe result}
3. {verify side effect}

### AC-2: {brief title}

1. ...

## Approval Criteria

- All manual steps pass with no blockers → feature approved for `/j-flow-review`
- Any blocker found → run `/j-flow-build --fix`, then re-run `/j-flow-qa`
