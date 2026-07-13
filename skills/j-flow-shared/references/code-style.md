# Code Style Rules

Used by `/j-flow-spec technical` (when drafting specs) and `/j-flow-build` (when writing code).
Audited by `/j-flow-review`.

## Design Constraints (for specs)

1. Describe the main function as a sequence of named steps — not disconnected utilities.
2. Use SDK/framework primitives over custom implementations. Name the specific method.
3. Don't spec abstractions unless reused across 3+ places.
4. Match existing repo patterns only when conditions match exactly.
5. Third-party infra (error tracking, etc.) defaults to managed cloud free tier — not a self-hosted docker-compose service — when self-hosting adds setup/maintenance complexity disproportionate to a dev environment. Example: error tracking uses GlitchTip cloud (dev) / Sentry cloud (prod), DSN swap only, no local GlitchTip container.

## Implementation Constraints (for code)

1. Extract to helper only when used in 3+ places. Inline by default.
2. Trust SDK/framework primitives — don't wrap them.
3. Guards only at system boundaries (HTTP input, external APIs). Not internal calls.
4. try/catch for expected errors only (not a catch-all).
5. Read data once per operation — no repeated fetches.
6. Hardcode fixed-scope values (don't parameterize what won't change).
7. Optimize for the next reader — names over comments.
8. Never use `any` (TypeScript) or `dynamic` (Dart).

## Stack-specific rules

**NestJS:**
- Repository pattern: controllers → services → repositories → Mongoose
- No business logic in controllers
- Auth guards applied per route (not globally) unless every route requires auth
- DTOs validated via class-validator
- Error responses use `HttpException` subclasses with shape: `{ error: { code, message } }`

**React:**
- Server state in React Query, client state in Zustand — never mix
- Forms use react-hook-form + zod schema
- No prop drilling >2 levels — use context or Zustand
- Use design tokens from `packages/ui` — never hardcode colors

**Flutter:**
- Riverpod for state — no `setState` in large widgets
- GoRouter for navigation — no `Navigator.push` directly
- Separate API models from UI models (use mappers)

## What /j-flow-review checks

- Code paths match the architecture described in the technical spec
- No code paths the spec doesn't describe (idempotency checks, verification flags, defensive wrappers)
- No unjustified helpers (rule 1)
- Unit tests exist for every public service method
- Storybook stories exist for every exported component
- Widgetbook entries exist for every reusable widget
- NestJS E2E specs cover every endpoint
