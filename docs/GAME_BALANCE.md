# Game balance notes

Values here are current implementation starting points. Treat the new wall / skill values as provisional until tested in a deployed run.

## Run economy and progression

- Starting gold: 20.
- Wave 1 clear reward: 12 gold, followed by 30 seconds of preparation.
- Wave 2 clear reward: 16 gold, followed by 75 seconds for jungle exploration and upgrades.
- Later clear rewards: at least 6 gold, scaling by wave.
- The ancient tree has 10,000 HP.
- Character death costs `level × 10` gold and respawns the character.

## Automatic skills

- Q: 8-second cooldown; triggers below 78% player health, on a nearby group, or for a nearby elite/boss.
- E: 12-second cooldown; triggers after at least 300 tree damage or when a wave enemy approaches the tree.
- R: 10-second cooldown; shop unlock; targets a nearby enemy automatically.
- F: 24-second cooldown; shop unlock; triggers when the tree is threatened by a group or the hero is surrounded.
- Skills have cooldowns but no MP cost.

## Grove walls

- Four sections correspond to north, east, south, and west wave lanes.
- Starting durability: 6,000 HP per section.
- Melee wall damage uses enemy DPS × 20 per second.
- Ranged attacks target their lane wall while it remains standing.
- After a lane wall reaches zero HP, its attackers can continue to the ancient tree.

- When an enemy’s assigned wall is broken and it remains more than 700 world units from that breach, it reassigns to the nearest standing wall. Near the broken gate, it enters instead.
- Wave enemies now follow the route waypoints to their assigned wall. A destroyed breach alerts once, with a toast and burst effect.
- Local first-wave test: north wall broke, enemies redirected toward the closest intact south wall (85% remained at 0:53), and the tree stayed full. More runs are needed before changing the 6,000 HP / DPS × 20 values. In another exploratory run, leaving the tree during wave 3 led to failure at 5:34 with 9 kills; confirm this risk after buying early gear before tuning values.

## Follow-up tuning questions

- Does a single wave destroy a gate too quickly or too slowly?
- Can the hero reliably clear a wave before the gate falls when staying near the tree?
- Do Q/E auto-trigger thresholds save the player / tree at useful moments without firing wastefully?
- Are gate HP bars and breach visuals obvious on mobile?
