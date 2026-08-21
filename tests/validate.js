#!/usr/bin/env node
// Structural validator for j-flow plugin. Run: node tests/validate.js

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// Parses the YAML frontmatter block between the first two `---` lines.
// Returns null if the file has no frontmatter block; throws on invalid YAML
// inside the block (surfaced by check() as a failed check, not a crash).
function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return yaml.load(m[1]);
}

// ── plugin.json ──────────────────────────────────────────────────────────────
console.log('\nplugin.json');

check('exists', () => {
  assert(fs.existsSync(path.join(ROOT, '.claude-plugin/plugin.json')), 'missing');
});

check('required fields', () => {
  const p = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
  for (const f of ['name', 'version', 'description', 'author']) {
    assert(p[f], `missing field: ${f}`);
  }
});

// ── skills ───────────────────────────────────────────────────────────────────
const EXPECTED_SKILLS = [
  'j-flow-shared', 'j-flow-project', 'j-flow-scaffold', 'j-flow-recommend', 'j-flow-start',
  'j-flow-spec', 'j-flow-plan', 'j-flow-build', 'j-flow-qa',
  'j-flow-review', 'j-flow-finish', 'j-flow-release', 'j-flow-reopen',
  'j-flow-update', 'j-flow-check', 'j-flow-eject',
];

console.log('\nskills/');

check('skills/ has no orphaned or undeclared directories', () => {
  const actual = fs.readdirSync(path.join(ROOT, 'skills'))
    .filter((f) => fs.statSync(path.join(ROOT, 'skills', f)).isDirectory());
  const actualSet = new Set(actual);
  const expectedSet = new Set(EXPECTED_SKILLS);
  const missing = EXPECTED_SKILLS.filter((s) => !actualSet.has(s));
  const orphaned = actual.filter((s) => !expectedSet.has(s));
  assert(missing.length === 0, `EXPECTED_SKILLS lists directories that don't exist: ${missing.join(', ')}`);
  assert(orphaned.length === 0,
    `skills/ has directories not declared in EXPECTED_SKILLS: ${orphaned.join(', ')}`);
});

for (const skill of EXPECTED_SKILLS) {
  check(`${skill} directory exists`, () => {
    assert(fs.existsSync(path.join(ROOT, 'skills', skill)), `missing skills/${skill}/`);
  });

  check(`${skill} SKILL.md exists`, () => {
    const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
    assert(fs.existsSync(skillFile), `missing skills/${skill}/SKILL.md`);
  });

  check(`${skill} has valid frontmatter`, () => {
    const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf8');
    const fm = parseFrontmatter(content);
    assert(fm, 'must start with a --- frontmatter block');
    assert(typeof fm.name === 'string' && fm.name.length > 0, 'frontmatter missing name: key');
    assert(typeof fm.description === 'string' && fm.description.length > 0,
      'frontmatter missing description: key');
  });

  check(`${skill} frontmatter name matches directory name`, () => {
    const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf8');
    const fm = parseFrontmatter(content) || {};
    assert(fm.name === skill, `frontmatter name "${fm.name}" must equal directory name "${skill}"`);
  });
}

// ── agents ───────────────────────────────────────────────────────────────────
const EXPECTED_AGENTS = [
  'j-flow-architect', 'j-flow-backend', 'j-flow-frontend',
  'j-flow-mobile', 'j-flow-cli', 'j-flow-devops', 'j-flow-quality', 'j-flow-reviewer',
];

console.log('\nagents/');

check('agents/ has no orphaned or undeclared files', () => {
  const actual = fs.readdirSync(path.join(ROOT, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3));
  const actualSet = new Set(actual);
  const expectedSet = new Set(EXPECTED_AGENTS);
  const missing = EXPECTED_AGENTS.filter((a) => !actualSet.has(a));
  const orphaned = actual.filter((a) => !expectedSet.has(a));
  assert(missing.length === 0, `EXPECTED_AGENTS lists files that don't exist: ${missing.join(', ')}`);
  assert(orphaned.length === 0,
    `agents/ has files not declared in EXPECTED_AGENTS: ${orphaned.join(', ')}`);
});

for (const agent of EXPECTED_AGENTS) {
  check(`${agent}.md exists`, () => {
    assert(fs.existsSync(path.join(ROOT, 'agents', `${agent}.md`)), `missing agents/${agent}.md`);
  });

  check(`${agent} has valid frontmatter with required fields`, () => {
    const content = fs.readFileSync(path.join(ROOT, 'agents', `${agent}.md`), 'utf8');
    const fm = parseFrontmatter(content);
    assert(fm, 'must start with a --- frontmatter block');
    assert(typeof fm.name === 'string' && fm.name.length > 0, 'frontmatter missing name: key');
    assert(typeof fm.description === 'string' && fm.description.length > 0,
      'frontmatter missing description: key');
    assert(fm.tools !== undefined, 'frontmatter missing tools: key');
  });

  check(`${agent} frontmatter name matches file name`, () => {
    const content = fs.readFileSync(path.join(ROOT, 'agents', `${agent}.md`), 'utf8');
    const fm = parseFrontmatter(content) || {};
    assert(fm.name === agent, `frontmatter name "${fm.name}" must equal file name "${agent}"`);
  });
}

