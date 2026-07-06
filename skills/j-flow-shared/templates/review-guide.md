# Review Guide — {slug}
Generated: {YYYY-MM-DD}

## Environment

```bash
docker compose up -d                          # MongoDB :27017, Redis :6379, Mailhog :8025
pnpm --filter @{project}/api dev              # :3000
pnpm --filter @{project}/web dev              # :3001
# pnpm --filter @{project}/admin dev          # :3002  (if admin panel in scope)
# cd apps/mobile && flutter run               # (if mobile in scope)
```

**Required env vars for this feature:**
- `{VAR}` — {description, or "none new for this feature"}

**Seed data:**
- {fixtures needed, or "none"}

## Per-Layer Testing Docs

Run in this order: api → web → mobile → admin → e2e (last, after all layers pass).

| Layer | File | ACs covered |
|-------|------|-------------|
| API   | [review/api.md](review/api.md) | {ac-ids} |
| Web   | [review/web.md](review/web.md) | {ac-ids} |
| Mobile | [review/mobile.md](review/mobile.md) | {ac-ids} |
| Admin | [review/admin.md](review/admin.md) | {ac-ids} |
| E2E   | [review/e2e.md](review/e2e.md) | {ac-ids} |

_Only include rows for layers with tasks in this feature._

## Approval Criteria

All per-layer checklists green → feature approved for `/j-flow-review`.
Any blocker found → run `/j-flow-build --fix`, then re-run `/j-flow-qa`.
