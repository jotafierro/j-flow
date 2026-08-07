# Gate Symbols

The `.specs/README.md` backlog symbol lookup — read by `/j-flow-project` (sync) and
`/j-flow-check --repo` (drift check), and by any skill recomputing a feature's symbol
after changing its gate state. If this reference is already in your session context
from earlier in this conversation, don't re-read it.

## Backlog symbols

The `.specs/README.md` backlog symbol for a feature, computed from meta.md state (first match wins, top to bottom). This is the single source — `j-flow-project` (sync) and `j-flow-check --repo` (drift check) both use it.

| Condition | Symbol |
|-----------|--------|
| `finish_status: completed` | `[✓]` |
| `review_status: approved` | `[R]` |
| `qa_status: green` | `[Q]` |
| `build_status: completed` | `[B]` |
| `tasks_status: approved` | `[P]` |
| `technical_status: approved` | `[TF]` |
| `functional_status: approved` | `[SF]` |
| otherwise (`pending`, `stale`, or no meta.md) | `[ ]` |

A `stale` value matches no gate condition and falls through to the earlier gate's symbol.
