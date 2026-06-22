---
name: j-flow-eject
description: Copy a j-flow template, reference, agent definition, or agent memory file from the plugin into the target repo under `.specs/.overrides/` so it can be customized without forking. Usage: /j-flow-eject [asset-path]
allowed-tools: Read Write Bash(cp *) Bash(mkdir *)
---

# j-flow-eject

Copy a single j-flow asset into the target repo's `.specs/.overrides/` tree so you can edit it without forking the plugin.

## What can be ejected

| Asset kind | Source path (plugin) | Destination (target repo) |
|------------|----------------------|---------------------------|
| Template | `${CLAUDE_SKILL_DIR}/../j-flow-shared/templates/<file>` | `.specs/.overrides/templates/<file>` |
| Agent memory template | `${CLAUDE_SKILL_DIR}/../j-flow-shared/templates/agents/<file>` | `.specs/.overrides/templates/agents/<file>` |
| Reference | `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/<file>` | `.specs/.overrides/references/<file>` |
| Agent definition | `${CLAUDE_SKILL_DIR}/../j-flow-shared/agents/<file>` | `.specs/.overrides/agents/<file>` |

## Usage

```
/j-flow-eject                                  # interactive: list categories and pick
/j-flow-eject templates/technical-spec.md      # eject a specific template
/j-flow-eject agents/j-flow-frontend.md        # eject a specific agent definition
/j-flow-eject references/code-style.md         # eject a reference
```

## Process

### Step 1: Resolve the asset

If no argument: list ejectable assets by category and ask the user to pick one. Show each as a path.

If argument provided: validate the path matches one of the four allowed prefixes (`templates/`, `templates/agents/`, `references/`, `agents/`). Reject anything else with: `Invalid path. Allowed prefixes: templates/, templates/agents/, references/, agents/`.

### Step 2: Verify source exists

Resolve the source path under `${CLAUDE_SKILL_DIR}/../`:
- `templates/<file>` → `${CLAUDE_SKILL_DIR}/../j-flow-shared/templates/<file>`
- `templates/agents/<file>` → `${CLAUDE_SKILL_DIR}/../j-flow-shared/templates/agents/<file>`
- `references/<file>` → `${CLAUDE_SKILL_DIR}/../j-flow-shared/references/<file>`
- `agents/<file>` → `${CLAUDE_SKILL_DIR}/../j-flow-shared/agents/<file>`

If the source file does not exist, stop with: `Source not found: <path>. Run /j-flow-eject without arguments to list available assets.`

### Step 3: Compute the destination

Destination is `.specs/.overrides/<argument>` (mirroring the same prefix structure).

### Step 4: Refuse to overwrite

If the destination already exists, stop with:
```
Override already exists at .specs/.overrides/<argument>.
Edit it directly, or delete it first if you want a fresh copy from the plugin.
```

Never silently overwrite a user-edited override.

### Step 5: Copy and report

Create the destination directory if needed. Copy the source file verbatim to the destination. Print:

```
✓ Ejected <argument>
  source: ${CLAUDE_SKILL_DIR}/../j-flow-shared/...<file>
  dest:   .specs/.overrides/<argument>

Edit the destination file. Skills will prefer it over the plugin default once the override-resolution pattern is enabled (tracked in plans/008 — not yet active).
```

### Step 6: Stage but do not commit

Do `git add` for the new file. Do NOT commit — the user reviews the diff and commits. Print: `Override staged. Review and commit when ready.`

## Rules

- Single file per invocation. No bulk eject.
- Never overwrite an existing override.
- The destination is always under `.specs/.overrides/` — no other location is supported.
- This skill only COPIES — it does not enable the override-lookup behavior elsewhere. Until plan 008 (override-resolution) ships, ejected files exist but are inert. Tell the user this in the confirmation message.
- Do not eject SKILL.md files themselves. Reject those paths.
