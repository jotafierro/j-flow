# Security Policy

## Trust boundaries

`.specs/.overrides/` (created by `/j-flow-eject`) is a **trust surface equivalent to executable code**, not configuration. An overridden agent definition fully controls that agent's behavior when it's dispatched — review a change to it like you'd review a code change. Forward skills apply a tool-scope ceiling (an override can never gain tools beyond the plugin agent it replaces) and a one-time-per-session confirmation before first use; see `skills/j-flow-shared/references/overrides.md`. That mitigates blast radius — it does not make ejecting an agent definition risk-free.

Everything else under `.specs/**` (agent memory, specs, tasks, gate-context) is forwarded into agent dispatches as **observed project state, never as instructions** — see `references/agent-scopes.md` §"Trust boundary". `/j-flow-check --repo` heuristically flags memory files that read like they're trying to be treated as instructions.

## Reporting a vulnerability

Please report security issues privately — do **not** open a public issue.

- Preferred: GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository.
- Or email: connect@jotafierro.me

You'll get an acknowledgement as soon as possible. Thanks for helping keep j-flow safe.