// ── templates ────────────────────────────────────────────────────────────────
const EXPECTED_TEMPLATES = [
  'meta.md', 'gate-context.md', 'gate-log.md', 'functional-spec.md', 'technical-spec.md',
  'tasks.json', 'review-guide.md', 'qa-report.md', 'review-findings.md',
  'feature-readme.md', 'product.md', 'design.md', 'specs-index.md', 'changelog.md',
  'system-domain.md', 'constitution.md', 'config.md',
];

console.log('\nshared templates/');

for (const tpl of EXPECTED_TEMPLATES) {
  check(`templates/${tpl} exists`, () => {
    const p = path.join(ROOT, 'skills/j-flow-shared/templates', tpl);
    assert(fs.existsSync(p), `missing: ${p}`);
  });
}

const EXPECTED_AGENT_TEMPLATES = [
  'j-flow-architect.md', 'j-flow-backend.md', 'j-flow-frontend.md',
  'j-flow-mobile.md', 'j-flow-cli.md', 'j-flow-devops.md', 'j-flow-quality.md', 'j-flow-reviewer.md',
];

for (const tpl of EXPECTED_AGENT_TEMPLATES) {
  check(`templates/agents/${tpl} exists`, () => {
    const p = path.join(ROOT, 'skills/j-flow-shared/templates/agents', tpl);
    assert(fs.existsSync(p), `missing: ${p}`);
  });
}

// ── references ───────────────────────────────────────────────────────────────
const EXPECTED_REFERENCES = [
  'gate-core.md', 'gate-cascade.md', 'gate-symbols.md', 'spec-markers.md',
  'layer-order.md', 'code-style.md', 'agent-scopes.md', 'overrides.md',
  'workflow-modes.md', 'language-contract.md',
];

console.log('\nshared references/');

for (const ref of EXPECTED_REFERENCES) {
  check(`references/${ref} exists`, () => {
    const p = path.join(ROOT, 'skills/j-flow-shared/references', ref);
    assert(fs.existsSync(p), `missing: ${p}`);
  });
}

// ── override resolution wiring ───────────────────────────────────────────────
// Every skill that loads overridable assets must reference the override-resolution
// rule so ejected overrides are honored (plan 035). scaffold is intentionally excluded
// (its generation is not overridable — the opinionated core).
const OVERRIDE_WIRED_SKILLS = [
  'j-flow-build', 'j-flow-spec', 'j-flow-plan', 'j-flow-review',
  'j-flow-qa', 'j-flow-finish', 'j-flow-project', 'j-flow-eject',
];

console.log('\noverride resolution/');

for (const skill of OVERRIDE_WIRED_SKILLS) {
  check(`${skill} references overrides.md`, () => {
    const content = fs.readFileSync(path.join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    assert(content.includes('overrides.md'), `${skill}/SKILL.md must reference references/overrides.md`);
  });
}

// ── layer consistency (mapping completeness) ─────────────────────────────────
// Every selectable STACK layer must be wired consistently across the surfaces that
// use the STACK taxonomy (web/api/mobile/admin[/e2e/cli]): the scaffold valid-values
// enum, its `has_<layer>` flag, the product.md **Layers:** enum, and an owning agent.
//
// This is MAPPING-COMPLETENESS, not string-equality: each layer must map to the RIGHT
// thing per surface. We deliberately do NOT assert a stack-layer name appears in the
// BUILD-taxonomy files (references/layer-order.md, skills/j-flow-qa) — those use
// data/service/ui/mobile/infra, and admin+web BOTH map to build-layer `ui`, so asserting
// stack names there would false-positive-block. QA/check layer-scoping is exercised by
// scenario fixtures (tests/scenarios), not by this structural guard.
//
// Adding a layer to STACK_LAYERS without wiring every surface below fails the guard by
// design — that is what stops a half-wired layer from shipping green (plan 037 Phase 0).
// When a layer is added: register it here AND in every surface, atomically.
const STACK_LAYERS = {
  web: { agent: 'j-flow-frontend' },
  api: { agent: 'j-flow-backend' },
  mobile: { agent: 'j-flow-mobile' },
  admin: { agent: 'j-flow-frontend' },   // reuses frontend — a mapping, not 1:1
  e2e: { agent: 'j-flow-quality' },    // harness layer — quality-owned, no new agent (plan 037)
  cli: { agent: 'j-flow-cli' },        // dedicated light agent, consumes 037's profile (plan 036)
};

console.log('\nlayer consistency/');

let scaffoldSkill = '';
let productTpl = '';

check('scaffold SKILL.md is readable for layer-consistency checks', () => {
  scaffoldSkill = fs.readFileSync(path.join(ROOT, 'skills/j-flow-scaffold/SKILL.md'), 'utf8');
});

check('product.md template is readable for layer-consistency checks', () => {
  productTpl = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/templates/product.md'), 'utf8');
});

// Anchored on the stable "**Stack layers:**" marker, not the generic phrase "valid
// values" — that phrase also appears at SKILL.md:1352 (an unrelated Storybook note).
const stackLayersLine = scaffoldSkill.split('\n').find((l) => l.includes('**Stack layers:**')) || '';
const validValuesMatch = stackLayersLine.match(/valid values:\s*([^)]*)\)/);
const scaffoldEnumTokens = validValuesMatch
  ? [...validValuesMatch[1].matchAll(/`([a-zA-Z0-9_-]+)`/g)].map((m) => m[1])
  : [];

