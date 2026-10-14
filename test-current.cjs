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
  assert.ok(monsters.some(m => m.edition === '2024'));
  assert.ok(spells.some(s => s.edition === '2024'));
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
  const start = inline.indexOf('edition.onchange=');
  const end = inline.indexOf("opt($('rule')", start);
  assert.ok(start >= 0 && end > start, 'Missing edition change handler');
  const handler = inline.slice(start, end);
  assert.doesNotMatch(handler,/roster\s*=\s*\[\]|save\(\)/);
  assert.match(inline,/if\(m\.edition!==edition\.value\)continue/);
});

test('legacy editions are not silently processed using 5e attack rules', () => {
  const homebrewMonster={
    edition:'ADND2',name:'Old-school Test',actions:[{name:'Sword',toHit:3,dice:[1,8,1],type:'slashing'}]
  };
  const roller=combatRNG([20]);
  assert.throws(() => roller.resolveMonsterChoice(homebrewMonster,'a:0','normal'),/edition-specific rules engine/);
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


test('each monster has independent HP and conditions, including restored legacy saves', () => {
  const start=inline.indexOf('const CONDITIONS=');
  const end=inline.indexOf('function secureDie(',start);
  assert.ok(start>=0&&end>start);
  const saved=[{name:'Goblin #1',edition:'2014',hp:7,ac:15,actions:[{name:'Scimitar'}],id:'old'}];
  let written=0;
  const state=vm.runInNewContext(inline.slice(start,end)+';({makeMonsterInstance,normalizeMonsterInstance,adjustMonsterHp,toggleMonsterCondition,monsterAttackCosts,spendMonsterAttackCosts})',
    {monsters,roster:saved,save:()=>{written++}});
  assert.equal(saved[0].currentHp,7);
  assert.equal(saved[0].maxHp,7);
  const m=monsters.find(x=>x.name==='Brown Bear');
  const one=state.makeMonsterInstance(m,'one','Brown Bear #1');
  const two=state.makeMonsterInstance(m,'two','Brown Bear #2');
  state.adjustMonsterHp(one,-17);
  state.toggleMonsterCondition(one,'Prone');
  assert.equal(one.currentHp,17);
  assert.equal(two.currentHp,34);
  assert.equal(two.conditions.length,0);
  const again=state.makeMonsterInstance(one,'three','Brown Bear #3');
  assert.equal(again.currentHp,34);
  assert.equal(again.conditions.length,0);
  assert.ok(written>=2);
});

test('Manticore ammunition is per instance and spent atomically', () => {
  const start=inline.indexOf('const CONDITIONS=');
  const end=inline.indexOf('function secureDie(',start);
  const state=vm.runInNewContext(inline.slice(start,end)+';({makeMonsterInstance,monsterAttackCosts,spendMonsterAttackCosts,normalizeMonsterInstance})',
    {monsters,roster:[],save:()=>{}});
  const template=monsters.find(m=>m.name==='Manticore'&&m.edition==='2014');
  const a=state.makeMonsterInstance(template,'a','Manticore #1');
  const b=state.makeMonsterInstance(template,'b','Manticore #2');
  assert.equal(a.resourceState[0].remaining,24);
  const costs=state.monsterAttackCosts(a,'r:1');
  assert.equal(costs.get('Tail Spikes'),3);
  state.spendMonsterAttackCosts(a,costs);
  assert.equal(a.resourceState[0].remaining,21);
  assert.equal(b.resourceState[0].remaining,24);
  a.resourceState[0].remaining=2;
  assert.throws(()=>state.monsterAttackCosts(a,'r:1'),/Insufficient/);
  assert.equal(a.resourceState[0].remaining,2);
  const old=JSON.parse(JSON.stringify(template));
  old.id='legacy';old.name='Manticore #1';delete old.resourceState;delete old.resources;
  state.normalizeMonsterInstance(old);
  assert.equal(old.resourceState[0].remaining,24);
});

test('caster concentration replaces per-caster spells but preserves another caster', () => {
  const start=inline.indexOf("const CONCENTRATION_KEY=");
  const end=inline.indexOf('function updateSpellDetails(){',start);
  assert.ok(start>=0&&end>start);
  const storage=new Map();
  const dom={
    spellCaster:{value:'Caster 1'},
    concentrationStatus:{textContent:''},
    endConcentration:{disabled:true}
  };
  const methods=vm.runInNewContext(inline.slice(start,end)+';({setConcentration,getConcentration,endConcentration,refreshConcentration})',{
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(k,v)=>storage.set(k,v)},
    $:id=>dom[id],edition:{value:'2014'},console:{warn:()=>{}},display:()=>{}
  });
  methods.setConcentration('2014','Caster 1','Bless',1);
  methods.setConcentration('2014','Caster 2','Moonbeam',2);
  const prior=methods.setConcentration('2014','Caster 1','Bane',1);
  assert.equal(prior.spell,'Bless');
  assert.equal(methods.getConcentration('2014','Caster 1').spell,'Bane');
  assert.equal(methods.getConcentration('2014','Caster 2').spell,'Moonbeam');
  assert.equal(methods.getConcentration('2024','Caster 1'),null);
  assert.equal(methods.endConcentration('2014','Caster 1'),true);
  assert.equal(methods.getConcentration('2014','Caster 1'),null);
  assert.ok(storage.get('cc-concentration-v1').includes('Moonbeam'));
});

test('2024 Goblin Warrior has extra advantage damage and separate crit dice', () => {
  const m=monsters.find(x=>x.name==='Goblin Warrior'&&x.edition==='2024');
  assert.ok(m);
  const normal=combatRNG([12]).resolveMonsterChoice(m,'a:0','normal').strikes[0];
  const adv=combatRNG([3,12]).resolveMonsterChoice(m,'a:0','advantage').strikes[0];
  const critical=combatRNG([20,5]).resolveMonsterChoice(m,'a:0','advantage').strikes[0];
  assert.equal(normal.damage,5);
  assert.equal(adv.damage,8);
  assert.equal(critical.damage,14);
});

test('spell concentration is explicit, and 2024 verified spells remain available', () => {
  for(const name of ['Bless','Bane','Moonbeam','Hold Person','Fly','Silence','Banishment']){
    const s=spells.find(x=>x.name===name&&x.edition==='2014');
    assert.equal(s?.concentration,true,name+' should require concentration');
  }
  assert.equal(spells.find(x=>x.name==='Fireball'&&x.edition==='2014').concentration,undefined);
  assert.equal(spells.find(x=>x.name==='Bless'&&x.edition==='2024').concentration,true);
  assert.equal(spells.find(x=>x.name==='Magic Missile'&&x.edition==='2024').formula(2)[0],4);
  assert.equal(spells.find(x=>x.name==='Shield'&&x.edition==='2024').base,1);
});

test('generic d6 recharge uses only configured resources and restores on threshold', () => {
  const start = inline.indexOf('function rollMonsterRecharge(');
  const end = inline.indexOf('function restoreMonsterResources(',start);
  assert.ok(start >= 0 && end > start);
  const source = inline.slice(start,end);
  for (const [roll,expected] of [[4,false],[5,true],[6,true]]) {
    let saved=0;
    const context={secureDie:()=>roll,save:()=>{saved++},console};
    const recharge=vm.runInNewContext(source+';rollMonsterRecharge',context);
    const monster={resourceState:[{name:'Breath',max:1,remaining:0,rechargeMin:5},{name:'Spikes',max:24,remaining:12,rechargeMin:null}]};
    const result=recharge(monster,'Breath');
    assert.equal(result.roll,roll);
    assert.equal(result.recharged,expected);
    assert.equal(monster.resourceState[0].remaining,expected?1:0);
    assert.equal(monster.resourceState[1].remaining,12);
    assert.equal(saved,1);
    assert.throws(()=>recharge(monster,'Spikes'),/No d6 recharge/);
  }
});

test('concentration damage DC follows half damage with minimum ten', () => {
  const start=inline.indexOf('function concentrationDamageDC(');
  const end=inline.indexOf('function concentrationDecision(',start);
  assert.ok(start>=0 && end>start);
  const dc=vm.runInNewContext(inline.slice(start,end)+';concentrationDamageDC',{console});
  for(const [damage,expected] of [[0,10],[1,10],[20,10],[21,10],[30,15],[53,26]])
    assert.equal(dc(damage),expected);
  for(const invalid of [-1,1.5,100000,NaN])assert.throws(()=>dc(invalid),/Enter damage/);
});

test('advance all timed conditions is per monster and preserves manual effects', () => {
  const start=inline.indexOf('function advanceAllConditionRounds(');
  const end=inline.indexOf('function monsterAttackCosts(',start);
  assert.ok(start>=0 && end>start);
  let saves=0;
  const advance=vm.runInNewContext(inline.slice(start,end)+';advanceAllConditionRounds',{save:()=>{saves++},console});
  const first={conditions:['Prone','Poisoned','Stunned'],conditionRounds:{Poisoned:2,Stunned:1}};
  const second={conditions:['Poisoned'],conditionRounds:{Poisoned:5}};
  assert.deepEqual(Array.from(advance(first)),['Stunned']);
  assert.deepEqual(Array.from(first.conditions),['Prone','Poisoned']);
  assert.equal(first.conditionRounds.Poisoned,1);
  assert.equal(first.conditionRounds.Stunned,undefined);
  assert.equal(second.conditionRounds.Poisoned,5);
  assert.deepEqual(Array.from(advance(first)),['Poisoned']);
  assert.deepEqual(Array.from(first.conditions),['Prone']);
  assert.equal(saves,2);
});
