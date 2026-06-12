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
  'j-flow-shared', 'j-flow-init', 'j-flow-start', 'j-flow-spec',
  'j-flow-plan', 'j-flow-build', 'j-flow-qa', 'j-flow-review',
  'j-flow-finish', 'j-flow-release', 'j-flow-reopen', 'j-flow-update',
  'j-flow-check',
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

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
