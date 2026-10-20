# Development progress

## 2026-10-20 — UI, automatic skills, wall defense, and first-wave playtest

- Published shop and equipment outside-click dismissal; both overlays pause gameplay while open.
- Published the expanded translucent map; the arena remains visible behind it and clicking outside map tools closes it.
- Published direct start without a skill-pick gate, automatic Q/E, shop-unlocked automatic R/F, and removal of mana and its potion.
- Published four durable lane walls with health bars, breakable visuals, and ranged enemies targeting the wall.
- Added route waypoint following for wave enemies so they follow the painted roads instead of cutting diagonally to the gate.
- Added fallback targeting: if an assigned wall is already broken and an enemy is still more than 700 world units from that breach, it switches to the nearest standing wall. Enemies already near the breach can enter the grove.
- Live Pages verification on `5bf7466`: HUD showed all four walls, no MP, Q/E automatic statuses, and E auto-cast; north wall took damage and broke during the first wave. The tree stayed at 10,000 HP through the 30-second preparation interval.
- Live UI verification: shop opens above the game without covering the bottom-left HUD, click outside closed it; equipment click-outside close worked; map showed the arena beneath it and closed on outside click.
- Local first-wave smoke play on the route-following build: at simulated 0:56, wave 1 was cleared, all 4 enemies defeated, tree at 10,000/10,000, north wall broken.

### Validation

- Bundled Node `--check` on the single inline game script: passed after latest source edit.
- `git diff --check`: passed.
- No package manifest or pre-existing automated test suite is present.
- The route-following/fallback and breach-alert code is now included in the local candidate; redeploy and verify the latest source on Pages before calling it live-tested.

### Observations and tuning

- Stationary auto-combat can clear the first wave without tree damage, while allowing one gate to break. That gives the defense system a useful first breaching event; verify it remains fair in wave 2 before tuning durability.
- Local follow-up at simulated 0:53 confirmed the north gate had broken and a later wave enemy attacked the south gate instead (south at 85%); tree remained at 10,000/10,000, player 90/100, 3 kills. This verifies the far-breach fallback on the local build.
- Added a one-time breach toast and particle burst for melee and ranged wall destruction; verify its readability in the next online run.
- Prior play tests showed exploration exposes the tree and that the first two wave rewards/preparation periods are the intended shop/jungle loop.

## Time accounting

- This session has involved source audit, implementation, local and live browser checks, and deployment/docs work. The Codex thread elapsed counter read about 38m at the latest checkpoint; elapsed thread time is not identical to productive coding time. Do not report a 10-hour completion. Continue keeping concrete activity and idle time distinct.