// product.md's **Layers:** line documents its enum as "comma list of: a, b, c — ...".
const layersEnumLine = productTpl.split('\n').find((l) => l.includes('**Layers:**')) || '';
const layersListMatch = layersEnumLine.match(/comma list of:\s*(.*?)\s*—/);
const productLayerTokens = layersListMatch
  ? layersListMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
  : [];

for (const [layer, { agent }] of Object.entries(STACK_LAYERS)) {
  check(`scaffold valid-values enum lists \`${layer}\``, () => {
    assert(scaffoldEnumTokens.includes(layer),
      `scaffold "Stack layers" valid-values must list \`${layer}\` (found: ${scaffoldEnumTokens.join(', ') || 'none'})`);
  });

  check(`scaffold derives has_${layer}`, () => {
    // Exact-token match: `has_api` must not match inside `has_api_client`.
    const re = new RegExp('has_' + layer + '(?![a-zA-Z0-9_])');
    assert(re.test(scaffoldSkill), `scaffold must derive the has_${layer} flag as an exact token`);
  });

  check(`product.md Layers enum lists ${layer}`, () => {
    assert(productLayerTokens.includes(layer),
      `product.md **Layers:** enum must list ${layer} (found: ${productLayerTokens.join(', ') || 'none'})`);
  });

  check(`${layer} maps to an owning agent (${agent})`, () => {
    assert(fs.existsSync(path.join(ROOT, 'agents', `${agent}.md`)),
      `owning agent ${agent}.md missing for layer ${layer}`);
  });
}

// ── tsconfig base inheritance (plan 039) ──────────────────────────────────────
// Static guard: assert each scaffold reference that generates a tsconfig has a
// documented reconciliation step engaging packages/config, so the "CLI drops
// its own disconnected tsconfig, nobody wires it back" defect can't regress
// silently. This does NOT run a scaffold or check a generated repo's actual
// inheritance chain — there is no fixture for that in this repo (see plan 039,
// Cambio D) — it only checks the plugin's own template text, same style as
// the `scaffold derives has_${layer}` check above.
const TSCONFIG_RECONCILIATION = {
  'skills/j-flow-scaffold/references/layer-web.md': '@{project}/config/tsconfig.base.json',
  'skills/j-flow-scaffold/references/layer-api.md': '@{project}/config/tsconfig.nest.json',
  'skills/j-flow-scaffold/references/layer-e2e.md': '@{project}/config/tsconfig.base.json',
  'skills/j-flow-scaffold/references/layer-cli.md': '@{project}/config/tsconfig.base.json',
  'skills/j-flow-scaffold/references/packages-ui.md': '@{project}/config/tsconfig.base.json',
};

console.log('\ntsconfig base inheritance/');

for (const [file, needle] of Object.entries(TSCONFIG_RECONCILIATION)) {
  check(`${file} engages packages/config's tsconfig base`, () => {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert(content.includes(needle), `expected to find "${needle}" in ${file}`);
  });
}

// layer-admin.md defers to layer-web.md's reconciliation step by cross-reference
// instead of repeating the extends snippet — assert the cross-reference and the
// workspace dep it still needs to declare locally.
check('layer-admin.md cross-references layer-web.md\'s tsconfig reconciliation', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-scaffold/references/layer-admin.md'), 'utf8');
  assert(content.includes('layer-web.md'), 'layer-admin.md must point to layer-web.md\'s reconciliation step');
  assert(content.includes('@{project}/config'), 'layer-admin.md must declare the @{project}/config workspace dep');
});

// ── gate-context / gate-log split (plan 044) ─────────────────────────────────
// Static guard on the plugin's own text. gate-context.md went from append-only
// history to one-block-per-gate current state, with superseded blocks moving to
// gate-log.md. Three ways that can silently regress: the canonical advance
// procedure forgets the supersede step (accumulation comes back), a template
// still advertises the old invariant (a fresh feature is seeded with a header
// contradicting the rule), or /j-flow-finish stops reading the log (the audit
// trail becomes write-only). Each is asserted below.
console.log('\ngate-context / gate-log split/');

check('gate-core.md advance procedure documents the supersede step', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/references/gate-core.md'), 'utf8');
  assert(content.includes('gate-log.md'), 'gate-core.md must name gate-log.md');
  assert(/one block per gate/i.test(content), 'gate-core.md must state the one-block-per-gate rule');
  assert(/supersed/i.test(content), 'gate-core.md must describe superseding an existing block');
});

check('gate-cascade.md reset preserves removed blocks in gate-log.md', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/references/gate-cascade.md'), 'utf8');
  assert(content.includes('gate-log.md'), 'reopen must append removed blocks to gate-log.md');
});

