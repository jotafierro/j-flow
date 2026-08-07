# Scenario Tests

YAML files in this directory describe behavioral contracts for j-flow skills.

## Runner: `tests/run-scenarios.js`

The runner parses each YAML, builds a fixture file tree under a temp directory from the `context:` block, and evaluates the `assertions:` list against the fixture's state.

## What the current runner verifies

Only file-system state derivable from the YAML's input `context:` block:

- `gate_context_contains: <str>` — passes if the literal `gate_context` input contains the substring; fails if the scenario has no `gate_context` in its `context:` block to check against; skips if the substring is absent (it may only appear post-execution, which this runner can't simulate).
- `gate_context_not_contains: <str>` — always skipped (cannot distinguish pre- from post-execution state without invoking the skill).
- `file_exists: <path>`, `file_not_exists: <path>` — checked against the fixture tree.

Everything else (string-on-output, no-files-written, qa_report_gate, etc.) requires invoking the real skill via Claude Code. Those assertions are reported as `skip` and counted but never fail.

This runner is **not** run as part of `npm test` — it can't fail on live-invocation assertions, so a green run doesn't mean a skill behaves correctly. Run it explicitly via `npm run scenarios:lint` as a lint over the YAML fixtures themselves (do they parse, do their FS-checkable assertions hold), not as a behavioral test suite.

## Adding a new scenario

1. Create `tests/scenarios/<name>.yaml`.
2. Use the matchers documented above for assertions you want the runner to verify.
3. Include `output_contains` and other "live execution" matchers as documentation — a future runner variant will execute the actual skill and turn those skips into pass/fail.

## Running

```bash
node tests/run-scenarios.js
```

Exit code 0 if no FS-verifiable assertion fails. Exit code 1 if any FS-verifiable assertion fails.
