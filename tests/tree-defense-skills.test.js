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
const interceptSource = functionSource('hasHeroDefenseTarget', 'isTreeInDanger');
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


test('tree danger warns before breach when wave enemies approach from afar', () => {
  const check = (hp, heroX, enemies = []) => vm.runInNewContext(`${interceptSource}; ${dangerSource}; isTreeInDanger(tree, hero, enemies)`, {tree:{x:0,y:0,hp,maxHp:10000},hero:{x:heroX,y:0,range:270},enemies});
  assert.equal(check(10000, 5000, [{x:4000,y:0}]), true);
  assert.equal(check(10000, 5000, [{x:4001,y:0}]), false);
  assert.equal(check(10000, 5000, [{x:1000,y:0,jungle:true}]), false);
  assert.equal(check(10000, 1200, [{x:1000,y:0}]), false);
});

test('a hero already in auto-attack range suppresses the return-home warning', () => {
  const check = (enemies) => vm.runInNewContext(`${interceptSource}; ${dangerSource}; isTreeInDanger(tree, hero, enemies)`, {tree:{x:0,y:0,hp:10000,maxHp:10000},hero:{x:1450,y:0,range:270},enemies});
  assert.equal(check([{x:1820,y:0,jungle:false}]), false);
  assert.equal(check([{x:1821,y:0,jungle:false}]), true);
  assert.equal(check([{x:1450,y:0,jungle:true},{x:4000,y:0,jungle:false}]), true);
});

test('tree danger still uses 90% away and 75% nearby damage thresholds', () => {
  const check = (hp, heroX) => vm.runInNewContext(`${interceptSource}; ${dangerSource}; isTreeInDanger(tree, hero)`, {tree:{x:0,y:0,hp,maxHp:10000},hero:{x:heroX,y:0,range:270}});
  assert.equal(check(7501, 1200), false);
  assert.equal(check(7500, 1200), true);
  assert.equal(check(9001, 1201), false);
  assert.equal(check(9000, 1201), true);
  assert.equal(check(4299, 1201), true);
  assert.equal(check(0, 1201), true);
});

test('tree warning stays visible through return until defense is stable', () => {
  const check = (hp, heroX, wasActive, enemies = []) => vm.runInNewContext(`${interceptSource}; ${dangerSource}; ${warningSource}; isTreeWarningActive(tree, hero, wasActive, enemies)`, {tree:{x:0,y:0,hp,maxHp:10000},hero:{x:heroX,y:0,range:270},wasActive,enemies});
  assert.equal(check(10000, 5000, false, [{x:4000,y:0}]), true);
  assert.equal(check(10000, 5000, true), true);
  assert.equal(check(8000, 0, true), true);
  assert.equal(check(9000, 0, true), true);
  assert.equal(check(9001, 0, true), false);
  assert.equal(check(10000, 0, true, [{x:3500,y:0}]), true);
  assert.equal(check(10000, 1450, true, [{x:1820,y:0,jungle:false}]), false);
  assert.equal(check(8000, 1450, true, [{x:1820,y:0,jungle:false}]), true);
  assert.equal(check(8000, 0, false), false);
});

test('return warning sends the player to a safe point beside the tree', () => {
  const returnSource = functionSource('setTreeReturnTarget', 'respawnHero');
  const sandbox = {
    hero: {},
    running: true,
    over: false,
    tree: { x: 400, y: 500 },
    world: { h: 1200 },
    moveTarget: null,
    $: () => ({}),
    say: () => {},
  };
  assert.equal(vm.runInNewContext(`${returnSource}; setTreeReturnTarget()`, sandbox), true);
  assert.deepEqual({ ...sandbox.moveTarget }, { x: 400, y: 830 });
  sandbox.world.h = 700;
  vm.runInNewContext(`${returnSource}; setTreeReturnTarget()`, sandbox);
  assert.deepEqual({ ...sandbox.moveTarget }, { x: 400, y: 676 });
});

test('return warning cannot issue movement after the run ends', () => {
  const returnSource = functionSource('setTreeReturnTarget', 'respawnHero');
  const sandbox = {
    hero: {}, running: false, over: false,
    tree: { x: 400, y: 500 }, world: { h: 1200 }, moveTarget: null,
    $: () => ({}), say: () => {},
  };
  assert.equal(vm.runInNewContext(`${returnSource}; setTreeReturnTarget()`, sandbox), false);
  assert.equal(sandbox.moveTarget, null);
});

test('tree damage ramps through wave three, then returns to full strength', () => {
  const scaleSource = functionSource('treeDamageScale', 'updateWallHud');
  const scale = wave => vm.runInNewContext(`${scaleSource}; treeDamageScale(${wave})`, {});
  assert.equal(scale(1), 0.1);
  assert.equal(scale(2), 0.1);
  assert.equal(scale(3), 0.25);
  assert.equal(scale(4), 1);
});
