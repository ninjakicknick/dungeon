# Dungeon — The Crooked Crown

A crowned frog, a corridor of empty armor, an impossible drop, a luminous garden, and a very large sleeping face. A small illustrated dungeon to wander at human height. Five distinctive rooms form a loop; something else is tucked away.

[Play Dungeon](https://ninjakicknick.github.io/dungeon/)

Touch a passage in the picture to move. Pause beside the fountain or under the mushrooms. Look down from the bridge. There are things worth watching, not just things to click.

## Controls

- Mouse/touch: choose a doorway or object. **Hotspots** reveals available places if you need it.
- Keyboard: arrows/WASD choose spatially; Enter/Space acts; Escape/Backspace returns or turns. Tab also works. H: hotspots. M: map. Q: sound.
- Standard controller: left stick/D-pad chooses, A acts, B returns, Y shows hotspots, Start opens map, Back toggles sound.
- Sound is opt-in. Position, remembered paths, physical changes and preferences stay on this device.

The map records places you have visited and paths you have walked. It doesn't teleport, expose hidden-room names, or count discoveries. No monsters, combat, stats, loot tables, quests, or procedural generation yet.

## Development

```sh
npm ci
npm run dev
npm run build
npx playwright install chromium
npm run test:smoke
```

GitHub Pages builds and publishes `main`, retaining the `/dungeon/` base and versioned asset URLs. The browser smoke test can use an existing Chromium through `TEST_CHROME=/absolute/path/to/chrome`. Build checks run on pull requests. For a browser-only test run, serve the development app and open `/dungeon/tests/preview.html`; it tests in an iframe with isolated memory and includes phone-sized previews. The `terminal.local` dev host is allowed for supervised preview; it does not affect production hosting.

See [DESIGN.md](DESIGN.md) for design, connections and **discovery spoilers**, [art provenance](assets/wonder/PROVENANCE.md) for image briefs, and [the archived Underchapel design](docs/UNDERCHAPEL.md) for the previous prototype.

## Artwork and audio

Eleven new illustrated scene/state assets were created using image generation for this slice. Two return views and the downward shaft are dedicated compositions; close inspections reuse their parent artwork. Sounds are original browser-synthesized ambience and effects. No external art/audio services are called while playing.

The retained, unused pixel-art scenery is by **Clint Bellanger**, from the *First Person Dungeon Crawl Art Pack* / *Heroine Dusk*, licensed **CC-BY-SA 3.0 (or later)**. It is not the visual direction of this version.

Heroine Dusk: http://heroinedusk.com  
Clint Bellanger: http://clintbellanger.net
