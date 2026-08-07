# Contributing to j-flow

Thanks for your interest! j-flow is a solo-maintained Claude Code plugin, but issues and pull requests are welcome.

## Before you open a PR

- Run `npm ci && npm test` — the structural validator that CI enforces (frontmatter, expected skills/agents/templates, layer-consistency mapping).
- Optionally run `npm run scenarios:lint` — a lint over `tests/scenarios/*.yaml` fixtures, not a behavioral test suite. It cannot fail on assertions that require a live skill invocation (`output_contains`, `no_files_written`, etc.); those are reported as `skip`. See `tests/scenarios/README.md`.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
- Keep changes focused, and update `CHANGELOG.md` under `[Unreleased]` when behavior changes.

## Reporting bugs or ideas

Open a GitHub issue describing the command involved, expected vs. actual behavior, and your Claude Code version.