check('templates/gate-context.md no longer claims append-only', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/templates/gate-context.md'), 'utf8');
  assert(!/append-only/i.test(content), 'gate-context.md template must not advertise the retired append-only invariant');
  assert(content.includes('gate-log.md'), 'gate-context.md template must point at gate-log.md');
});

check('templates/gate-log.md is the append-only one', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/templates/gate-log.md'), 'utf8');
  assert(/append-only/i.test(content), 'gate-log.md template must state it is append-only');
});

check('j-flow-finish reads gate-log.md and tolerates its absence', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-finish/SKILL.md'), 'utf8');
  assert(content.includes('gate-log.md'), 'j-flow-finish must read gate-log.md');
  assert(/skip if absent/i.test(content), 'j-flow-finish must state gate-log.md is optional');
});

// Only /j-flow-finish should read the log — any other reader reintroduces the cost
// the split removes. Two skills may name the file without reading it:
//   j-flow-finish   — the one legitimate reader.
//   j-flow-scaffold — emits a gate-context.md header that points at gate-log.md for
//                     the project it generates. That is file content it writes, not
//                     a file it reads.
const GATE_LOG_ALLOWED = ['j-flow-finish', 'j-flow-scaffold', 'j-flow-shared'];

check('no skill other than j-flow-finish reads gate-log.md', () => {
  const offenders = fs.readdirSync(path.join(ROOT, 'skills'))
    .filter((d) => !GATE_LOG_ALLOWED.includes(d))
    .filter((d) => {
      const p = path.join(ROOT, 'skills', d, 'SKILL.md');
      return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('gate-log.md');
    });
  assert(offenders.length === 0, `gate-log.md should only be read by j-flow-finish; also referenced by: ${offenders.join(', ')}`);
});

// ── technical-spec section scoping (plan 044) ────────────────────────────────
// technical-spec.md is the largest per-feature artifact (~16k tokens on a real
// large feature). A builder agent only needs its own layer's sections, and most
// already said so — but j-flow-backend had drifted to reading the whole file,
// which is how the convention silently decays. Assert that every agent reading
// it names sections, with one documented exception.
//
// j-flow-reviewer is exempt on purpose: it audits architecture across layer
// boundaries, so the whole spec is its job. Do not "fix" it.
const WHOLE_SPEC_READERS = ['j-flow-reviewer.md'];

console.log('\ntechnical-spec section scoping/');

