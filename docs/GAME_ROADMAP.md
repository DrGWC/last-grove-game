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
- Tree danger warning uses a 4,000-unit approach threshold while the hero is away and retains 90%/75% HP fallbacks. Live wave-1 sampling saw the warning by 0:33 when the north wall was at 34%; both north and south walls were broken by 1:00, with tree health still full. The sample did not include a return order, so its response value remains unproven. Earlier 2,500-unit warning was too late in wave 2; compare warning-to-wall-breach timing before further radius tuning.
- Published `4926efc` improves auto-targeting of wave enemies actively attacking their assigned standing wall (0.55 score multiplier inside 260 units), stacking with the existing near-tree multiplier. The bonus stops when the wall breaks. Automated numeric tests pass; live target-acquisition verification is pending.
- Published `4926efc` suppresses the “return home” banner while a wave enemy is already within the hero's auto-attack range plus 100 units; an active interception clears the latch only if tree HP is above 90%. Twelve automated tests pass. Verify banner behavior during live combat.
- Live follow-up through wave 2 verified the camp risk/reward loop: one camp cleared (8 → 7), gold 38 → 56, XP 10% → 50%, while hero HP fell to 20/100. Two 8-gold potions and two 12-gold tree resins restored hero/tree to full; 16 gold remained. Wave 2 was cleared at ~3,531 tree HP before blessing/E recovery.
- Live gear check confirmed staff attack 1 → 2 for 18 gold and boots movement speed 235 → 265 for 16 gold. In this sample, remaining wall integrity delayed pressure; once walls were all broken with the hero away, tree damage accelerated sharply.

## Active

- Continue live playtests beyond wave 2, including wave 3 and the every-fourth-wave boss.
- Verify map destination selection at narrow mobile widths and near world edges.
- Test jungle travel and camp combat during active waves; intermission camp timing/rewards are verified once, but safe return timing and mobile targeting remain unverified.
- Observe ranged enemy behavior after walls break or enemies retarget; tune only after more runs.
- Test equipment pause restoration on Pages (local regression already covers it).
- Validate wall-threat target selection in a live wave before tuning its priority multiplier.
- Recheck return-banner prominence when it overlaps wave announcements; verify the active-intercept suppression and low-tree persistence in a competing-target scenario.
- Test F after unlocking it in a live siege; only its Node boundary test has run so far.

## Next

1. Improve the wave-to-jungle transition and camp rewards while keeping tree defense meaningful.
2. Assess a wall repair or defensive shop item after more wave data.
3. Improve upgrade variety and build synergies while keeping choices readable.
4. Re-check mobile layout, touch input, map interaction, and long-run performance.
5. Add a lightweight smoke-test harness if it fits the single-file architecture without adding dependencies.

- Automatic E/F tree healing and shielding require the hero to be in the 1,200-unit defense area. The return warning should use enemy proximity plus HP fallbacks and persist until safe; alert-to-failure timing and live return success still need measurement.
