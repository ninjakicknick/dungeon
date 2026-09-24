# The Underchapel

Build a place worth inhabiting before adding a game. Fixed illustration, physical routes, a light carried by the unseen visitor. Never randomize the exits of these rooms.

## Physical plan

The entrance is south of the gallery; the chapel is north. A crypt adjoins the chapel's east side. The cistern is one level below the eastern wing. A return stair climbs west to the entrance; a sloping watercourse provides a shorter passage from the gallery to the cistern.

| Space | Position / level | Connections | Recognition |
|---|---|---|---|
| Entrance | southwest, upper | Gallery north; return stair east/down | Headless saint holding a bowl; fallen leaves; iron rail |
| Gallery | west, upper | Entrance south; chapel north; watercourse east/down | Faded blue ceramic band; low barrel vault |
| Chapel | northwest, upper | Gallery south; crypt east | Bare altar, ruined benches, broken stone-backed rose |
| Crypt | northeast, upper | Chapel west; cistern south/down | Empty burial shelves; clay bowl; mineral-stained stair |
| Watercourse | middle, sloping | Gallery west/up; cistern east/down | Dry walking edge alongside runoff; dogleg around the foundation |
| Cistern | east, lower | Crypt north/up; watercourse west/up; return stair south | Broken column in water; perimeter ledge; high-water stain |
| Return stair | southeast, rising west | Cistern north; entrance west/up | Iron rail and the familiar saint visible above |

Main loop: entrance → gallery → chapel → crypt → cistern → return stair → entrance. Every route is traversable in either direction. The gallery–watercourse–cistern connection makes a smaller second loop.

## Viewpoint convention

A scene is a curated standing place, not a grid cell. Entering a room may include a small turn toward its landmark. The gallery, chapel, and crypt have dedicated reverse illustrations, not mirrored copies. Moving back from the cistern climbs into the crypt's west-facing view; returning from the chapel enters the gallery's south-facing view. The stair and watercourse have oblique compositions showing both ends.

Close views are deliberately cropped from the exact parent illustration. Their positioning is clamped to the image edges, so inspection cannot reveal empty borders. Returning restores the parent frame. They are pauses, not new rooms on the map.

The entrance/gallery/chapel share the blue band. Water and mineral streaks lead toward the lower level. The saint is visible from the return stair. The chapel is visible from the gallery and through the crypt doorway. Those continuities carry the geography; the optional map only records it.

## Presentation and state

- Warm light comes from near the camera; the building has no active wall torches.
- Subtle dust, lantern warmth, and cistern rings respect reduced motion and tab visibility.
- Wind and water are independent seam-blended beds, mixed and filtered per room. Water direction reverses when the visitor turns around. Occasional drops are irregular. Sound starts only after consent/interaction.
- A decoded image is ready before movement begins; navigation is locked during transitions. Load failure leaves the old scene usable and offers a retry through its hotspot.
- Save version `dungeon-underchapel-v1` stores position, visited rooms, noticed details, and preferences. Storage failure must not prevent play.
- No inventories, encounter placeholders, characters, stats, objectives, random doors, or completion percentages.

## Validation

The browser smoke route walks the large loop both ways, the watercourse both ways, close views, saved-location reload, map discovery, and mobile bounds. The build keeps GitHub Pages paths relative to `/dungeon/` through Vite asset imports.

Manual acceptance still matters: start at the saint, leave the map closed, wander for five minutes, then describe how to reach the crypt and return via the lower stair. A successful build alone cannot establish a sense of place.
