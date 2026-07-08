# Storybook — {Project Name}

Storybook 8 catalog for the React design system in `packages/ui`.

## Run

```bash
pnpm --filter @{project}/ui storybook
# Opens http://localhost:6006
```

## Where stories live

- `packages/ui/src/components/*.tsx` — components
- `packages/ui/src/components/*.stories.tsx` — stories co-located with components

## Adding a story

```tsx
// MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = { component: MyComponent };
export default meta;
export const Default: StoryObj<typeof MyComponent> = { args: { ... } };
```

## Design tokens

Tokens live in [`DESIGN.md`](../DESIGN.md). Use CSS variables exposed via the design-system stylesheet; never hardcode colors.

## Default theme

This project's default theme is **{default_theme}** (configured in `packages/ui/.storybook/preview.ts`).
