---
name: j-flow-recommend
description: Recommends plugins, skills, and tools that enhance the j-flow workflow. Invoked automatically at the end of /j-flow-scaffold. Can also be run standalone any time. Usage: /j-flow-recommend
---

# /j-flow-recommend

Lists complementary plugins, skills, and tools for the j-flow workflow.

## Process

### Step 1: Show recommended plugins

```
╔══════════════════════════════════════════════════════════════════╗
║              Recommended plugins for j-flow                      ║
╚══════════════════════════════════════════════════════════════════╝

▸ superpowers (obra) — process discipline + structured workflows
  Install: claude plugin install obra/superpowers
  Used by j-flow:
    · superpowers:brainstorming         → /j-flow-spec (functional dialogue)
    · superpowers:subagent-driven-development → /j-flow-build (agent dispatch)
    · superpowers:writing-plans         → /j-flow-plan (task breakdown)
    · superpowers:requesting-code-review → /j-flow-review (structured findings)
  Hub: https://www.claudepluginhub.com/plugins/obra-superpowers-2

▸ caveman (juliusbrussee) — token compression for long sessions
  Install:
    /plugin marketplace add juliusbrussee/caveman
    /plugin install caveman@caveman
  Used by j-flow:
    · gate-context.md, qa-report.md, review-findings.md kept compact
    · Agent dispatch outputs stay short
  Hub: https://www.claudepluginhub.com/plugins/juliusbrussee-caveman

▸ ponytail (DietrichGebert) — lazy senior developer enforcement (never write code you don't need)
  Install:
    /plugin marketplace add DietrichGebert/ponytail
    /plugin install ponytail
  Used by j-flow:
    · /j-flow-build → decision ladder runs before each layer dispatch
    · /j-flow-review → over-engineering scan before reviewer agent dispatch
  GitHub: https://github.com/DietrichGebert/ponytail

▸ RTK (rtk-ai) — CLI output compression
  Install: brew install rtk
  Savings in j-flow sessions:
    · git status / log / diff: ~80%
    · test runner output:      ~90%
    · grep / rg:               ~80%
  GitHub: https://github.com/rtk-ai/rtk
  Setup: rtk hook for Claude Code auto-rewrites commands transparently

▸ autoskills — skill dependency manager for Claude Code plugins
  Install: npx autoskills
  Reads skills-lock.json to install pinned external skill dependencies.
  Keeps j-flow skill dependencies reproducible across installs.
  Website: https://www.autoskills.sh/
```

### Step 2: Show recommended Storybook addons

```
▸ Recommended Storybook addons
  · @storybook/addon-a11y         — accessibility audits in stories
  · @storybook/addon-themes       — light/dark mode switcher
  · @storybook/addon-interactions — interaction testing
```

### Step 3: Show useful tools

```
▸ Useful tools
  · Mongo Express UI       docker run -p 8081:8081 --net host -e ME_CONFIG_MONGODB_URL=mongodb://localhost:27017 mongo-express
  · Bruno or Insomnia      API testing (alternatives to Postman)
  · Mongo Compass          GUI for MongoDB Atlas / local
  · react-query-devtools   included via @tanstack/react-query-devtools in dev
  · Gemini CLI             bulk-read large diffs/files before /j-flow-analyze or /j-flow-doctor on big repos — cheaper per-token than Claude for pure context-gathering
  · GitHub Copilot         mechanical, well-specified boilerplate (CRUD DTOs, schemas) once the technical spec is approved — validate the result with /j-flow-review
```

### Step 4: Show useful Claude Code built-in commands and skills

```
▸ Useful skills
  · /verify           — verify a change actually works in the running app
  · /code-review      — review the current diff at configurable effort
  · /security-review  — security audit of pending changes
  · /simplify         — review + apply fixes to current diff
  · /insights         — analyze the session for patterns and improvement areas
  · /compact          — summarize the conversation to free up context window
```

### Step 5: Print closing

```
─────────────────────────────────────────────────────────────────────
For the full j-flow workflow reference, see FLOW.md in the plugin repo.
Run /j-flow-check anytime to see current feature status.
─────────────────────────────────────────────────────────────────────
```

### Step 6: Offer next feature

Read `.specs/README.md`. Find the first feature row with status `[ ]` (not yet started), in table order.

If one is found (slug `{next-slug}`), ask:
```
Next up: {next-slug} — {one-line description from the table}

Continue to next step?

  1. Yes — run /j-flow-start {next-slug} now
  2. No — stay here, I want to discuss or adjust first

Enter 1 or 2:
```
- Reply `1`: invoke `/j-flow-start {next-slug}`.
- Reply `2`: stop. Do not invoke anything else. Wait for the user's next message.

If no `[ ]` row exists (every feature already started or done), skip this step silently — do not print anything.

## Rules

- This skill is read-only — never writes files
- Safe to run multiple times
- Does NOT install anything automatically — only shows commands
- Output each step's template block verbatim — do not filter, omit, reorder, or summarize any item
