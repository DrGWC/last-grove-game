# Game balance notes

Values here are current implementation starting points. Treat the new wall / skill values as provisional until tested in additional deployed runs.

## Run economy and progression

- Starting gold: 20.
- Wave 1 clear reward: 12 gold, followed by 30 seconds of preparation.
- Wave 2 clear reward: 16 gold, followed by 75 seconds for jungle exploration and upgrades.
- Later clear rewards: at least 6 gold, scaling by wave.
- The ancient tree has 10,000 HP.
- Character death costs `level × 10` gold and respawns the character.
- Live check: after wave 1 and four kills, the player had 40 gold; buying 藤木法杖 cost 18 and increased attack from 1 to 2.
- 2026-10-21 live check: 藤木法杖 (18) raised attack 1 → 2; 疾风短靴 (16) raised move speed 235 → 265. After wave 2, one northeast camp raised gold 38 → 56 and XP 10% → 50%, but reduced hero HP to 20/100. Two life potions (8 each) and two Ancient Tree resins (12 each) restored hero and tree to full, leaving 16 gold. This is one successful sample; camp risk and reward scaling need more runs.
- Presentation note: when both notices are active, the persistent defense badge now sits below the short toast to prevent overlap. This changes no warning timing or combat values.

## Automatic skills

- Q: 8-second cooldown; triggers below 78% player health, on a nearby group, or for a nearby elite/boss.
- E: 12-second cooldown; triggers after at least 300 tree damage or when a wave enemy approaches the tree.
- R: 10-second cooldown; shop unlock; targets a nearby enemy automatically.
- F: 24-second cooldown; shop unlock; triggers when the tree is threatened by a group or the hero is surrounded.
- Skills have cooldowns but no MP cost.

## Automatic targeting

- Wave enemies within 450 world units of the tree receive a 0.65 priority multiplier for hero auto-attacks. Enemies within 260 units of their assigned standing wall receive a 0.55 multiplier; these priorities stack. Once that wall breaks, its attackers stop receiving the wall bonus. Bosses and elites retain distance-score multipliers of 1.5 and 1.35 respectively.
- This defensive weighting helps the hero intercept active tree and wall attackers. Five target-score cases verify wall priority and its interactions. A pre-refinement local browser run cleared wave 1 with 4 kills and 98% north wall while the hero guarded that gate; in wave 2 the hero was at the east lane by 1:31 with 6 kills, full east wall, full tree, and full HP. This is a promising sample, not proof that the priority alone caused the outcome. Commit `4926efc` is deployed; the cache-busted live page loaded and started, but the target-selection scenario has not been visually isolated.
- Tree danger warning triggers when a non-jungle wave enemy comes within 4,000 world units while the hero is farther than 1,200 units away and has no wave enemy within auto-attack range plus 100. HP fallbacks remain 90% max while away and 75% nearby. A latched warning clears if the hero returns safely or is actively intercepting, while tree HP is above 90%. Twelve Node tests cover the alert/latch and auto-target boundaries. The deployed page loaded and started normally; coverage-aware alert suppression still needs a live-combat browser check.
- Live 4,000-unit warning sample saw the banner by 0:33 with the north wall at 34%; by 1:00 the north and south walls were broken while tree HP remained full and the hero was away. We did not issue a return order, so alert-to-breach response remains unknown. Previous 2,500-unit warning arrived too late in wave 2; 5,000 units was judged early based on tree-damage timing, but wall-damage timing needs more comparison before further radius tuning.

## Grove walls

