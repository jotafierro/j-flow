# Manual Testing — {slug} API

Curl-based smoke tests. Run against local dev stack.

## Setup

```bash
docker compose up -d                        # MongoDB :27017, Redis :6379, Mailhog :8025
pnpm --filter @{project}/api dev            # API :3000
curl http://localhost:3000/api/v1/health    # verify
```

**Note (zsh):** `!` inside double quotes triggers history expansion. Use `printf` for passwords containing `!`:
```bash
BODY=$(printf '{"email":"%s","password":"Test1234!"}' "test@example.com")
```

---

## {N}. {AC-N short title} ({ac-id})

```bash
curl -s -X {METHOD} http://localhost:3000/api/v1/{route} \
  -H "Content-Type: application/json" \
  -d '{...request body}' | jq
```

Expected: `{response shape or HTTP status}`

{Additional verification: DB check, header, cookie, or side effect}

---

## Checklist

| AC | Scenario | Pass |
|----|----------|------|
| {ac-id} | {scenario one line} | [ ] |
