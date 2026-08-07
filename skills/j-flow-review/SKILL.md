---
name: j-flow-review
description: "Audit code quality against approved technical specs. Only reachable if QA gate is green. Produces review-findings.md. Usage: /j-flow-review"
---

# j-flow-review

## Required reading

**Override resolution:** every `${CLAUDE_PLUGIN_ROOT}/…` template or reference this skill reads resolves through `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — if a matching file exists under `.specs/.overrides/`, use it verbatim instead of the plugin default. For dispatching **j-flow-reviewer**, follow the agent-override dispatch rule in `overrides.md` §"Agent-definition overrides (dispatch)" — session confirmation and tool-scope ceiling included, never widened.

Before auditing, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/layer-order.md` — layer boundaries to check
3. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/agent-scopes.md` — agent ownership (to detect cross-boundary code)
4. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` — implementation rules to enforce
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

### Over-engineering check (optional)

Before dispatching the reviewer agent, run a ponytail scan:

1. **If ponytail plugin is not installed:** print `ℹ ponytail not installed — over-engineering check skipped.` Continue (non-blocking).

2. **If ponytail is installed:** invoke `/ponytail-review` on the current diff.
   - Collect findings. Each finding has format `L{line}: {tag} {what}. {replacement}.`
   - Print findings to the user.
   - Count findings by tag: `delete:`, `stdlib:`, `native:`, `yagni:`, `shrink:`.
   - These findings are **advisory** — they do not block approval.
   - Forward findings to the reviewer agent (Step "Dispatch j-flow-reviewer") so it can include them in `review-findings.md` under an `## Over-engineering` section.

3. Whether skipped or run, record the outcome for the gate entry (see "If approved" section below).

### Dispatch j-flow-reviewer

Provide the agent with:
- Full contents of `.specs/{slug}/technical-spec.md`
- Full contents of `.specs/{slug}/tasks.json`
- Full contents of `.specs/{slug}/review-guide.md`
- Contents of each present file in `.specs/{slug}/review/` (api.md, web.md, mobile.md, admin.md, e2e.md)
- Full contents of `.specs/.agents/j-flow-reviewer.md` (agent memory)
- Template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/review-findings.md` for the output structure
- Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` for style constraints
- Instruction: "Audit the implementation against the technical spec. Check for spec conformance, stack pattern violations, security gaps, performance issues, and speculative code. Produce review-findings.md following the template: populate Critical/Major/Minor sections with findings."
- Additional check — **Swagger coverage (REST mode only)**: scan controller files. Any `@Get`, `@Post`, `@Patch`, `@Delete` method without `@ApiOperation` is a `low` severity finding: "Missing `@ApiOperation` on `{MethodName}` — Swagger UI will show no description for this endpoint." Any DTO property without `@ApiProperty` is also `low`. Skip this check entirely if `@nestjs/graphql` is present in `apps/api/package.json`.

### Show Findings

Display the agent's `review-findings.md` output to the user.

Ask:
"Review complete. Are there any critical or major findings that need fixing?
- Run /j-flow-build --fix to resolve findings, then re-run /j-flow-qa to validate — QA gate must be green again before approving
- Reply 'approved' only after all critical/major findings are resolved AND /j-flow-qa is green"

### Write findings file

Always write `.specs/{slug}/review-findings.md` regardless of verdict.

### If approved (no critical findings or all resolved):

Before accepting approval, verify the most recent gate-context.md `[QA]` entry is `green` and dated **after** the last `[REVIEW] changes-requested` entry. If QA is stale or absent:
```
Cannot approve — QA gate must be re-run after review fixes.
Run /j-flow-qa first, then reply 'approved'.
```

Append to `.specs/{slug}/gate-context.md`:
```
[REVIEW] approved {today's date}
  → constitution: ✓ {N} principles checked
  → ponytail: {✓ N findings | skipped — not installed}
  → {N} findings resolved
```

Advance the **review** gate per `references/gate-rules.md` §"Advancing a gate" — sets the meta.md fields and recomputes the `.specs/README.md` backlog symbol.

Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-finish`):
```
Review approved ✓

Continue to next step?

  1. Yes — run /j-flow-finish now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```

### If changes requested (critical findings remain):

Append to `.specs/{slug}/gate-context.md`:
```
[REVIEW] changes-requested {today's date}
  → {N} critical findings — see review-findings.md
```

Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-build --fix`):
```
Review: changes requested
{N} critical finding(s) need resolution.
See .specs/{slug}/review-findings.md

Continue to next step?

  1. Yes — run /j-flow-build --fix now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```
