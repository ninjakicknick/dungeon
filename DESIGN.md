# Dungeon — The Crooked Crown

A wonderfully gamey dungeon, experienced at human height. Room identity takes precedence over architectural plausibility. The test is whether you have a favorite room and want to see through the next doorway.

## The new slice

This is a new five-room loop with a sixth, hidden branch. It is not the Underchapel's seven-room topology with renamed rooms. The old engineering provides decoded-image transitions, authored routes, close views, opt-in sound, and local memory. The earlier design is archived in `docs/UNDERCHAPEL.md`; its assets remain available in source history.

| Room | Landmark / palette | Physical connections | Ways to stay |
| --- | --- | --- | --- |
| Frog fountain | Crooked copper crown, jade frog, turquoise pool, terracotta | Armor left; garden right | Sit at the rim; touch water |
| Red watch | Oversized horned bronze armor, crimson, diamond floor | Fountain behind; bridge ahead | Approach a hollow helmet; listen |
| Long drop | Ivory bridge, violet shaft, improbable distant windows | Armor at near end; sleeping face beyond far landing | Approach parapet and look down; turn back from the far side |
| Lantern garden | Huge peach caps, mint glow, curled roots, lush moss | Fountain left; bell chamber up right | Sit beneath the gills |
| Sleeping face | Enormous stone face, hanging copper bell, saffron and red | Bridge left; garden right; mouth when open | Ring the bell; watch the stone change |
| A room for one | Velvet armchair, hot tea, lemon, small shaft window | Back through the stone lips | Sit and stay |

Loop: fountain → armor → bridge → sleeping face → garden → fountain. The bell room is reachable in either direction. Ringing opens or closes the mouth; the small sitting room is not an objective or a reward screen. It remains open across reloads. There is no way to close it from inside and strand the visitor.

## Presence

- Armor has a dedicated reverse illustration showing the frog. The far bridge landing has a separate return view framing the armor hall. A bridge crossing first advances to the far landing before entering the bell room.
- Oblique garden and fountain compositions show both connecting passages. The back-edge control in the bridge moves toward the doorway behind the viewer.
- Close viewpoints stay in their parent room on the map. Zooms are clamped to image edges. The shaft has original downward art.
- Decoded images load before movement. On failure, the previous scene stays interactive and a subsequent click retries. Navigation is locked while moving or changing the bell room.
- The pictures fill a stable 16:9 area. No inventory or dialog moves the scene. The map is a modal overlay; it neither teleports nor reveals unvisited names. Only traversed connections become solid paths. Short dotted stubs suggest visible unexplored exits; the secret branch has no stub.
- Hotspot marks are normally invisible, except the small back-edge arrow. Hover, keyboard/controller focus, and the optional Hotspots control reveal them. There are no ambient-event notifications.

## Unannounced life (spoilers)

- The nearest armor visor is raised for one of three 47-second world phases. It is empty. The change does not depend on clicking, so the player can see a different state on returning, or catch it moving. Forward and close viewpoints share the same aligned alternate image.
- Shaft windows brighten on staggered 79-second cycles. A small light traverses a deep section of the downward view during a roughly 21-second interval every 113 seconds. These clocks continue while other rooms are visited, using a persisted per-device phase seed.
- Garden spores drift, the caps breathe with light, and a broader light wave crosses them briefly every 97 seconds.
- Fountain rings spread from a touched point. A synthesized hollow bronze note receives a quieter response in the hall. Steam drifts above the teacup.
- Sound beds crossfade with position: flowing fountain, hollow bronze hall, open shaft wind, soft garden tones, deep bell-room resonance, a quiet sitting room. Bell partials and delayed stereo echoes give the mechanism weight. Sound is opt-in, reversible, and suspended in a hidden tab. No downloaded recordings.

These are tiny environmental behaviors, not encounters, collectibles, or a puzzle system. Timed motion pauses rendering in hidden tabs; reduced motion removes particles, steam, shaking and movement transitions. Slow world-state changes remain observable.

## Controls and memory

Mouse/touch uses the picture. Tab/Enter retains native button navigation. Arrows/WASD select spatially; Enter/Space activates; Escape/Backspace steps back or turns; H shows hotspots; M opens the map; Q toggles sound. Standard gamepad: D-pad/left stick selects, A activates, B backs out, Y shows hotspots, Start opens map, Back toggles sound. Axes have a dead zone and held-input repeat delay. All actions use the same buttons and transition guards.

`dungeon-wonder-v1` stores position, visited rooms, walked paths, small interaction memories, mouth state, a world-phase seed and preferences. The Underchapel save is left intact; only sound/hotspot preferences migrate. Unrecognized room names, malformed JSON, inherited object names and unavailable storage must not prevent entry. No accounts or backend.

## Validation

`npm run build` checks TypeScript and bundles the production app. `npm run test:smoke` covers both loop directions, every close view, opening/closing the mouth, the hidden branch and reload, map disclosure, keyboard and simulated gamepad input, timed visor state, mobile bounds, failed-image retry, malformed/blocked storage and audio activation. Actual controller hardware and subjective headphone/mobile audio quality remain manual checks.

Art briefs and state edits: `assets/wonder/PROVENANCE.md`. The current visual direction deliberately abandons the Underchapel's gray-blue archaeology, while keeping its scene-loading and exploration foundation.
