# Gate Cascade

Reopen/update mechanics — read by `/j-flow-reopen` and `/j-flow-update`. If this
reference is already in your session context from earlier in this conversation,
don't re-read it.

## Cascade rules for /j-flow-reopen

Reopening at phase X resets X and all downstream gates back to `pending`. Commits are NOT reverted.

| Reopen at | Resets |
|-----------|--------|
| functional | functional + technical + tasks + build + qa + review + finish |
| technical | technical + tasks + build + qa + review + finish |
| tasks | tasks + build + qa + review + finish |
| build | build + qa + review + finish |
| qa | qa + review + finish |
| review | review + finish |
| finish | finish |

## Resetting a gate (reopen / update)

When a gate is cleared (`/j-flow-reopen`) or invalidated (`/j-flow-update`), update ALL THREE stores for each affected gate, in this order:

1. **gate-context.md** — reopen: remove the gate's entry (truncate after the last kept gate). update: append ` [stale]` to the gate's status line.
2. **meta.md** — set the gate's `{phase}_status:` field: reopen → `pending`; update → `stale`. On reopen, also set `current_phase` to the earliest reopened phase.
3. **.specs/README.md** — recompute the feature's backlog symbol from the updated meta.md per `gate-symbols.md` §"Backlog symbols".

Phase → meta field: functional→`functional_status`, technical→`technical_status`, task plan→`tasks_status`, build→`build_status`, qa→`qa_status`, review→`review_status`, finish→`finish_status`. Downstream sets are in "Cascade rules" above.

## Stale marker (from /j-flow-update)

Mark downstream gates by appending ` [stale]`:
- `[BUILD] completed 2026-06-12 [stale]`
- `[QA] green 2026-06-12 [stale]`

Stale gates block subsequent skills the same as missing gates.
