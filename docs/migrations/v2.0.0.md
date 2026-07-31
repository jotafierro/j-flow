# Migration Guide

## 1.7.0 → 2.0.0

2.0.0 removes two slash commands and one release flag. **No feature data migration is required** — every existing `.specs/` artifact (`meta.md`, `gate-context.md`, backlog symbols, specs, tasks) stays valid. The changes are the plugin's command surface and internal rules, not your project data.

### Update the plugin

```bash
git -C ~/j-flow pull && claude plugin update j-flow
```

### Breaking: renamed / removed commands

The three read-only inspectors were consolidated into one, and the retroactive release mode was removed.

| Before (1.7.x) | After (2.0.0) | Notes |
|----------------|---------------|-------|
| `/j-flow-doctor` | `/j-flow-check --repo` | Repo health diagnostics (drift, missing artifacts, backlog vs gate state). Same 8 checks. |
| `/j-flow-doctor --verbose` | `/j-flow-check --repo --verbose` | Same. |
| `/j-flow-analyze` | `/j-flow-check --consistency` | AC↔task↔test cross-consistency for the active feature. Same 5 checks. |
| `/j-flow-analyze --verbose` | `/j-flow-check --consistency --verbose` | Same. |
| `/j-flow-release --retroactive` | *(removed)* | No replacement. Rewrote git history via interactive rebase — speculative, high-risk. Use standard `/j-flow-release [major\|minor\|patch]`. |

`/j-flow-check` unchanged for its default (feature status) and `--all` modes.

**Action:** update any personal aliases, scripts, or notes that call `/j-flow-doctor`, `/j-flow-analyze`, or `/j-flow-release --retroactive`. Nothing inside a target repo references these commands, so no in-repo edits are needed.

### Cosmetic: dead `[S]` backlog symbol

The `[S]` ("functional spec in progress") backlog symbol was removed — it was unreachable in 1.7.x. If your `.specs/README.md` legend still lists it:

```
| `[S]` | Functional spec in progress |
```

it is harmless and self-heals the next time you run `/j-flow-project --update` (which regenerates the backlog). No manual edit required.

### What did NOT change (no action)

- Existing gate state, specs, tasks, and gate-context files remain valid.
- `meta.md` schema is unchanged. (Recovery skills now also reset `meta.md` gate-status fields — a bug fix that only affects new `/j-flow-reopen` and `/j-flow-update` runs going forward.)
- The gate flow, layers, agents, and QA/review gates are unchanged.

### Recommended after updating

Run the repo health check once per project to surface any drift the new rules catch:

```
/j-flow-check --repo
```
