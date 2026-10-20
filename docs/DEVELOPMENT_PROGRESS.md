# Development progress

## 2026-10-20 — UI, automatic skills, wall defense, and live playtests

- Published shop and equipment outside-click dismissal; both overlays pause gameplay while open.
- Published the expanded translucent map; the arena remains visible behind it and clicking outside map tools closes it.
- Published direct start without a skill-pick gate, automatic Q/E, shop-unlocked automatic R/F, and removal of mana and its potion.
- Published four durable lane walls with health bars, breakable visuals, and ranged enemies targeting the wall.
- Added route waypoint following for wave enemies so they follow the painted roads instead of cutting diagonally to the gate.
- Added one-time breach toast and burst feedback for melee/ranged wall destruction.
- Fixed run restart retaining the previous mouse or touch movement target; fresh runs now reset joystick state too.
- Added fallback targeting: if an assigned wall is already broken and an enemy is still more than 700 world units from that breach, it switches to the nearest standing wall. Enemies already near the breach can enter the grove.
- Latest deployed source at start of this cycle: `054e6cc` (`Reset movement state on restart`); Pages workflow `39470753104` succeeded.
- Live second-wave run: wave 1 ended at 2:02 with 4 kills and tree at 10,000 HP. North and south walls had broken by 1:36. By 3:28 all four walls were down; tree briefly fell to 9,693, then automatic E restored it to 10,000 by 4:02. Wave 2 ended with 9 total kills.
- Live shop check: buying 藤木法杖 at 40 gold cost 18, equipped it, and raised attack from 1 to 2. The shop rerendered the equipped state and correctly disabled unaffordable replacements.
- Local exploration test exposed friction in long trips to camps: the nearest camp starts 5.2 km away. The expanded map now accepts a destination tap/click, marks it, closes, and starts click-to-move; a local test moved the nearest-camp readout from 5.2 km to 4.2 km. Clicking outside the map still closes it without setting a new destination. A narrow-screen title size adjustment keeps the map controls legible.

### Validation

- Bundled Node `--check` for the inline game script: passed after map navigation change.
- `git diff --check`: passed.
- Local browser test: map destination selection closed the map and began travel; click-outside closed the map; game continued updating wall health and the nearest-camp indicator.
- Live browser test: shop purchase and wave/wall/automatic-skill feedback verified. Browser console logs are unavailable in this tab; no runtime error was observed in the visible UI.
- No package manifest or pre-existing automated test suite is present.

### Observations and tuning

- The first two waves can be cleared while stationary after buying the starter weapon; in the latest live run all walls were lost before wave 2 ended, but automatic E restored the tree to full. This leaves a clear wall-repair / defense-upgrade design opportunity, but current samples are too small to alter durability yet.
- A prior exploratory run without early equipment failed at 5:34 while the hero was away from the tree. Test again with early gear and map navigation before rebalancing travel or tree damage.
- Live breach alerts were visible in the accessibility tree for north, south, and east walls. Confirm their visual prominence on a narrow mobile viewport in a later check.

## Time accounting

- The active goal timer showed about 55 minutes elapsed across the thread at the start of this cycle; that includes conversation and wait time, so it is not equivalent to productive development time.
- This cycle was about 6 minutes of focused implementation and verification. The 10-hour mission target is not complete; continue with measured active work and keep idle time separate.