for (const file of fs.readdirSync(path.join(ROOT, 'agents'))) {
  const content = fs.readFileSync(path.join(ROOT, 'agents', file), 'utf8');
  if (!content.includes('technical-spec.md')) continue;
  if (WHOLE_SPEC_READERS.includes(file)) continue;
  check(`agents/${file} scopes technical-spec.md to its layer's sections`, () => {
    assert(
      /technical-spec\.md`? — [^\n]*section/i.test(content),
      `${file} reads technical-spec.md without naming which sections; scope it to its layer (or add it to WHOLE_SPEC_READERS with a reason)`,
    );
  });
}

// ── skill-local references wiring (plan 044) ─────────────────────────────────
// Skills with their own references/ directory (scaffold, project, check) load them
// conditionally so a run only pays for what it uses. Two ways that breaks silently:
// a reference is added but never loaded (dead weight the model never reads), or a
// SKILL.md points at a file that doesn't exist (the run dead-ends mid-flow).
// Bidirectional, same shape as the skills/agents orphan guard.
console.log('\nskill-local references/');

for (const skill of fs.readdirSync(path.join(ROOT, 'skills'))) {
  const refDir = path.join(ROOT, 'skills', skill, 'references');
  const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
  if (!fs.existsSync(refDir) || !fs.existsSync(skillFile)) continue;

  const body = fs.readFileSync(skillFile, 'utf8');
  const onDisk = fs.readdirSync(refDir).filter((f) => f.endsWith('.md'));

  check(`${skill}: every references/ file is loaded by SKILL.md`, () => {
    const orphans = onDisk.filter((f) => !body.includes(`references/${f}`));
    assert(orphans.length === 0, `never loaded by ${skill}/SKILL.md: ${orphans.join(', ')}`);
  });

  check(`${skill}: every references/ file SKILL.md loads exists`, () => {
    const named = [...body.matchAll(new RegExp(`skills/${skill}/references/([\\w.-]+\\.md)`, 'g'))]
      .map((m) => m[1]);
    const dangling = [...new Set(named)].filter((f) => !onDisk.includes(f));
    assert(dangling.length === 0, `referenced by ${skill}/SKILL.md but missing on disk: ${dangling.join(', ')}`);
  });
}

// ── narrative docs vs gate mechanics (plan 044 follow-up) ────────────────────
// The guards above cover gate-core.md, the templates, and j-flow-finish. Nothing
// covered the *narrative* docs, and that is exactly where plan 044 left drift:
// README.md (twice) and docs/FLOW.md still described gate-context.md as
// append-only after the invariant moved to gate-log.md. `npm test` passed the
// whole time, because no check reads prose.
//
// Heuristic, deliberately: flag "append-only" sitting within ~200 characters of
// "gate-context" with no mention of "gate-log" anywhere in that window. That is
// the shape all three real regressions had, and the window is wide enough that
// legitimate text describing the split (which always names both files nearby)
// passes. It will not catch every possible paraphrase — a sentence that conveys
// permanence without the words "append-only" slips through. It catches the
// mistake we actually made.
console.log('\nnarrative docs vs gate mechanics/');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  if (e.isDirectory()) return walk(full);
  return e.isFile() && e.name.endsWith('.md') ? [full] : [];
});

const NARRATIVE = [
  path.join(ROOT, 'README.md'),
  ...walk(path.join(ROOT, 'docs')),
  ...walk(path.join(ROOT, 'skills')),
  ...walk(path.join(ROOT, 'agents')),
].filter((f) => fs.existsSync(f));

check('no doc describes gate-context.md as append-only', () => {
  const offenders = [];
  for (const file of NARRATIVE) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/append[- ]only/gi)) {
      const from = Math.max(0, m.index - 200);
      const window = text.slice(from, m.index + 200);
      if (!/gate-context/i.test(window)) continue;   // not about gate-context at all
      if (/gate[- ]log/i.test(window)) continue;     // describes the split correctly ("gate-log.md" or a "Gate Log" heading)
      const line = text.slice(0, m.index).split('\n').length;
      offenders.push(`${path.relative(ROOT, file)}:${line}`);
    }
  }
  assert(
    offenders.length === 0,
    `gate-context.md is not append-only since plan 044 — gate-log.md is. Fix: ${offenders.join(', ')}`,
  );
});

// Counterpart: the mechanism must stay documented for a reader arriving cold.
// Without this, deleting the explanation would silently satisfy the check above.
check('docs/FLOW.md documents gate-log.md', () => {
  const flow = fs.readFileSync(path.join(ROOT, 'docs/FLOW.md'), 'utf8');
  assert(flow.includes('gate-log.md'), 'docs/FLOW.md must list gate-log.md among a feature\'s files');
});

// ── pnpm catalog policy (plan 047) ───────────────────────────────────────────
// The catalog is the single place a shared dependency's version is declared, so
// every consuming package references it as "catalog:". Two ways that silently
// regresses, each guarded below:
//   1. someone re-adds a literal range for a cataloged dep in a generated
//      package.json — the workspace quietly installs two versions again, which
//      for react/react-dom means "invalid hook call" at runtime;
//   2. someone writes "catalog:" for a key the catalog doesn't carry — the
//      consumer's install dies with ERR_PNPM_CATALOG_ENTRY_NOT_FOUND.
// Both are assertions on the scaffold's own template text, not on a scaffolded
// repo: this validator never runs a scaffold.
console.log('\npnpm catalog policy/');

const SCAFFOLD_DIR = 'skills/j-flow-scaffold';

// Scaffold files that emit or reference package.json content.
function scaffoldTemplateFiles() {
  const files = [path.join(SCAFFOLD_DIR, 'SKILL.md')];
  const refDir = path.join(ROOT, SCAFFOLD_DIR, 'references');
  for (const f of fs.readdirSync(refDir)) {
    if (f.endsWith('.md')) files.push(path.join(SCAFFOLD_DIR, 'references', f));
  }
  return files;
}

// Keys of the `catalog:` block in the pnpm-workspace.yaml the scaffold emits.
// Parsed from the YAML fence rather than hardcoded here, so adding an entry to
// the scaffold automatically extends both guards below.
function catalogKeys() {
  const skill = fs.readFileSync(path.join(ROOT, SCAFFOLD_DIR, 'SKILL.md'), 'utf8');
  const block = skill.match(/^catalog:\n([\s\S]*?)\n^\S/m);
  assert(block, 'SKILL.md must emit a `catalog:` block in pnpm-workspace.yaml');
  const keys = [];
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s{2}"?([@\w./-]+)"?:\s*\S/);
    if (m) keys.push(m[1]);
  }
  assert(keys.length > 0, 'the catalog block must declare at least one entry');
  return keys;
}

check('catalog block declares the expected shared dependencies', () => {
  const keys = catalogKeys();
  for (const expected of ['typescript', 'oxlint', 'react', 'react-dom', '@playwright/test']) {
    assert(keys.includes(expected), `catalog is missing the "${expected}" entry`);
  }
});

check('no scaffold-emitted package.json declares a cataloged dep literally', () => {
  const keys = catalogKeys();
  const offenders = [];
  for (const file of scaffoldTemplateFiles()) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // Only inspect ```json fences: those are the package.json bodies the
    // scaffold writes verbatim. Prose and comparison tables legitimately quote
    // the literal ranges a CLI generates before reconciliation.
    for (const fence of content.match(/```json\n[\s\S]*?```/g) || []) {
      for (const key of keys) {
        const literal = new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*"(?!catalog:)[^"]+"`);
        const hit = fence.match(literal);
        if (hit) offenders.push(`${file}: ${hit[0]}`);
      }
    }
  }
  assert(offenders.length === 0, `cataloged deps declared with a literal version:\n    ${offenders.join('\n    ')}`);
});

