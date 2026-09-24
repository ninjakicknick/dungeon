# Dungeon — The Underchapel

A small authored place to wander, built from fixed illustrated viewpoints. Seven connected spaces, a complete return loop, a wet shortcut, and quiet places to look closer. No monsters, combat, loot, objectives, or procedural rooms.

**Play:** tap the passages in the picture. Small circles mark places to look closer. Turn around in the gallery, chapel, and crypt; step back from close views. `Tab` and `Enter` operate every hotspot; `Escape` steps back or turns around. `H` toggles hotspot labels. Sound is opt-in. Position, discoveries, and preferences stay on this device.

The map is a secondary record of visited places. It does not teleport you, reveal unseen rooms, or give you a checklist.

## Development

```sh
npm ci
npm run dev
npm run build
npm run test:smoke
```

The smoke test needs Playwright Chromium (`npx playwright install chromium`). CI installs it automatically. GitHub Pages still builds and publishes on merge to `main`, with Vite's `/dungeon/` base. The production build bundles only the new referenced artwork; the older assets remain in source for attribution/history.

See [DESIGN.md](DESIGN.md) for the physical layout and [the art provenance](assets/underchapel/PROVENANCE.md) for generation briefs.

## Earlier artwork credits

The retained, unused pixel-art dungeon scenery is by **Clint Bellanger**, from the *First Person Dungeon Crawl Art Pack* / *Heroine Dusk*, licensed **CC-BY-SA 3.0 (or later)**. It is not the visual reference for this version.

Heroine Dusk: http://heroinedusk.com  
Clint Bellanger: http://clintbellanger.net

The atmospheric prototype reference is `assets/room-scenes/dungeon01.png`. New underchapel images were generated specifically for this slice from that reference. Ambient sound is synthesized by the application, with no third-party recordings.
