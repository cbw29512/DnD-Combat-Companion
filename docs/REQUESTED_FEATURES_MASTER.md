# Combat Companion — consolidated requested scope (13 October 2026)

This is the implementation contract for the **D&D Combat Companion website**, not D20 Iron Pit and not the separate ESP32 dice companion. Preserve the existing working browser preview while growing its catalog. These are user requests, NOT claims that features are finished.

## Definition of Done
The DM can run a 2014 or 2024 encounter on a Chromebook-sized tablet with no unintended page scrolling, legible touch controls, independent monster cards, accurate source-labeled abilities, usable dice animations, searchable rules and editable homebrew. The laptop DM view can intentionally publish a sanitized card/result to a separate player-facing ChromeOS display while mirroring that view locally. Each supported mechanic has edition-specific data, automated tests and working device behavior. Source-verified SRD material is clearly distinguished from homebrew and unavailable proprietary content.

## Data schema before implementation
- EditionRule: edition (2014, 2024, or explicitly unsupported), source version, rule ID, display name, text, action economy and timing.
- MonsterTemplate: edition, source, CR, HP/AC, movement/senses, ability/saves, actions, multiattack sequence, traits, reactions, immunities/resistances/vulnerabilities, conditions, save DC, uses, recharge, spell list, and explicit mechanic parameters.
- MonsterInstance: unique ID; template reference; editable visible name; HP/maxHP; initiative; conditions and their sources/durations; resources/recharge; per-turn resource usage; fight-local temporary modifiers and event log. Copying template never aliases mutable instance data.
- Effect: generic capability ID, display source name, target, buff/debuff classification, amount, saving throw, damage type, duration, trigger, remaining rounds, expiry timing, source edition and visibility.
- SpellTemplate: edition, level, school, casting time, range, components, duration, concentration, attack/save, damage/upcast, effect parameter list, SRD source.
- HomebrewTemplate: versioned user-owned monster/spell/item/feature data, edit/copy/delete, export/import, favorites, ordering, inclusion in personal decks. Do not silently change published core rules.
- RollRecord: actor/source name, edition, selected mode, individual secure dice, modifier, critical/fumble, public/private flag and timestamp.
- DisplayState: explicit publishable sanitized payload; DMState is NEVER serialized into the player view.
- Session/Command: paired display identity and authorization, sequence/version/reconnect fields, message validation and offline transport decision.

## Prioritized build queue
1. **Monster catalog**: steadily add source-verified **2014 SRD 5.1 first**, then compatible **2024 SRD 5.2.1**, with separate actual 2024 changes; CR filters, edition labels, readable stat blocks, one-click legal Multiattacks; comprehensive traits, specials, reactions, recharge and per-instance ammunition/uses. Do not invent stats. No false 'fully complete' counts.
2. **Combat mechanics**: generic attack/advantage/disadvantage/critical damage, saves with DM adjudication, damage-type resistance/immunity/vulnerability, condition immunity, timed buffs/debuffs, source-specific ability labels in logs, regeneration, recharge, repeated spell effects, target HP, conditions by source, end-of-turn saves, concentration save DC, initiative/round tracker, action history, resource recovery. Compose existing primitives; no named-monster resolver.
3. **Card UX**: large monster name at the **top** of each instance card (including editable labels like '+ Goblin Trashcan'); compact advantage/normal/disadvantage controls surrounding primary attack; use blank card space well; sizable high-contrast typography; flip front/back; back shows complete DM-visible details, HP, conditions, effects, resource controls. Prioritize a **no-page-scroll** tablet workspace, especially ChromeOS MediaTek Kompanio 500 / 4GB device. Monster silhouettes can be improved later.
4. **Unified toolbar**: D&D Combat Companion title, edition selector, Monsters/Spells/Debuffs & Damage/Dice/Homebrew tabs, CR and monster selection, Add action. Avoid duplicate nav rows.
5. **Dice**: tactile readable d4/d6/d8/d10/d12/d20/d100; pools of 1–20, plus/minus modifiers, normal/adv/disadvantage, individual dice and total, history, large natural-20 celebratory animation and natural-1 failure/skull animation; secure unbiased Web Crypto or explicit unavailable message. Preserve ability to roll without selecting a monster.
6. **Spells & rules**: comprehensive edition-tagged searchable spell and condition reference (range, components, damage, saves, concentration, duration, upcasting, effects), buff/debuff and damage-type cards, core combat rules, action economy and glossary. All interactive effects show source name, not just generic engine identifier.
7. **Homebrew and decks**: create/edit/copy/delete monsters/spells; support items and custom conditions eventually; save, favorite, reorder, import/export and collect cards into usable player/DM decks. Explicitly explain device-local persistence until real sync is built.
8. **Two physical screens**: laptop remains private DM control with embedded live **mirror**; player-facing portable Chromebook/browser receives ONLY explicitly published NPC/monster art, card faces, handouts, and public dice/results. No hidden AC/HP, unpublished attacks, DM notes or private roll leakage. Pairing and transport must be designed and tested before calling it live.
9. **Offline/performance**: usable offline-first local content and dice after proper installation/caching, small CPU/RAM budget, keyboard/accessibility support, reduced motion alternative, no viewport overflow and touch targets practical for older eyes.
10. **Broader D&D information**: player-side sheets (level, abilities, speed, AC, HP, initiative, attacks, slots, equipment, conditions, history), monster/spell quick-reference, magic items, DM notes, combat tracker and searchable rules. Only licensed SRD or supplied/owned homebrew; do not scrape or republish non-SRD D&D Beyond content.

## Behavioral rules
- Iron Pit semantic reuse remains an architecture reference where relevant; the Companion is a DM-adjudicated control surface, NOT a cloned automated arena.
- 2014 and 2024 are distinct. Build 2014 first, reuse only edition-compatible mechanics for 2024, then add genuine changes.
- Buffs permanently present on a character/monster should display bright white when active, gray when naturally eligible but inactive; temporary effects disappear upon expiry. An immunity suppresses the relevant damage/effect. Keep duration and trigger accurate, never infer from a feature name.
- Each monster in the encounter owns HP, resources, concentration-related effects and conditions. No shared mutable state.
- DM decides hit/miss/target/save unless a supported specific rule explicitly authorizes automation.
- A documented or cataloged ability is NOT an implemented mechanic until verified with tests.
- Split code files once they exceed 150 lines; the legacy index.html script needs controlled extraction rather than further indefinite growth.

## Acceptance scenarios
- Add two Goblins and a Troll, change each HP/conditions/resources, then switch editions and back without state leakage.
- Attack with normal/adv/disadvantage; natural 20 and natural 1 use visible large feedback and remain accurate to edition.
- Use Manticore spikes three times in a full multiattack without overspending; d6 recharge abilities only restore on their actual threshold.
- Troll regeneration is suppressed when the relevant recent typed damage occurs and resumes correctly based on source timing.
- Different casters independently maintain/replace/end concentration; damage DC uses max(10, floor(damage/2)), and DM controls pass/fail.
- All toolbar components fit the Chromebook/tablet viewport and card labels remain fully readable.
- Publish one monster picture or public roll to the player display; mirrored laptop public preview matches, DM-only HP/notes cannot be obtained from player payloads.
- CI, automated browser/viewport tests and actual Chromebook checks pass before labeling production-ready.

## Delivery practice
Keep adding source-verified cards and universal mechanics in coherent commits; do not block expansion on a full visual audit unless a failing build/regression makes the new work unsafe. Track pending failures honestly; defer comprehensive audit when requested.
