# Harmonies — Progress & Status

**Current version:** v6.1.0
**Status:** ✅ Playable, mechanics verified against the real published Harmonies, with
auto-save/resume for touch-and-go play.

> This is the single living status doc. (It replaces the old `HANDOFF.md` and
> `PHASE6-VERIFICATION.md`, which were redundant and partly inaccurate.)

---

## What's done

- **Core solo game** — 23-hex Side A board, click-to-place tokens, 3 token spaces × 3 tokens,
  draw/discard/refill, end-game detection (pouch < 9 or ≤ 2 empty hexes), sun achievements (1–8).
- **All 6 scoring categories** implemented and unit-tested against the real rulebook values.
- **32 animal cards** with habitat patterns.
- **Correct pattern matching** — patterns match in any of 6 rotations and mirrored, with exact
  terrain and (where specified) exact height.
- **Touch-and-go persistence** — auto-save to `localStorage` after every move; resume on reload;
  "New Game" clears the save.
- **Tests** — dependency-free `node --test` unit suite + Playwright browser smoke tests.

---

## v6.1.0 — Correctness & persistence pass

Audited every mechanic against the real published Harmonies (BGA game help, geekyhobbies,
officialgamerules) and fixed the genuine bugs:

1. **Animal patterns now rotate and mirror.** Previously only one fixed orientation was accepted,
   so most legal placements were rejected. `hex-grid.js` gained `getPatternOrientations` (used by
   `checkAnimalPattern` for both placement and the valid-hex highlight).
2. **Animal scoring direction fixed** — more cubes placed now scores *more* points (was inverted).
3. **Exact height enforced** in pattern matching (`mountain` ≠ single `rock`); Ht-2/Ht-3 mountain
   cards (fish, duck, eagle) carry an explicit `height` field.
4. **Weighted token draw** — the bag now draws proportional to how many of each color remain
   (was uniform across distinct colors).
5. **Animal cubes block stacking** — the live game now passes `placedAnimals` to `canPlaceToken`.
6. **Docs corrected** — `game-rules.md` had wrong values; now matches the real game (see below).

### Verified already-correct (no change needed)

Tree 1/3/7 · Mountain 1/3/7 + adjacency · Fields 5 per group of 2+ ·
Water (Side A) 2/5/8/11/15 +4 · Buildings must be **stacked** red + 3 different neighbor colors ·
token stacking rules.

### game-rules.md corrections

- Tall tree (2 brown + green): **5 → 7** (table, worked example, quick-ref).
- Buildings: a lone red scores **0** — it must be built upon (stacked) to count.
- (Animal "more cubes = more points" was already stated correctly in the rules; the *code* was the
  side that was wrong, now fixed.)

---

## Firebase scoreboard (optional)

A lightweight shared scoreboard (NOT multiplayer): finished games push their final
score to a `scores` node in the `harmonies-game` Realtime Database, and the sidebar
shows the 10 most recent games (name + score + suns). An editable player-name field
in the header (saved in `localStorage`) tags each score.

- Wired directly in `index.html` via **dynamic import** of the Firebase v10 modular
  SDK, so if the CDN/DB is unreachable the game still runs (scoreboard shows "offline").
- Config needs only `databaseURL` (no auth).
- **Required DB rules** (the old time-limited rules expired 2026-03-17). Paste in
  Firebase console → Realtime Database → Rules:
  ```json
  {
    "rules": {
      "scores": { ".read": true, ".write": true, ".indexOn": ["ts"] }
    }
  }
  ```
  Open read/write is acceptable for a personal 2-player game (only non-sensitive
  scores are stored); tighten later if desired.

## Not doing (by design)

- **No multiplayer / networking.** Solo-only is intentional: two people play their own boards on
  their own devices, at their own pace. The unused `js/game/firebase-*.js` files are legacy and
  not wired into the live game.
- **No Side B (islands) board, no Nature Spirit cards** — out of scope for casual play.

## Possible future polish (low priority)

- Verify each animal card's exact point *magnitudes* against the physical deck (direction is
  correct; individual numbers are the repo's own data).
- Animations / sound, undo, tutorial overlay.
- Remove dead `js/main.js` + `js/phaser/**` (old Phaser prototype, not loaded by `index.html`).

---

## Testing

```bash
npm test            # node --test: scoring, orientation, stacking rules (13 tests)
npx playwright test # browser: loads clean, 3-token turn, board persists across reload
```
