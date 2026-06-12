---
name: j-flow-plan
description: Generate task plan (tasks.json) and review guide (review-guide.md) from approved specs. Validates AC coverage before saving. Usage: /j-flow-plan
---

# j-flow-plan

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[TECHNICAL SPEC] approved` and not stale.
If missing or stale: "Gate [TECHNICAL SPEC] not approved. Run /j-flow-spec technical first."

## Process

### Step 1: Parse ACs

Read `.specs/{slug}/functional-spec.md`. Extract every line starting with `- AC`:
```
AC1: Given {context}, when {action}, then {outcome}
AC2: ...
```

Read `.specs/{slug}/technical-spec.md` for implementation details per layer.

### Step 2: Map ACs to layers

For each AC, determine which build layers implement it:
- `data` — Mongoose schema or DTO changes
- `service` — NestJS business logic
- `api` — HTTP endpoint
- `ui` — React component or page
- `mobile` — Flutter screen or widget
- `infra` — CI/CD, Docker, deployment config

One AC can map to multiple layers (e.g. a create-user feature touches data + service + api + ui + mobile).

### Step 3: Generate tasks.json

Build a JSON structure grouping tasks by layer, each with an id, description, the ACs it covers, and the files it will create or modify:

```json
{
  "slug": "{slug}",
  "created": "{today's date}",
  "layers": {
    "data": [
      {
        "id": "data-1",
        "description": "Create User Mongoose schema and DTOs",
        "ac": ["AC1", "AC2"],
        "files": [
          "apps/api/src/users/schemas/user.schema.ts",
          "apps/api/src/users/dto/create-user.dto.ts",
          "apps/api/src/users/dto/user-response.dto.ts"
        ]
      }
    ],
    "service": [],
    "api": [],
    "ui": [],
    "mobile": [],
    "infra": []
  },
  "ac_coverage": {
    "AC1": ["data-1", "service-1", "api-1"],
    "AC2": ["ui-1", "mobile-1"]
  },
  "uncovered_acs": []
}
```

**Coverage validation:** If `uncovered_acs` is not empty, stop:
"Warning: the following ACs have no tasks assigned: {list}. Add tasks before proceeding."

### Step 4: Generate review-guide.md

```markdown
# Review Guide — {slug}
Generated: {today's date}

## Requirements
{list each AC as a numbered requirement}
1. AC1: {full text}
2. AC2: {full text}

## Environment Setup
- Run `docker compose up -d` (MongoDB, Redis)
- Run backend: `pnpm --filter @{project}/api dev` (port 3000)
- Run frontend: `pnpm --filter @{project}/web dev` (port 3001)
- Run mobile: `flutter run` from `apps/mobile/`
- Required seed data: {any fixtures, or "none"}
- Feature flags or env vars: {any, or "none"}

## Manual Test Steps

{For each AC, 2-5 step test scenario}

### AC1: {brief title}
1. {action — be specific, e.g. "Navigate to /dashboard"}
2. {observe result — be specific, e.g. "Verify the invoice list shows 3 items"}
3. {verify side effect — e.g. "Check MongoDB: db.invoices.find() returns 3 documents"}

### AC2: {brief title}
1. ...

## Approval Criteria

All manual test steps pass with no blockers → feature approved for review.
Any blocker found → run /j-flow-build --fix, then re-run /j-flow-qa.
```

### Step 5: Show and confirm

Display both `tasks.json` and `review-guide.md` to the user. Ask:
"Does this plan look right? Reply 'approved' to proceed, or tell me what to change."

### Step 6: Approval

When approved:
1. Write `.specs/{slug}/tasks.json`
2. Write `.specs/{slug}/review-guide.md`
3. Append to `.specs/{slug}/gate-context.md`:
   ```
   [TASK PLAN] approved {today's date}
     → {N} tasks across {N} layers, {N} ACs covered
   ```
4. Print:
   ```
   Task plan approved and saved ✓
   Next step: /j-flow-build
   ```
