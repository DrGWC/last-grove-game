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

## Automatic skills

- Q: 8-second cooldown; triggers below 78% player health, on a nearby group, or for a nearby elite/boss.
- E: 12-second cooldown; triggers after at least 300 tree damage or when a wave enemy approaches the tree.
- R: 10-second cooldown; shop unlock; targets a nearby enemy automatically.
- F: 24-second cooldown; shop unlock; triggers when the tree is threatened by a group or the hero is surrounded.
- Skills have cooldowns but no MP cost.

## Automatic targeting

- Wave enemies within 450 world units of the tree receive a 0.65 priority multiplier for hero auto-attacks. Bosses and elites retain distance-score multipliers of 1.5 and 1.35 respectively.
- This defensive weighting helps the hero intercept active tree threats. The score logic passed numeric checks, but it needs live validation when an eligible target is within range; jungle enemies do not receive the tree-threat weight.
- Tree danger warning triggers when a non-jungle wave enemy comes within 4,000 world units while the hero is farther than 1,200 units away. HP fallbacks remain 90% max while away and 75% nearby. The badge stays until the hero returns within range, tree HP recovers above 90%, and nearby wave threats are gone. Six Node tests cover warning thresholds and persistence. Wave 1 warned while tree HP was full and a return waypoint got the hero back before damage. Wave 2 showed the 2,500-unit warning at tree 8,671/10,000, but the ~35-second return lag let it fall to 2,886. A 12-gold tree resin plus E raised HP to 8,418; this saved the run but shows the alert should start earlier. The 5,000-unit candidate warned at 0:19 on wave 1 with full tree/all walls and over 100 seconds before tree damage, too early for normal play. The next candidate uses 4,000 units; live-check before balancing further.

## Grove walls

- Four sections correspond to north, east, south, and west wave lanes.
- Starting durability: 6,000 HP per section.
- Melee wall damage uses enemy DPS × 20 per second.
- Ranged attacks target their lane wall while it remains standing.
- If an enemy is far from a broken assigned gate, it reassigns to the nearest standing wall; close attackers can enter through the breach.
- Live wave test: north and south walls were broken by 1:36 in wave 1. All four were down by 3:28 in wave 2. Tree fell temporarily to 9,693 and recovered to full via E by 4:02; run cleared wave 2 at 9 kills.
- Latest equipped live run: by 5:59 all four walls had fallen, but the tree remained at 10,000 HP, the player had 132/140 HP, and kills had reached 8. In the earlier away-from-tree run, tree reached 3,958 HP at wave-2 end; hero HP remained 100. Character and combat rolls materially changed tree pressure across the two samples.
- A prior local test with one wall broken showed later attackers damaging the south wall to 85% while the tree stayed full. More tests needed to explain why later live runs lost all four walls faster; keep HP/damage provisional.
- Live map waypoint check moved the nearest-camp HUD from 5.2 km to 4.2 km over roughly six game seconds; this verifies destination travel responds, but camp-clear and safe return timing still need evaluation.

## Follow-up tuning questions

- Does a single wave destroy a gate too quickly or too slowly?
- Can the hero reliably clear waves before gates fall when staying near the tree?
- Do Q/E auto-trigger thresholds save the player / tree at useful moments without firing wastefully?
- Does the map waypoint feature make camp trips practical within preparation windows?
- Are gate HP bars and breach visuals obvious on mobile?

## Ancient Tree skill range

- Automatic E healing/root and F protection trigger only when the hero is within 1,200 world units of the Ancient Tree. This stops global off-screen healing from erasing the cost of leaving the defense zone and gives the return warning a gameplay purpose. Test three boundary/siege cases with `node --test tests/tree-defense-skills.test.js` before changing this range.
- This is a first-pass range, not final balance. Check how long the player needs to return from the nearest camps and whether the 90% away / 75% nearby warning arrives early enough during a real wave.
