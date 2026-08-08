# Scaffold Layer — admin

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_admin`. Covers `apps/admin`. Requires `packages/ui` and `packages/domain` to already exist on disk — read `references/packages-ui.md` first if not already loaded.

**apps/admin — only if `has_admin`:**

Same as apps/web but on port 3002, name `@{project}/admin`. Internal deps MUST use `workspace:*` protocol (only include `@{project}/api-client` if `has_api`):
```json
"dependencies": {
  "@{project}/ui": "workspace:*",
  "@{project}/api-client": "workspace:*",
  "@{project}/domain": "workspace:*",
  ... external deps ...
}
```

If `styling: 'tailwind'`: same devDependencies (`tailwindcss`, `@tailwindcss/vite`) and the same `apps/admin/vite.config.ts` plugin registration as apps/web.

Same tsconfig reconciliation as apps/web (see `layer-web.md`'s "Post-process the Vite-generated tsconfigs" step) applies here: set `"extends": "@{project}/config/tsconfig.base.json"` in both `apps/admin/tsconfig.app.json` and `apps/admin/tsconfig.node.json`, strip the now-inherited options, and add `"@{project}/config": "workspace:*"` to `apps/admin` devDependencies.

Apply the same welcome-screen replacements as apps/web (both `styling` variants), except the title text in `App.tsx` must be `{Project Name} — admin`.

Write `apps/admin/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Also write `apps/admin/.env` as a copy of `apps/admin/.env.example`.

**Smoke tests for apps/web (vitest):**

Add `apps/web/src/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the project title', () => {
    render(<App />);
    expect(screen.getByText('{Project Name}')).toBeInTheDocument();
  });
});
```

Add `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup-tests.ts'],
  },
});
```

Add `apps/web/src/setup-tests.ts`:
```ts
import '@testing-library/jest-dom';
```

Add devDeps to `apps/web/package.json`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/ui` (use real version ranges).

If apps/admin was generated, add the same smoke test files there too. The test title text must be `'{Project Name} — admin'` to match the admin App.tsx.
