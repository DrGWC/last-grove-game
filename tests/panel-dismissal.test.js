const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function dismissPanelsOnOutsidePointerDown(');
const end = html.indexOf("document.addEventListener('pointerdown',dismissPanelsOnOutsidePointerDown", start);
assert.notEqual(start, -1, 'missing outside-dismiss handler');
assert.notEqual(end, -1, 'missing outside-dismiss boundary');
const source = html.slice(start, end);

function run({shop = false, equipment = false, inside = false} = {}) {
  const closed = [];
  let prevented = false;
  let stopped = false;
  const panels = {
    shop: { classList: { contains: name => name === 'show' && shop } },
    equipmentPanel: { classList: { contains: name => name === 'show' && equipment } },
  };
  const event = {
    target: { closest: selector => inside && selector.includes(shop ? '#shop' : '#equipmentPanel') },
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  };
  const result = vm.runInNewContext(`${source}; dismissPanelsOnOutsidePointerDown(event)`, {
    $: id => panels[id], event,
    closeShop: () => closed.push('shop'),
    closeEquipment: () => closed.push('equipment'),
  });
  return {result, closed, prevented, stopped};
}

test('outside click closes shop and blocks click-through to the game canvas', () => {
  assert.deepEqual(run({shop: true}), {result: true, closed: ['shop'], prevented: true, stopped: true});
});

test('inside click does not dismiss the shop', () => {
  assert.deepEqual(run({shop: true, inside: true}), {result: false, closed: [], prevented: false, stopped: false});
});

test('outside click closes equipment and blocks click-through', () => {
  assert.deepEqual(run({equipment: true}), {result: true, closed: ['equipment'], prevented: true, stopped: true});
});
