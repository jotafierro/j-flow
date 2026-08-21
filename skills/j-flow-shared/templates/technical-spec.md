# Technical Spec — {Feature Name}
<!-- Prose in the project's Spec language; headings, IDs, gate vocabulary and code stay English — see references/language-contract.md -->
Date: {YYYY-MM-DD}

## Architecture Overview

{ASCII flow diagram top-to-bottom. Example:

HTTP Request
  ↓
AuthController.login()
  1. validate DTO
  2. call AuthService.login(dto)
     2a. find user by email (UserRepository → Mongoose)
     2b. compare password (argon2)
     2c. generate JWT pair (JwtService)
  3. set refresh token cookie
  ↓
HTTP Response 200 { accessToken }
}

## Data Layer

**MongoDB collections:**

```typescript
// {Name}Schema
@Schema({ timestamps: true })
export class {Name} {
  @Prop({ required: true, index: true })
  tenantId: string;

  // fields
}
```

**Indexes:** {list compound indexes, TTL, sparse, unique}

## Service Layer

**Modules:** {NestJS modules introduced}

**Services:**

| Service | Responsibilities | Dependencies |
|---------|-------------------|--------------|
| {Name}Service | {what it does} | {repos, other services} |

## API Layer

| Method | Path | Guard | Request | Response | Errors |
|--------|------|-------|---------|----------|--------|
| POST | /api/v1/{route} | JwtAuthGuard | `{ ... }` | `{ ... }` | `400 VALIDATION`, `401 UNAUTHORIZED` |

## Frontend

**Routes:** {new routes}
**Components:** {new components in `apps/web/` or `packages/ui/`}
**State:**
- Server state: React Query — keys `[{name}, ...]`
- Client state: Zustand — `use{Name}Store`
**Forms:** zod schema + react-hook-form

## Mobile

**Screens:** {new screens in `apps/mobile/lib/screens/`}
**Widgets:** {reusable widgets in `apps/mobile/lib/widgets/`}
**State:** Riverpod providers
**Navigation:** GoRouter routes
**Widgetbook entries:** {list}

## Infrastructure

**New env vars:**
- `{VAR_NAME}` — {description}

**Docker services:** {new services in docker-compose.yml, or "none"}

**CI changes:** {new jobs or steps, or "none"}

## Cross-cutting Concerns

**Auth:** {which routes require auth, which guards}
**Validation:** {DTO + zod schemas}
**Error handling:** {error shape, HTTP status codes}
**Logging:** {what events to log}

## Design decisions

- **DD-1** — {Decision}: {rationale, alternatives considered}
- **DD-2** — {Decision}: {rationale}

## Testing Strategy

**Unit tests:**
- {Service}: {what to test}

**NestJS E2E (`apps/api/test/*.e2e-spec.ts`):**
- {endpoint flow}: {happy + error paths}

**Flutter integration:**
- {flow}: {what to verify}

**Playwright E2E (`apps/e2e/tests/`):**
- {user journey}: {steps to verify}
