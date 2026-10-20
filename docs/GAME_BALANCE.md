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
