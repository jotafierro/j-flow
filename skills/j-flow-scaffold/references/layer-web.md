# Scaffold Layer — web

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_web`. Covers `apps/web` (React + Vite). Requires `packages/ui` and `packages/domain` to already exist on disk (see Step 4's ordering note in the main skill) — read `references/packages-ui.md` first if `has_web` or `has_admin`.

**apps/web (React + Vite) — only if `has_web`:**
```bash
cd apps && pnpm create vite@9.1.2 web --template react-ts
cd ..
```

Post-process `apps/web/package.json`:
- Rename to `@{project}/web`
- Add external deps: `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-router-dom` (use real version ranges) — omit `@tanstack/react-query` if `!has_api` (nothing to fetch)
- **If `styling: 'tailwind'`:** also add `tailwindcss`, `@tailwindcss/vite` to devDependencies (Tailwind v4 — no `tailwind.config.js` or `postcss.config.js` needed)
- Add internal workspace deps with `workspace:*` protocol — REQUIRED for pnpm to link locally instead of trying npm registry. Only include `@{project}/api-client` if `has_api`:
  ```json
  "dependencies": {
    "@{project}/ui": "workspace:*",
    "@{project}/api-client": "workspace:*",
    "@{project}/domain": "workspace:*",
    ... external deps ...
  }
  ```
- Add scripts: `lint`, `type-check: tsc --noEmit`, `test: vitest`
- Change `dev` script port to 3001: `vite --port 3001`
- Change `preview` script port to 3001: `vite preview --port 3001`
- Add `"@{project}/config": "workspace:*"` to devDependencies (consumed by the tsconfig reconciliation below).

**Post-process the Vite-generated tsconfigs** — `pnpm create vite` leaves `apps/web/tsconfig.app.json` and `apps/web/tsconfig.node.json` fully self-contained, disconnected from `packages/config`. Set `"extends": "@{project}/config/tsconfig.base.json"` in **both** files. Do **not** merge the two files into one — the browser/build split is intentional:

- **`tsconfig.app.json`** inherits `moduleResolution: "bundler"` from the base as-is — remove any of `strict`, `moduleResolution`, `skipLibCheck`, `esModuleInterop`, `resolveJsonModule`, `isolatedModules` if the generated file happens to set them explicitly (recent `create-vite` output may not include all of them — remove whichever are actually present, it's fine if some aren't).
- **`tsconfig.node.json`** builds for Node (`vite.config.ts`), not the bundler target — it needs `"module": "nodenext"` **and** `"moduleResolution": "nodenext"` set explicitly as local overrides, even if the CLI's generated file didn't spell out `moduleResolution` itself. **Verified by live build**: leaving `moduleResolution` unset here makes it inherit the base's `"bundler"` value, which TypeScript rejects outright when `module` is `"nodenext"` (`TS5109: Option 'moduleResolution' must be set to 'NodeNext'... when option 'module' is set to 'NodeNext'`) — `tsc -b` fails immediately, before Vite even runs. Still remove `skipLibCheck`/`strict`/etc. from this file the same as `tsconfig.app.json` if the CLI included them.

**Post-process the Vite-generated `.oxlintrc.json`** — current Vite `react-ts` templates generate `.oxlintrc.json` (oxlint replaced ESLint in the official template; keep it, do not swap it for ESLint). It ships with its own inline rules, disconnected from `packages/config`. Replace its content with:
```json
{ "extends": ["../../packages/config/oxlint.base.json"] }
```
merged with any project-specific rule already present in the generated file (today: none — Vite's default `.oxlintrc.json` only carries the two React rules `oxlint.base.json` already centralizes). Keep the `"lint": "oxlint"` script exactly as the CLI generated it.

Edit `apps/web/src/vite-env.d.ts` to add:
```typescript
/// <reference types="vite/client" />
declare module '*.css';
declare module '*.module.css';
```

**If `styling: 'tailwind'`:** edit `apps/web/vite.config.ts` to register the plugin:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**Replace default Vite welcome content for apps/web:**

DELETE `apps/web/src/App.css` (the default Vite CSS is not aligned with DESIGN.md).

**If `styling: 'plain-css'` (default):**

REPLACE `apps/web/src/App.tsx` with:
```tsx
import './index.css';

export default function App() {
  return (
    <main className="app-shell">
      <h1 className="app-title">{Project Name}</h1>
    </main>
  );
}
```

REPLACE `apps/web/src/index.css` with a minimal stylesheet using DESIGN.md color tokens:
```css
:root {
  --color-bg: {color_bg_light};
  --color-fg: {color_fg_light};
  --color-primary: {color_primary_light};
}

[data-theme="dark"] {
  --color-bg: {color_bg_dark};
  --color-fg: {color_fg_dark};
  --color-primary: {color_primary_dark};
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { background: var(--color-bg); color: var(--color-fg); font-family: system-ui, sans-serif; }

.app-shell {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--color-bg);
  color: var(--color-fg);
}

.app-title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
}
```

**If `styling: 'tailwind'`:**

REPLACE `apps/web/src/App.tsx` with:
```tsx
import './index.css';

export default function App() {
  return (
    <main className="min-h-dvh grid place-items-center bg-[var(--color-bg)] text-[var(--color-fg)]">
      <h1 className="text-[clamp(2rem,6vw,4rem)] font-bold text-center text-[var(--color-primary)]">{Project Name}</h1>
    </main>
  );
}
```

REPLACE `apps/web/src/index.css` with:
```css
@import "tailwindcss";

:root {
  --color-bg: {color_bg_light};
  --color-fg: {color_fg_light};
  --color-primary: {color_primary_light};
}

[data-theme="dark"] {
  --color-bg: {color_bg_dark};
  --color-fg: {color_fg_dark};
  --color-primary: {color_primary_dark};
}

body { font-family: system-ui, sans-serif; }
```

Both variants substitute `{color_bg_light}`, `{color_fg_light}`, `{color_primary_light}`, `{color_bg_dark}`, `{color_fg_dark}`, `{color_primary_dark}` with actual hex values from DESIGN.md (or fallbacks if missing).

Edit `apps/web/src/main.tsx` to inject the default theme on `<html>` before React renders. Add this line before `ReactDOM.createRoot(...)`:
```ts
document.documentElement.dataset.theme = '{default_theme}';
```

Write `apps/web/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/web/.env` as a copy of `apps/web/.env.example`.
