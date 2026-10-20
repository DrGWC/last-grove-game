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
- Tree danger warning is being moved earlier: if a wave enemy comes within 4,000 world units while the hero is away, show the persistent return warning; retain 90%/75% HP fallback thresholds. A wave-1 away run verified an early warning and successful return. Wave 2 showed the 2,500-unit warning still leaves too little return time; 2,500 fired too late in wave 2 and 5,000 fired over 100 seconds before wave-1 tree damage; a 4,000 candidate needs a live timing check. Tree resin and E recovered the run after it fell to 2,886 HP.

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

- Automatic E/F tree healing and shielding require the hero to be in the 1,200-unit defense area. The return warning should use enemy proximity plus HP fallbacks and persist until safe; alert-to-failure timing and live return success still need measurement.
