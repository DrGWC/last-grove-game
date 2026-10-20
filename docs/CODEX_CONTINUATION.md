# Codex continuation checkpoint

- Repository: `DrGWC/last-grove-game`
- Branch: `main`
- Current remote base before latest local candidate: `aa671b3` (`Add route-based wall AI and breach warning`)
- Source: single-file browser game in `index.html`; GitHub Pages deploys on pushes to `main` via `.github/workflows/deploy-pages.yml`.
- Local validation server: `python3 -m http.server 8765` (shell session 77532; stop when done).

## Current local candidate

- Enemy road waypoint following; far-breach fallback to nearest standing wall at >700 units.
- One-time toast and burst on wall destruction.
- Restart clears old click-to-move and touch joystick state; a previous run’s move target had caused new runs to walk unexpectedly.
- Shop/outside close, equipment/outside close, translucent map and outside dismissal were visually verified in a previous live run.

## Verification

- Local wall test at simulated 0:53: north gate broken; enemies attacked the south gate to 85%; tree 10,000/10,000, hero 90/100, 3 kills.
- A stationary run cleared the first two waves with 9 kills; tree was restored to 99.5% after wave two. An exploratory wave-three run failed at 5:34 with 9 kills while the hero was away from the tree.
- The restart target-retention bug was reproduced; the reset fix is written but not yet tested via a second death/restart cycle.
- Bundled Node syntax check and `git diff --check` passed before this newest reset edit. Re-run both before publishing.
- Previous Pages deployment for `aa671b3` succeeded; current reset edit and doc refresh still need commit/deploy/live check.
- No package manifest or pre-existing test runner was present.

## Next actions

1. Re-run Node syntax check and `git diff --check`.
2. Commit/publish latest reset fix and docs, verify Pages succeeds.
3. Refresh live site, verify source is intact and start a new run. Confirm hero remains at spawn after a fresh start, observe a wall break warning, then check shop/map outside-close behavior.
4. Play waves 1–3 with an early weapon purchase, and repeat narrow-screen/mobile checks.
5. Continue the 10-hour target only as actual work time allows; the mission is not complete.

## Known caveats

- Wall durability/damage and auto-skill thresholds remain provisional.
- Third-wave survival while exploring is not yet balanced; confirm after buying gear before tuning.
- Breach alert and restart fix are not yet live-verified.
- No automated test runner was present.
