const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function functionSource(name, nextName) {
  const start = html.indexOf(`function ${name}(`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start) : html.indexOf('\n', start);
  assert.notEqual(start, -1, `missing ${name} function`);
  assert.notEqual(end, -1, `missing boundary after ${name}`);
  return html.slice(start, end);
}
const dangerSource = functionSource('isTreeInDanger', 'withinTreeGuardRange');
const warningSource = functionSource('isTreeWarningActive', 'withinTreeGuardRange');
const guardSource = functionSource('withinTreeGuardRange', 'castSkill');
const skillsSource = functionSource('autoSkills', 'killEnemy');

function automaticDefenseCasts({ heroX, treeHp = 10000, enemies = [] }) {
  const calls = [];
  const sandbox = {
    hero: { x: heroX, y: 0, hp: 100, maxHp: 100, unlockedSkills: ['e', 'f'], eCd: 0, fCd: 0, qCd: 20, rCd: 20, range: 270 },
    tree: { x: 0, y: 0, hp: treeHp, maxHp: 10000 },
    enemies,
    treeShieldTimer: 0,
    paused: false,
    over: false,
    castSkill: skill => calls.push(skill),
  };
  vm.runInNewContext(`${guardSource}\n${skillsSource}\nautoSkills()`, sandbox);
  return calls;
}

test('tree defense skills trigger within 1,200 world units', () => {
  const enemies = [
    { x: 100, y: 0, jungle: false },
    { x: -100, y: 0, jungle: false },
  ];
  assert.deepEqual(automaticDefenseCasts({ heroX: 1200, treeHp: 9000, enemies }), ['e', 'f']);
});

test('tree defense skills do not heal or shield globally while the hero is away', () => {
  const enemies = [
    { x: 100, y: 0, jungle: false },
    { x: -100, y: 0, jungle: false },
  ];
  assert.deepEqual(automaticDefenseCasts({ heroX: 1201, treeHp: 5000, enemies }), []);
});

test('tree defense skills wait when the tree is healthy and there is no siege', () => {
  assert.deepEqual(automaticDefenseCasts({ heroX: 500 }), []);
});


test('tree danger uses an earlier threshold while the hero is away', () => {
  const check = (hp, heroX) => vm.runInNewContext(`${dangerSource}; isTreeInDanger(tree, hero)`, {tree:{x:0,y:0,hp,maxHp:10000},hero:{x:heroX,y:0}});
  assert.equal(check(7501, 1200), false);
  assert.equal(check(7500, 1200), true);
  assert.equal(check(9001, 1201), false);
  assert.equal(check(9000, 1201), true);
  assert.equal(check(4299, 1201), true);
  assert.equal(check(0, 1201), true);
});


test('tree warning stays visible through return and clears after recovery', () => {
  const check = (hp, heroX, wasActive) => vm.runInNewContext(`${dangerSource}; ${warningSource}; isTreeWarningActive(tree, hero, wasActive)`, {tree:{x:0,y:0,hp,maxHp:10000},hero:{x:heroX,y:0},wasActive});
  assert.equal(check(9000, 5000, false), true);
  assert.equal(check(8000, 0, true), true);
  assert.equal(check(9000, 0, true), true);
  assert.equal(check(9001, 0, true), false);
  assert.equal(check(8000, 0, false), false);
});
