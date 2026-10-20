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
- Local browser playtest reproduced overlapping short combat toasts and the persistent defense banner. The banner now sits below the toast (52px on desktop, 46px at narrow widths); the local screenshot confirmed readable separation.

## Active

- Verify the local all-walls-broken return warning in a live wave; the published run lost the tree before a distant hero could return.
- Capture and review floating damage values at real gameplay scale and mobile-like zoom before publishing; the label now holds a 16px screen size, but visual QA remains pending.
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

- The persistent tree-danger badge is now an “立即回防” button that sends the hero to a safe point beside the tree. Click-to-return was manually observed in a local wave-3 run; the same run still lost the tree 19 seconds later, so route timing and the wave-three damage ramp need another deployed comparison.
- Candidate tree damage ramp is 10% on waves 1–2, 25% on wave 3, then 100% from wave 4. Fifteen automated cases pass; live survivability after this tuning is not yet verified.

- Online return-button playtest succeeded: from the northwest camp approach, clicking the warning routed the hero back near the tree in about 26 game seconds; the tree stayed full during the return. Continue to test later waves under active siege.
- Fixed locally a wave-stall case where a ranged enemy at a broken lane gate stood still outside tree attack range. New tests pass for movement into range; deploy and verify the wave now clears.

- Live `cd9ed06` regression confirms the post-breach ranged enemy now advances and wave 2 clears by 3:43 (9 kills, tree 8,317). The prior version was still stuck at 5/5 at 5:43.
- Local fix now stops outside shop/equipment dismissal clicks from propagating to canvas movement. Three tests cover shop/equipment click-through; online check pending.
- Wave-three 25% damage sample still ended at 7:23 after two resin purchases; the test is confounded because an outside-shop click redirected the hero. Re-test after publishing click-through fix before tuning this multiplier.

- Live `4236616` shop-dismissal check: outside click closed the shop and left the hero by the tree after 10 seconds. Clean run cleared wave 2 at 3:45 and wave 3 at 5:50 with the hero guarding the tree.
- Fourth-wave boss trip is currently too costly: a southeast map waypoint at 6:11 was followed by tree defeat at 6:39. Candidate keeps wave-four tree damage at 25%, then raises it to 50% on waves 5–6 and 100% from wave 7; automated boundaries pass. Deploy and repeat the boss trip before deciding further tuning.

- New online comparison shows wave 3 can destroy the tree by 4:56–6:13 under two different early builds, even with tree resin. Current 25% wave-three pressure is too steep for early progression. Candidate lowers waves 3–4 to the 10% opening tier, then ramps through 25% waves 5–6, 50% waves 7–8, and full pressure at wave 9. Validate with a camp-upgraded run before finalizing.
- Jungle playtest: map waypoint reached the southwest camp during the 75-second wave-two preparation; camp cleared and rewarded currency, but the hero died during the fight and respawned at the tree. Improve camp danger readability and make first camp difficulty/reward more forgiving after the new tree curve is verified.

- XP pickup candidate now homes from at least 320 units or weapon range +60, with 360 units/second attraction. Tests pass; verify its level-up pace in a live run.
- Isolate the wave-eight wipe seen at 11:27 (52 kills, tree 9,936 at 11:16): observe whether remaining wave-eight enemies or wave nine caused it before changing late-game balance.
- Fix candidate: projectiles now stay alive long enough to cover the player's attack range. The wave-three run showed a ranged enemy at the attack boundary surviving for roughly 90 seconds; verify target hits and wave clear in a deployed run.

- New local candidate: floating damage values distinguish regular hits, boss/skill hits, and damage received; cap 36 active labels to bound rendering work. Node suite passes, but a browser screenshot has not yet captured a damage value, so keep it pending visual verification before publishing.
- Fresh Pages run at `d032f3c` cleared waves 1–4 and the wave-four cave boss with a camp-upgraded build. Wave 5 was active at 7:33; continue the survival sample and inspect the next elite.
- Extended live run cleared wave 7, defeated the wave-eight cave boss, then lost at 12:10 after the player stayed away despite an active return warning. Repeat the late-wave defense with immediate return before changing the wave 7–8 damage multiplier.
- Candidate `98ad590` is local-only until damage numbers are visually confirmed in a screenshot. Current published build remains `d032f3c`.


## 2026-10-21 update

- Completed locally: gear shop now previews resulting stats after replacing an equipped item; 2 new calculation tests, full suite 33/33. Desktop visual check passed; verify mobile shop layout before publishing.
- Active: continue published run and respond promptly to the tree-defense warning; current run is wave 3. Complete visual QA for the damage label and breached-lane warning candidates before bundling them into a release.
- Next: mobile UI review, then decide whether the shop comparison text needs a compact layout; continue the one-hour observed playtest and publish only stable, verified changes.


## 2026-10-21 update — defense recovery

- Implemented locally: cleared-wave transitions restore 25% max HP to each wall, including breached walls. This gives the ring a partial repair between waves while keeping it vulnerable during active sieges. Automated tests pass for repair caps and the wave transition hook. Local browser run visibly showed `城墙修复 1500`, a north wall at 25%, and normal incoming damage during wave 2. Mobile and late-wave verification remain.
- Live testing still shows severe pressure after the full ring is breached: the hero returned during wave 3, but the tree fell at 7:20 in wave 4 after a southeast boss detour. The boss outcome was not observed. Repeat with the repaired-wall candidate before changing wave damage or boss difficulty.
- Latest local shop improvement (`09e3f47`) previews stats before replacing gear; 33 tests passed at its commit.


- Further local validation: wave 2 cleared at 4:03 with tree 9,942 and all walls breached; advancing to wave 3 restored all four to 25% (6000 total HP), confirmed by toast and HUD. Continue late-wave playtest; damage popup still needs a clearly captured hit.


## Deployment update — 2026-10-21

- Live: gear stat comparisons and between-wave wall repair deployed in commit `2a2b94c`; Pages workflow #88 succeeded. Published shop smoke test confirmed the new comparison text.
- Still verify wall restoration during a deployed intermission and on mobile. Keep damage labels unpublished until captured clearly in combat.


- Production verification complete: live `2a2b94c` run confirmed the wave-one clear restores 3,000 HP across the two breached gates (25% each). The toast and wall HUD matched at 2:18; tree was full. Continue later-wave and mobile QA.


## 2026-10-21 update — Haste fix

- Haste now changes the attack interval to deliver its stated +20% attacks per second. Automated tests pass, and a local wave-two level-up showed the rate changing from 1.8 to 2.1/s. Publish and confirm on Pages; continue late-wave defense testing.


## 2026-10-21 update — release and ranged-threat playtest

- Haste effect fix deployed in `117a862`; Pages workflow #90 succeeded. Local HUD verified the effect, but the first post-deploy level-up randomly offered Speed instead.
- New playtest note: wave two remained active with one distant ranged enemy while the hero stayed at the tree. Moving toward the visible north-lane threat ended the wave. Improve enemy-distance/intercept feedback so players know when to move out and engage; preserve manual interception as a gameplay choice.


## 2026-10-21 update — distant-threat guidance

- Local candidate displays the nearest out-of-range wave threat's direction and distance after all enemies spawn. It is gold-highlighted beside the camp hint, while interception remains a player choice. Three focused tests added; 44/44 pass and local desktop play shows the hint. Check narrow-screen fit after publishing.


- Threat direction/distance hint published in `2d73cb3`; Pages workflow #92 succeeded. Fresh production run verified the 656 m south-threat hint at 0:55 while the tree was full. Next: check phone-width line wrapping/readability, then continue late-wave manual-intercept tests.
