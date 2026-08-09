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

1. **gate-context.md** — reopen: remove the gate's block (blocks are in canonical gate order and there is exactly one per gate, so this is a truncation after the last kept gate) and **append each removed block verbatim to `gate-log.md`** — reopening discards gate state, not the record that it existed. update: append ` [stale]` to the gate's status line; the block stays in `gate-context.md` (it is still the current block for that gate — see `gate-core.md` §"gate-context.md format" for why stale and superseded are different things).
2. **meta.md** — set the gate's `{phase}_status:` field: reopen → `pending`; update → `stale`. On reopen, also set `current_phase` to the earliest reopened phase.
3. **.specs/README.md** — recompute the feature's backlog symbol from the updated meta.md per `gate-symbols.md` §"Backlog symbols".

Phase → meta field: functional→`functional_status`, technical→`technical_status`, task plan→`tasks_status`, build→`build_status`, qa→`qa_status`, review→`review_status`, finish→`finish_status`. Downstream sets are in "Cascade rules" above.

## Stale marker (from /j-flow-update)

Mark downstream gates by appending ` [stale]`:
- `[BUILD] completed 2026-06-12 [stale]`
- `[QA] green 2026-06-12 [stale]`

Stale gates block subsequent skills the same as missing gates.

A stale block stays in `gate-context.md` — it is still the current block for its gate, just invalidated. When the phase is re-approved, the advance procedure supersedes it: the stale block moves to `gate-log.md` and the fresh one takes its place (`gate-core.md` §"Advancing a gate"). So a feature revised four times has one `[TECHNICAL SPEC]` block in `gate-context.md` and three superseded ones in `gate-log.md`, not four blocks in one file.
