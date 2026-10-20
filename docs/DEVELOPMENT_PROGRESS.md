# Development progress

## 2026-10-20 — UI, automatic skills, wall defense, and live playtests

- Published shop/equipment outside-click dismissal, translucent expanded map, direct start without skill selection, automatic Q/E plus shop-unlocked R/F, and removal of MP.
- Added four breakable lane walls, per-side health feedback, route waypoint enemy movement, breach warning/effects, and nearest-standing-wall fallback for enemies far from a broken gate.
- Fixed restart retaining mouse/touch movement targets; fresh runs reset movement state.
- Added expanded-map click-to-move waypoint selection and a nearest-camp hint. Live and local checks moved the nearest-camp readout from 5.2 km to 4.2 km after selecting a destination.
- Fixed a pause-state bug: shop/equipment opened from an already paused run now restore the original pause state on close. Local checks covered both panel paths and active-game shop resume. Live shop regression verified the pause overlay remained after close and timer stayed at 0:02.
- Latest deployed source: `6c7ce5098cd8e6fd17721c02ec30fef9a8ef0b89` (`Warn earlier when the ancient tree is under pressure`); Pages run `39474860822` (#60) succeeded.
- Live second-wave run: wave 1 ended at 2:02 with 4 kills and tree at 10,000 HP. North/south walls broke by 1:36; all four walls were down by 3:28. The tree briefly fell to 9,693 and automatic E healed it to 10,000 by 4:02. Wave 2 ended with 9 kills.
- Live shop check: 藤木法杖 cost 18 from 40 gold, equipped successfully, and raised attack from 1 to 2; unaffordable replacements were disabled.
- Map controls live check: zoom button changed 100% to 125%; clicking outside closed the map. Prior live waypoint check confirmed click-to-move.
- Added a combat targeting weight for non-jungle enemies within 450 world units of the tree, so urgent tree threats can outrank an equally close ordinary target. Elite and boss multipliers remain. The score logic passed numeric tests; live target acquisition itself has not been directly observed.
- Changed the tree-danger warning from a late 25% threshold to a once-per-run 60% max-HP threshold; the message asks players to return and clear nearby enemies. Numeric boundary checks passed.
- Candidate deployment playtest: wave 1 cleared at 1:59 with 4 kills, tree full, and both north/south walls broken. Bought 藤木法杖 for 18 of 40 gold; attack rose to 2. During wave 2, a map waypoint trip left the tree exposed; all walls fell and tree HP reached 3,958/10,000 by 3:59, while the hero stayed at 100 HP and kills reached 9. The existing 25% warning did not fire in time; this exposed a need for an earlier, one-time return-to-defense warning at 60%. The run survived into 66 seconds of wave-2 preparation.
- Latest build live run: wave 1 cleared at 2:00 with 4 kills; staff purchase raised attack to 2. While moving toward the east lane, wave 2 reached 8 kills by 5:59, all walls were broken, the tree remained at 10,000, and the hero had 132/140 HP. The 60% warning did not trigger because tree HP never crossed the threshold; the new warning's live visual behavior remains unverified.

### Validation

- Inline game script Node `--check`: passed after map change.
- `git diff --check`: passed for source and current documentation edits.
- Browser checks showed no visible runtime error; browser console log access was unavailable.
- No package manifest or pre-existing automated test suite is present.

### Observations and tuning

- Latest live run cleared the first two waves while stationary after the starter weapon purchase, but all walls fell by wave 2 end; automatic E kept the tree healthy. Wall repair/defense upgrades may help but need more samples before tuning.
- An earlier run without early gear failed at 5:34 while the hero was away from the tree. Re-test exploration with early gear before changing travel or tree damage.
- Breach alerts appeared in the accessibility tree; visual prominence at narrow mobile widths remains unverified.

## Time accounting

- At the start of this cycle the active goal timer showed about 55 minutes elapsed across the thread, including conversation and wait time.
- This cycle has accumulated about 22 minutes of focused implementation and verification (estimate; waiting for game time is excluded). The 10-hour mission is not complete; count active work separately from idle time.

## 2026-10-21 — Keep tree-defense skills local to the defense

- A pressure run exposed a strategic flaw: automatic E restored the Ancient Tree from anywhere, and the F shield could also cover the tree globally. This let the player remain away while the core skills silently handled defense.
- E and F now require the hero to be within 1,200 world units of the Ancient Tree, both in their automatic trigger and at skill-cast entry. Their ready-state label says `回防自动`, with hover text explaining the defense-range requirement.
- Added three dependency-free Node regression tests: E/F trigger at the 1,200-unit boundary during a siege, do not trigger at 1,201 units even with a damaged tree and nearby threats, and stay idle when there is no siege or tree damage. All 3 passed. Inline script syntax check and `git diff --check` passed.
- Browser local run verified the new skill labels and hover descriptions. A prior local pressure sample before this change showed tree health recovering globally while the hero was away; the new anti-global-heal behavior has not yet been observed in a full multi-wave browser run.
- The 60% warning still awaits a live visual trigger; the most recent run recovered above the threshold before reaching it.
- Prior GitHub Pages deployment #61 for `11f2516` completed successfully. This code change is not deployed yet.

### Active time estimate

- Add about 7 minutes of focused code and verification this cycle, plus 2 minutes 45 seconds of deliberate play observation. Idle time is not counted. The 10-hour mission remains active and incomplete.
