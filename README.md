# D&D Combat Companion

A **tablet-oriented DM combat companion** for D&D. The current live preview is hosted by GitHub Pages:

https://cbw29512.github.io/DnD-Combat-Companion/

## Current implementation (13 Oct 2026)

- **2014 5e:** 34 monster cards and 45 spell entries (including simple non-damage effects). Five monsters support an explicit one-click Multiattack routine; other specials are DM-resolved.
- **2024 5e:** one clearly marked sample monster and one spell. Full 2024 support is **not complete**.
- **Other editions:** listed in the edition picker for planning and editable Homebrew references, but edition-specific combat math is not yet implemented. Automatic monster attacks are intentionally disabled for unsupported editions.
- **Combat cards:** edition/CR/monster toolbar, independent monster instances, normal/ADV/DIS attacks, natural 20/1 feedback, and potential damage. DM decides hits, targets, saving throws, and HP changes.
- **Spells:** automatic dice for supported damaging spells, upcasting where defined, Magic Missile darts, and repeatable damage triggers for Cloud of Daggers and Moonbeam.
- **Dice:** Web Crypto secure sampling, dice pools, advantage/disadvantage, total and d20 critical/fumble feedback.
- **Homebrew:** create/edit/copy/delete/use custom monsters and spells, monster attack profiles and multiattack sequences, JSON import/export; persisted in **this browser's localStorage**, not server-synchronized.
- **Encounter persistence:** switching editions preserves each edition's cards. Stored encounter state remains tied to the local browser.

## Known incomplete work

1. **2014:** extend verified monster library, spell library, multiattack/special-ability resolution, source citations, concentration/conditions and per-instance HP/resources.
2. **2024:** source-verified rules and cards — the current samples are not a complete edition.
3. **Earlier editions:** build separate rules adapters; do not silently reuse 5e critical-hit rules or roll math.
4. **Homebrew:** browser/device synchronization and richer structured spell effects do not exist. Export JSON backups before clearing browser data.
5. **UI:** Chromebook/tablet-specific viewport testing and real device QA are pending. The site's dice tray is **not** the separate site's 3D physics roller.
6. **Player display:** laptop-to-tablet real-time relay and secure DM/player separation not yet implemented.

## Tests

The current GitHub Pages site lives in root `index.html`, with `homebrew.js` and `homebrew.css`.

Run the current smoke/regression suite on Node 22:

```sh
node --check homebrew.js
node --test test-current.cjs
```

The GitHub Actions workflow `.github/workflows/ci.yml` runs these checks on push and pull requests. The former `test-safety.js` references a separate V2.1 `netlify-site` architecture that has **not been imported**, and is not used to certify this web preview.

## Architecture notes

The current preview still uses a large inline script and accumulated CSS in `index.html`; modularization and automated browser viewport testing are needed. The Homebrew schema and engine are deliberately limited to mechanics representable by the current UI. Do not represent catalog counts as numbers of fully implemented rules-complete cards.
