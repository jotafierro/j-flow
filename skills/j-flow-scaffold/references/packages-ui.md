# Scaffold Package — packages/ui

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_web` or `has_admin` (whichever comes first needs this loaded before its own layer file). Covers `packages/ui` (React design system + Storybook), a shared dependency for both the web and admin layers.

**packages/ui (React design system + Storybook) — only if `has_web` or `has_admin`:**

Create `packages/ui/package.json` first. Storybook 10.x folded `addon-essentials`, `addon-interactions`, `addon-blocks`, and `@storybook/react` into the core — devDeps simplified:

```json
{
  "name": "@{project}/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@{project}/config": "workspace:*",
    "typescript": "^5.4.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@storybook/react-vite": "^10.0.0",
    "storybook": "^10.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

Do NOT add `@storybook/react`, `@storybook/blocks`, `@storybook/addon-essentials`, or `@storybook/addon-interactions` — they no longer exist as standalone packages in v10.

**Create `packages/ui/tsconfig.json`** — `storybook init` doesn't generate one, so without this step `packages/ui` never engages `packages/config` at all:
```json
{
  "extends": "@{project}/config/tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "noEmit": true },
  "include": ["src"]
}
```

Then run init (skips install — root `pnpm install` later resolves everything via workspace + the `.npmrc` hoist patterns we wrote in Step 2):

```bash
cd packages/ui && npx -y storybook@latest init --yes --no-dev --skip-install --no-features
cd ../..
```

Do NOT pass `--type=react-vite` — current Storybook CLI rejects it (`--type` choices no longer include `react-vite`; valid values are `react`, `nextjs`, etc.). Omit `--type` entirely: the CLI auto-detects `react-vite` correctly from the `vite` + `react` deps already in `packages/ui/package.json`.

`--no-features` disables the CLI's default auto-installed addons (`addon-vitest`, `addon-a11y`, `addon-docs`, `addon-mcp`, `@chromatic-com/storybook`) which otherwise pull in `vitest` + `playwright` + browser binary downloads (triggered even with `--skip-install`) — unwanted duplication with apps/e2e's own Playwright setup. With `--no-features`, `.storybook/main.ts` is generated with `addons: []` directly; do not hand-write or replace it.

`storybook init` creates `src/stories/` with default Button/Header/Page examples — DELETE that directory entirely:
```bash
rm -rf packages/ui/src/stories
```

Generate a DESIGN.md-aligned Welcome component instead.

Write `packages/ui/src/components/Welcome.tsx`:
```tsx
import './welcome.css';

export type WelcomeProps = {
  projectName: string;
  variant?: 'light' | 'dark';
};

export function Welcome({ projectName, variant = '{default_theme}' }: WelcomeProps) {
  return (
    <div className={`welcome welcome--${variant}`}>
      <h1 className="welcome__title">{projectName}</h1>
      <p className="welcome__tag">Design System Starter</p>
    </div>
  );
}
```
(Substitute `{default_theme}` with the actual value, e.g. `'dark'` or `'light'`.)

Write `packages/ui/src/components/welcome.css`:
```css
.welcome {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
}

.welcome--light {
  --bg: {color_bg_light};
  --fg: {color_fg_light};
  --primary: {color_primary_light};
  background: var(--bg);
  color: var(--fg);
}

.welcome--dark {
  --bg: {color_bg_dark};
  --fg: {color_fg_dark};
  --primary: {color_primary_dark};
  background: var(--bg);
  color: var(--fg);
}

.welcome__title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700;
  color: var(--primary);
  text-align: center;
}

.welcome__tag {
  font-size: 1rem;
  opacity: 0.6;
  text-align: center;
  margin-top: 0.5rem;
}
```
(Substitute color token hex values from DESIGN.md or fallbacks.)

Write `packages/ui/src/components/Welcome.stories.tsx`. **Storybook 10+ requires `@storybook/react-vite` for types, not `@storybook/react`:**
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Welcome } from './Welcome';

const meta: Meta<typeof Welcome> = {
  component: Welcome,
  parameters: { layout: 'fullscreen' },
  args: { projectName: '{Project Name}' },
};
export default meta;

type Story = StoryObj<typeof Welcome>;

export const Light: Story = { args: { variant: 'light' } };
export const Dark: Story = { args: { variant: 'dark' } };
```

Update `packages/ui/.storybook/preview.tsx` (current CLI generates `.tsx`, not `.ts`) to set the default background per `default_theme`. If `default_theme === 'dark'`, add:
```ts
parameters: {
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'light', value: '{color_bg_light}' },
      { name: 'dark', value: '{color_bg_dark}' },
    ],
  },
},
```
If `default_theme === 'light'`, set `default: 'light'` instead.

Write `packages/ui/src/index.ts`:
```typescript
export * from './components/Welcome';
```
