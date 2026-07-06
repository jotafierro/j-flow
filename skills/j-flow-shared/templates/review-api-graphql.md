# Manual Testing — {slug} API (GraphQL)

GraphQL smoke tests. Run against local dev stack.

## Setup

```bash
docker compose up -d                        # MongoDB :27017, Redis :6379, Mailhog :8025
pnpm --filter @{project}/api dev            # API :3000
curl http://localhost:3000/api/v1/health    # verify health (REST endpoint stays)
```

**Apollo Playground (dev only):** http://localhost:3000/graphql

**Introspection check:**
```bash
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}' | jq
# Expected: { "data": { "__typename": "Query" } }
```

---

## {N}. {AC-N short title} ({ac-id})

### Query — {queryName}

```bash
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ {queryName}({args}) { {fields} } }"}' | jq
```

Expected: `{ "data": { "{queryName}": { ... } } }`

### Mutation — {mutationName}

```bash
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { {mutationName}(input: { {fields} }) { {returnFields} } }"}' | jq
```

Expected: `{ "data": { "{mutationName}": { ... } } }`

{Additional verification: DB check or side effect}

---

## Checklist

| AC | Scenario | Pass |
|----|----------|------|
| {ac-id} | {scenario one line} | [ ] |
