# dungeon

A deliberately small first-person dungeon crawler inspired by tabletop solo dungeon games and late-'80s/early-'90s grid crawlers.

The native game view is **160×120**. The dungeon is a 2D grid rendered through pre-drawn perspective artwork; it is not a 3D game.

## v0.0.1 — Walk the Dungeon

The first milestone is intentionally tiny: walk a hand-authored dungeon, turn in 90° increments, collide with walls, and render the view from fixed perspective scenery.

**Controls:** W / ↑ forward · S / ↓ backward · A / ← turn left · D / → turn right. Touch controls appear below the viewport.

## Art credits and license

Dungeon scenery artwork by **Clint Bellanger**, from the *First Person Dungeon Crawl Art Pack* / *Heroine Dusk* artwork.

The visual art is licensed **CC-BY-SA 3.0 (or later)**. Clint Bellanger's name is included here to satisfy the attribution requirement.

Heroine Dusk: http://heroinedusk.com  
Clint Bellanger: http://clintbellanger.net

## Development

```bash
npm install
npm run dev
```

Production build: `npm run build`.
