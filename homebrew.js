/* Combat Companion homebrew library v1 — local, edition-scoped, JSON-portable. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORE = 'combat-companion-homebrew-v1';
  const EDITIONS = new Set(['ODND','BX','ADND1','ADND2','3.0','3.5','4e','2014','2024']);
  const MAX_ENTRIES = 100;
  let library = { monsters: [], spells: [] };
  let editing = null;

  function note(message, isError = false) {
    const node = $('hb-status');
    node.textContent = message;
    node.classList.toggle('hb-error', isError);
  }
  function integer(value, low, high, label) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < low || n > high) throw Error(label + ' must be between ' + low + ' and ' + high + '.');
    return n;
  }
  function text(value, max = 500) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
  }
  function editionValue(value) {
    if (!EDITIONS.has(value)) throw Error('Choose a supported D&D edition.');
    return value;
  }
  function validateMonster(raw) {
    const name = text(raw.name, 80);
    if (!name) throw Error('Monster name is required.');
    const cr = text(raw.cr, 8);
    if (!/^(?:0|1\/8|1\/4|1\/2|[1-9]|[12]\d|30)$/.test(cr)) throw Error('Choose a CR from 0 through 30 (including 1/8, 1/4 or 1/2).');
    if (!Array.isArray(raw.actions) || !raw.actions.length || raw.actions.length > 12) throw Error('Add between 1 and 12 attacks.');
    const actions = raw.actions.map((a, i) => {
      const attackName = text(a.name, 80);
      if (!attackName) throw Error('Attack ' + (i + 1) + ' needs a name.');
      if (!Array.isArray(a.dice) || a.dice.length !== 3) throw Error('Invalid attack dice.');
      return {
        name: attackName, toHit: integer(a.toHit, -30, 50, 'Attack bonus'),
        dice: [integer(a.dice[0], 1, 100, 'Number of dice'),
          integer(a.dice[1], 2, 1000, 'Dice sides'), integer(a.dice[2], -1000, 1000, 'Damage modifier')],
        type: text(a.type, 40) || 'untyped', onHit: text(a.onHit, 400)
      };
    });
    const multiattacks = (raw.multiattacks || []).map((routine, ri) => {
      const title = text(routine.name, 80);
      if (!title) throw Error('Multiattack '+(ri+1)+' needs a name.');
      if (!Array.isArray(routine.sequence) || routine.sequence.length < 2 || routine.sequence.length > 4)
        throw Error('Multiattack '+(ri+1)+' requires 2–4 attacks.');
      const sequence = routine.sequence.map(i => integer(i, 0, actions.length - 1, 'Multiattack attack index'));
      return {name:title, sequence};
    });
    if (multiattacks.length > 6) throw Error('Maximum six multiattack routines per monster.');
    return {
      homebrewId: text(raw.homebrewId, 70) || crypto.randomUUID(),
      edition: editionValue(raw.edition), name,
      cr, hp: integer(raw.hp, 1, 99999, 'HP'), ac: integer(raw.ac, 0, 99, 'AC'),
      traits: text(raw.traits, 2500), actions, multiattacks
    };
  }
  function validateSpell(raw) {
    const name = text(raw.name, 80);
    if (!name) throw Error('Spell name is required.');
    const base = integer(raw.base, 0, 9, 'Spell level');
    const upcast = Boolean(raw.upcast) && base > 0 && base < 9;
    const hasDamage = Boolean(raw.hasDamage);
    let customDice = null;
    if (hasDamage) {
      const d = raw.customDice || {};
      customDice = {
        count: integer(d.count, 1, 100, 'Damage dice'),
        sides: integer(d.sides, 2, 1000, 'Damage die sides'),
        bonus: integer(d.bonus, -1000, 1000, 'Damage modifier'),
        perLevel: upcast ? integer(d.perLevel, 0, 30, 'Extra dice per spell level') : 0
      };
      if (upcast && customDice.count + customDice.perLevel * (9 - base) > 100)
        throw Error('The upcast damage formula exceeds 100 dice.');
    }
    return {
      homebrewId: text(raw.homebrewId, 70) || crypto.randomUUID(),
      edition: editionValue(raw.edition), name, base, upcast, hasDamage, customDice,
      type: text(raw.type, 40) || 'untyped',
      save: text(raw.save, 750), special: text(raw.special, 2500)
    };
  }
  function hydrateSpell(spell) {
    const hydrated = { ...spell };
    if (spell.hasDamage && spell.customDice) {
      const d = spell.customDice;
      hydrated.formula = level => [d.count + (level - spell.base) * d.perLevel, d.sides, d.bonus];
    }
    return hydrated;
  }
  function registerLibrary() {
    for (let i = monsters.length - 1; i >= 0; i--) if (monsters[i].homebrewId) monsters.splice(i, 1);
    for (let i = spells.length - 1; i >= 0; i--) if (spells[i].homebrewId) spells.splice(i, 1);
    monsters.push(...library.monsters);
    spells.push(...library.spells.map(hydrateSpell));
    updateMonsters();
    updateSpells();
  }
  function normalizeLibrary(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.monsters) || !Array.isArray(data.spells))
      throw Error('Expected a Combat Companion homebrew backup (version 1).');
    if (data.monsters.length > MAX_ENTRIES || data.spells.length > MAX_ENTRIES)
      throw Error('Backup exceeds 100 entries per category.');
    const m = data.monsters.map(validateMonster);
    const s = data.spells.map(validateSpell);
    const ids = [...m, ...s].map(item => item.homebrewId);
    if (new Set(ids).size !== ids.length) throw Error('Duplicate homebrew IDs in backup.');
    return { monsters: m, spells: s };
  }
  function persist() {
    localStorage.setItem(STORE, JSON.stringify({ version: 1, ...library }));
    registerLibrary();
    drawList();
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) library = normalizeLibrary(JSON.parse(raw));
      registerLibrary();
      note('Saved on this device. Export a backup before clearing browser data or switching devices.');
    } catch (error) {
      note('Could not load saved homebrew: ' + error.message, true);
    }
  }
  function attackRow(value = {}) {
    const row = document.createElement('div');
    row.className = 'hb-attack';
    row.innerHTML = '<label>Attack name<input data-field="name" maxlength="80" placeholder="Claw" required></label>' +
      '<label>To hit<input data-field="toHit" type="number" min="-30" max="50" required></label>' +
      '<label>Dice<input data-field="count" type="number" min="1" max="100" required></label>' +
      '<label>d<input data-field="sides" type="number" min="2" max="1000" required></label>' +
      '<label>+ / −<input data-field="bonus" type="number" min="-1000" max="1000" required></label>' +
      '<label>Type<input data-field="type" maxlength="40" placeholder="slashing"></label>' +
      '<label class="hb-wide">On-hit effect (optional)<input data-field="onHit" maxlength="400" placeholder="DC 12 STR or prone"></label>' +
      '<button class="hb-remove-attack" type="button" aria-label="Remove attack">− Remove attack</button>';
    const val = (key, fallback) => row.querySelector('[data-field="' + key + '"]').value = String(value[key] ?? fallback);
    val('name', 'Claw'); val('toHit', 4); val('count', value.dice?.[0] ?? 1);
    val('sides', value.dice?.[1] ?? 6); val('bonus', value.dice?.[2] ?? 2);
    val('type', 'slashing'); val('onHit', '');
    row.querySelector('.hb-remove-attack').onclick = () => {
      if ($('hb-attacks').children.length < 2) return note('A monster needs at least one attack.', true);
      row.remove();
      refreshRoutineOptions();
    };
    $('hb-attacks').append(row);
    refreshRoutineOptions();
  }

  // Each multiattack step refers to an attack index, not a creature or ability name.
  function refreshRoutineOptions() {
    const attacks=[...$('hb-attacks').children].map((row,i)=>({
      id:String(i),name:row.querySelector('[data-field="name"]').value.trim()||'Attack '+(i+1)
    }));
    for(const row of $('hb-routines').children) {
      for(const select of row.querySelectorAll('select[data-strike]')){
        const old=select.value;
        select.replaceChildren();
        const blank=document.createElement('option');blank.value='';blank.textContent='— None —';select.append(blank);
        for(const attack of attacks){
          const opt=document.createElement('option');opt.value=attack.id;opt.textContent='#'+(Number(attack.id)+1)+' '+attack.name;select.append(opt);
        }
        select.value=old;
      }
    }
  }
  function routineRow(value={}) {
    const row=document.createElement('div');row.className='hb-routine';
    row.innerHTML='<label class="hb-wide">Routine name<input data-routine-name maxlength="80" placeholder="Multiattack · Bite + Claws"></label>'+
      '<div class="hb-routine-picks"></div><button class="hb-remove-routine" type="button">− Remove routine</button>';
    row.querySelector('[data-routine-name]').value=value.name||'Multiattack';
    const picks=row.querySelector('.hb-routine-picks');
    for(let i=0;i<4;i++){
      const label=document.createElement('label');label.textContent='Strike '+(i+1);
      const select=document.createElement('select');select.setAttribute('data-strike',String(i));select.setAttribute('aria-label','Multiattack strike '+(i+1));
      label.append(select);picks.append(label);
    }
    row.querySelector('.hb-remove-routine').onclick=()=>row.remove();
    $('hb-routines').append(row);
    refreshRoutineOptions();
    row.querySelectorAll('select[data-strike]').forEach((s,i)=>{s.value=value.sequence?.[i]===undefined?'':String(value.sequence[i])});
  }
  function resetEditor() {
    editing = null;
    $('hb-form').reset();
    $('hb-edition').value = edition.value;
    $('hb-kind').value = 'monster';
    $('hb-attacks').replaceChildren();
    $('hb-routines').replaceChildren();
    attackRow();
    toggleKind();
    $('hb-save').textContent = 'Save homebrew';
    refreshTemplates();
    note('New homebrew entry. It will appear under its selected edition.');
  }
  function toggleKind() {
    const monster = $('hb-kind').value === 'monster';
    $('hb-monster-fields').hidden = !monster;
    $('hb-spell-fields').hidden = monster;
    $('hb-upcast').disabled = $('hb-level').value === '0' || $('hb-level').value === '9';
    if ($('hb-upcast').disabled) $('hb-upcast').checked = false;
    const damage = $('hb-damage-enabled').checked;
    $('hb-damage-fields').hidden = !damage;
  }
  function readEditor() {
    const common = {
      homebrewId: editing?.id || crypto.randomUUID(),
      edition: $('hb-edition').value, name: $('hb-name').value
    };
    if ($('hb-kind').value === 'monster') {
      return validateMonster({
        ...common, cr: $('hb-cr').value, hp: $('hb-hp').value, ac: $('hb-ac').value,
        traits: $('hb-traits').value,
        actions: [...$('hb-attacks').children].map(row => {
          const value = key => row.querySelector('[data-field="' + key + '"]').value;
          return { name: value('name'), toHit: value('toHit'),
            dice: [value('count'), value('sides'), value('bonus')],
            type: value('type'), onHit: value('onHit') };
        }),
        multiattacks: [...$('hb-routines').children].map(row => ({
          name: row.querySelector('[data-routine-name]').value,
          sequence:[...row.querySelectorAll('select[data-strike]')].map(s=>s.value).filter(x=>x!=='').map(Number)
        }))
      });
    }
    return validateSpell({
      ...common, base: $('hb-level').value, upcast: $('hb-upcast').checked,
      hasDamage: $('hb-damage-enabled').checked,
      customDice: { count: $('hb-dice-count').value, sides: $('hb-dice-sides').value,
        bonus: $('hb-dice-bonus').value, perLevel: $('hb-dice-extra').value },
      type: $('hb-damage-type').value, save: $('hb-save-text').value, special: $('hb-effect').value
    });
  }
  function submitEditor(event) {
    event.preventDefault();
    try {
      const kind = $('hb-kind').value;
      const entry = readEditor();
      const key = kind === 'monster' ? 'monsters' : 'spells';
      const items = library[key];
      const position = editing ? items.findIndex(x => x.homebrewId === editing.id) : -1;
      if (editing && (editing.kind !== kind || position < 0)) throw Error('Edited entry is no longer available.');
      if (position < 0 && items.length >= MAX_ENTRIES) throw Error('100 saved entries per category maximum.');
      if (position >= 0) items[position] = entry; else items.push(entry);
      persist();
      // Move the dropdown to the saved entry when it matches the selected combat edition.
      if (entry.edition === edition.value) {
        if (kind === 'monster') { $('cr').value = entry.cr; updateMonsterList(); $('monster').value = String(monsters.findIndex(m => m.homebrewId === entry.homebrewId)); }
        else $('spell').value = String(spells.findIndex(s => s.homebrewId === entry.homebrewId));
        if (kind === 'spell') updateSpellDetails();
      }
      const label = (position >= 0 ? 'Updated ' : 'Saved ') + entry.name + ' (' + entry.edition + ').';
      resetEditor();
      note(label + ' Entries are stored locally; export a backup for another device.');
    } catch (error) { note(error.message, true); }
  }
  function editEntry(kind, id) {
    const entry = library[kind === 'monster' ? 'monsters' : 'spells'].find(x => x.homebrewId === id);
    if (!entry) return note('Entry could not be found.', true);
    resetEditor();
    editing = { kind, id };
    $('hb-kind').value = kind; $('hb-edition').value = entry.edition; $('hb-name').value = entry.name;
    if (kind === 'monster') {
      $('hb-cr').value = entry.cr; $('hb-hp').value = entry.hp; $('hb-ac').value = entry.ac;
      $('hb-traits').value = entry.traits;
      $('hb-attacks').replaceChildren(); entry.actions.forEach(attackRow);
      $('hb-routines').replaceChildren(); (entry.multiattacks||[]).forEach(routineRow);
    } else {
      $('hb-level').value = entry.base; $('hb-upcast').checked = entry.upcast;
      $('hb-damage-enabled').checked = entry.hasDamage;
      const d = entry.customDice || { count: 1, sides: 6, bonus: 0, perLevel: 0 };
      $('hb-dice-count').value = d.count; $('hb-dice-sides').value = d.sides;
      $('hb-dice-bonus').value = d.bonus; $('hb-dice-extra').value = d.perLevel;
      $('hb-damage-type').value = entry.type; $('hb-save-text').value = entry.save;
      $('hb-effect').value = entry.special;
    }
    toggleKind();
    refreshTemplates();
    $('hb-save').textContent = 'Update homebrew';
    $('hb-form').scrollTop = 0;
    note('Editing ' + entry.name + '. Save to apply changes.');
  }
  function deleteEntry(kind, id) {
    const key = kind === 'monster' ? 'monsters' : 'spells';
    const entry = library[key].find(x => x.homebrewId === id);
    if (!entry || !confirm('Delete homebrew ' + entry.name + '?')) return;
    library[key] = library[key].filter(x => x.homebrewId !== id);
    try { persist(); if (editing?.id === id) resetEditor(); note('Deleted ' + entry.name + ' from your homebrew library.'); }
    catch (error) { note('Delete could not be saved: ' + error.message, true); }
  }
  function refreshTemplates() {
    const target = $('hb-template');
    if (!target) return;
    const choices = monsters.map((monster, index) => ({ monster, index }))
      .filter(row => !row.monster.homebrewId && row.monster.edition === $('hb-edition').value)
      .sort((a, b) => a.monster.name.localeCompare(b.monster.name));
    target.replaceChildren();
    for (const { monster, index } of choices) {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = monster.name + ' · CR ' + monster.cr;
      target.append(option);
    }
    $('hb-use-template').disabled = !choices.length;
  }
  function useTemplate() {
    const index = Number($('hb-template').value);
    const source = monsters[index];
    if (!source || source.homebrewId || source.edition !== $('hb-edition').value)
      return note('Select an existing monster in this edition first.', true);
    resetEditor();
    $('hb-name').value = (source.name + ' (Homebrew)').slice(0, 80);
    $('hb-edition').value = source.edition;
    $('hb-cr').value = source.cr;
    $('hb-ac').value = source.ac;
    $('hb-hp').value = source.hp;
    $('hb-traits').value = source.traits || '';
    $('hb-attacks').replaceChildren();
    source.actions.forEach(a => attackRow(a));
    $('hb-routines').replaceChildren(); (source.multiattacks||[]).forEach(routineRow);
    refreshTemplates();
    note('Loaded a working copy of ' + source.name + '. The original stat block is unchanged. Edit and save your version.');
  }
  function duplicateEntry(kind, id) {
    const key = kind === 'monster' ? 'monsters' : 'spells';
    const original = library[key].find(x => x.homebrewId === id);
    if (!original) return note('The saved entry could not be found.', true);
    if (library[key].length >= MAX_ENTRIES) return note('100 saved entries maximum for this category.', true);
    const clone = JSON.parse(JSON.stringify(original));
    clone.homebrewId = crypto.randomUUID();
    clone.name = (original.name.replace(/ \(Copy\)$/, '') + ' (Copy)').slice(0, 80);
    library[key].push(clone);
    try { persist(); note('Duplicated ' + original.name + '. Select Edit to customize the copy.'); }
    catch (error) { library[key].pop(); note('Could not save duplicate: ' + error.message, true); }
  }
  function useInCombat(kind, id) {
    const key = kind === 'monster' ? 'monsters' : 'spells';
    const item = library[key].find(x => x.homebrewId === id);
    if (!item) return note('The saved entry could not be found.', true);
    if (edition.value !== item.edition)
      return note('Change the main edition to ' + item.edition + ', then select Use again. Existing encounter monsters will not be cleared.', true);
    if (kind === 'monster') {
      if (roster.length >= 100) return note('The current encounter already has 100 monsters.', true);
      $('cr').value = item.cr;
      updateMonsterList();
      const index = monsters.findIndex(m => m.homebrewId === id);
      if (index < 0) return note('Monster is not available in the catalog.', true);
      $('monster').value = String(index);
      document.querySelector('[data-tab="monsters"]').click();
      $('add').click();
      note('Added ' + item.name + ' to the encounter.');
    } else {
      const index = spells.findIndex(s => s.homebrewId === id);
      if (index < 0) return note('Spell is not available in the catalog.', true);
      document.querySelector('[data-tab="spells"]').click();
      $('spell').value = String(index);
      updateSpellDetails();
      note('Selected ' + item.name + ' in Spells. Choose a slot and cast it.');
    }
  }
  function drawList() {
    const root = $('hb-list');
    root.replaceChildren();
    const query = $('hb-search').value.trim().toLocaleLowerCase();
    const entries = [
      ...library.monsters.map(item => ({ kind: 'monster', item })),
      ...library.spells.map(item => ({ kind: 'spell', item }))
    ].filter(row => (row.item.name + ' ' + row.item.edition + ' ' + row.kind).toLocaleLowerCase().includes(query))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
    $('hb-count').textContent = library.monsters.length + ' monsters · ' + library.spells.length + ' spells';
    if (!entries.length) { root.textContent = 'No homebrew entries yet.'; return; }
    for (const { kind, item } of entries) {
      const row = document.createElement('div'); row.className = 'hb-saved-item';
      const desc = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = item.name;
      const meta = document.createElement('small'); meta.textContent = item.edition + ' · ' + (kind === 'monster' ? 'Monster · CR ' + item.cr : 'Spell · Level ' + item.base);
      desc.append(title, meta);
      const use = document.createElement('button'); use.textContent = 'Use'; use.title = 'Use in combat'; use.onclick = () => useInCombat(kind, item.homebrewId);
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.onclick = () => editEntry(kind, item.homebrewId);
      const duplicate = document.createElement('button'); duplicate.textContent = 'Copy'; duplicate.onclick = () => duplicateEntry(kind, item.homebrewId);
      const del = document.createElement('button'); del.textContent = 'Delete'; del.onclick = () => deleteEntry(kind, item.homebrewId);
      row.append(desc, use, edit, duplicate, del); root.append(row);
    }
  }
  function exportBackup() {
    const json = JSON.stringify({ version: 1, ...library }, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'combat-companion-homebrew.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    note('Homebrew backup downloaded. Keep it somewhere safe.');
  }
  async function importBackup(file) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw Error('Backup file must be smaller than 1 MB.');
      const imported = normalizeLibrary(JSON.parse(await file.text()));
      if ((library.monsters.length || library.spells.length) &&
          !confirm('Replace your existing homebrew library with the imported backup? Export first if you want to keep it.')) return;
      const old = library; library = imported;
      try { persist(); resetEditor(); note('Imported ' + imported.monsters.length + ' monsters and ' + imported.spells.length + ' spells.'); }
      catch (error) { library = old; registerLibrary(); throw error; }
    } catch (error) { note('Import failed: ' + error.message, true); }
    finally { $('hb-import').value = ''; }
  }

  $('hb-form').addEventListener('submit', submitEditor);
  $('hb-kind').addEventListener('change', () => { editing = null; toggleKind(); $('hb-save').textContent = 'Save homebrew'; });
  $('hb-damage-enabled').addEventListener('change', toggleKind);
  $('hb-level').addEventListener('change', toggleKind);
  $('hb-add-attack').onclick = () => {
    if ($('hb-attacks').children.length >= 12) return note('Limit of 12 attack profiles.', true);
    attackRow();
  };
  $('hb-add-routine').onclick=()=>{
    if($('hb-routines').children.length>=6)return note('Maximum six multiattack routines.',true);
    routineRow();
  };
  $('hb-attacks').addEventListener('input',e=>{if(e.target.matches('[data-field="name"]'))refreshRoutineOptions()});
  $('hb-new').onclick = resetEditor;
  $('hb-search').addEventListener('input', drawList);
  $('hb-edition').addEventListener('change', refreshTemplates);
  $('hb-use-template').onclick = useTemplate;
  $('hb-export').onclick = exportBackup;
  $('hb-import').addEventListener('change', event => importBackup(event.target.files[0]));
  resetEditor();
  load();
  drawList();
})();
