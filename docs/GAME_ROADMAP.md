# Game roadmap

## Completed

- Outside-click dismissal for shop and equipment overlays.
- Translucent expanded map with zoom controls and click-outside close.
- Direct start flow without a skill-selection gate; Q/E auto-use, R/F auto-use after shop unlock, no MP.
- Four lane-specific breakable wall sections with per-side health feedback.
- Wave enemies follow route waypoints and retarget the nearest standing wall when their assigned wall is broken before they reach its breach.
- Four-lane wave routes, jungle camps, shop equipment slots, and nearest-camp HUD compass.

## Active

- Deploy and verify the latest route-following and fallback-wall behavior on GitHub Pages.
- Observe the first two waves with the new wall behavior; tune wall durability, wall damage, and automatic-skill triggers only from additional play evidence.
- Check narrow-screen/mobile layout and input after the new wall HUD.

## Next

1. Improve the wave-to-jungle transition and camp rewards while keeping the tree defense meaningful.
2. Verify ranged enemies and shots when their wall breaks or when they retarget a new one.
3. Improve upgrade variety and build synergies while keeping level-up choices readable.
4. Add clear wall-breach alerts and lightweight damage feedback.
5. Re-check mobile layout, input, and long-run performance.
6. Add a lightweight smoke-test harness if it fits the single-file architecture without adding a dependency.