- Four sections correspond to north, east, south, and west wave lanes.
- Starting durability: 6,000 HP per section.
- Melee wall damage uses enemy DPS × 20 per second.
- Ranged attacks target their lane wall while it remains standing.
- If an enemy is far from a broken assigned gate, it reassigns to the nearest standing wall; close attackers can enter through the breach.
- Live wave test: north and south walls were broken by 1:36 in wave 1. All four were down by 3:28 in wave 2. Tree fell temporarily to 9,693 and recovered to full via E by 4:02; run cleared wave 2 at 9 kills.
- Latest equipped live run: by 5:59 all four walls had fallen, but the tree remained at 10,000 HP, the player had 132/140 HP, and kills had reached 8. In the earlier away-from-tree run, tree reached 3,958 HP at wave-2 end; hero HP remained 100. Character and combat rolls materially changed tree pressure across the two samples.
- New live wave-2 run cleared with all walls broken and tree around 3,531/10,000 before a 2,000-HP level-up blessing and automatic E recovery. During one interval with the hero away and gates broken, tree health fell from 5,716 to roughly 3,500 in about 15 seconds; this indicates a very short post-breach response window. Do not retune enemy damage from this single run, but prioritize testing a clearer breach alert and rapid return path.
- A prior local test with one wall broken showed later attackers damaging the south wall to 85% while the tree stayed full. More tests needed to explain why later live runs lost all four walls faster; keep HP/damage provisional.
- Live map waypoint check moved the nearest-camp HUD from 5.2 km to 4.2 km over roughly six game seconds; this verifies destination travel responds, but camp-clear and safe return timing still need evaluation.
- Candidate online run at `?v=100ca96-radius4000`: banner was visible by wave-1 0:33, tree remained 10,000 HP, hero had 94 HP, and north wall was 34%; at 1:00 north and south walls were both broken, tree still had 10,000 HP. This is an observed sample only; warning onset and exact first wall-contact time were not captured.
- Local pre-warning-fix test: hero guarded the north wall through wave-1 clear at 0:31 with 4 kills and north wall at 98%. In wave 2, the hero was already attacking enemies at the east lane by 1:31; kills were 6, east wall and tree remained full, and hero HP was full. The old banner still said “立即回防” during this active interception, motivating the coverage-aware exception; verify the new wording/visibility logic in browser.

## Follow-up tuning questions

- Does a single wave destroy a gate too quickly or too slowly?
- Can the hero reliably clear waves before gates fall when staying near the tree?
- Do Q/E auto-trigger thresholds save the player / tree at useful moments without firing wastefully?
- Does the map waypoint feature make camp trips practical within preparation windows?
- Are gate HP bars and breach visuals obvious on mobile?

## Ancient Tree skill range

- Automatic E healing/root and F protection trigger only when the hero is within 1,200 world units of the Ancient Tree. This stops global off-screen healing from erasing the cost of leaving the defense zone and gives the return warning a gameplay purpose. Test three boundary/siege cases with `node --test tests/tree-defense-skills.test.js` before changing this range.
- This is a first-pass range, not final balance. Check how long the player needs to return from the nearest camps and whether the 90% away / 75% nearby warning arrives early enough during a real wave.

## Wave-three breach ramp (candidate)

The live wave-three sample destroyed the tree by 5:35 after all walls had fallen, despite the player clicking the return warning at 5:16 from roughly 2.8 km away. Waves 1–2 use a 0.10 tree damage multiplier; wave 3 now uses 0.25; wave 4+ uses 1.0. This stages the threat while retaining full damage for the later boss cycle. Re-test wave 3 with the published candidate before treating this as final balance.

- Return-warning CTA was clicked online in wave 2 from about 542 units from the northwest camp; the hero returned near the tree in about 26 game seconds with full HP and the tree still full. The observation supports the control but is only one low-pressure sample.
- Separate wave-stall defect: ranged enemies at breached gates could stop outside attack range, preventing them from reaching the tree and stalling the wave. A local candidate makes them approach into range. This is an AI correctness fix; the wave-three damage multiplier remains a balance candidate until a fresh deployed run reaches wave 3.

- Latest deployed wave-three sample with 25% tree damage scaling: 9,917 tree HP at 5:25, 6,679 at 5:48, 4,029 at 6:12; two 2,500-HP resin purchases raised the tree to 8,829, then the run ended at 7:23 with 13 kills. Because clicking outside the shop redirected the hero, this sample cannot isolate the multiplier's fair survivability. Re-run after the UI fix.

- Clean wave-three online sample after the shop click-through fix cleared at 5:50 with tree 9,836/10,000 and 15 kills while hero stayed near the tree. This suggests the prior wave-three losses were caused by leaving defense and the stray click path, rather than the 25% multiplier alone.
- Wave-four boss trip sample: player clicked the southeast cave marker at 6:11; the tree was destroyed by 6:39 with 15 kills. Candidate now extends 25% damage reduction through wave 4 so the boss adventure has a return window, then ramps to 50% for waves 5–6 and full damage from wave 7. Needs live comparison.

## Revised early-wave tree damage candidate (2026-10-21)

