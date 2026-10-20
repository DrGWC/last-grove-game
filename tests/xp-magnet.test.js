const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function xpMagnetRange(');
const end = html.indexOf('\nfunction update(', start);
assert.notEqual(start, -1, 'missing xpMagnetRange');
assert.notEqual(end, -1, 'missing boundary after xpMagnetRange');
const source = html.slice(start, end);
const range = (attackRange, magnetLevels) => vm.runInNewContext(`${source}; xpMagnetRange(${attackRange},${magnetLevels})`, {});

test('XP pickup range covers ordinary auto-attack kills', () => {
  assert.equal(range(270, 0), 330);
  assert.equal(range(320, 0), 380);
});

test('XP pickup follows long-range weapons and adds the magnet blessing', () => {
  assert.equal(range(450, 0), 510);
  assert.equal(range(450, 2), 620);
});

test('XP pickup retains a useful minimum when attack range is missing', () => {
  assert.equal(range(undefined, 0), 320);
});
