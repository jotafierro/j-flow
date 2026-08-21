# {Feature Name}
<!-- Prose in the project's Spec language; headings, IDs, gate vocabulary and code stay English — see references/language-contract.md -->

**Slug:** {slug}
**Branch:** feature/{slug}
**PR:** {PR URL}
**Merged:** {date}

## Summary

{1-3 sentence description of what was built and why.}

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | {short description} | ✓ |
| AC-2 | {short description} | ✓ |

## Files Added / Modified

| File | Change |
|------|--------|
| `apps/api/src/{module}/` | New module |
| `packages/ui/src/{name}/` | New components |

## Patterns Introduced

{Any new patterns, conventions, or technical decisions worth noting for future features. If nothing non-obvious: "None."}

## Test Coverage

- Unit: `pnpm --filter @{project}/api test`
- E2E (NestJS): `pnpm --filter @{project}/api test:e2e`
- E2E (Playwright): `pnpm --filter @{project}/e2e test`
- Mobile: `flutter test` + `flutter drive`
