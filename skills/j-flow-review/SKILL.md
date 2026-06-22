---
name: j-flow-review
description: Audit code quality against approved technical specs. Only reachable if QA gate is green. Produces review-findings.md. Usage: /j-flow-review
allowed-tools: Read Write
---

# j-flow-review

## Required reading

Before auditing, read:

1. `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/gate-rules.md` — gate format
2. `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/layer-order.md` — layer boundaries to check
3. `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/agent-scopes.md` — agent ownership (to detect cross-boundary code)
4. `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/code-style.md` — implementation rules to enforce
5. `DESIGN.md` — required if review touches UI/mobile (token usage)
6. `.specs/{slug}/functional-spec.md` — to verify ACs are met
7. `.specs/{slug}/technical-spec.md` — to verify architecture is respected
8. `.specs/{slug}/tasks.json` — to detect speculative code
9. `.specs/{slug}/gate-context.md` — accumulated decisions
10. `CONSTITUTION.md` — project principles to enforce (if absent: warn and skip check)
11. Template: `templates/review-findings.md` — output format

## Gate Check

Find the active feature. Read `.specs/{slug}/gate-context.md`.
Require `[QA] green`.
If QA gate is absent, red, or stale:
"Gate [QA] not green. Run /j-flow-qa first (and resolve any failures with /j-flow-build --fix)."

## Process

### Principles check (blocking)

Before dispatching the reviewer agent, check `CONSTITUTION.md`:

1. **If file does not exist:** print `⚠ CONSTITUTION.md not found — principles check skipped. Run /j-flow-project to generate it.` Continue (non-blocking).

2. **If file exists but contains the placeholder** (line matching `*(none defined`): print `⚠ No principles defined in CONSTITUTION.md — skipping check.` Continue (non-blocking).

3. **If principles are defined:** for each principle (P1, P2, ...):
   - Read the principle name and text.
   - Evaluate the feature's changed files (from `tasks.json` file list) against the principle.
   - Report:
     - `✓ P{N} — {name}` if no violation detected.
     - `✗ P{N} — {name}: {specific violation, with file and location if possible}` if violated.

4. **If any principle is violated (`✗`):**
   ```
   [REVIEW] BLOCKED — constitution violation(s) found:

     ✗ P{N} — {name}: {violation detail}

   Fix the violation(s) above before re-running /j-flow-review.
   CONSTITUTION.md principles are inviolable — they cannot be overridden per-feature.
   ```
   Do NOT write any gate entry. Stop here.

5. **If all principles pass:** print `✓ Constitution: {N} principles checked.` Continue to reviewer agent dispatch.

### Dispatch j-flow-reviewer

Provide the agent with:
- Full contents of `.specs/{slug}/technical-spec.md`
- Full contents of `.specs/{slug}/tasks.json`
- Full contents of `.specs/{slug}/review-guide.md`
- Full contents of `.specs/.agents/j-flow-reviewer.md` (agent memory)
- Template `${CLAUDE_SKILL_DIR}/../j-flow-shared/templates/review-findings.md` for the output structure
- Reference `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/code-style.md` for style constraints
- Instruction: "Audit the implementation against the technical spec. Check for spec conformance, stack pattern violations, security gaps, performance issues, and speculative code. Produce review-findings.md following the template: populate Critical/Major/Minor sections with findings."

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
  → constitution: ✓ {N} principles checked
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
