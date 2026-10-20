const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const intervalStart = html.indexOf('function effectiveAttackInterval()');
const intervalEnd = html.indexOf('function fresh()', intervalStart);
assert.notEqual(intervalStart, -1, 'missing effective attack-rate helpers');
const intervalSource = html.slice(intervalStart, intervalEnd);
const start = html.indexOf('function gearComparison(');
const end = html.indexOf('function renderShop(', start);
assert.notEqual(start, -1, 'missing gearComparison');
assert.notEqual(end, -1, 'missing boundary after gearComparison');
const source = `${intervalSource};${html.slice(start, end)}`;

function compare(item, equipment, gear, hero) {
  return vm.runInNewContext(`${source}; gearComparison(item)`, { equipment, goods: { gear }, hero, item });
}

test('weapon replacement preview includes attack, attack rate, and range after removing old weapon', () => {
  const gear = [
    { id: 'sling', damage: 1, fireRate: -0.18, range: 50 },
    { id: 'bow', damage: 1, fireRate: 0.24, range: 180 },
  ];
  const result = compare({ id: 'bow', slot: '武器', ...gear[1] }, { 武器: 'sling' }, gear, {
    damage: 4, fireRate: 0.38, range: 320, speed: 235, maxHp: 160, armor: 0, regen: 0,
  });
  assert.equal(result, '替换后：攻击 4→4 · 攻速 2.6→1.3/秒 · 射程 320→450');
});

test('armor and boots previews show their practical stat gains', () => {
  const gear = [
    { id: 'armor', hp: 60 },
    { id: 'boots', speed: 30 },
  ];
  const hero = { damage: 2, fireRate: 0.56, range: 270, speed: 205, maxHp: 140, armor: 0, regen: 0 };
  assert.equal(compare({ id: 'armor', slot: '上衣', ...gear[0] }, {}, gear, hero), '替换后：生命 140→200');
  assert.equal(compare({ id: 'boots', slot: '鞋子', ...gear[1] }, {}, gear, hero), '替换后：移速 205→235');
});

test('weapon replacement preview clamps an over-fast equipped weapon to the combat minimum', () => {
  const gear = [
    { id: 'sling', damage: 1, fireRate: -0.18, range: 50 },
    { id: 'staff', damage: 1 },
  ];
  const hero = { damage: 3, fireRate: 0.144, range: 320, speed: 235, maxHp: 160, armor: 0, regen: 0 };
  assert.equal(
    compare({ id: 'staff', slot: '武器', ...gear[1] }, { 武器: 'sling' }, gear, hero),
    '替换后：攻击 3→3 · 攻速 5.3→3.1/秒 · 射程 320→270',
  );
});