check('every "catalog:" reference resolves to a catalog entry', () => {
  const keys = catalogKeys();
  const offenders = [];
  for (const file of scaffoldTemplateFiles()) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of content.matchAll(/"([@\w./-]+)"\s*:\s*"catalog:"/g)) {
      if (!keys.includes(m[1])) offenders.push(`${file}: "${m[1]}"`);
    }
  }
  assert(offenders.length === 0, `"catalog:" used for keys with no catalog entry (ERR_PNPM_CATALOG_ENTRY_NOT_FOUND at install):\n    ${offenders.join('\n    ')}`);
});

check('every package with a lint script declares oxlint', () => {
  const offenders = [];
  for (const file of scaffoldTemplateFiles()) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const fence of content.match(/```json\n[\s\S]*?```/g) || []) {
      // apps/api keeps ESLint by design and has no oxlint script, so it is not
      // matched here — this only fires on a package.json that runs oxlint.
      if (/"lint"\s*:\s*"oxlint"/.test(fence) && !/"oxlint"\s*:/.test(fence)) {
        offenders.push(`${file}: a package.json runs oxlint without declaring it`);
      }
    }
  }
  assert(offenders.length === 0, `pnpm's isolated node_modules makes this "oxlint: command not found":\n    ${offenders.join('\n    ')}`);
});

// ── workflow modes (plan 045) ────────────────────────────────────────────────
// The base branch and the PR step are now resolved from .specs/config.md rather
// than hardcoded to develop. The failure mode is omission, not design: one
// skill left pointing at `develop` sends a solo project's merge at a branch
// that does not exist. workflow-modes.md is the single place allowed to name
// the concrete branches; everywhere else must defer to it.
console.log('\nworkflow modes/');

const WORKFLOW_MODES_REF = 'skills/j-flow-shared/references/workflow-modes.md';

check('workflow-modes.md is the canonical source and is indexed', () => {
  assert(fs.existsSync(path.join(ROOT, WORKFLOW_MODES_REF)), `${WORKFLOW_MODES_REF} must exist`);
  const body = fs.readFileSync(path.join(ROOT, WORKFLOW_MODES_REF), 'utf8');
  assert(/\bsolo\b/.test(body) && /\bteam\b/.test(body), 'it must define both modes');
  assert(body.includes('.specs/config.md'), 'it must name the config file it governs');
  // The "absent means team" rule is what keeps every pre-existing project working.
  assert(/assume `team`|defaults? to `?team/i.test(body), 'it must state the absent-config default');
});

check('no skill hardcodes the develop branch in a git command', () => {
  const offenders = [];
  for (const file of walk(path.join(ROOT, 'skills'))) {
    const rel = path.relative(ROOT, file);
    if (rel === WORKFLOW_MODES_REF) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of [/--base develop/g, /git checkout develop/g, /--head develop\b/g]) {
      for (const m of content.match(pattern) || []) {
        // A `team`-scoped block may still spell develop out; require the file to
        // at least defer to the canonical reference so the branch is conditional.
        if (!content.includes('workflow-modes.md')) offenders.push(`${rel}: ${m}`);
      }
    }
  }
  assert(offenders.length === 0, `hardcoded develop with no reference to workflow-modes.md:\n    ${offenders.join('\n    ')}`);
});

check('finish and release resolve the base branch from the canonical reference', () => {
  for (const rel of ['skills/j-flow-finish/SKILL.md', 'skills/j-flow-release/SKILL.md', 'skills/j-flow-start/SKILL.md']) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert(content.includes('workflow-modes.md'), `${rel} must resolve the base branch via workflow-modes.md`);
  }
});

check('j-flow-finish keeps both integration paths', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills/j-flow-finish/SKILL.md'), 'utf8');
  assert(content.includes('gh pr create'), 'team mode must still open a PR');
  assert(/git merge --no-ff/.test(content), 'solo mode must merge locally with --no-ff');
});

// Counterpart to the guard above: dropping the config seed would leave the mode
// undeclarable while every check above still passed.
check('/j-flow-project seeds and backfills .specs/config.md', () => {
  const init = fs.readFileSync(path.join(ROOT, 'skills/j-flow-project/references/mode-init.md'), 'utf8');
  const update = fs.readFileSync(path.join(ROOT, 'skills/j-flow-project/references/mode-update.md'), 'utf8');
  assert(init.includes('templates/config.md'), 'init mode must write .specs/config.md from the template');
  assert(update.includes('.specs/config.md'), 'update mode must backfill .specs/config.md');
  assert(fs.existsSync(path.join(ROOT, 'skills/j-flow-shared/templates/config.md')), 'the config template must exist');
});

// ── language contract (plan 046) ─────────────────────────────────────────────
// Spec prose can be written in the project's language; the artifact schema cannot.
// The failure mode is silent: a translated heading raises no error, it just means
// /j-flow-plan, /j-flow-review and /j-flow-finish stop finding the section and
// work with less context than they think they have. `npm test` is the only thing
// standing in front of that, so these guards are the point of the plan, not trim.
console.log('\nlanguage contract/');

const LANGUAGE_CONTRACT = 'skills/j-flow-shared/references/language-contract.md';
const TPL_DIR = 'skills/j-flow-shared/templates';

// Snapshot of the section schema of every artifact a skill parses. Translating a
// heading, or renaming one without meaning to, breaks this. Adding a section
// deliberately means updating this list — a conscious act, which is the point.
const TEMPLATE_HEADINGS = {
  'functional-spec.md': [
    'Purpose', 'Feature users', 'Trigger', 'Acceptance criteria', 'Scope',
    'Dependencies', 'Edge cases', 'Risks', 'Functional scenarios (optional)',
  ],
  'technical-spec.md': [
    'Architecture Overview', 'Data Layer', 'Service Layer', 'API Layer', 'Frontend',
    'Mobile', 'Infrastructure', 'Cross-cutting Concerns', 'Design decisions',
    'Testing Strategy',
  ],
  'qa-report.md': ['Test Results', 'Failures', 'Manual Checklist Results'],
  'review-findings.md': [
    'Critical (must fix before approval)', 'Major (should fix)', 'Minor (optional)',
    'Verdict',
  ],
};

for (const [tpl, expected] of Object.entries(TEMPLATE_HEADINGS)) {
  check(`templates/${tpl} section schema is unchanged`, () => {
    const content = fs.readFileSync(path.join(ROOT, TPL_DIR, tpl), 'utf8');
    const actual = [...content.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
    assert(JSON.stringify(actual) === JSON.stringify(expected),
      `heading schema drifted.\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  });
}

