# Nine-edition implementation contract

Supported selectors: Original D&D 1974, B/X, AD&D 1e, AD&D 2e, D&D 3.0, D&D 3.5, D&D 4e, D&D 5e 2014, D&D 5e 2024.

**A selector does not imply that the complete edition's rules, monsters, spells or powers are implemented.**

## Fourth edition foundation (prepared locally in V2.2)
- d20 + attack bonus against an explicitly selected AC, Fortitude, Reflex or Will defense.
- On a natural 20, maximum normal damage **if the attack hits**. Additional critical dice and riders remain manual-only.
- No fifth-edition spell slot model: 4e powers require source-verified handling by power category and recharge.
- A custom training card only; no published 4e stat blocks copied.
- Healing surges, marks, action points, power effects and saving throw timing remain to implement.

## Release criteria
All nine editions require verified rules mechanics, independently licensed or user-supplied data, automated regression tests, offline tests and accessible mobile UI before any label of "complete."

## Current GitHub state
The local V2.2 ZIP contains application code and 13 passing safety tests. **The application source is not yet fully committed to GitHub.** CI correctly remains blocked until it is uploaded. Do not deploy or describe GitHub as release-ready.
