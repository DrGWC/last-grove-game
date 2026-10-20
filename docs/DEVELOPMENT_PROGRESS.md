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

## 2026-10-21 — Wall attacker target priority and 4,000-unit warning sample

- Online at `?v=100ca96-radius4000`, wave 1 showed the persistent danger banner by 0:33 while tree HP was 10,000/10,000, hero HP 94/100, and north wall 34%. At 1:00, north and south walls were broken but tree HP remained full. The hero was away during the sample; no return waypoint was issued, so the response window remains unmeasured.
- This showed that wall pressure is the useful early-playtest signal: the previous “over 100 seconds early” judgment used first tree damage, even though gates take damage much earlier. Future warning comparisons must record warning onset, wall HP, wall breach, and player distance together.
- Added local active-wall target priority: wave enemies within 260 units of their assigned wall receive a 0.55 score multiplier, stacking with the existing 0.65 multiplier for enemies within 450 units of the tree. Jungle creatures do not get either defensive weight.
- Added dependency-free target-score regression cases, including broken-wall exclusion. Combined `node --test tests/*.test.js`: 12 passed; inline script parse and `git diff --check` passed. Live target selection and balance remain to be verified before publishing this local change.
- The wall-targeting and coverage-aware alert change was published in commit `4926efc`; Pages workflow #74 succeeded. A cache-busted live page loaded the new targeting helpers and started normally.
- Local browser playtest: guarding the north wall through wave 1 ended at 0:31 with 4 kills and 98% north-wall HP. By 1:31 in wave 2, the hero was on the east lane with 6 kills; east wall, tree, and hero HP were all full. This sample does not isolate the effect of the targeting multiplier.
- Found a false-positive UX case during that run: the “立即回防” banner remained on while the hero was within auto-attack range of east-lane enemies. Added a coverage check so the alert is suppressed/cleared during an active intercept when tree HP is above 90%; it still remains for low tree HP. Added matching tests; 12 passed. The alert refinement itself has not yet been browser-verified.
- The online follow-up confirms the deployed source includes `activeWallDistance` and `hasHeroDefenseTarget`; the initial live HUD showed all four walls at 100%, tree at 10,000 HP, and a fresh wave ready. Browser console logs were unavailable. Live selection of a competing target and the alert-suppression case still need an observed scenario.

## 2026-10-21 — Live wave-2 return and jungle economy check

- Continued the deployed `?v=4926efc-wall-defense` run from 1:42 through the wave-2 break and first camp. Wave 1 cleared at the end of this sample with tree at 10,000, all walls except east broken (east at 12%), 4 kills, and 40 gold. The wave-1 bonus and kill/camp rewards leave meaningful preparation purchases.
- Bought 藤木法杖 (18 gold): attack changed 1 → 2. Bought 疾风短靴 (16 gold): move speed changed 235 → 265. Shop displayed the weapon as equipped, disabled unaffordable replacements, and left 6 gold.
- The east-side wave-2 defense kept its wall at 12% for the first sampled 17 seconds while the hero stayed at the gate. After the hero left to pursue red enemy markers, east wall fell to 0%; by 5:31, the tree was at 5,716/10,000. This shows wall pressure alone does not finish the wave, but a broken wall plus distant hero creates a short, sharp core-damage window.
- Wave 2 cleared at 5:45 with the tree around 3,531/10,000, hero at 100/100, 9 kills, and all four walls broken. A level-2 blessing restored 2,000 tree HP; automatic E added further healing while back near the tree.
- Sent the hero to the northeast camp during the 75-second intermission. The camp count changed 8 → 7, gold rose 38 → 56, experience advanced 10% → 50%, and the hero was reduced to 20/100 HP. This directly verifies the intended wave → jungle risk/reward loop.
- In the separate pause-safe shop check, two life potions (8 each) and two tree resins (12 each) were bought. On closing the shop, HUD confirmed hero 100/100 and tree 10,000/10,000; 16 gold remained. Purchase state was applied immediately, while the paused HUD refreshed on resume.
- Browser screenshots confirmed the active game and overlays visually. Full suite re-run: `node --test tests/*.test.js` — 12 passed. `git diff --check` passed. No source code changed in this playtest iteration; browser console logs remain unavailable.
- Observed UX issue to investigate: the persistent return warning appears while the hero is at an outer gate with no enemy in auto-attack range. It may be accurate when attackers have passed the broken gate, but the badge can overlap wave notices; review visual priority and alert wording before changing trigger behavior.

### Active time estimate

- This follow-up used roughly 6 minutes of focused live play, observation, and validation; game-time waits were brief and are not counted as active development time. The 10-hour mission remains incomplete.

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
- Added a pre-breach candidate: while the hero is outside 1,200 units, warn if a non-jungle enemy enters 4,000 units from the tree. Keep the existing 90% away / 75% nearby HP fallbacks. Badge clears once the hero is back in range, tree exceeds 90% HP, and nearby wave threats are gone.
- Expanded `tests/tree-defense-skills.test.js` to six cases including approaching wave enemies, jungle exclusion, the 4,000-unit boundary, HP fallback thresholds, and return latch behavior. All six pass; inline JS syntax and whitespace checks pass. Candidate awaits publishing/live timing validation.

