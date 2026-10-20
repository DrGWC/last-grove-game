const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function applyBlessing(');
const end = html.indexOf('function showUpgrade(', start);
assert.notEqual(start, -1, 'missing applyBlessing');
assert.notEqual(end, -1, 'missing boundary after applyBlessing');
const source = html.slice(start, end);

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

test('haste increases attacks per second by 20 percent and respects the combat minimum', () => {
  const result = apply('haste');
  assert.ok(Math.abs(result.hero.fireRate - (0.56 / 1.2)) < 1e-12);
  assert.equal(result.blessings.haste, 1);
  assert.equal(apply('haste', { hero: { fireRate: 0.2 } }).hero.fireRate, 0.19);
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
