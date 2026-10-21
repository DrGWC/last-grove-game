const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const compactStart = html.indexOf('function packOnlinePlayer(');
const compactEnd = html.indexOf('function syncOnlineState(', compactStart);
assert.notEqual(compactStart, -1, 'missing online snapshot projector');
assert.notEqual(compactEnd, -1, 'missing online sync boundary');
const compactSource = html.slice(compactStart, compactEnd);

const slowStart = html.indexOf('function applyVineArrowSlow(');
const slowEnd = html.indexOf('function effectiveAttackInterval(', slowStart);
assert.notEqual(slowStart, -1, 'missing vine-arrow status helper');
assert.notEqual(slowEnd, -1, 'missing vine-arrow helper boundary');
const slowSource = html.slice(slowStart, slowEnd);
const sendStart = html.indexOf('function sendOnline(');
const sendEnd = html.indexOf('function newRoomCode(', sendStart);
assert.notEqual(sendStart, -1, 'missing online sender');
assert.notEqual(sendEnd, -1, 'missing online sender boundary');
const sendSource = html.slice(sendStart, sendEnd);

test('online snapshots omit simulation-only routes and projectile hit references', () => {
  const source = {
    tree: { x: 4, y: 5, r: 8, hp: 90, maxHp: 100, internal: 'omit' },
    walls: [{ id: 0, name: '北', x: 1, y: 2, hp: 5, maxHp: 10, route: [1, 2] }],
    enemies: [{ x: 3, y: 4, r: 5, hp: 6, max: 10, role: 'runner', route: Array.from({ length: 200 }, (_, i) => [i, i]), pathingCache: { keep: false } }],
    shots: [{ x: 1, y: 2, vx: 3, vy: 4, life: 1, r: 5, weapon: 'bow', hit: Array.from({ length: 50 }, () => ({ route: [1, 2, 3] })), damage: 10 }],
    enemyShots: [], orbs: [], particles: [], damageFloats: [], camps: [],
    bossPit: { x: 1, y: 2, hidden: true }, shopStation: { x: 3, y: 4, hidden: true },
    elapsed: 4, spawnTimer: 1, kills: 2, xp: 3, level: 1, wave: 1,
    spawnSide: 0, waveSpawned: 1, waveLimit: 6, waveClearTimer: 0,
    waveRewarded: false, gold: 20, equipment: { 武器: 'stick' },
    gearEnhancements: {}, weaponCriticalTier: 0, treeWarning: false,
    treeShieldTimer: 0, hero: { x: 8, y: 9, combatTarget: { route: [1, 2] }, form: { name: '射手' }, unlockedSkills: ['q'] },
    remoteHero: { x: 2, y: 3, characterClass: 'vinewarden' }, running: true, over: false,
  };
  const packet = vm.runInNewContext(`${compactSource}; compactOnlineSnapshot(source)`, { source });
  assert.equal(packet.enemies[0].route, undefined);
  assert.equal(packet.enemies[0].pathingCache, undefined);
  assert.equal(packet.shots[0].hit, undefined);
  assert.equal(packet.shots[0].damage, undefined);
  assert.equal(packet.hero.combatTarget, undefined);
  assert.equal(packet.remoteHero.characterClass, 'vinewarden');
  assert.ok(JSON.stringify(packet).length < JSON.stringify(source).length / 2);
});

test('the vine archer applies and refreshes its slow without shortening a stronger slow', () => {
  const result = vm.runInNewContext(`${slowSource}; const first={slow:0};applyVineArrowSlow(first);const stronger={slow:2};applyVineArrowSlow(stronger);({first:first.slow,stronger:stronger.slow})`);
  assert.equal(result.first, 1.25);
  assert.equal(result.stronger, 2);
});

test('online sender drops stale snapshots when the peer queue is congested', () => {
  const result = vm.runInNewContext(`${sendSource}; const stale=sendOnline({type:'state'}); const input=sendOnline({type:'input',x:1,y:0}); const fresh=sendOnline({type:'state'}); ({stale,input,fresh,sent:online.conn.sent})`, {
    online: { conn: { open: true, bufferSize: 140 * 1024, dataChannel: { bufferedAmount: 0 }, send() { this.sent = (this.sent || 0) + 1; this.bufferSize = 0; } } },
  });
  assert.equal(result.stale, false);
  assert.equal(result.input, true);
  assert.equal(result.fresh, true);
  assert.equal(result.sent, 2);
});

test('each co-op character renders its own aim direction', () => {
  assert.match(html, /function drawPixelHero\([^\n]*attackAngle=hero\.attackAngle/);
  assert.match(html, /remoteHero\.characterClass,remoteHero\.attackAngle/);
});
