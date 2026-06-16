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
  'j-flow-update', 'j-flow-check', 'j-flow-doctor',
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
  'j-flow-mobile', 'j-flow-devops', 'j-flow-quality', 'j-flow-reviewer',
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
  'j-flow-mobile.md', 'j-flow-devops.md', 'j-flow-quality.md', 'j-flow-reviewer.md',
];

for (const tpl of EXPECTED_AGENT_TEMPLATES) {
  check(`templates/agents/${tpl} exists`, () => {
    const p = path.join(ROOT, 'skills/j-flow-shared/templates/agents', tpl);
    assert(fs.existsSync(p), `missing: ${p}`);
  });
}

// ── references ───────────────────────────────────────────────────────────────
const EXPECTED_REFERENCES = [
  'gate-rules.md', 'layer-order.md', 'code-style.md', 'agent-scopes.md',
];

console.log('\nshared references/');

for (const ref of EXPECTED_REFERENCES) {
  check(`references/${ref} exists`, () => {
    const p = path.join(ROOT, 'skills/j-flow-shared/references', ref);
    assert(fs.existsSync(p), `missing: ${p}`);
  });
}

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
