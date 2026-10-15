'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const identity = require('./encounter-identity.js');

test('adding after a removal cannot reuse an occupied encounter label', () => {
  const roster = [{ name: 'Goblin #1' }, { name: 'Goblin #3' }];
  assert.equal(identity.nextMonsterName('Goblin', roster), 'Goblin #2');
  roster.push({ name: 'Goblin #2' });
  assert.equal(identity.nextMonsterName('Goblin', roster), 'Goblin #4');
});

test('labels respect literal homebrew names and avoid collisions across editions', () => {
  const roster = [{ name: 'Goblin #1', edition: '2014' }, { name: 'Goblin Boss #1' }];
  assert.equal(identity.nextMonsterName('Goblin', roster), 'Goblin #2');
  assert.equal(identity.nextMonsterName('Goblin #1', roster), 'Goblin #1 #1');
  assert.equal(identity.nextMonsterName('A [test]', roster), 'A [test] #1');
  assert.throws(() => identity.nextMonsterName('', roster), /required/);
});

test('recovering existing duplicate labels preserves IDs, HP, effects and resources', () => {
  const roster = ['one', 'two', 'three'].map((id, index) => ({
    id, name: index === 0 ? 'Goblin #1' : 'Goblin #3', edition: '2014',
    currentHp: index + 2, maxHp: 7, conditions: ['Poisoned'],
    conditionRounds: { Poisoned: index + 1 },
    resourceState: [{ name: 'Uses', remaining: index, max: 3 }]
  }));
  const before = JSON.parse(JSON.stringify(roster));
  assert.equal(identity.repairDuplicateNames(roster), true);
  assert.equal(new Set(roster.map(m => m.name)).size, 3);
  for (let i = 0; i < roster.length; i++) {
    const { name: oldName, ...oldState } = before[i];
    const { name: newName, ...newState } = roster[i];
    assert.deepEqual(newState, oldState);
  }
  assert.equal(roster[0].name, before[0].name);
  assert.equal(roster[1].name, before[1].name);
  const restored = JSON.parse(JSON.stringify(roster));
  assert.equal(identity.repairDuplicateNames(restored), false);
  assert.deepEqual(restored, roster);
});

test('the real add-monster handler stays unique after removal and reload', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const instance = inline.slice(inline.indexOf('function makeMonsterInstance('),
    inline.indexOf('function normalizeMonsterInstance('));
  const add = inline.slice(inline.indexOf('function addMonster(){'),
    inline.indexOf("$('cr').onchange=updateMonsterList;"));
  let writes = 0;
  const context = {
    CombatEncounterIdentity: identity, roster: [], edition: { value: '2014' },
    monsters: [{ name: 'Goblin', edition: '2014', hp: 7, actions: [], resources: [] }],
    $: () => ({ value: '0' }), secureDie: () => ++writes,
    save: () => {}, render: () => {}, selected: null
  };
  vm.createContext(context);
  vm.runInContext(instance + add, context);
  context.addMonster(); context.addMonster(); context.addMonster();
  context.roster.splice(1, 1);
  context.addMonster();
  context.roster = JSON.parse(JSON.stringify(context.roster));
  context.addMonster();
  assert.equal(new Set(context.roster.map(m => m.name)).size, 4);
  assert.equal(new Set(context.roster.map(m => m.id)).size, 4);
  assert.ok(context.roster.every(m => m.currentHp === 7 && m.conditions.length === 0));
  assert.match(inline, /name\.textContent=m\.name;/);
  assert.match(inline, /nextMonsterName\(base,roster\)/);
});
