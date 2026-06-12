---
name: j-flow-init
description: One-time project setup. Generates PRODUCT.md, DESIGN.md, CHANGELOG.md, Playwright config, detects Storybook/Widgetbook, and initializes agent memory. Run once per repo before /j-flow-start.
---

# j-flow-init

One-time setup for a new project. Run from the project root.

## Prerequisites

- Git repo initialized (`git init` done)
- Stack decided: MongoDB + NestJS + React + Flutter (default) or subset

## Process

### Step 1: Verify git repo

Check that `.git` exists in the current directory. If not:
"Run `git init` first, then re-run /j-flow-init."

### Step 2: Generate PRODUCT.md via dialogue

Ask the following questions ONE AT A TIME (wait for each answer before asking the next):

1. **Product name and tagline?**
2. **Problem it solves?** (1-3 sentences)
3. **Primary audience?** (who uses it, scale)
4. **Key features?** (bullet list, 5-10 items)
5. **Which parts of the stack are active?** (backend / frontend / mobile — confirm or adjust defaults)
6. **Deployment targets?** (Railway, Vercel, self-hosted, etc.)

After all answers, draft `PRODUCT.md` and show it to the user before saving:

```markdown
# Product Definition — {name}

## Product
**Name:** {name}
**Tagline:** {tagline}
**Problem:** {problem}

## Audience
**Primary user:** {audience}

## Features
{bullet list}

## Stack
- Backend: NestJS + MongoDB
- Frontend: React (TypeScript)
- Mobile: Flutter (Dart)
- Deployment: {deployment}
```

Ask: "Does this look right? Reply 'yes' to save or tell me what to change."

### Step 3: Generate DESIGN.md via dialogue

Ask these questions ONE AT A TIME:

1. **Brand personality?** (e.g. "modern corporate", "playful", "minimal", "technical")
2. **Primary brand color?** (hex or description like "deep blue")
3. **Typography preference?** (or "suggest based on brand")

Generate `DESIGN.md` with:
- Brand & Philosophy section describing the aesthetic
- Color Tokens table (light mode + dark mode) — derive a palette from the primary color
- Typography section (font families, scale)
- Component Patterns section (placeholder — to be filled as UI is built)

Show the draft and confirm before saving.

### Step 4: Initialize CHANGELOG.md

If `CHANGELOG.md` does not exist, create:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```

If it already exists, leave it untouched and print "CHANGELOG.md already exists ✓".

### Step 5: Detect Storybook and Widgetbook

**Storybook (React):**
Check if `.storybook/` directory exists in the project root or any `packages/` subdirectory.
- Found: print "Storybook detected ✓"
- Not found: print "Storybook not found. Run `npx storybook@latest init` in your UI package, then re-run /j-flow-init."

**Widgetbook (Flutter):**
Check if a `widgetbook/` directory exists (relative to Flutter app root, usually `apps/mobile/widgetbook/`).
- Found: print "Widgetbook detected ✓"
- Not found: print "Widgetbook not found. Add `widgetbook` to your Flutter pubspec.yaml and create the widgetbook app directory, then re-run /j-flow-init."

### Step 6: Initialize Playwright config

If `playwright.config.ts` does not exist, create it in the project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Also create `e2e/` directory with a `.gitkeep` file.

If `playwright.config.ts` already exists, print "Playwright config detected ✓".

### Step 7: Initialize agent memory

Create `.specs/.agents/` directory and write one memory file per agent:

```markdown
# {Agent Name} — Agent Memory
Project: {product name from PRODUCT.md}
Stack: {stack from PRODUCT.md}
Initialized: {today's date}

## Learned Patterns
(populated by /j-flow-finish as features complete)

## Project Conventions
(populated by /j-flow-finish as features complete)
```

Create files for all 7 agents:
- `.specs/.agents/j-flow-architect.md`
- `.specs/.agents/j-flow-backend.md`
- `.specs/.agents/j-flow-frontend.md`
- `.specs/.agents/j-flow-mobile.md`
- `.specs/.agents/j-flow-devops.md`
- `.specs/.agents/j-flow-quality.md`
- `.specs/.agents/j-flow-reviewer.md`

### Step 8: Commit and confirm

```bash
git add PRODUCT.md DESIGN.md CHANGELOG.md playwright.config.ts e2e/ .specs/
git commit -m "chore: j-flow-init — project setup"
```

Print:
```
Project initialized ✓
  PRODUCT.md created
  DESIGN.md created
  CHANGELOG.md ready
  Playwright config ready
  Agent memory initialized at .specs/.agents/

Next step: /j-flow-start {slug}
```

## Output

No gate-context.md entry — init is project-level, not feature-level.
