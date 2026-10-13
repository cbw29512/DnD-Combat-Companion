# Flip-card interface — definitive UI contract

The interface MUST consist of premium fantasy flip cards, not generic text panels or form-driven dashboards. Artwork is the front; flip reveals clear combat rules and results. Cards are responsive for desktop and phone.

## Monster card
- Edition and edition-appropriate CR/level filter identifies the monster card.
- Each encounter instance receives its own card, state, and easy + duplicate / remove controls.
- Prominent ATTACK button rolls the complete chosen attack routine with individually paired to-hit and potential damage for each strike. An action chooser is used only when the monster has mutually exclusive routines or special actions.
- Results animate onto the card; flip for details and rules.
- DM adjudicates hits, targets, saves and applied damage. Do not deduct player HP.

## Spell card
- Edition filter and searchable spell dropdown yield the spell's artwork card.
- Show casting level dropdown *only* if the spell has a legitimate upcast mechanism for its edition; default base level.
- Prominent CAST button uses secure unbiased crypto dice and displays damage/attack/save information or non-damage effects on the card with a flip animation.
- DM chooses targets and resolves outcomes.

## Condition cards
- Debuff, buff and damage-type entries display edition-appropriate explanation on flip.

## Acceptance
Demonstrate flipping, one-click attack/cast, multi-monster cards, mobile responsive layout and secure RNG. Never claim complete nine-edition content when only examples are installed. Source and tests must be committed and browser-tested prior to final release.
