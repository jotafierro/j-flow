---
name: j-flow-eject
description: "Copy a j-flow template, reference, agent definition, or agent memory file from the plugin into the target repo under `.specs/.overrides/` so it can be customized without forking. Usage: /j-flow-eject [asset-path]"
---

# j-flow-eject

Copy a single j-flow asset into the target repo's `.specs/.overrides/` tree so you can edit it without forking the plugin.

## What can be ejected

| Asset kind | Source path (plugin) | Destination (target repo) |
|------------|----------------------|---------------------------|
| Template | `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/<file>` | `.specs/.overrides/templates/<file>` |
| Agent memory template | `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/<file>` | `.specs/.overrides/templates/agents/<file>` |
| Reference | `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/<file>` | `.specs/.overrides/references/<file>` |
| Agent definition | `${CLAUDE_PLUGIN_ROOT}/agents/<file>` | `.specs/.overrides/agents/<file>` |

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

If argument provided, validate in this order — fail closed, stop at the first violation:

1. Reject if the argument contains `..` anywhere, starts with `/` or `~`, or contains a null byte. Stop with: `Invalid path. Must be a relative path under one of: templates/, templates/agents/, references/, agents/ — no '..', and no absolute or home-relative paths.` (A bare prefix check is not enough — `templates/../../../../etc/passwd` starts with `templates/` too.)
2. Validate the (now traversal-free) path matches one of the four allowed prefixes (`templates/`, `templates/agents/`, `references/`, `agents/`). Reject anything else with: `Invalid path. Allowed prefixes: templates/, templates/agents/, references/, agents/`.

### Step 2: Verify source exists and is contained

Resolve the source path under `${CLAUDE_PLUGIN_ROOT}`:
- `templates/<file>` → `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/<file>`
- `templates/agents/<file>` → `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/agents/<file>`
- `references/<file>` → `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/<file>`
- `agents/<file>` → `${CLAUDE_PLUGIN_ROOT}/agents/<file>`

After resolving to an absolute path, verify it is still contained under the corresponding plugin directory above (`${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/templates/`, `.../references/`, or `${CLAUDE_PLUGIN_ROOT}/agents/`) — reject if the resolved path falls outside it, even if Step 1's string check passed. This is defense in depth, not redundant: it also catches anything Step 1 missed.

If the source file does not exist, stop with: `Source not found: <path>. Run /j-flow-eject without arguments to list available assets.`

### Step 3: Compute the destination and verify it's contained

Destination is `.specs/.overrides/<argument>` (mirroring the same prefix structure). Resolve it to an absolute path and verify it is contained under `.specs/.overrides/` in the target repo's root — reject with the Step 1 message if not.

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
  source: ${CLAUDE_PLUGIN_ROOT}/.../<file>
  dest:   .specs/.overrides/<argument>

Edit the destination file. Forward skills resolve it over the plugin default automatically — see ${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md.
```

### Step 6: Stage but do not commit

Do `git add` for the new file. Do NOT commit — the user reviews the diff and commits. Print: `Override staged. Review and commit when ready.`

## Rules

- Single file per invocation. No bulk eject.
- Never overwrite an existing override.
- The destination is always under `.specs/.overrides/` — no other location is supported.
- This skill only COPIES the asset. Forward skills honor the override at load/dispatch time per `${CLAUDE_PLUGIN_ROOT}/skills/j-flow-shared/references/overrides.md` — an edited override wins over the plugin default.
- Do not eject SKILL.md files themselves. Reject those paths. SKILL bodies, the `/j-flow-scaffold` generation, and the `/j-flow-qa` stage commands are deliberately NOT overridable (the opinionated core) — see the boundary note in `references/overrides.md`.
