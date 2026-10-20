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
- E and F now require the hero to be within 1,200 world units of the Ancient Tree, both in their automatic trigger and at skill-cast entry. Their ready-state label says `回防自动`, with hover text explaining the defense-range requirement. The tree warning is moving from a 60% short toast to a 75% threshold with a persistent arena badge.
- Added three dependency-free Node regression tests: E/F trigger at the 1,200-unit boundary during a siege, do not trigger at 1,201 units even with a damaged tree and nearby threats, and stay idle when there is no siege or tree damage. All 3 passed. Inline script syntax check and `git diff --check` passed.
- Local browser confirmed the new skill labels and hover descriptions. A follow-up pressure run directly displayed the 60% warning at 4,299/10,000 tree HP while the hero was away. After routing back to the tree, HP rose from 2,383 at 5:51 to 3,134 at 5:56 and E showed cooldown, consistent with its recovery activating in defense range. F range remains unverified in a live unlock-and-siege scenario.
- GitHub Pages workflow #62 for `de6f661` completed successfully. A fresh online page loaded the `回防自动` status and E-skill hover guidance; the original paused test run was kept intact.

### Active time estimate

- Add about 11 minutes of focused code, regression, and deployment checks across this cycle, plus roughly 3 minutes 45 seconds of deliberate game observation. Idle time is not counted. The 10-hour mission remains active and incomplete.


## 2026-10-21 — Verify the warning and return heal under pressure

- Continued the local away-from-base run through 6:00. The tree warning appeared at 4,299/10,000 HP at 5:19 with the hero away and all four walls broken.
- Selected the Ancient Tree waypoint and returned. Tree health moved from 2,383 at 5:51 to 3,134 at 5:56; E showed cooldown, matching its 800-point cast after re-entering the 1,200-unit range. Choosing the Ancient Tree Breath level-up then raised it to 5,134.
- The wave entered its preparation countdown after remaining wave enemies were cleared. Hero stayed at 100/100 HP. The run was paused at 6:00.
- The new skill-range change is deployed as code commit `de6f661`; deployment workflow #62 succeeded. Docs synchronization #64 (`6ff0c9f`) also succeeded. Fresh online build displayed the new return-to-defense E guidance and was paused at 1:17 for the user.
- This adds about 5 minutes of focused verification and 3 minutes 50 seconds of deliberate local browser play after the previous checkpoint. F's live unlock test and direct auto-target selection observation remain pending. The 60% warning live trigger and an E heal on return are now confirmed.

- Documentation follow-up: the 60% danger warning triggered in the local away-from-tree run, and E recovered the Ancient Tree after the return waypoint. Pages workflow #62 contains the deployed code; documentation workflow #64 completed successfully.


## 2026-10-21 — Keep the return warning visible

- The local run with the 60% one-shot warning ended at 2:16 with the tree at 479 HP. A follow-up run with the persistent badge and 75% threshold displayed `古树受袭 · 立即回防` at 1,808 HP around 2:09; the tree still fell shortly after. The sampling gap was about a minute, so the exact response window is unknown.
- Added a compact, high-contrast pinned banner while tree HP is at or below 75%; it disappears after recovery above that mark and is hidden on game over/restart. The first-crossing toast remains for immediate emphasis.
- Four Node tests passed, including 75% threshold boundary. Inline script syntax and `git diff --check` passed. Screenshot review confirmed the persistent banner is centered at the arena top and remains readable alongside the map and pause controls.
- Code commit `72c3378` and Pages workflow #66 deployed the 75% banner. Fresh online smoke page confirmed the banner is hidden at full tree health and E hover guidance is present; run paused at 0:03. The online warning trigger itself still needs validation. Measure warning-to-failure with shorter intervals and test whether a return waypoint saves the tree before tuning again.
- Adds about 5 minutes focused implementation and verification and about 2 minutes deliberate pressure-test observation for this sub-cycle. The latest cycle total is roughly 30 focused minutes and 15m30s of game observation.