A live no-jungle build with a staff, boots and shirt lost the tree in wave 3 at 6:13 despite two 2,500-HP resin purchases. A second run cleared one jungle camp and unlocked 林风箭 but still lost the tree in wave 3 at 4:56; it began wave 3 with fewer kills and its camp fight caused a hero death. These samples show the previous 25% wave-three multiplier is not forgiving enough for early progression, though player route and build differ. New candidate: 10% through wave 4, 25% waves 5–6, 50% waves 7–8, full damage wave 9 onward. Treat as provisional until an upgraded camp route survives the first boss cycle.

## XP pickup range candidate (2026-10-21)

- XP orbs begin homing at `max(320, hero attack range + 60)` world units. 林地召唤 magnet blessing adds 55 units per stack. Attraction speed is 360 units/second, above the observed 307 movement speed, so an orb homing to a moving hero can catch up.
- Rationale: the old 95-unit pickup radius was far shorter than the 270-unit baseline attack range and the 450-unit bow range. The wave-eight sample ended at level 4 with 52 kills, but this one run cannot prove missed XP caused the slow progression. Verify XP and level-up timing online before further tuning.

## Projectile reach candidate (2026-10-21)

- Attack projectiles now receive `clamp((attack range + target radius + 10) / projectile speed, 0.8, 1.8)` seconds of flight time. This avoids expiring before a target at the edge of a range bonus can be hit, while bounding each projectile's lifespan.
- Triggering observation: the wave-three run had a 330-unit hero attack range, but normal shots lived only 0.75 seconds (about 307 units at 410 speed). A ranged enemy remained at approximately the hero's attack boundary while the wave stayed uncleared. Confirm the new projectile hits online before tuning enemy durability or target selection.

## Combat feedback candidate

- Floating damage values are display-only; they do not change attack, skill, boss, or enemy damage. The label pool is capped at 36 and each value lasts about 1.05 seconds to keep the battlefield readable.
- Verify density and legibility in a real combat screenshot before publishing. Retune only presentation timing/font size if the values overlap enemies or obscure the player.
- Late-wave observation: a wave-eight run cleared the cave boss, then lost the tree after the player stayed southeast instead of returning when warned. The run is not evidence that the current 50% wave 7–8 multiplier is too high; re-test with a prompt return before tuning.
- Wave-three 2026-10-21 sample: with all four walls down and the hero 2.9 km from the tree, the return warning began at 9,587/10,000 HP; the tree fell before the hero returned. Local candidate now warns at the first active wave spawn whenever all walls are broken and the hero is not intercepting. No tree damage values changed; live candidate verification remains pending.
- Combat labels now use inverse camera scaling to preserve 16 CSS-pixel text across zoom levels. Automated math coverage passes; phone-size visual readability remains unverified.


## Gear replacement preview (2026-10-21)

Shop previews derive post-purchase stats by subtracting the replaced slot's bonuses and adding the candidate item bonuses. Attack speed is shown as attacks per second (the inverse of the game's `fireRate` interval); the UI clamps the interval to the same 0.19-second minimum used by combat. Health displays the new maximum rather than current HP. This is informational only and does not change item prices or combat values. Automated coverage includes weapon replacement, armor, and boots.


## Between-wave wall repair candidate (2026-10-21)

After a wave is cleared and the next wave begins, restore 25% of each wall's maximum HP. This also revives a breached wall at 25%; it never exceeds maximum HP. Repair does not happen during a wave or on a failed run. The goal is to make the defensive ring recoverable after breaches without erasing ongoing siege pressure. A live wave-four sample still lost the tree after all walls were broken and the hero left for the boss. A local browser run verified a 1,500 HP repair toast and 25% restored north wall before wave 2; the wall fell to 18% after wave-two damage. A full late-wave run is still needed to decide whether 25% is sufficient.


Follow-up sample: after wave 2, all four walls were broken; wave transition restored 25% each, for 6,000 total HP. This enables a second barrier phase without healing the Ancient Tree itself. Tree was 9,942 at transition, with 9 kills. Need test whether that buffer lasts long enough in wave 3 and beyond.


## Deployment status (2026-10-21)

The 25%-per-wall intermission repair is now live in `2a2b94c`. Local observation: 1,500 HP repair after wave 1, then 6,000 total after wave 2 when all four gates were broken. Local wave-four boss run survived through the return trip with tree above 9,000. Confirm those values in the published build before further adjusting repair fraction or wave damage.


