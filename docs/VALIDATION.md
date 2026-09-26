# Crooked Crown verification — 2026-09-26

## Passed

- TypeScript and production Vite build.
- Real-browser manual walk: fountain/water, armor/helmet, bridge/downward shaft, far landing/reverse view, bell mechanism, hidden sitting room, reload, garden/root seat, full reverse loop, map and audio opt-in.
- The isolated real-browser regression runner (`tests/preview.html`) reported **PASS — all exploration checks**:
  - full loop in both directions and every close view;
  - bell opening/closing, gated route, physical art change and reload persistence;
  - initial map disclosure and six remembered connections after walking them;
  - spatial keyboard selection, Escape, and simulated standard gamepad D-pad/A/B/Start using actual frame polling;
  - timed raised and lowered visor states with no event message;
  - 390×844, 844×390 and 320×568 layouts, no horizontal overflow and hotspots within the scene;
  - invalid saved room values recover safely;
  - injected image failure retains the current scene and retries successfully;
  - blocked storage still allows exploration;
  - no application runtime errors.
- Inspected full-size source art, alternate states, and rendered desktop/close viewpoints. Review screenshot: `crooked-crown-preview.jpg`.

## Limits

The environment could not launch local Chromium because it restricts the required sockets. The regression checks were therefore run in the supported cloud browser against the supervised Vite preview. `tests/runtime-smoke.mjs` preserves equivalent Playwright coverage for GitHub CI and ordinary development machines; that CLI suite was not completed locally.

Controller input was simulated through the standard Gamepad API. Physical controller hardware, phone audio policy and subjective headphone sound quality still need hardware checks. This is an exploration slice, not evidence that the game is ready for combat or progression systems.
