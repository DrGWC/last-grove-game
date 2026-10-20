# Game roadmap

## Completed

- Outside-click dismissal for shop and equipment overlays.
- Translucent expanded map with zoom controls and click-outside close.
- Direct start flow without a skill-selection gate; Q/E auto-use, R/F auto-use after shop unlock, no MP.
- Four lane-specific breakable wall sections with per-side health feedback.
- Wave enemies follow route waypoints and retarget the nearest standing wall when their assigned wall is broken before they reach its breach.
- One-time wall breach toast/particles; game restart clears leftover click and touch movement state.
- Shop weapon purchase verified: attack bonus applies and the equipped/disabled replacement states update correctly.
- Expanded map tap/click sets a movement destination and closes the map; clicking blank space closes without selecting a new destination.
- Shop and equipment panels preserve whether the run was paused before they opened.

## Active

- Commit and deploy the latest pause-state fix for shop/equipment; verify both paused and active close paths on Pages.
- Continue live playtests beyond wave 2, including wave 3 and the every-fourth-wave boss encounter.
- Verify map destination selection at narrow mobile widths, different zoom levels, and near world edges.
- Test jungle travel and camp combat while waves are active; determine whether travel distance, return timing, and rewards support the intended loop.
- Observe ranged enemy projectiles after a wall breaks or enemies retarget; tune walls/skills only after more runs.

## Next

1. Improve the wave-to-jungle transition and camp rewards while keeping tree defense meaningful.
2. Assess a wall repair or defensive shop item after enough wave data exists.
3. Improve upgrade variety and build synergies while keeping level-up choices readable.
4. Re-check mobile layout, touch input, map interaction, and long-run performance.
5. Add a lightweight smoke-test harness if it fits the single-file architecture without a dependency.
