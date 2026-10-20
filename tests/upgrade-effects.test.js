const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const intervalStart = html.indexOf('function effectiveAttackInterval()');
const intervalEnd = html.indexOf('function fresh()', intervalStart);
const blessingStart = html.indexOf('function applyBlessing(');
const blessingEnd = html.indexOf('function showUpgrade(', blessingStart);
assert.notEqual(intervalStart, -1, 'missing effective attack-rate helpers');
const intervalSource = html.slice(intervalStart, intervalEnd);
const start = blessingStart;
const end = blessingEnd;
assert.notEqual(start, -1, 'missing applyBlessing');
assert.notEqual(end, -1, 'missing boundary after applyBlessing');
const source = `${intervalSource};${html.slice(start, end)}`;

function apply(id, initial = {}) {
  const state = {
    blessings: {},
    hero: { speed: 200, fireRate: 0.56, damage: 2, skillPower: 3, hp: 50, maxHp: 100 },
    tree: { hp: 5000, maxHp: 10000 },
    ...initial,
  };
  vm.runInNewContext(`${source}; applyBlessing(id)`, { ...state, id });
  return state;
}

test('haste increases attacks per second by 20 percent and the combat loop uses that same rate', () => {
  const result = apply('haste');
  assert.ok(Math.abs(result.hero.fireRate - (0.56 / 1.2)) < 1e-12);
  assert.equal(result.blessings.haste, 1);
  assert.ok(Math.abs(1 / result.hero.fireRate - (1.2 / 0.56)) < 1e-12);
  const capped = apply('haste', { hero: { fireRate: 0.2 } });
  assert.ok(Math.abs(capped.hero.fireRate - (0.2 / 1.2)) < 1e-12);
  assert.equal(vm.runInNewContext(`${source}; effectiveAttackInterval()`, capped), 0.19);
  assert.ok(Math.abs(vm.runInNewContext(`${source}; attacksPerSecond()`, capped) - (1 / 0.19)) < 1e-12);
});

test('a high-rate weapon and Haste use the same capped combat and HUD rate', () => {
  const result = apply('haste', { hero: { fireRate: 0.324 - 0.18 } });
  assert.equal(vm.runInNewContext(`${source}; effectiveAttackInterval()`, result), 0.19);
  assert.ok(Math.abs(vm.runInNewContext(`${source}; attacksPerSecond()`, result) - (1 / 0.19)) < 1e-12);
  assert.match(html, /hero\\.fire=effectiveAttackInterval\\(\\)/, 'auto-attacks must use the shared capped interval');
  assert.doesNotMatch(html, /hero\\.fireRate-\\(blessings\\.haste\\|\\|0\\)/, 'Haste must not be applied again in combat');
});

test('speed and damage blessings change their named combat stats', () => {
  const speed = apply('speed');
  assert.ok(Math.abs(speed.hero.speed - 232) < 1e-9);
  const damage = apply('damage');
  assert.equal(damage.hero.damage, 3);
  assert.equal(damage.hero.skillPower, 4);
});

test('tree heal and vitality blessings respect caps and restore health', () => {
  const tree = apply('heal');
  assert.equal(tree.tree.hp, 7000);
  assert.equal(apply('heal', { tree: { hp: 9500, maxHp: 10000 } }).tree.hp, 10000);
  const vitality = apply('vital');
  assert.equal(vitality.hero.maxHp, 120);
  assert.equal(vitality.hero.hp, 70);
});

test('magnet and thorns blessings stack their effect counts', () => {
  const result = apply('magnet');
  vm.runInNewContext(`${source}; applyBlessing('magnet'); applyBlessing('thorns')`, result);
  assert.equal(result.blessings.magnet, 2);
  assert.equal(result.blessings.thorns, 1);
});
