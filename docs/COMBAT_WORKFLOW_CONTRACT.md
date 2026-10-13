# Combat workflow contract — DM adjudication, groups, and secure dice

## Data schema first

- Edition: id, display label, rules adapter. Edition-specific rules are not inferred from 5e.
- MonsterTemplate: edition, source/license, id, name, edition-appropriate challenge/level, AC/defenses, HP, actions, attacks, saves, spellcasting and rules text.
- MonsterInstance: unique encounter id, monster template id, editable label (e.g. Goblin #2), current/max HP, effects, per-instance resources, initiative and alive flag. Multiple instances can share one template but MUST NOT share mutable combat state.
- Encounter: id, edition, ordered monster instance IDs, selected instance ID, combat log.
- CombatAction: source monster instance, action id, attack-vs-defense information (if applicable), damage expression, save ability, printed DC, targets, resources, special effects and repetition/multiattack parts.
- RollRecord: crypto dice outcomes (each individual die), modifiers, critical rules, total, per-target result, acting source and timestamps.
- SaveDecision: action target, printed DC, optional DM-adjusted DC, DM-reported pass/fail, resulting effect. No automatic judgement based solely on a displayed save DC.
- EditionRule: conditions/debuffs/damage types with source and edition.

## State and flow

1. Select edition, then Monster > edition-appropriate challenge/level > monster > Add to encounter (repeat any number). Keep individual named copies and HP/resources.
2. Select individual monster instance; Attack shows each available attack and action. A one-click Multiattack may roll all specified attacks, but manual outcomes for targets and saves remain under DM control.
3. Monster attacking player: roll attack (against defense/AC as appropriate); for saving throw action show printed save DC and ability, ASK the player whether they succeeded and let the DM enter pass/fail. The tool never rolls the player's save unless explicitly chosen in a future feature.
4. Player attacking monster: show its AC/defense or save data. The DM determines hit/miss or whether the monster passes the required save; record this manually. Save DC originates from the player's spell/effect or the DM adjustment, not from a fixed monster DC.
5. Spells > level > name > legal upcast option (when applicable) > Cast; apply attack/damage/save and effects using source-specific edition rules.
6. Debuffs and damage types are edition-specific reference entries, with correct immunities, resistances, vulnerabilities and durations.
7. Back returns to preceding menu without clearing encounter or state. Never leak one monster's HP/effects to another instance.

## Dice randomness

All automatic dice draws MUST use Web Crypto `crypto.getRandomValues` (secure browser context). For each 1..sides integer use unbiased rejection sampling, never `randomByte % sides` / `Math.random` fallback. Refuse/disable rolls with an explanatory error if secure randomness is unavailable. Validate every die size/count, attack batch, modifier and multiplier before any roll. Record individual dice for auditing; do not call cryptographic RNG 'perfect' or guarantee its physical entropy. Automated tests may inject a deterministic source solely for testing.

## UI acceptance

- Add two goblins and a dragon, switch between all three and confirm independent HP, effects, initiative and action resources.
- Attack with any selected monster, roll all permitted attack/damage components, display DC for saves, and wait for a DM entered success/failure before resolving conditional effects.
- Select an enemy creature as a target for each attack in a multiattack when needed.
- No incorrect automatic saving throw verdicts. Maintain proper attack-roll versus AC/defense behavior.
- Verify rejection sampling with mocked edge values, no modulo bias, unavailable crypto failure and dice range checks.
- Preserve offline support: Web Crypto requires the installed PWA to run in a secure context (HTTPS or localhost).
- Keep older D&D editions mechanically separate. Where an edition has no CR, use an edition-correct selector.

## Definition of Done
A feature is complete only when its source is committed, tests pass on CI, and it works offline on mobile. This document describes behavior and acceptance criteria, not a claim that code is implemented.
