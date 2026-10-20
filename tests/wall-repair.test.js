const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function repairWalls(');
const end = html.indexOf('\nfunction burst(', start);
assert.notEqual(start, -1, 'missing repairWalls');
assert.notEqual(end, -1, 'missing helper boundary');
const source = html.slice(start, end);

function repair(walls, fraction) {
  return vm.runInNewContext(`${source}; repairWalls(walls, fraction)`, { walls, fraction });
}

test('between-wave repair restores 25% max health, including breached walls', () => {
  const walls = [
    { hp: 0, maxHp: 6000 },
    { hp: 3000, maxHp: 6000 },
    { hp: 6000, maxHp: 6000 },
    { hp: 1000, maxHp: 6000 },
  ];
  assert.equal(repair(walls, 0.25), 4500);
  assert.deepEqual(walls.map(wall => wall.hp), [1500, 4500, 6000, 2500]);
});

test('wall repair caps at maximum and leaves full walls unchanged', () => {
  const walls = [{ hp: 5900, maxHp: 6000 }, { hp: 6000, maxHp: 6000 }];
  assert.equal(repair(walls, 0.25), 100);
  assert.deepEqual(walls.map(wall => wall.hp), [6000, 6000]);
});

test('invalid walls are ignored and negative repair does not damage walls', () => {
  const walls = [null, { hp: 200, maxHp: 0 }, { hp: 100, maxHp: 6000 }];
  assert.equal(repair(walls, -1), 0);
  assert.equal(walls[2].hp, 100);
});

test('next wave transition applies wall repair once when it advances', () => {
  const transition = html.slice(html.indexOf('function nextWave(){'), html.indexOf('\nfunction ', html.indexOf('function nextWave(){') + 1));
  assert.match(transition, /repairWalls\(walls,\.25\)/);
});
