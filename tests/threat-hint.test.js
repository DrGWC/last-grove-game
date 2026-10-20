const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function nearestThreatHint(');
const end = html.indexOf('function updateCampHint(', start);
assert.notEqual(start, -1, 'missing nearestThreatHint');
assert.notEqual(end, -1, 'missing nearestThreatHint boundary');
const source = html.slice(start, end);
const hint = (enemies, hero, range) => vm.runInNewContext(
  `${source}; nearestThreatHint(enemies, hero, range)`,
  { enemies, hero, range },
);

test('shows direction and distance to the nearest out-of-range wave threat', () => {
  assert.equal(hint([{ x: 0, y: -1200 }], { x: 0, y: 0 }, 270), '威胁：北侧 · 1.2 km');
  assert.equal(hint([{ x: 300, y: 0 }], { x: 0, y: 0 }, 270), '威胁：东侧 · 300 m');
});

test('hides the hint when no wave enemy is outside attack range', () => {
  assert.equal(hint([{ x: 200, y: 0 }], { x: 0, y: 0 }, 270), '');
  assert.equal(hint([], { x: 0, y: 0 }, 270), '');
});

test('ignores jungle creatures when selecting a wave threat', () => {
  assert.equal(hint([{ x: 0, y: -50, jungle: true }], { x: 0, y: 0 }, 270), '');
});