## 2026-10-21 — Live-verified pre-breach warning and gear slots

- Deployed commit `973f0b4` in Pages run #70. Six tests pass for E/F locality, enemy-proximity warning, HP fallbacks, jungle exclusion, and return latch. Inline script syntax and diff whitespace checks pass.
- Online wave-1 test: at 0:20, the warning appeared while Ancient Tree was 10,000/10,000, all four walls were 100%, and hero was away near the northwest camp. I selected the tree marker as a map waypoint; by 0:31 the hero was back near the northeast defense/camp point, tree still full, and the warning badge had cleared. Wave 1 later remained stable at full tree HP. This demonstrates the early warning and a successful first-wave return, not later-wave safety.
- Live purchase regression: staff applied its attack bonus; footwear applied +30 movement speed (205→235) and occupied the single shoes slot. Character equipment panel reflected weapon, shirt, shoes, and derived stats correctly.
- The previous wave-2 run had shown tree at 4,408/10,000 at 3:40 and defeat by 3:50, with too coarse sampling to see the exact damage start. This establishes urgency, not an exact response-time benchmark. Test the new trigger in wave 2 and later before tuning its 4,000-unit radius.

- Post-deployment online check: at 0:20 in wave 1, badge/toast appeared while tree remained full and all walls were intact; hero was at a distant camp. A waypoint return brought the hero back by 0:31; badge cleared and the tree remained at 10,000 through wave-1 clear at 1:45. The user-facing wording was adjusted to “古树防线告急” because the early signal is an approaching threat, not tree damage already underway.

## 2026-10-21 — Wave-two warning response and recovery economy

- At wave 2 3:03, with the hero away, the published 2,500-unit warning showed at 8,671/10,000 tree HP. The map return took about 35 seconds; tree fell to 2,886 before the hero reached defense. This confirms the warning still arrives too late for that route.
- In the live shop, Ancient Tree Resin cost 12 gold and restored 2,500 HP (2,886→6,018). Near-tree E then fired; tree rose to 8,418 by 4:33. The run was still active, demonstrating a meaningful recovery choice without treating it as proof the warning was adequate.
- Candidate expands the pre-breach radius to 4,000 units; six automated cases were updated to cover the new boundary. Test deployment timing in a later wave before accepting the tuning.

- Live evaluation of the 5,000-unit setting: warning appeared at wave-1 0:19 with tree at 10,000 and all walls at 100%; the first observed tree damage was after 2:00, so the warning was over 100 seconds ahead of damage. The player returned and wave 1 stayed alive, but the interruption is too early. 2,500 was too late in wave 2; set the next candidate to 4,000 and retest.

## 2026-10-21 — Separate stacked combat and defense alerts

- A local wave-2 screenshot showed the short combat toast and persistent “立即回防” badge occupying the same top-center position, making both harder to read.
- Moved the persistent badge to 52px from the arena top (46px on narrow mobile screens), leaving the short toast at its original position. Local browser playtest at 1:34 visibly showed the yellow wave warning above the red persistent badge with clear spacing.
- Re-ran the game script syntax check and `node --test tests/*.test.js` (12 passed); `git diff --check` passed. This is a presentation-only change; no balance or trigger thresholds changed.
- A post-publish check caught that the GitHub blob upload had captured a truncated command output, briefly publishing an incomplete `index.html`. Restored the full 80,133-byte source from the prior verified commit and re-applied the three-line CSS change. Correction `4cdffa4` redeployed in Pages workflow #78 (success); a cache-busted live tab loaded the start screen and entered an active run normally.

## 2026-10-21 — One-click return warning and wave-three tree pressure

- Live playtest of the published build: wave 2 with all four walls down reached 2,253/10,000 tree HP at 3:08 and ended at 3:13 with 5 kills. A map waypoint to the tree was issued immediately before the end; the return route could not beat the remaining tree damage window.
- In a separate local candidate run, the hero left the tree during wave 3. The persistent warning appeared at 5:13 while the tree was still full; clicking it visibly displayed “正在沿路线回防远古之心.” The run nevertheless ended at 5:35 with 11 kills, showing that a return trip from roughly 2.8 km can still exceed wave-three breach time after the walls are gone.
- Made the persistent warning a keyboard/touch accessible button that routes the hero to a safe point beside the tree. This avoids the extra map-open and marker-selection steps. Manual local browser check confirmed the click handler and return-status toast.
- Added a staged tree damage multiplier: waves 1–2 remain at 10%; wave 3 uses 25%; wave 4 onward uses 100%. This preserves the sharper late-game threat while giving the wave-three return path more time. Fifteen automated tests cover the stage boundaries and return target; inline JavaScript syntax, tests, and `git diff --check` pass. The wave-three multiplier is a candidate tuning and needs a deployed survival comparison before further adjustment.
