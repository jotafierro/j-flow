---
name: j-flow-spec
description: Generate functional spec (default) via dialogue, or technical spec (technical argument) via j-flow-architect agent, or explore scope without committing (--explore). Both spec modes produce approval gates. Usage: /j-flow-spec [technical|--explore]
---

# j-flow-spec

## Required reading

**Override resolution:** every `${CLAUDE_PLUGIN_ROOT}/…` template or reference this skill reads resolves through `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — if a matching file exists under `.specs/.overrides/`, use it verbatim instead of the plugin default. Before dispatching **j-flow-architect**, if `.specs/.overrides/agents/j-flow-architect.md` exists, dispatch a general-purpose agent seeded with that file's content instead of the built-in subagent (task context and memory forwarded unchanged).

Before drafting any spec, read:

1. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/gate-rules.md` — gate format and approval rules
2. `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/code-style.md` — design constraints for specs (used by /j-flow-spec technical)
3. `PRODUCT.md` — product vision and tech stack to anchor decisions
4. `DESIGN.md` — design system tokens (REQUIRED when the spec includes any UI or mobile work)
5. `.specs/_system/` — living system spec for all domains (read ALL domain files present; use to avoid contradicting established behavior or duplicating ACs already in the system). Skip if directory does not exist yet.
6. `.specs/{slug}/gate-context.md` — prior gate decisions to keep continuity
7. `.specs/{slug}/functional-spec.md` (only for `technical` mode) — the functional spec to base the technical spec on
8. Templates: `templates/functional-spec.md` or `templates/technical-spec.md`

## Gate Check

Find the active feature (see j-flow-shared: "How to Find Active Feature").
Read `.specs/{slug}/gate-context.md`.

**For `technical` argument only:** Require `[FUNCTIONAL SPEC] approved`.
If missing or stale: "Gate [FUNCTIONAL SPEC] not approved. Run /j-flow-spec first."

**For default mode:** No prior gate required (it's the first gate).

**For `--explore` mode:** No prior gate required. No files will be written.

---

## Mode: Explore (`/j-flow-spec --explore`)

Lightweight scoping conversation. No files are written. No gate is created. Ends with a summary and an offer to start the real spec.

### When to use

Use `--explore` when the feature idea is still vague:
- "I want to add notifications but I'm not sure of the scope."
- "Should this be one feature or two?"
- "Which existing features does this touch?"

If the feature already has `[FUNCTIONAL SPEC] approved` in `gate-context.md`, print:
`⚠ This feature already has an approved functional spec. Use /j-flow-reopen to revisit it, or /j-flow-spec (no flag) to re-run.` Stop.

### Dialogue

Ask the following questions conversationally — keep it casual, no formal numbered list. Wait for each answer before asking the next.

1. What's the rough idea? (1–3 sentences, user's words, no structure needed)
2. Who benefits from this? (user roles or system actors)
3. What's the trigger? (user action, event, or schedule — even a vague answer is fine)
4. Any obvious constraints or things it definitely should NOT do?
5. Does this feel like one feature, or could it be split? (if split: ask what the natural boundaries are)

### Scope summary

After the 5 questions, produce a short unstructured summary:

```
Explore summary — {rough feature name}

What it does: {1–2 sentences}
Who: {roles}
Trigger: {trigger}
Constraints: {constraints or "none identified"}
Domains likely affected: {list domains from .specs/_system/ if it exists, otherwise from PRODUCT.md context}
Suggested split: {1 feature / split into: {A}, {B}} — {reason if split}

Open questions:
  - {any questions that came up during dialogue needing answers before speccing}

Spec-ready? {yes / not yet — and why if not}
```

If `.specs/_system/` exists: note any existing behaviors this idea might extend or conflict with (1 line each).

### Commit or continue

Ask:
> "Ready to start the real spec? Reply 'yes' to move to `/j-flow-spec`, 'split' to discuss splitting further, or 'not yet' to end here."