// The nine headings a skill matches by literal string, plus where each is matched
// from. These are the ones where a translation breaks a skill immediately rather
// than eventually, so the contract must name them AND the template must carry them.
const LOAD_BEARING = [
  ['## Architecture Overview', 'technical-spec.md'],
  ['## Design decisions', 'technical-spec.md'],
  ['## Scope', 'functional-spec.md'],
  ['## Verdict', 'review-findings.md'],
  ['## Failures', 'qa-report.md'],
  ['## Test Results', 'qa-report.md'],
  ['## Critical (must fix before approval)', 'review-findings.md'],
  ['## Major (should fix)', 'review-findings.md'],
  ['## Minor (optional)', 'review-findings.md'],
];

check('language contract names every literal-matched heading', () => {
  const contract = fs.readFileSync(path.join(ROOT, LANGUAGE_CONTRACT), 'utf8');
  const missing = LOAD_BEARING.filter(([h]) => !contract.includes(h)).map(([h]) => h);
  assert(missing.length === 0, `not declared frozen in the contract: ${missing.join(', ')}`);
});

check('every literal-matched heading is still in its template', () => {
  const offenders = [];
  for (const [heading, tpl] of LOAD_BEARING) {
    const content = fs.readFileSync(path.join(ROOT, TPL_DIR, tpl), 'utf8');
    if (!content.includes(heading)) offenders.push(`${heading} (expected in ${tpl})`);
  }
  assert(offenders.length === 0, `missing from their template:\n    ${offenders.join('\n    ')}`);
});

// The frozen vocabulary the gate machinery parses. Asserted as: declared frozen in
// the contract, AND still present somewhere in the plugin. The gate block names now
// have a canonical home — gate-core.md enumerates all seven (plan 049) — which the
// gate-vocabulary guard below asserts separately in both directions.
const FROZEN_VOCABULARY = [
  '[FUNCTIONAL SPEC]', '[TECHNICAL SPEC]', '[TASK PLAN]', '[BUILD]', '[QA]', '[REVIEW]', '[FINISH]',
  '[stale]', '[NEEDS CLARIFICATION', '[SF]', '[TF]',
  '**Given**', '**When**', '**Then:**',
  'current_phase', 'changes-requested',
];

check('frozen vocabulary is declared in the contract and still used', () => {
  const contract = fs.readFileSync(path.join(ROOT, LANGUAGE_CONTRACT), 'utf8');
  const corpus = [...walk(path.join(ROOT, 'skills')), ...walk(path.join(ROOT, 'agents'))]
    .filter((f) => path.relative(ROOT, f) !== LANGUAGE_CONTRACT)
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');
  const offenders = [];
  for (const literal of FROZEN_VOCABULARY) {
    if (!contract.includes(literal)) offenders.push(`${literal}: not declared frozen in the contract`);
    if (!corpus.includes(literal)) offenders.push(`${literal}: no longer used anywhere in the plugin`);
  }
  assert(offenders.length === 0, offenders.join('\n    '));
});

check('language contract states the default and the resolving rule', () => {
  const contract = fs.readFileSync(path.join(ROOT, LANGUAGE_CONTRACT), 'utf8');
  assert(contract.includes('.specs/config.md'), 'it must name the config file it reads');
  assert(/default(s)? to `en`|both default to `en`/.test(contract), 'it must state the en default');
  assert(/if a skill looks for it, it is\s*\n?\s*not translated/i.test(contract.replace(/\*\*/g, '')),
    'it must carry the catch-all rule for cases not listed');
});

