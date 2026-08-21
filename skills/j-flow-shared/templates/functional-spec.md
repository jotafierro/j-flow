# Functional Spec — {Feature Name}
<!-- Prose in the project's Spec language; headings, IDs, gate vocabulary and code stay English — see references/language-contract.md -->
Date: {YYYY-MM-DD}

<!--
MARKER CONVENTION
If any section has unresolved questions, use:
  [NEEDS CLARIFICATION: {question to resolve before planning}]

Example:
  - **AC-3** — [NEEDS CLARIFICATION: should this apply to admin users too, or only regular users?]

/j-flow-plan will refuse to start while any [NEEDS CLARIFICATION] marker remains in this file.
Remove the marker (replace it with the resolved content) before running /j-flow-plan.
-->

## Purpose

{Describe the user-facing purpose. What problem does this feature solve?}

## Feature users

{Who uses this feature? Roles, personas, or system actors.}

## Trigger

{What initiates this feature? User action, event, schedule.}

## Acceptance criteria

<!-- Each AC uses Given/When/Then format. Keep ACs atomic — one observable outcome per AC.
     For complex multi-step flows, add a Functional scenarios section below. -->

### AC-1 — {short name}

**Given** {precondition or system state}
**When** {user action or system event}
**Then:**
- {observable outcome 1}
- {observable outcome 2}

### AC-2 — {short name}

**Given** ...
**When** ...
**Then:**
- ...

### AC-3 — {short name}

**Given** ...
**When** ...
**Then:**
- ...

## Scope

**In scope:**
- {item}

**Out of scope:**
- {item}

## Dependencies

{Features this feature depends on. If none: N/A.}

## Edge cases

- {edge case}

## Risks

- {risk and mitigation}

## Functional scenarios (optional)

<!-- Use this section only for complex multi-step user journeys that span multiple ACs.
     Simple features: leave this section empty or delete it. -->
