# Spec Markers

Functional-spec conventions — read by `/j-flow-spec`, `/j-flow-plan`, `/j-flow-qa`, and
`/j-flow-check --consistency`. If this reference is already in your session context
from earlier in this conversation, don't re-read it.

## Clarification markers

**`[NEEDS CLARIFICATION: {question}]`** — marker for unresolved questions in `functional-spec.md`. A functional spec may be approved with markers present (progress is saved). However, the PLAN gate will block until all markers are resolved. Markers in a technical spec are not recognized — resolve them at the functional level before running `/j-flow-spec technical`.

## AC format

Acceptance Criteria in `functional-spec.md` use Given/When/Then structure (`### AC-N — {name}` heading, `**Given** / **When** / **Then:**` lines). Free-form ACs from pre-013 specs are accepted but degrade traceability in `/j-flow-check --consistency` and `/j-flow-qa`.
