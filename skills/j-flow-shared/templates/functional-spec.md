# Functional Spec — {Feature Name}
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

## Functional scenarios

### Scenario 1 — {Name}

**Given** {precondition}
**When** {action}
**Then:**
- {outcome 1}
- {outcome 2}

### Scenario 2 — {Name}

**Given** ...
**When** ...
**Then:** ...

## Acceptance criteria

- **AC-1** — {criterion}
- **AC-2** — {criterion}
- **AC-3** — {criterion}

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
