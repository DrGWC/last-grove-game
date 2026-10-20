# Game roadmap

## Completed

- Shop/equipment outside-click dismissal; overlays pause gameplay and restore the prior pause state when closed.
- Translucent expanded map with zoom, click-outside close, and click-to-move destination selection.
- Direct start flow without skill selection; Q/E auto-use, R/F auto-use after shop unlock, no MP.
- Four lane-specific breakable walls with health feedback, route-following wave enemies, nearest-standing-wall fallback, and breach effects.
- Restart resets leftover click/touch movement targets.
- Shop weapon purchase verified to apply attack bonus and update equipped/disabled states.
- Latest Live Pages workflow #62 succeeded; live checks verified paused shop close, map zoom and outside-click close, and the deployed E-skill return-to-defense guidance.
- Automatic targeting now weights wave enemies threatening the Ancient Tree more heavily, while keeping elite and boss targets valuable.
- Tree danger warning now targets 60% tree health (previously 25%); local pressure run confirmed the alert at 4,299/10,000 HP.

## Active

- Continue live playtests beyond wave 2, including wave 3 and the every-fourth-wave boss.
- Verify map destination selection at narrow mobile widths and near world edges.
- Test jungle travel and camp combat during waves; assess travel/return timing and rewards.
- Observe ranged enemy behavior after walls break or enemies retarget; tune only after more runs.
- Test equipment pause restoration on Pages (local regression already covers it).
- Validate tree-threat target selection in a live wave before tuning its priority multiplier.
- Test F after unlocking it in a live siege; only its Node boundary test has run so far.

## Next

1. Improve the wave-to-jungle transition and camp rewards while keeping tree defense meaningful.
2. Assess a wall repair or defensive shop item after more wave data.
3. Improve upgrade variety and build synergies while keeping choices readable.
4. Re-check mobile layout, touch input, map interaction, and long-run performance.
5. Add a lightweight smoke-test harness if it fits the single-file architecture without adding dependencies.

- Automatic E/F tree healing and shielding require the hero to be in the 1,200-unit defense area. Local pressure run confirmed E recovered the tree after the hero returned; see `docs/CODEX_CONTINUATION.md`.
