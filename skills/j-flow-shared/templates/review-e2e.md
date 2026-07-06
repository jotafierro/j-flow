# Manual Testing — {slug} E2E

Full-stack cross-layer flows. Run after all layers are built. Requires the full stack running.

## Setup

```bash
docker compose up -d
pnpm --filter @{project}/api dev     # :3000
pnpm --filter @{project}/web dev     # :3001
# pnpm --filter @{project}/admin dev # :3002 (if admin in scope)
# cd apps/mobile && flutter run      # (if mobile in scope)
```

---

## {N}. {flow name} ({ac-start-id} → {ac-end-id})

{Brief description of the cross-layer scenario: what starts on web/mobile, what the API does, what the result is}

**Web side:**
1. {step}
2. Expected: {result}

**API verification:**
```bash
curl -s http://localhost:3000/api/v1/{verification-route} | jq
```
Expected: `{state change confirmed}`

**Mobile side (if applicable):**
1. {step}
2. Expected: {result}

---

## Checklist

| Flow | ACs | Pass |
|------|-----|------|
| {flow name} | {ac-start-id} → {ac-end-id} | [ ] |
