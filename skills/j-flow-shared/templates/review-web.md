# Manual Testing — {slug} Web

Browser smoke tests. Run against local dev stack.

## Setup

```bash
docker compose up -d
pnpm --filter @{project}/api dev     # :3000
pnpm --filter @{project}/web dev     # :3001
```

Mailhog UI: http://localhost:8025 (if feature sends email)

---

## {N}. {AC-N short title} ({ac-id})

1. Open http://localhost:3001/{path}
2. {action}
3. Expected: {observable result}
4. DevTools verification (if applicable): {tab → what to check}

---

## Checklist

| AC | Scenario | Pass |
|----|----------|------|
| {ac-id} | {scenario one line} | [ ] |
