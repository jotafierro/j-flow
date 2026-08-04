#!/usr/bin/env node
// Structural validator for j-flow plugin. Run: node tests/validate.js

const fs = require('fs');
const path = require('path');

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

for (const skill of EXPECTED_SKILLS) {
  check(`${skill} directory exists`, () => {
    assert(fs.existsSync(path.join(ROOT, 'skills', skill)), `missing skills/${skill}/`);
  });

  check(`${skill} SKILL.md exists`, () => {
    const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
    assert(fs.existsSync(skillFile), `missing skills/${skill}/SKILL.md`);
  });

  check(`${skill} has frontmatter`, () => {
    const skillFile = path.join(ROOT, 'skills', skill, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf8');
    assert(content.startsWith('---'), 'must start with --- frontmatter');
    assert(content.includes('name:'), 'frontmatter missing name:');
    assert(content.includes('description:'), 'frontmatter missing description:');
  });
}

// ── agents ───────────────────────────────────────────────────────────────────
const EXPECTED_AGENTS = [
  'j-flow-architect', 'j-flow-backend', 'j-flow-frontend',
  'j-flow-mobile', 'j-flow-cli', 'j-flow-devops', 'j-flow-quality', 'j-flow-reviewer',
];

console.log('\nagents/');

for (const agent of EXPECTED_AGENTS) {
  check(`${agent}.md exists`, () => {
    assert(fs.existsSync(path.join(ROOT, 'agents', `${agent}.md`)), `missing agents/${agent}.md`);
  });

  check(`${agent} has frontmatter with required fields`, () => {
    const content = fs.readFileSync(path.join(ROOT, 'agents', `${agent}.md`), 'utf8');
    assert(content.startsWith('---'), 'must start with --- frontmatter');
    assert(content.includes('name:'), 'missing name:');
    assert(content.includes('description:'), 'missing description:');
    assert(content.includes('tools:'), 'missing tools:');
  });
}

// ── templates ────────────────────────────────────────────────────────────────
const EXPECTED_TEMPLATES = [
  'meta.md', 'gate-context.md', 'functional-spec.md', 'technical-spec.md',
  'tasks.json', 'review-guide.md', 'qa-report.md', 'review-findings.md',
  'feature-readme.md', 'product.md', 'design.md', 'specs-index.md', 'changelog.md',
  'system-domain.md', 'constitution.md',
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
  'gate-rules.md', 'layer-order.md', 'code-style.md', 'agent-scopes.md', 'overrides.md',
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
  web:    { agent: 'j-flow-frontend' },
  api:    { agent: 'j-flow-backend' },
  mobile: { agent: 'j-flow-mobile' },
  admin:  { agent: 'j-flow-frontend' },   // reuses frontend — a mapping, not 1:1
  e2e:    { agent: 'j-flow-quality' },    // harness layer — quality-owned, no new agent (plan 037)
  cli:    { agent: 'j-flow-cli' },        // dedicated light agent, consumes 037's profile (plan 036)
};

console.log('\nlayer consistency/');

const scaffoldSkill = fs.readFileSync(path.join(ROOT, 'skills/j-flow-scaffold/SKILL.md'), 'utf8');
const productTpl = fs.readFileSync(path.join(ROOT, 'skills/j-flow-shared/templates/product.md'), 'utf8');
const validValuesLine = scaffoldSkill.split('\n').find((l) => l.includes('valid values')) || '';
const layersEnumLine = productTpl.split('\n').find((l) => l.includes('**Layers:**')) || '';

for (const [layer, { agent }] of Object.entries(STACK_LAYERS)) {
  check(`scaffold valid-values enum lists \`${layer}\``, () => {
    assert(validValuesLine.includes('`' + layer + '`'),
      `scaffold "valid values:" line must list \`${layer}\``);
  });

  check(`scaffold derives has_${layer}`, () => {
    assert(scaffoldSkill.includes('has_' + layer),
      `scaffold must derive the has_${layer} flag`);
  });

  check(`product.md Layers enum lists ${layer}`, () => {
    assert(layersEnumLine.includes(layer),
      `product.md **Layers:** enum must list ${layer}`);
  });

  check(`${layer} maps to an owning agent (${agent})`, () => {
    assert(fs.existsSync(path.join(ROOT, 'agents', `${agent}.md`)),
      `owning agent ${agent}.md missing for layer ${layer}`);
  });
}

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
