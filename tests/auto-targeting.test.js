const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const wallDistanceStart = html.indexOf('function activeWallDistance(');
const start = html.indexOf('function autoTargetScore(');
const end = html.indexOf('function updateWallHud(', start);
assert.notEqual(start, -1, 'missing autoTargetScore');
assert.notEqual(end, -1, 'missing autoTargetScore boundary');
assert.notEqual(wallDistanceStart, -1, 'missing activeWallDistance');
const wallDistanceSource = html.slice(wallDistanceStart, start);
const source = html.slice(start, end);
const score = (enemy, distance, treeDistance, wallDistance) => vm.runInNewContext(
  `${source}; autoTargetScore(enemy, distance, treeDistance, wallDistance)`,
  { enemy, distance, treeDistance, wallDistance },
);
const assertScore = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≉ ${expected}`);

test('auto attacks prioritize enemies currently attacking a wall', () => {
  assertScore(score({ wallId: 0 }, 200, 900, 259), 110);
  assert.equal(score({ wallId: 0 }, 200, 900, 260), 200);
});

test('wall priority stops when the assigned wall is broken', () => {
  const distance = (hp, enemy = { wallId: 0, x: 100, y: 0 }) => vm.runInNewContext(
    `${wallDistanceSource}; activeWallDistance(enemy, walls)`,
    { enemy, walls: [{ hp, x: 0, y: 0 }] },
  );
  assert.equal(distance(1), 100);
  assert.equal(distance(0), Infinity);
  assert.equal(distance(1, { x: 100, y: 0 }), Infinity);
});

test('wall priority does not apply to jungle creatures', () => {
  assert.equal(score({ jungle: true, wallId: 0 }, 200, 900, 100), 200);
});

test('tree and wall siege priorities stack for wave enemies', () => {
  assertScore(score({ wallId: 0 }, 200, 449, 259), 71.5);
  assertScore(score({ wallId: 0 }, 200, 450, 259), 110);
});

test('elite and boss threat bonuses combine with defensive targeting', () => {
  assertScore(score({ elite: true, wallId: 0 }, 270, 900, 100), 110);
  assertScore(score({ boss: true, wallId: 0 }, 270, 900, 100), 99);
});
