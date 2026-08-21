# Language Contract

What gets written in the project's language and what never does. Canonical — skills
and agents reference this file rather than restating any of it.

**The rule that resolves every case not listed below: if a skill looks for it, it is
not translated. If a human reads it, it is.**

## Reading the config

Read `.specs/config.md`:

- `**Spec language:**` — prose inside `.specs/`, and the dialogues this flow prints.
- `**Docs language:**` — `docs/`, `CHANGELOG.md`, `README.md`.

If the file is absent, or a field is absent or unrecognized, both default to `en`.
Never fail because the file is missing. Values are IETF language subtags (`en`, `es`, …).

## The three layers of every artifact

| Layer | What it is | Language |
|---|---|---|
| **1. Structural** | what a skill looks for by literal string: keys, gate vocabulary, section headings, markers, IDs | **English, frozen** — see the list below |
| **2. Prose** | what a human reads: purpose, criteria, rationale, findings, risks | the applicable language field |
| **3. Code** | identifiers, field names, enum values, error codes, comments, commit messages, branch names, slugs | **English, always** (see `code-style.md`) |

## Artifact → language

**`Spec language`:** `.specs/{slug}/functional-spec.md` · `technical-spec.md` · `review-guide.md` · `qa-report.md` · `review-findings.md` · the feature's `README.md` · the decision prose in `gate-context.md` and `gate-log.md` · the *description* fields of `tasks.json` (never its keys) · `.specs/_system/*.md` · the Learned Patterns entries in `.specs/.agents/*.md` · the feature descriptions in `.specs/README.md` · `PRODUCT.md`, `DESIGN.md`, `CONSTITUTION.md` · **and the dialogues printed to the user**.

**`Docs language`:** `docs/features/*.md` · `docs/architecture/*.md` · `docs/features/README.md` · `CHANGELOG.md` · the root `README.md`.

`/j-flow-finish` is the only skill that writes both in one run — its feature README and `_system/` entry follow `Spec language` while its `docs/` pages and CHANGELOG entry follow `Docs language`. Its Step 1c already rewrites for register ("user-facing language"); that rewrite also crosses languages.

## The frozen vocabulary (never translated)

Derived by sweeping the plugin, not by assumption. Every entry below has at least one
real consumer.

**`meta.md`** — every key (`feature`, `branch`, `created_at`, `stack`, `fast_track`, `{phase}_status`, `{phase}_approved_at`, `{phase}_completed_at`, `current_phase`) **and every value**: `pending`, `approved`, `green`, `completed`, `red`, `changes-requested`, `stale`, `true`/`false`, and the `current_phase` values `functional`, `technical`, `planning`, `build`, `qa`, `review`, `finish`, `done`.

**Gate block names** in `gate-context.md` / `gate-log.md` — `[FUNCTIONAL SPEC]`, `[TECHNICAL SPEC]`, `[TASK PLAN]`, `[BUILD]`, `[QA]`, `[REVIEW]`, and the `[stale]` suffix. The status word that follows the name is a `meta.md` value and is frozen with it.

**Backlog symbols** (`gate-symbols.md`) — `[ ]`, `[SF]`, `[TF]`, `[P]`, `[B]`, `[Q]`, `[R]`, `[✓]`.

**Markers** — `[NEEDS CLARIFICATION: …]`: the marker is English, **the question inside it is prose** and follows `Spec language`. `<!-- next feature entries are appended above this line -->` and the `Last updated:` / `Date:` lines are frozen verbatim.

**Given/When/Then** — `**Given**`, `**When**`, `**Then:**`. Plan 013 made these format, not prose. The text after each one is prose.

**IDs** — `AC-N`, `DD-N`, the task ids in `tasks.json`, feature slugs, `feature/{slug}`, and Conventional Commit types.

**Section headings** of every artifact template. They are the artifact's schema. Nine of them are additionally **matched by literal string today**, so translating one of these breaks a skill immediately rather than eventually:

`## Architecture Overview` · `## Design decisions` · `## Scope` · `## Verdict` · `## Failures` · `## Test Results` · `## Critical (must fix before approval)` · `## Major (should fix)` · `## Minor (optional)`

plus, in `CHANGELOG.md`, `## [Unreleased]` and its `### Added` / `### Fixed` / `### Changed`.

The rest (`## Purpose`, `## Feature users`, `## Trigger`, `## Acceptance criteria`, `## Edge cases`, `## Risks`, `## Dependencies`, the technical-spec layer headings, …) have no literal consumer at the time of writing — they are frozen anyway, because a stable schema is the point and a future skill will grep one of them.

## Two known inconsistencies (pre-existing, do not "fix" while translating)

- `## Acceptance criteria` in `functional-spec.md` vs `## Acceptance Criteria` in `feature-readme.md`. Both are frozen as they are; unifying them is a separate change with its own blast radius.
- No `[FINISH]` gate block name exists anywhere in the plugin, though the gate order includes finish. Whatever a run writes there today is unspecified — do not invent a translated one.
- **No shared reference enumerates the six gate block names.** `gate-core.md` shows `[FUNCTIONAL SPEC]` and `[TECHNICAL SPEC]` by example, `gate-cascade.md` carries `[QA]`/`[BUILD]`/`[REVIEW]`, and `[TASK PLAN]` appears only in the skills that consume it. The list above is currently the closest thing to a full enumeration, which is a side effect of writing this contract, not its job — treat it as frozen vocabulary, not as the canonical gate-naming source.

## What this contract does not cover

Anything in layer 3 — see `code-style.md`. And the plugin's own files: skills, agents,
references and templates are written in English regardless of any project's config. The
contract governs what a run *writes into a project*, not what the plugin *is*.
