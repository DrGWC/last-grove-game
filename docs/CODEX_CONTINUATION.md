# Codex continuation checkpoint

- Repository: `DrGWC/last-grove-game`, branch `main`.
- Current game-code commit before this checkpoint: `0b7aa36` (away-from-tree 90% warning); Pages deployment #68 succeeded. Current uncommitted change keeps that warning latched through return until tree HP recovers above 90%.
- Source remains a single-file browser game in `index.html`; GitHub Pages deploys from `.github/workflows/deploy-pages.yml`.

## Current behavior

- Mobile/desktop map waypoint selection closes the map and moves the hero; outside click closes without changing destination. Map zoom and translucent full-screen presentation remain live.
- Shop and equipment are separate overlays; they pause while open, preserve inherited pause state, and close with outside click. The live shop showed separate weapon/gear, potion, and skill-book lists. A staff purchase changed gold from 32 to 14, attack from 1 to 2, and marked the weapon equipped while unaffordable replacements were disabled.
- E root/heal and F tree shield require the hero within 1,200 world units of the tree. Five dependency-free Node tests cover those boundaries, the away alert threshold, and warning persistence; all pass.
- Tree alert starts at 90% max HP while hero is more than 1,200 units away, and at 75% while nearby. The current local change keeps an activated alert visible until tree HP rises above 90%, avoiding it disappearing immediately when the hero returns and the threshold drops to 75%.

## Latest verification

- Commit `0b7aa36` Pages workflow #68 succeeded.
- Online wave-1 playtest at `?v=0b7aa36-away-warning`: hero waypointed away (camp-distance display changed); at 1:44 wave 1 cleared with tree full and 4 kills. Wave 2 ended at 5 kills and tree full by 3:04; the hero had respawned near the tree after losing HP, so this did not validate a fully-away alert threshold.
- A separate online run on the preceding build showed the toast and pinned badge by 1:50 at 7,163/10,000 tree HP, with all walls broken. Sampling interval missed the exact crossing and hero distance, so do not claim that run proves the away 90% trigger or that a waypoint can save the tree.
- On the current live shop: staff purchase applied correctly, shop tabs were distinct, current slot/attributes updated, and disabled purchase buttons explained affordability. Potion tab showed “已满” for full health/tree; skill-book tab showed learned Q/E and locked R/F.
- Local automated validation after the current uncommitted latch change: `node --test tests/tree-defense-skills.test.js` — 5 passed; inline script syntax check and `git diff --check` passed.

## Next work

1. Deploy the warning-latch fix, then verify its visible state from danger through return/recovery.
2. Sample live tree HP and hero distance more frequently around an away-from-base warning; make a deliberate return attempt.
3. Continue through wave 3 and, if practical, wave 4 boss; test F after unlocking it.
4. Test target selection when an ordinary enemy and a tree threat are both eligible, and check map waypoint movement on narrow mobile layouts.
5. Continue reviewing shop prices/gear slots and upgrade clarity from actual play, changing balance only with evidence.

## Time accounting

The longer autonomous mission is still active and incomplete. Track actual implementation/testing separately from game-running time; exclude idle waits and do not report the requested duration as complete prematurely.
