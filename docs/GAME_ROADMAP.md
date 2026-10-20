# Game roadmap

## Completed

- Shop/equipment outside-click dismissal; overlays pause gameplay and restore the prior pause state when closed.
- Translucent expanded map with zoom, click-outside close, and click-to-move destination selection.
- Direct start flow without skill selection; Q/E auto-use, R/F auto-use after shop unlock, no MP.
- Four lane-specific breakable walls with health feedback, route-following wave enemies, nearest-standing-wall fallback, and breach effects.
- Restart resets leftover click/touch movement targets.
- Shop weapon purchase verified to apply attack bonus and update equipped/disabled states.
- Live Pages workflow #55 succeeded; live checks verified paused shop close, zoom in to 125%, and outside-click map close.
- Automatic targeting now weights wave enemies threatening the Ancient Tree more heavily, while keeping elite and boss targets valuable.
- Tree danger warning now targets 60% tree health (previously 25%) to give earlier return-to-defense feedback.

## Active

- Continue live playtests beyond wave 2, including wave 3 and the every-fourth-wave boss.
- Verify map destination selection at narrow mobile widths and near world edges.
- Test jungle travel and camp combat during waves; assess travel/return timing and rewards.
- Observe ranged enemy behavior after walls break or enemies retarget; tune only after more runs.
- Test equipment pause restoration on Pages (local regression already covers it).
- Validate tree-threat target selection in a live wave before tuning its priority multiplier.
- Confirm the earlier tree danger warning fires once at the intended threshold in a live wave.

## Next

1. Improve the wave-to-jungle transition and camp rewards while keeping tree defense meaningful.
2. Assess a wall repair or defensive shop item after more wave data.
3. Improve upgrade variety and build synergies while keeping choices readable.
4. Re-check mobile layout, touch input, map interaction, and long-run performance.
5. Add a lightweight smoke-test harness if it fits the single-file architecture without adding dependencies.