- **`yes`**: transition immediately to Mode: Functional Spec (run the full dialogue as if `/j-flow-spec` was invoked fresh). Use the explore summary as pre-filled context — skip questions clearly answered already.
- **`split`**: ask the user to name the sub-features. Produce a summary for each. Then ask again.
- **`not yet`**: print `Explore session ended. No files written. Run /j-flow-spec --explore again when ready, or /j-flow-spec to start the formal spec.`

### Rules for --explore

- Never write any file. No `.specs/` changes, no `gate-context.md` entries.
- Never output a gate status line.

---

## Mode: Functional Spec (default `/j-flow-spec`)

Generate the functional spec through a dialogue. Ask questions ONE AT A TIME — wait for each answer before asking the next.

### Questions

Before asking question 1, check if `.specs/_system/` exists and has any domain files.
If yes: read all domain files and keep them in context as the current behavioral baseline.
If during the dialogue a user answer describes behavior already covered by an existing AC in `_system/`, surface it:
  "⚠ Similar behavior exists in `_system/{domain}.md`: '{existing AC}'. Confirm this is an intentional extension or modification."
Do not block the spec — just surface the overlap so the user makes an informed choice.

1. **What does this feature do?** (describe from the user's perspective in 1-2 sentences)
2. **Who uses it?** (which user roles interact with this feature)
3. **What triggers it?** (user action, event, cron schedule, etc.)
4. **What are the acceptance criteria?**
   Guide: "List conditions that must be true for this feature to be complete. Use Given/When/Then format for each:
     - **Given** {precondition or system state}
     - **When** {user action or system event}
     - **Then:** {observable outcomes, one per line}
   Each AC should be atomic — one observable outcome per criterion. Aim for 3–8 ACs.
   Example:
     AC-1 — User login
       Given the user is not authenticated
       When they submit valid credentials
       Then: they receive a JWT token, they are redirected to the dashboard"
5. **What is explicitly out of scope?** (what this feature does NOT do)
6. **Any constraints?** (performance, security, compliance, UX)

### Handling partial answers

If the user cannot answer a question fully during the dialogue (e.g. "not sure yet", "TBD", "need to check with the team"):
- Record the partial answer.
- Mark it in the draft with `[NEEDS CLARIFICATION: {the unresolved question}]`.
- Example: `- **AC-3** — [NEEDS CLARIFICATION: should rate limiting apply to admin users too?]`

The spec can still be approved with markers present — this allows saving progress. However, `/j-flow-plan` will block until all markers are resolved.

### Draft and Confirm

After collecting all answers, read template `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/functional-spec.md`. Substitute placeholders with the answers from the dialogue above. When substituting ACs: format each as `### AC-N — {short name}` with `Given / When / Then:` structure following the template exactly. If the user provided free-form ACs during the dialogue, convert them to GWT format before writing the draft — show the conversion alongside the original text if the interpretation may not be obvious. Show the full draft to the user.

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
3. Advance the **functional** gate per `references/gate-rules.md` §"Advancing a gate" — sets the meta.md fields and recomputes the `.specs/README.md` backlog symbol.
4. Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-spec technical`):
   ```
   Functional spec approved and saved ✓

   Continue to next step?

     1. Yes — run /j-flow-spec technical now
     2. No — stay here, I want to discuss or adjust first

   Enter 1 or 2:
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
- Instruction: "Generate a complete technical spec following the template structure. Every decision must reference an AC. No speculative features. If the functional spec has few ACs and requires no new architectural decisions (a bugfix, a copy/config tweak, or a small addition that follows an existing pattern already in this codebase), keep the spec minimal: a one-paragraph `## Architecture Overview` naming the existing pattern followed, `## Design decisions` stating 'None — follows existing {pattern}', and 'N/A' for any section that doesn't apply. Do not invent content to fill a section that has nothing to say."

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
3. Advance the **technical** gate per `references/gate-rules.md` §"Advancing a gate" — sets the meta.md fields and recomputes the `.specs/README.md` backlog symbol.
4. Print the completion message, then use the Next-step dialogue from `references/gate-rules.md` (next command: `/j-flow-plan`):
   ```
   Technical spec approved and saved ✓

   Continue to next step?

     1. Yes — run /j-flow-plan now
     2. No — stay here, I want to discuss or adjust first

   Enter 1 or 2:
   ```
