# Codex continuation checkpoint

- Repository: `DrGWC/last-grove-game`, branch `main`.
- Current deployed game-code commit: `973f0b4` (pre-breach return warning); Pages deployment #70 / run `39482545696` succeeded.
- Source remains a single-file browser game in `index.html`; GitHub Pages deploys from `.github/workflows/deploy-pages.yml`.

## Current behavior

- Mobile/desktop map waypoint selection closes the map and moves the hero; outside click closes without changing destination. Map zoom and translucent full-screen presentation remain live.
- Shop and equipment are separate overlays; they pause while open, preserve inherited pause state, and close with outside click. The live shop showed separate weapon/gear, potion, and skill-book lists. A staff purchase changed gold from 32 to 14, attack from 1 to 2, and marked the weapon equipped while unaffordable replacements were disabled.
- E root/heal and F tree shield require the hero within 1,200 world units of the tree. Five dependency-free Node tests cover those boundaries, the away alert threshold, and warning persistence; all pass.
- Tree alert starts when a non-jungle wave enemy comes within 2,500 world units while the hero is more than 1,200 away; tree-HP fallbacks remain 90% away / 75% nearby. The badge latches until the hero returns within 1,200, tree is above 90%, and nearby wave threats are gone.

## Latest verification

- Commit `0b7aa36` Pages workflow #68 succeeded.
- Online wave-1 playtest at `?v=973f0b4-prebreach`: hero waypointed away. At 0:20 the alert appeared with tree still 10,000 HP, all walls at 100%, and the hero around the NW camp (2.2 km distance readout), showing the enemy-approach trigger is earlier than tree damage. A map return waypoint was selected; by 0:31 the hero was near the NE camp marker (22 m readout), tree remained full, and the banner was hidden. Wave 1 later cleared with tree full at 1:45. This verifies an early alert and return response for wave 1; it does not prove later waves are survivable.
- A separate online run on the preceding build showed the toast and pinned badge by 1:50 at 7,163/10,000 tree HP, with all walls broken. Sampling interval missed the exact crossing and hero distance, so do not claim that run proves the away 90% trigger or that a waypoint can save the tree.
- On the live shop: staff purchase changed attack from 1 to 3 in a wolf run (wolf bonus +1 plus staff +1), then boots increased movement speed from 205 to 235; equipped slot labels and the equipment panel updated. Shop tabs were distinct; potions showed “已满” for full health/tree, and skill books showed learned Q/E and locked R/F.
- Automated validation at the published pre-breach build: `node --test tests/tree-defense-skills.test.js` — 6 passed; inline script syntax check and `git diff --check` passed.

## Next work

1. Measure alert timing and survival through wave 2+; wave-1 alert and return behavior are now confirmed online.
2. Sample live tree HP and hero distance more frequently around an away-from-base warning; make a deliberate return attempt.
3. Continue through wave 3 and, if practical, wave 4 boss; test F after unlocking it.
4. Test target selection when an ordinary enemy and a tree threat are both eligible, and check map waypoint movement on narrow mobile layouts.
5. Continue reviewing shop prices/gear slots and upgrade clarity from actual play, changing balance only with evidence.

## Time accounting

The longer autonomous mission is still active and incomplete. Track actual implementation/testing separately from game-running time; exclude idle waits and do not report the requested duration as complete prematurely.

## Latest follow-up — pre-breach warning candidate

- At 3:40 in live wave 2, tree HP was 4,408/10,000 and the warning was visible; the run ended at 3:50 before the waypoint return succeeded. Sampling confirms the response window is too short, but did not capture the exact damage onset or warning crossing.
- Published pre-breach code triggers an away-from-tree warning when a non-jungle enemy comes within 2,500 world units, with 90%/75% HP fallbacks. Six tests pass. At 0:20 of online wave 1 it warned with tree full, walls intact, and the hero at a distant camp. A tree-directed map click returned the hero to the defense area by 0:31; tree remained full and the badge cleared. Later-wave response still needs testing.
