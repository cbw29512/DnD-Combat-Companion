# Combat Companion Architecture

## Objective
Offline-first D&D combat companion with independent rules for ODND, BX, ADND1, ADND2, 3.0, 3.5, 2014 and 2024.

## Data schema before logic
Every monster and spell is edition tagged. Imported monsters store identity, display stats, attacks, and source/license/provenance. Rolls are enabled only when all inputs are validated and conversion is unambiguous.

## State
Player and DM result history and effects are separated in local browser state. Export/import is a manual backup; browser storage is not a permanent guarantee.

## Components
- netlify-site/validation.js: rejects invalid and expensive dice/attack definitions
- netlify-site/engine.js: deterministic-compatible dice and spell rolls
- netlify-site/catalog.js: vetted built-in cards
- netlify-site/app.js: UI, local persistence, import/export
- netlify-site/sw.js: offline asset cache
- test-safety.js: engine and validation regression gates

## Hard rules
Never silently assign 5e mechanics to older editions. Never auto-roll an unparsed multiattack or ambiguous damage rider. Preserve provenance and attribution. Split files exceeding 150 lines during continued development. Maintain error logging and recoverable import failures.
