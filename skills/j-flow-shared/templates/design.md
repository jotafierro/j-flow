# {Project Name} Design System
<!-- Prose in the project's Spec language; headings, IDs, gate vocabulary and code stay English — see references/language-contract.md -->

> Source of truth for design tokens. `packages/ui` mirrors these for React; `apps/mobile/lib/core/theme/` mirrors them for Flutter.

---

## Brand & Philosophy

**Personality:** {modern corporate / playful / minimal / technical}
**Aesthetic target:** {one phrase, e.g. "stability through clarity"}
**Emotional target:** {what feeling the UI should evoke}

---

## Color Tokens

Two modes. React: `data-theme` attribute switches. Flutter: `AppTheme.light()` / `AppTheme.dark()`.

### Light mode

| Token | Value | Usage |
|---|---|---|
| `background` | `#{hex}` | Page background |
| `surface` | `#{hex}` | Elevated surfaces |
| `surface-container` | `#{hex}` | Standard containers |
| `on-surface` | `#{hex}` | Primary text on surfaces |
| `primary` | `#{hex}` | Brand primary |
| `on-primary` | `#{hex}` | Text on primary |
| `secondary` | `#{hex}` | Brand secondary |
| `error` | `#{hex}` | Error states |
| `outline` | `#{hex}` | Borders, dividers |

### Dark mode

| Token | Value | Usage |
|---|---|---|
| `background` | `#{hex}` | Page background |
| ... | ... | ... |

---

## Typography

**Font families:**
- Sans: `{font}` — UI, body, headings
- Mono: `{font}` — code, data

**Scale:**

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `display-lg` | 48px | 600 | 56px | Hero |
| `display-md` | 36px | 600 | 44px | Page titles |
| `heading-lg` | 24px | 600 | 32px | Section headings |
| `body-md` | 16px | 400 | 24px | Body text |
| `body-sm` | 14px | 400 | 20px | Secondary text |
| `label` | 12px | 500 | 16px | Form labels |

**Numeric displays:** Use `font-feature-settings: "tnum"` (tabular figures) for currency and quantities.

---

## Spacing Scale

4px base. Tokens: `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px), `space-12` (48px).

---

## Component Patterns

(Populated as components are built. Each component documented in `packages/ui/src/{component}/README.md`.)