// Counterpart: the prose-producing templates must keep pointing at the contract, and
// the docs/-facing one must NOT — that is what encodes the two-language split.
check('prose templates point at the contract and docs templates do not', () => {
  const shouldPoint = [
    'functional-spec.md', 'technical-spec.md', 'review-guide.md', 'qa-report.md',
    'review-findings.md', 'feature-readme.md', 'system-domain.md', 'product.md',
    'design.md', 'constitution.md',
  ];
  const missing = shouldPoint.filter(
    (f) => !fs.readFileSync(path.join(ROOT, TPL_DIR, f), 'utf8').includes('language-contract.md'));
  assert(missing.length === 0, `no language pointer: ${missing.join(', ')}`);
  const docsTpl = fs.readFileSync(path.join(ROOT, TPL_DIR, 'feature-doc.md'), 'utf8');
  assert(!docsTpl.includes('language-contract.md'),
    'feature-doc.md writes under docs/ and follows Docs language — it must not carry the Spec-language pointer');
});

check('every generator skill and agent declares its output language', () => {
  const skills = ['spec', 'plan', 'build', 'qa', 'review', 'finish', 'reopen', 'project'];
  const offenders = [];
  for (const name of skills) {
    const f = path.join(ROOT, 'skills', `j-flow-${name}`, 'SKILL.md');
    if (!fs.readFileSync(f, 'utf8').includes('language-contract.md')) offenders.push(`j-flow-${name}`);
  }
  for (const agent of EXPECTED_AGENTS) {
    const f = path.join(ROOT, 'agents', `${agent}.md`);
    if (!fs.readFileSync(f, 'utf8').includes('language-contract.md')) offenders.push(agent);
  }
  assert(offenders.length === 0, `no language instruction: ${offenders.join(', ')}`);
});

// ── gate block vocabulary (plan 049) ────────────────────────────────────────
// gate-core.md §"Advancing a gate" requires a gate-context block for every phase,
// and the finish phase is in that table — but the name of its block was declared
// nowhere, so a real run skipped it silently (finzas/01-infra-base: six blocks,
// finish_status completed, no finish block). gate-core.md now enumerates all seven.
// Guarded in both directions so neither half can drift: a declared name that fell
// out of use, or a new gate name appearing in a skill without being declared.
console.log('\ngate block vocabulary/');

const GATE_CORE = 'skills/j-flow-shared/references/gate-core.md';
const GATE_BLOCKS = [
  '[FUNCTIONAL SPEC]', '[TECHNICAL SPEC]', '[TASK PLAN]',
  '[BUILD]', '[QA]', '[REVIEW]', '[FINISH]',
];

// Bracketed uppercase tokens that are deliberately NOT gate blocks. Anything else
// found in skills/ must be a declared gate block — that is the point of the check.
const NON_GATE_TOKENS = new Set([
  '[NEEDS CLARIFICATION]', '[SF]', '[TF]', '[PLAN]', '[WARN]', '[GATE NAME]',
  '[P]', '[B]', '[Q]', '[R]', '[S]', '[ ]',
]);

check('gate-core.md enumerates all seven gate block names', () => {
  const core = fs.readFileSync(path.join(ROOT, GATE_CORE), 'utf8');
  const missing = GATE_BLOCKS.filter((b) => !core.includes(b));
  assert(missing.length === 0, `not enumerated in gate-core.md: ${missing.join(', ')}`);
});

check('every enumerated gate block has a real consumer', () => {
  // Declared in the two reference files is not "used" — some skill must actually
  // write or read the block, which is precisely what [FINISH] was missing: it was
  // designed in gate-core.md's summary line and no skill ever wrote it.
  const REFERENCES = [GATE_CORE, LANGUAGE_CONTRACT];
  const skillFiles = walk(path.join(ROOT, 'skills'))
    .filter((f) => !REFERENCES.includes(path.relative(ROOT, f)));
  const corpus = skillFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const dead = GATE_BLOCKS.filter((b) => !corpus.includes(b));
  assert(dead.length === 0,
    `enumerated but no skill writes or reads it: ${dead.join(', ')}`);
});

check('no undeclared gate block name appears in any skill', () => {
  const declared = new Set(GATE_BLOCKS);
  const offenders = new Map();
  for (const file of walk(path.join(ROOT, 'skills'))) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.match(/\[[A-Z][A-Z ]*[A-Z]\]|\[[A-Z]\]/g) || []) {
      if (declared.has(m) || NON_GATE_TOKENS.has(m)) continue;
      if (!offenders.has(m)) offenders.set(m, rel);
    }
  }
  const list = [...offenders].map(([tok, f]) => `${tok} (${f})`);
  assert(list.length === 0,
    `bracketed token that is neither a declared gate block nor a known non-gate:\n    ${list.join('\n    ')}\n    If it is a new gate, enumerate it in gate-core.md and the language contract. If not, add it to NON_GATE_TOKENS.`);
});

check('the language contract freezes the same seven names', () => {
  const contract = fs.readFileSync(path.join(ROOT, LANGUAGE_CONTRACT), 'utf8');
  const missing = GATE_BLOCKS.filter((b) => !contract.includes(b));
  assert(missing.length === 0, `declared in gate-core.md but not frozen in the contract: ${missing.join(', ')}`);
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
