# D&D Combat Companion

A **tablet-oriented DM combat companion** for D&D. The current live preview is hosted by GitHub Pages:

https://cbw29512.github.io/DnD-Combat-Companion/

## Current implementation (13 Oct 2026)

- **2014 5e:** 38 monster cards and 45 spell entries (including simple non-damage effects). Nine monsters support an explicit one-click Multiattack routine; many other specials are DM-resolved.
- **2024 5e:** two SRD monsters (Goblin Minion and Goblin Warrior) and four spells (Fireball, Magic Missile, Shield, Bless). Full 2024 support is **not complete**.
- **Other editions:** listed in the edition picker for planning and editable Homebrew references, but edition-specific combat math is not yet implemented. Automatic monster attacks are intentionally disabled for unsupported editions.
- **Combat cards:** edition/CR/monster toolbar, visibly numbered independent monster instances with editable current HP, manually managed conditions and limited-use resources, normal/ADV/DIS attacks, natural 20/1 feedback, and potential damage. DM decides hits, targets, saving throws, and HP changes. Removing and adding cards preserves unique labels; older duplicate labels recover without changing instance IDs or combat state. Rotated-away card faces are excluded from keyboard navigation and assistive technology.
- **Spells:** automatic dice for supported damaging spells, upcasting where defined, Magic Missile darts, repeatable damage triggers for Cloud of Daggers and Moonbeam, and caster-scoped concentration tracking with manual End button.
- **Dice:** Web Crypto secure sampling, dice pools, advantage/disadvantage, total and d20 critical/fumble feedback.
- **Homebrew:** create/edit/copy/delete/use custom monsters and spells, monster attack profiles and multiattack sequences, spell concentration flags, JSON import/export; persisted in **this browser's localStorage**, not server-synchronized.
- **Encounter persistence:** switching editions preserves each edition's cards. Monster current HP, conditions, limited resources, and per-caster concentration persist locally.

## Master requested scope

See [the consolidated Combat Companion requirements](docs/REQUESTED_FEATURES_MASTER.md) for the full requested D&D catalog, conditions, spell data, dice, homebrew, card accessibility, two-screen workflow, acceptance scenarios, and what remains unimplemented. This contract is a development specification, not a feature-completion claim.

## Known incomplete work

1. **2014:** extend verified monster library, spell library, multiattack/special-ability resolution, saving throws, target HP adjudication, condition durations, and automated recharge/regeneration where accurately modeled.
2. **2024:** source-verified rules and cards — the current small Goblin-centered selection is not a complete edition.
3. **Earlier editions:** build separate rules adapters; do not silently reuse 5e critical-hit rules or roll math.
4. **Homebrew:** browser/device synchronization and richer structured spell effects do not exist. Export JSON backups before clearing browser data.
5. **UI:** Chromebook/tablet-specific viewport testing and real device QA are pending. The site's dice tray is **not** the separate site's 3D physics roller.
6. **Player display:** laptop-to-tablet real-time relay and secure DM/player separation not yet implemented.

## Tests

The current GitHub Pages site lives in root `index.html`, with `homebrew.js`, `homebrew.css`, `encounter-identity.js`, and `card-faces.js`.

Run the current smoke/regression suite on Node 22:

```sh
node --check homebrew.js
node --check encounter-identity.js
node --check card-faces.js
node --test test-current.cjs test-encounter-identity.cjs test-card-faces.cjs
```

The GitHub Actions workflow `.github/workflows/ci.yml` runs these checks on push and pull requests. The former `test-safety.js` references a separate V2.1 `netlify-site` architecture that has **not been imported**, and is not used to certify this web preview.

## Architecture notes

The current preview still uses a large inline script and accumulated CSS in `index.html`; modularization and automated browser viewport testing are needed. The Homebrew schema and engine are deliberately limited to mechanics representable by the current UI. Do not represent catalog counts as numbers of fully implemented rules-complete cards.

## Attribution

Rules and monster/spell information in the published preview are adapted from **System Reference Document 5.1** and **System Reference Document 5.2.1** by Wizards of the Coast, available at [D&D Beyond SRD](https://www.dndbeyond.com/srd), under the [Creative Commons Attribution 4.0 license](https://creativecommons.org/licenses/by/4.0/). Stat blocks are abbreviated and rearranged as interactive cards; not every special effect is implemented. This adaptation is not endorsed by Wizards of the Coast.
