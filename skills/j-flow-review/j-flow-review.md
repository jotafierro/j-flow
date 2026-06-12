---
name: j-flow-review
description: Audit code quality against approved technical specs. Only reachable if QA gate is green. Produces review-findings.md. Usage: /j-flow-review
---

# j-flow-review

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[QA] green`.
If QA gate is absent, red, or stale:
"Gate [QA] not green. Run /j-flow-qa first (and resolve any failures with /j-flow-build --fix)."

## Process

### Dispatch j-flow-reviewer

Provide the agent with:
- Full contents of `.specs/{slug}/technical-spec.md`
- Full contents of `.specs/{slug}/tasks.json`
- Full contents of `.specs/{slug}/review-guide.md`
- Full contents of `.specs/.agents/j-flow-reviewer.md` (agent memory)
- Instruction: "Audit the implementation against the technical spec. Check for spec conformance, stack pattern violations, security gaps, performance issues, and speculative code. Produce review-findings.md."

### Show Findings

Display the agent's `review-findings.md` output to the user.

Ask:
"Review complete. Are there any critical or major findings that need fixing?
- Reply 'approved' if no blockers (or after /j-flow-build --fix has resolved them)
- Or run /j-flow-build --fix to resolve findings first"

### Write findings file

Always write `.specs/{slug}/review-findings.md` regardless of verdict.

### If approved (no critical findings or all resolved):

Append to `.specs/{slug}/gate-context.md`:
```
[REVIEW] approved {today's date}
  → {N} findings resolved
```

Print:
```
Review approved ✓

Next step: /j-flow-finish
```

### If changes requested (critical findings remain):

Append to `.specs/{slug}/gate-context.md`:
```
[REVIEW] changes-requested {today's date}
  → {N} critical findings — see review-findings.md
```

Print:
```
Review: changes requested
{N} critical finding(s) need resolution.
See .specs/{slug}/review-findings.md

Next step: /j-flow-build --fix
```