## 2026-10-21 — Earlier away alert and return-safe banner

- Published `0b7aa36` (#68) uses 90% tree HP warning while the hero is farther than 1,200 units, and 75% when nearby. Five Node tests pass for E/F locality, threshold boundaries, and alert latching.
- The online run showed wave 1 clearing at 1:44 with tree full (4 kills), then wave 2 reaching 5 kills and tree still full at 3:04. The hero had taken damage and later fired E, indicating it returned/respawned near the tree; this run does not isolate the away threshold.
- A prior live pressure run displayed the alert by 1:50 at 7,163/10,000 HP after all walls broke. We missed the exact threshold crossing and did not measure a successful retreat, so the 90% live-away trigger and save window remain open questions.
- Shop live review confirmed weapon/gear, potion, and skill-book tabs are distinct. Buying 藤木法杖 from 32 gold left 14, changed attack from 1 to 2, and marked the slot equipped; insufficient purchases were disabled. Potion stock correctly showed 已满; Q/E showed 已掌握 in skill books.
- Found a UI-state edge case: because the danger threshold lowers from 90% to 75% when the hero returns, the alert could disappear at (for example) 80% without any recovery. Added a warning latch that persists until the tree heals above 90%; the five-test suite verifies it.
- The latch change is currently local and uncommitted in this checkpoint. Publish after final validation, then verify the badge remains visible through the range change and clears only after recovery.

## 2026-10-21 — Move the warning ahead of tree damage

- The 90% HP warning did not give a safe return window in the live wave-2 pressure run: by 3:40 tree HP was 4,408/10,000 with the badge visible; defeat occurred at 3:50 before the map return completed. The sample missed the moment the tree first took damage, so the exact time gained by 90% cannot be stated.
- Added a pre-breach candidate: while the hero is outside 1,200 units, warn if a non-jungle enemy enters 2,500 units from the tree. Keep the existing 90% away / 75% nearby HP fallbacks. Badge clears once the hero is back in range, tree exceeds 90% HP, and nearby wave threats are gone.
- Expanded `tests/tree-defense-skills.test.js` to six cases including approaching wave enemies, jungle exclusion, the 2,500-unit boundary, HP fallback thresholds, and return latch behavior. All six pass; inline JS syntax and whitespace checks pass. Candidate awaits publishing/live timing validation.

## 2026-10-21 — Live-verified pre-breach warning and gear slots

- Deployed commit `973f0b4` in Pages run #70. Six tests pass for E/F locality, enemy-proximity warning, HP fallbacks, jungle exclusion, and return latch. Inline script syntax and diff whitespace checks pass.
- Online wave-1 test: at 0:20, the warning appeared while Ancient Tree was 10,000/10,000, all four walls were 100%, and hero was away near the northwest camp. I selected the tree marker as a map waypoint; by 0:31 the hero was back near the northeast defense/camp point, tree still full, and the warning badge had cleared. Wave 1 later remained stable at full tree HP. This demonstrates the early warning and a successful first-wave return, not later-wave safety.
- Live purchase regression: staff applied its attack bonus; footwear applied +30 movement speed (205→235) and occupied the single shoes slot. Character equipment panel reflected weapon, shirt, shoes, and derived stats correctly.
- The previous wave-2 run had shown tree at 4,408/10,000 at 3:40 and defeat by 3:50, with too coarse sampling to see the exact damage start. This establishes urgency, not an exact response-time benchmark. Test the new trigger in wave 2 and later before tuning its 2,500-unit radius.

- Post-deployment online check: at 0:20 in wave 1, badge/toast appeared while tree remained full and all walls were intact; hero was at a distant camp. A waypoint return brought the hero back by 0:31; badge cleared and the tree remained at 10,000 through wave-1 clear at 1:45. The user-facing wording was adjusted to “古树防线告急” because the early signal is an approaching threat, not tree damage already underway.
