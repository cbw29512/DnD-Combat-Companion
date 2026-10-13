# Laptop controller and tablet display contract

## Objective
The Combat Companion website must support a two-device workflow. The laptop is the DM's private control center. The ChromeOS tablet (or other device) is a remotely controlled display. The laptop shows a real-time preview of exactly what the tablet sees.

## Data schema and state
- Session: sessionId, version, edition, connection status.
- DMState (private): current encounter roster, monster HP/resources, selected source card, action selection, unpublished rules, private dice results, and DM notes.
- DisplayState (shared): current card identity, card face, explicitly published rules/results, optional public roll effect and critical/fumble flash sequence number.
- Command: sessionId, sequence number, kind (show-card, flip-card, clear, publish-roll, flash, etc.), payload, originating controller.
- Connection: authenticated pairing/short-lived permission and reconnect metadata; never expose DMState via public display commands.

## Behavior
1. Laptop browser can add/remove/select monsters, cast spells, and operate all existing DM controls.
2. A separate tablet display browser receives only DM-authorized cards and roll results in real time.
3. Laptop embeds a live mirror of the tablet display without moving browser windows.
4. Critical natural 20 flashes green and natural 1 flashes red on the relevant display when a roll is published.
5. Browser links may have different roles; random website visitors must not control a session.
6. Pair devices intentionally; reconnect safely and do not disclose hidden DM information.
7. Local dice rolling uses Web Crypto unbiased sampling, and the DM continues to adjudicate hits/targets/saves/damage.
8. Target should function between laptop and ChromeOS tablet on the same Wi-Fi; offline-only mode requires an explicitly designed local transport (ordinary GitHub Pages cannot act as a realtime relay or LAN server).
9. Keep responsive touch-first monster/spell flip cards and quick attack/cast buttons. The tablet may optionally operate in standalone mode without laptop connection.

## Implementation boundary
This document is an accepted requirement, **not a claim that live synchronization or local relay is implemented**. Decide the real-time transport and offline constraints before coding synchronization.
