# DM-first combat assistance — locked behavior

## Purpose
This app is a tabletop combat aid, **not an automated DM**. The DM makes every adjudication decision, including whether a monster's attack hits, which player is targeted, and how much rolled damage is applied.

## Encounter state
- Add a monster from the edition-specific catalog with one action; add another copy with a visible **+** control.
- Remove one monster instance with an obvious **Remove** control (confirm only if accidental loss of tracked state is plausible).
- Allow adding/removing monsters during an active encounter without restarting or resetting other monsters.
- Each added monster has its own instance ID, nickname/index, HP, initiative, conditions, limited-use abilities, and action history.
- Selecting a monster shows that monster's available actions and **Attack** control.

## Attack interaction
- Clicking **Attack** rolls the chosen monster's complete, rules-correct attack routine where fully modeled, showing every individual to-hit roll and associated damage roll, clearly paired together.
- Show all available alternative attacks/abilities with separate controls; do not fire mutually exclusive attacks simultaneously or spend unchosen abilities.
- Multiattack resolves its specified sequence in one click, with separate attack/damage results. If an ability requires a hit before its damage/effect, pre-roll damage may be displayed as *potential damage* and only the DM decides whether to apply it.
- The app MUST NOT automatically mark hit/miss, subtract player HP, choose a player target, or apply damage to a player's sheet.
- DM may optionally mark an attack hit/miss, assign a target, and log applied damage; those are manual actions, never requirements to get an attack roll.
- On saves, display printed DC and save type; DM asks player for success/failure and decides the result. For player attacks monsters, DM adjudicates versus monster AC/defense and saving throws.
- Clear **Back** navigation keeps current encounter state intact.
- Dice use Web Crypto with unbiased integer sampling in secure contexts, never an insecure production fallback.

## Example acceptance test
Add Goblin #1, tap + to add Goblin #2, add Ogre, remove Goblin #1 during combat. Select Ogre > Attack. UI displays each attack's to-hit and potential damage separately. No player HP changed, no target auto-selected and no automated hit determination. Switching back to Goblin #2 retains its own HP/conditions/resources.
