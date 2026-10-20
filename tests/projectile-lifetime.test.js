const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function projectileLifetime(');
const end = html.indexOf('function xpMagnetRange(', start);
assert.notEqual(start, -1, 'missing projectileLifetime');
assert.notEqual(end, -1, 'missing boundary after projectileLifetime');
const source = html.slice(start, end);
const lifetime = (range, speed, radius) => vm.runInNewContext(`${source}; projectileLifetime(${range},${speed},${radius})`, {});

test('projectiles live long enough to reach the edge of the current attack range', () => {
  assert.ok(lifetime(270, 410, 12) * 410 >= 270 + 12 + 10);
  assert.ok(lifetime(330, 410, 12) * 410 >= 330 + 12 + 10);
});

test('long-range weapons receive a range-scaled flight time', () => {
  assert.ok(lifetime(450, 530, 12) * 530 >= 450 + 12 + 10);
});

test('slow projectiles remain safe and retain a minimum lifetime', () => {
  assert.equal(lifetime(270, 0, 12), 1.8);
  assert.equal(lifetime(270, 410, 0), 0.8);
});