Production check: a live run reached wave 2 with north and south gates broken. The transition restored each to 25%, 3,000 total HP, while tree stayed at 10,000. This matches the intended recovery rule. Late-wave survivability still needs more samples.


## Attack-speed blessing correction (2026-10-21)

`明亮灵灵` now changes the attack interval from `fireRate` to `max(0.19, fireRate / 1.2)`, matching its stated +20% attacks-per-second bonus. The old handler only incremented the blessing counter and never modified attack interval. At the 0.19-second floor, further stacks cannot increase attack speed.

Local playtest confirmed that the Haste blessing changes the displayed rate from 1.8 to 2.1 attacks/second. The HUD displays one decimal, while combat uses the underlying interval divided by 1.2. Production confirmation is pending.

## Ranged threat and wave pacing observation (2026-10-21)

In a post-deploy wave-two run, all gates were breached and one ranged enemy remained outside the hero's 270-unit auto-attack radius while firing from the tree lane. The wave persisted until the player moved north to intercept; the run then recorded a ninth kill and entered preparation with the tree restored to full. This suggests a player-guidance gap. Do not reduce enemy health or siege pressure based on this single run; first communicate threat direction/distance and repeat the observation.

## Threat distance guidance candidate (2026-10-21)

When all wave enemies have spawned, show the nearest non-jungle wave threat's compass direction and distance only if it is outside the hero's auto-attack range. This informs the player about distant siege pressure without changing enemy movement, attack range, hero auto-targeting, or wave balance. Local desktop display is verified; narrow-screen fit and production behavior remain to be checked.

Production verification for the threat hint: wave 1 at 0:55 showed the nearest out-of-range enemy as south, 656 m away, while the tree was full. The display does not change attack distance or balance. Phone-size legibility still needs QA.

## Production shop and boss sample (2026-10-21)

- Live gear values behaved as described: staff +1 attack (18 gold), armor +60 max HP (24), boots +30 movement (16). Replacement previews used current gear and Haste stacks; the shop disabled items the player could not afford.
- Tree resin cost 12 and restored 2,500 HP, capped at 10,000; its button disabled at full. Life potion cost 8 and restored 45 HP (36→81 in the sample). The shop pause allowed purchases during active danger.
- Wave 4 boss defeated at 13:39 after a golden-circle charge cue; reward was 40 gold, +1 attack, and 1,500 tree healing. Hero reached 15 HP on the excursion, then returned and recovered. This supports keeping the boss as a risk/reward detour; do not retune from one sample. Charge cue was readable at the tested desktop screenshot size.
- The same run ended wave 3 at tree 8,800 despite eventual clearing; wave 4 boss healing restored tree health. More runs are needed to evaluate sustainability rather than this single successful boss clear.


## 2026-10-21 — Effective attack-rate cap

- Combat uses a 0.19-second minimum attack interval (5.3 attacks/s). Haste grants +20% attacks/s by dividing the base interval by 1.2 and must not be applied again in the firing loop.
- HUD, loadout, and gear replacement preview must all report the same capped rate used by combat. A 6.9/s HUD versus 5.3/s effective cadence was observed with crossbow/Haste. Fix deployed in `aa7b5d3`; recheck the full late-run combination before changing item balance.



## Woodland marksman and long-rifle tuning (2026-10-21)

The randomized 林地神射手 form borrows the long-range precision role associated with DotA 1 Sniper, with original forest-themed naming and art:

- Passive: +160 range; every fifth basic shot deals 2.5x damage and stuns for 0.55s.
- Q 榴霰箭: auto-casts on low HP, nearby groups, elite, or boss pressure; hits a 175-radius area for skill power +3, slows for 2.2s, 8s cooldown.
- R 穿林狙击: shop unlock, auto-targets the lowest-HP wave enemy within 4x range, deals 5x attack + skill power, stuns 1.35s, 18s cooldown.
- 苔影长铳 costs 42; adds 2 attack and 240 range with a slower interval (+0.18s). Every fourth shot deals 1.8x damage and slows for 0.9s. It is an alternative weapon build, not an extra weapon slot.

A two-wave preview reached wave 2 with 8 kills and the tree at 9,105/10,000; the east wall had fallen. Buying R at 26 gold changed its state to auto-release. The rifle's new fourth-shot effect and R proc on a later wave still need direct live capture. Do not rebalance from this short sample.
