'use strict';
/* Current GitHub Pages app smoke/regression checks. No dependencies. */
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const homebrew = fs.readFileSync('homebrew.js', 'utf8');
const stylesheet = fs.readFileSync('homebrew.css', 'utf8');
function capture(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, 'Missing '+label);
  return match[1];
}
const inline = capture(html, /<script>([\s\S]*?)<\/script>/, 'main application script');
const monsterExpression = capture(html, /const monsters=(\[[\s\S]*?\]);\s*const spells=/, 'monster dataset');
const spellExpression = capture(html, /const spells=(\[[\s\S]*?\]);\s*const rules=/, 'spell dataset');
const monsters = vm.runInNewContext('('+monsterExpression+')');
const spells = vm.runInNewContext('('+spellExpression+')');

function combatRNG(d20s) {
  let index = 0;
  const start = inline.indexOf('function resolveStrike(');
  const end = inline.indexOf('function render(){', start);
  assert.ok(start !== -1 && end > start, 'Missing universal combat functions');
  const context = {
    secureDie: sides => sides === 20 ? d20s[index++ % d20s.length] : 1,
    roll: (n, sides, bonus = 0) => ({
      dice: Array(n).fill(3), bonus, total: 3*n + bonus
    })
  };
  return vm.runInNewContext(inline.slice(start,end)+';({resolveMonsterChoice,describeMonsterChoice})', context);
}

test('all current scripts compile', () => {
  assert.doesNotThrow(() => new vm.Script(inline));
  assert.doesNotThrow(() => new vm.Script(homebrew));
  assert.ok(stylesheet.length > 500);
});

test('toolbar, Homebrew, spell tick and dice controls exist exactly once', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate DOM IDs');
  const required = ['edition','cr','monster','add','roster','cast','rollSpellTick','diceTray',
    'homebrew','hb-routines','hb-add-routine','hb-list','hb-import','hb-export','attack-flash'];
  for (const id of required) assert.ok(ids.includes(id), 'Missing '+id);
  const homebrewReferences = [...homebrew.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]);
  for (const id of homebrewReferences) assert.ok(ids.includes(id), 'Unwired Homebrew element: '+id);
  assert.match(html,/homebrew\.js\?v=\d+/);
  assert.match(html,/homebrew\.css\?v=\d+/);
});

test('only implemented edition cards are advertised', () => {
  assert.ok(monsters.filter(m => m.edition === '2014').length >= 34);
  assert.ok(spells.filter(s => s.edition === '2014').length >= 45);
  assert.equal(monsters.filter(m => m.edition === '2024').length, 1);
  assert.equal(spells.filter(s => s.edition === '2024').length, 1);
  for (const item of [...monsters,...spells]) assert.ok(item.edition && item.name);
});

test('all monster multiattack sequences resolve valid action indices', () => {
  for (const m of monsters) {
    for (const routine of m.multiattacks || []) {
      assert.ok(routine.name);
      assert.ok(Array.isArray(routine.sequence) && routine.sequence.length > 0 && routine.sequence.length <= 8);
      for (const index of routine.sequence)
        assert.ok(Number.isInteger(index) && index >= 0 && index < m.actions.length, m.name+' invalid attack index');
    }
  }
});

test('multiattack: each strike has a separate d20 and damage roll', () => {
  const bear = monsters.find(m => m.name === 'Brown Bear');
  const roller = combatRNG([13,8]);
  const result = roller.resolveMonsterChoice(bear, 'r:0', 'normal');
  assert.equal(result.strikes.length,2);
  assert.deepEqual(Array.from(result.strikes,x=>x.natural),[13,8]);
  assert.equal(result.strikes[0].action.name,'Bite');
  assert.equal(result.strikes[1].action.name,'Claws');
  assert.match(roller.describeMonsterChoice(bear,result),/Combined POTENTIAL/);
});

test('natural 20 adds critical dice; natural 1 cannot deal damage', () => {
  const bear = monsters.find(m => m.name === 'Brown Bear');
  const critical = combatRNG([20]).resolveMonsterChoice(bear,'a:0','normal').strikes[0];
  assert.equal(critical.critical,true);
  assert.equal(critical.damage,10); // 1d8(+4) + crit 1d8 using mock 3s
  const miss = combatRNG([1]).resolveMonsterChoice(bear,'a:0','normal').strikes[0];
  assert.equal(miss.miss,true);
  assert.equal(miss.damage,null);
});

test('advantage selects higher d20 and disadvantage selects lower', () => {
  const bear=monsters.find(m => m.name === 'Brown Bear');
  assert.equal(combatRNG([3,19]).resolveMonsterChoice(bear,'a:0','advantage').strikes[0].natural,19);
  assert.equal(combatRNG([3,19]).resolveMonsterChoice(bear,'a:0','disadvantage').strikes[0].natural,3);
  assert.throws(() => combatRNG([12]).resolveMonsterChoice(bear,'r:999','normal'),/unavailable|Missing/);
});

test('switching D&D editions must not delete the encounter', () => {
  const handler = capture(inline, /edition\.onchange=([^;]*);/, 'edition change handler');
  assert.doesNotMatch(handler,/roster\s*=\s*\[\]|save\(\)/);
  assert.match(inline,/if\(m\.edition!==edition\.value\)continue/);
});

test('spell upcasting formulas remain within engine dice safety', () => {
  for(const s of spells){
    if(!s.formula)continue;
    for(let lvl=s.base;lvl<=(s.upcast?9:s.base);lvl++){
      const dice=s.formula(lvl);
      assert.equal(dice.length,3);
      assert.ok(Number.isInteger(dice[0])&&dice[0]>=1&&dice[0]<=100, s.name+' level '+lvl+' unsafe number of dice');
      assert.ok(Number.isInteger(dice[1])&&dice[1]>=2&&dice[1]<=1000000);
      assert.ok(Number.isInteger(dice[2])&&Math.abs(dice[2])<=1000);
    }
  }
  const fireball=spells.find(s=>s.name==='Fireball'&&s.edition==='2014');
  assert.equal(fireball.formula(5)[0],10);
});

test('Homebrew old records and multiattack records validate; bad index rejected', () => {
  const start=homebrew.indexOf('  function integer(');
  const end=homebrew.indexOf('  function validateSpell(',start);
  assert.ok(start>=0&&end>start);
  const validate=vm.runInNewContext(homebrew.slice(start,end)+';validateMonster',{
    EDITIONS:new Set(['2014','2024']),
    crypto:{randomUUID:()=> 'test-id'}
  });
  const monster={edition:'2014',name:'Test Bear',cr:'1',hp:34,ac:11,
    actions:[{name:'Bite',toHit:6,dice:[1,8,4],type:'piercing'},
             {name:'Claws',toHit:6,dice:[2,6,4],type:'slashing'}]};
  assert.equal(validate(monster).multiattacks.length,0);
  const updated=validate({...monster,multiattacks:[{name:'Bite and Claws',sequence:[0,1]}]});
  assert.equal(updated.multiattacks[0].sequence.length,2);
  assert.throws(()=>validate({...monster,multiattacks:[{name:'Invalid',sequence:[0,5]}]}),/index/);
});
