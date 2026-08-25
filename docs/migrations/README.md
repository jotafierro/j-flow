# Migration Guides

Version-to-version upgrade notes for the j-flow plugin. Read the guide for the version you are upgrading **to**.

| To version | Guide | Summary |
|------------|-------|---------|
| 2.5.1 | [v2.5.1.md](v2.5.1.md) | Three scaffold fixes for projects on specific profiles: `bare-single-package` could not `pnpm install` at all; an e2e external-target project passed green against whatever answered on port 3001; and `turbo` never passed `BASE_URL` into the `e2e` task, which is what hid the second one. Nothing to do on the default workspace profile with a `web` layer. |
| 2.5.0 | [v2.5.0.md](v2.5.0.md) | Nothing breaks and no feature data migrates — but a project scaffolded with 2.4.x still carries the scaffold bugs 2.5.0 fixes, because a scaffold runs once. Retrofit checklist: declare `oxlint`, give `apps/e2e` a Playwright script kept out of `pnpm test`, move shared versions into the catalog, resolve `allowBuilds`. `/j-flow-scaffold --review` does not detect any of it. |
| 2.0.0 | [v2.0.0.md](v2.0.0.md) | Consolidated the 3 read-only inspectors into `/j-flow-check` flags (`--repo`, `--consistency`); removed `/j-flow-release --retroactive`. No feature-data migration required. |
