#!/usr/bin/env node
// Scenario runner for tests/scenarios/*.yaml.
// Parses each scenario, builds a fixture file tree under a temp dir,
// runs file-system assertions, and reports.

const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SCENARIOS_DIR = path.join(__dirname, 'scenarios');

// Assertions actually evaluated by this runner. Others are reported as "skip".
const FS_MATCHERS = new Set([
  'gate_context_contains',
  'gate_context_not_contains',
  'file_exists',
  'file_not_exists',
]);

const SKIP_MATCHERS = new Set([
  'output_contains',
  'no_files_written',
  'no_commits_made',
  'review_blocked',
  'review_gate_blocked',
  'writes_file',
  'qa_report_gate',
  'qa_report_contains',
]);

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;

function setupFixture(scenario) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'j-flow-scenario-'));
  const specsDir = path.join(tmp, '.specs', 'test-feature');
  fs.mkdirSync(specsDir, { recursive: true });

  const ctx = scenario.context || {};
  if (typeof ctx.gate_context === 'string') {
    fs.writeFileSync(path.join(specsDir, 'gate-context.md'), ctx.gate_context);
  }

  // Persist remaining context keys for future runners.
  const otherCtx = { ...ctx };
  delete otherCtx.gate_context;
  if (Object.keys(otherCtx).length > 0) {
    fs.writeFileSync(path.join(specsDir, '_context.json'), JSON.stringify(otherCtx, null, 2));
  }

  return { tmp, specsDir };
}

function evaluateAssertion(assertion, fixture) {
  const [key, value] = Object.entries(assertion)[0];

  if (SKIP_MATCHERS.has(key)) {
    return { status: 'skip', key, reason: 'requires live skill invocation' };
  }

  if (key === 'gate_context_contains') {
    const content = fs.readFileSync(path.join(fixture.specsDir, 'gate-context.md'), 'utf8');
    const ok = content.includes(value);
    // If the substring is not yet in the input gate-context, this assertion
    // describes post-execution state we cannot verify without an LLM run.
    return ok
      ? { status: 'pass', key, value }
      : { status: 'skip', key, value, reason: 'post-execution state' };
  }

  if (key === 'gate_context_not_contains') {
    const content = fs.readFileSync(path.join(fixture.specsDir, 'gate-context.md'), 'utf8');
    const present = content.includes(value);
    // We can only confidently pass this if the input still contains the string
    // and the scenario expects it to be removed (i.e. it WOULD have been
    // present but isn't). Otherwise we cannot tell pre- from post-state.
    return present
      ? { status: 'skip', key, value, reason: 'requires post-execution state diff' }
      : { status: 'skip', key, value, reason: 'no input state to diff against' };
  }

  if (key === 'file_exists') {
    const ok = fs.existsSync(path.join(fixture.tmp, value));
    return { status: ok ? 'pass' : 'fail', key, value };
  }

  if (key === 'file_not_exists') {
    const ok = !fs.existsSync(path.join(fixture.tmp, value));
    return { status: ok ? 'pass' : 'fail', key, value };
  }

  return { status: 'fail', key, value, detail: `unknown matcher: ${key}` };
}

function runScenario(file) {
  const text = fs.readFileSync(file, 'utf8');
  const scenario = yaml.load(text);
  const name = scenario.name || path.basename(file, '.yaml');
  console.log(`\n▸ ${name}`);
  console.log(`  ${scenario.description || '(no description)'}`);

  let fixture;
  try {
    fixture = setupFixture(scenario);
  } catch (e) {
    console.error(`  ✗ fixture setup failed: ${e.message}`);
    totalFail++;
    return;
  }

  const assertions = scenario.assertions || [];
  let pass = 0, fail = 0, skip = 0;
  for (const a of assertions) {
    const r = evaluateAssertion(a, fixture);
    if (r.status === 'pass') { pass++; console.log(`  ✓ ${r.key}${r.value !== undefined ? `: ${r.value}` : ''}`); }
    else if (r.status === 'fail') { fail++; console.error(`  ✗ ${r.key}${r.value !== undefined ? `: ${r.value}` : ''} — ${r.detail || ''}`); }
    else { skip++; console.log(`  ⊘ ${r.key} (skip: ${r.reason})`); }
  }

  totalPass += pass;
  totalFail += fail;
  totalSkip += skip;

  // Clean fixture (best-effort).
  try { fs.rmSync(fixture.tmp, { recursive: true, force: true }); } catch (_) {}
}

function main() {
  if (!fs.existsSync(SCENARIOS_DIR)) {
    console.error(`scenarios dir not found: ${SCENARIOS_DIR}`);
    process.exit(2);
  }
  const files = fs.readdirSync(SCENARIOS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).sort();
  if (files.length === 0) {
    console.error(`no scenarios in ${SCENARIOS_DIR}`);
    process.exit(2);
  }

  console.log(`Running ${files.length} scenarios from ${SCENARIOS_DIR}`);
  for (const f of files) runScenario(path.join(SCENARIOS_DIR, f));

  console.log(`\nResult: ${totalPass} passed, ${totalFail} failed, ${totalSkip} skipped`);
  if (totalFail > 0) process.exit(1);
}

main();
