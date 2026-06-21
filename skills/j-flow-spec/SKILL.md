---
name: j-flow-spec
description: Generate functional spec (default) via dialogue, or technical spec (technical argument) via j-flow-architect agent. Both produce approval gates. Usage: /j-flow-spec [technical]
---

# j-flow-spec

## Required reading

Before drafting any spec, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format and approval rules
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` — design constraints for specs (used by /j-flow-spec technical)
3. `PRODUCT.md` — product vision and tech stack to anchor decisions
4. `DESIGN.md` — design system tokens (REQUIRED when the spec includes any UI or mobile work)
5. `.specs/{slug}/gate-context.md` — prior gate decisions to keep continuity
6. `.specs/{slug}/functional-spec.md` (only for `technical` mode) — the functional spec to base the technical spec on
7. Templates: `templates/functional-spec.md` or `templates/technical-spec.md`

## Gate Check

Find the active feature (see j-flow-shared: "How to Find Active Feature").
Read `.specs/{slug}/gate-context.md`.

**For `technical` argument only:** Require `[FUNCTIONAL SPEC] approved`.
If missing or stale: "Gate [FUNCTIONAL SPEC] not approved. Run /j-flow-spec first."

**For default mode:** No prior gate required (it's the first gate).

---

## Mode: Functional Spec (default `/j-flow-spec`)

Generate the functional spec through a dialogue. Ask questions ONE AT A TIME — wait for each answer before asking the next.

### Questions

1. **What does this feature do?** (describe from the user's perspective in 1-2 sentences)
2. **Who uses it?** (which user roles interact with this feature)
3. **What triggers it?** (user action, event, cron schedule, etc.)
4. **What are the acceptance criteria?**
   Guide: "List conditions that must be true for this feature to be complete. Format each as: 'Given {context}, when {action}, then {outcome}'. Aim for 3-8 ACs."
5. **What is explicitly out of scope?** (what this feature does NOT do)
6. **Any constraints?** (performance, security, compliance, UX)

### Handling partial answers

If the user cannot answer a question fully during the dialogue (e.g. "not sure yet", "TBD", "need to check with the team"):
- Record the partial answer.
- Mark it in the draft with `[NEEDS CLARIFICATION: {the unresolved question}]`.
- Example: `- **AC-3** — [NEEDS CLARIFICATION: should rate limiting apply to admin users too?]`

The spec can still be approved with markers present — this allows saving progress. However, `/j-flow-plan` will block until all markers are resolved.

### Draft and Confirm

After collecting all answers, read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/functional-spec.md`. Substitute placeholders with the answers from the dialogue above. Show the draft to the user.

Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` for gate format requirements.

Ask: "Does this spec look right? Reply 'approved' to proceed, or tell me what to change."

If the user requests changes, make them and show the updated draft again.

### Approval

When the user replies 'approved' (or equivalent confirmation):
1. Write `.specs/{slug}/functional-spec.md`
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [FUNCTIONAL SPEC] approved {today's date}
     → key decisions: {1-line summary of main scope decisions}
   ```
3. Print:
   ```
   Functional spec approved and saved ✓
   Next step: /j-flow-spec technical
   ```

After writing the gate entry, scan the written `functional-spec.md` for `[NEEDS CLARIFICATION` markers.
If any found, print:
```
⚠ {N} unresolved [NEEDS CLARIFICATION] marker(s) in the spec.
/j-flow-plan will block until they are resolved.
Edit .specs/{slug}/functional-spec.md to replace each marker with the resolved content.
```

---

## Mode: Technical Spec (`/j-flow-spec technical`)

### Dispatch j-flow-architect

Provide the agent with:
- Full contents of `.specs/{slug}/functional-spec.md`
- Full contents of `.specs/.agents/j-flow-architect.md` (agent memory)
- Template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/technical-spec.md` for the output structure
- Reference `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` for style constraints
- Instruction: "Generate a complete technical spec following the template structure. Every decision must reference an AC. No speculative features."

### Draft and Confirm

Show the agent's output to the user as a draft `technical-spec.md`. Ask:
"Does this technical spec look right? Reply 'approved' to proceed, or tell me what to change."

If the user requests changes, apply them to the draft and show again.

### Approval

When approved:
1. Write `.specs/{slug}/technical-spec.md`
2. Append to `.specs/{slug}/gate-context.md`:
   ```
   [TECHNICAL SPEC] approved {today's date}
     → architecture: {1-line summary of main architecture decisions}
     → patterns: {key patterns chosen, e.g. "repository pattern, JWT guards, Riverpod"}
   ```
3. Print:
   ```
   Technical spec approved and saved ✓
   Next step: /j-flow-plan
   ```
