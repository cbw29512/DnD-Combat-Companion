/* Encounter labels are presentation only; instance IDs and combat state stay intact. */
(function (root) {
  'use strict';

  function nextMonsterName(base, roster) {
    if (typeof base !== 'string' || !base || !Array.isArray(roster))
      throw Error('A monster name and encounter are required.');
    const used = new Set(roster.map(monster => monster.name));
    let number = 1;
    while (used.has(base + ' #' + number)) number++;
    return base + ' #' + number;
  }

  function repairDuplicateNames(roster) {
    try {
      const seen = new Set();
      let changed = false;
      for (const monster of roster) {
        if (seen.has(monster.name) && / #\d+$/.test(monster.name)) {
          const base = monster.name.replace(/ #\d+$/, '');
          monster.name = nextMonsterName(base, roster);
          changed = true;
        }
        seen.add(monster.name);
      }
      return changed;
    } catch (error) {
      console.warn('Encounter label recovery failed', error);
      throw error;
    }
  }

  const api = { nextMonsterName, repairDuplicateNames };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CombatEncounterIdentity = api;
})(typeof globalThis === 'object' ? globalThis : this);
