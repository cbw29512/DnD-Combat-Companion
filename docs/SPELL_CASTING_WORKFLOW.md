# Spell casting interface contract

## Purpose
A quick DM dice-and-rules aid, not an automatic adjudicator.

## State and data
- Selected edition (one of nine), selected spell, eligible casting/upcast level, displayed spell details, current dice result.
- Spell definition must include edition, source/license, canonical level or edition-specific equivalent, allowed upcasting mechanism, casting action, attack or save data, damage formula and scaling, effects and exact rules text/summary. No guessed rules.
- Upcast selector appears only when the selected edition and spell actually support higher-level casting; otherwise hide/disable it. Do not assume fifth-edition spell slots for older editions or 4e powers.

## UI sequence
1. Click **Spells**.
2. Choose **Edition** (default to active encounter edition, with ability to change).
3. Choose a **Spell** from a searchable dropdown filtered by edition (optional spell-level filter for large lists).
4. If that spell can be upcast, display **Cast at level** dropdown populated only with legal choices; select desired casting level. The default is the spell's base level.
5. Click **Cast** to roll all applicable to-hit and damage dice using unbiased Web Crypto; display each rolled die and result, with separate per-target values if rules require.
6. Show DC, save ability, damage type, and spell effect in readable form. The DM decides the target, hit/miss, save success/failure, and damage actually applied.
7. **Back** returns without clearing the encounter.

## Acceptance
- 2014 Fireball chosen at third level: third-level formula; fifth level: correct additional dice.
- Magic Missile: count darts and damage correctly for casting level, but DM controls target allocation.
- Non-damaging spell: show effect, never invent a damage roll.
- An edition without upcasting: never display a 5e-style upcast control.
- No automatic player HP modification or saving throw adjudication.
- Secure randomness required; on unavailable crypto, fail clearly instead of switching to Math.random.

This is a specification only; no claim of implementation or deployment.
