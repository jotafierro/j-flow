# {Project Name} — Specs Index
<!-- Prose in the project's Spec language; headings, IDs, gate vocabulary and code stay English — see references/language-contract.md -->

{One-line product description from PRODUCT.md tagline}

## Feature Status

| Symbol | Meaning |
|--------|---------|
| `[ ]` | No spec |
| `[S]` | Functional spec in progress |
| `[SF]` | Functional spec approved |
| `[TF]` | Technical spec approved |
| `[P]` | Task plan approved |
| `[B]` | Build completed |
| `[Q]` | QA green |
| `[R]` | Review approved |
| `[✓]` | Finished (merged) |

---

## Phase 0 — Foundation _(required before anything else)_

| Status | Feature | Folder | Description |
|--------|---------|--------|-------------|
| `[ ]` | Monorepo & infra base | `.specs/01-infra-base/` | Turborepo + Docker + CI/CD |
| `[ ]` | Design system | `.specs/02-design-system/` | Tokens, primitives, Storybook |

---

## Phase 1 — Core _(minimum viable product)_

> These features are interdependent. Order is mandatory.

| Status | Feature | Folder | Description | Depends on |
|--------|---------|--------|-------------|------------|
| `[ ]` | {feature} | `.specs/{slug}/` | {description} | {dep} |

---

## Phase 2 — {Phase Name}

| Status | Feature | Folder | Description | Depends on |
|--------|---------|--------|-------------|------------|
| `[ ]` | {feature} | `.specs/{slug}/` | {description} | {dep} |
