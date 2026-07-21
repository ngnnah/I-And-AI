# Harmonies — Solo Board Game

**Version:** v6.1.0 (HTML/CSS/JS)
**Status:** ✅ Playable · mechanics verified against the real game · auto-save resume
**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/

A single-player digital build of Libellud's **Harmonies**, made for casual "touch-and-go"
play — put it down anytime and pick it back up; the board auto-saves in your browser.

---

## 🎮 Play

**Online:** https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/

**Local:**
```bash
cd projects/gaming/harmonies
python3 -m http.server 8001
# open http://localhost:8001/
```

---

## ✨ What it does

- **Click-to-place** tokens (no drag & drop) with live validation and error feedback.
- **All 6 scoring categories** update in real time: trees, mountains, fields, buildings, water, animals.
- **32 animal cards** with habitat patterns that match in **any rotation or mirror**, with exact
  terrain/height checks (e.g. a "Mountain Ht 3" card really needs 3 gray tokens).
- **Sun achievements** (1–8 ☀️) and full end-game detection (pouch < 9 tokens, or ≤ 2 empty hexes).
- **Auto-save / resume** — your game is stored in `localStorage` after every move, so closing or
  refreshing the tab never loses progress. "New Game" confirms, then clears the save.

> Solo-only by design. Two people play their own boards on their own devices, at their own pace —
> no accounts, no server, no turn-waiting.

---

## 🎯 Mechanics (matches the real Harmonies)

### Token stacking

| Token   | Can place on            | Max height | Notes                                  |
| ------- | ----------------------- | ---------- | -------------------------------------- |
| Yellow 🌼 | Ground only             | 1          | Fields — no stacking                   |
| Blue 💧  | Ground only             | 1          | Water — no stacking                    |
| Brown 🪵 | Brown only              | 2          | Tree trunks                            |
| Green 🌿 | 1–2 Brown               | 3          | Tree crown — needs a trunk underneath  |
| Gray ⛰️  | Gray only               | 3          | Mountains                              |
| Red 🏠   | Gray/Brown/Red, or alone| 2          | Buildings — never the 3rd token        |

### Scoring

1. **Trees** — bush (green) **1**, tree (brown+green) **3**, tall tree (2 brown+green) **7**.
2. **Mountains** — gray height 1/2/3 = **1/3/7**, but **0** if not adjacent to another mountain.
3. **Fields** — **5** per connected group of 2+ yellow (a lone yellow = 0).
4. **Buildings** — a **stacked** red (red on brown/gray/red) scores **5** if adjacent to 3+ different
   top-colors. A lone red on the ground scores **0** until it is built upon.
5. **Water (Side A)** — longest river of length 2/3/4/5/6 = **2/5/8/11/15**, +4 per token beyond 6.
6. **Animals** — score the value for the number of cubes you've placed; **more cubes = more points**.

### Suns

| Points  | Suns | Points  | Suns |
| ------- | ---- | ------- | ---- |
| 40–69   | 1 ☀️  | 130–139 | 5 ☀️  |
| 70–89   | 2 ☀️  | 140–149 | 6 ☀️  |
| 90–109  | 3 ☀️  | 150–159 | 7 ☀️  |
| 110–129 | 4 ☀️  | 160+    | 8 ☀️  |

Full rules and strategy: **[game-rules.md](./game-rules.md)**.

---

## 🏗️ Architecture

Self-contained static app — no build step. `index.html` holds the UI and game flow inline and
imports pure-logic ES modules from `js/`:

- `index.html` — game UI, turn flow, pattern matching, persistence (~2,400 lines)
- `js/game/scoring-engine.js` — all 6 scoring categories
- `js/game/token-manager.js` — placement validation, stacking rules, terrain derivation
- `js/game/hex-grid.js` — axial hex math + `getPatternOrientations` (rotation/mirror for patterns)
- `js/data/tokens-config.js` — pouch distribution (120 tokens) and stacking rules
- `js/data/animal-cards.js` — 32 animal cards with habitat patterns

State lives in one in-memory `gameState` object that is serialized to `localStorage`
(key `harmonies_solo_game`) on every scored change.

---

## 🧪 Testing

```bash
npm test                       # pure-logic unit tests (node --test, no deps)
npx playwright test            # browser smoke tests (solo flow + persistence)
```

Unit tests cover scoring (incl. the real tree=7 and building rules), animal-score direction,
pattern rotation/mirror, and the cube-blocks-stacking rule. Playwright verifies the page loads
error-free, a 3-token turn works, and the board survives a reload.

---

## 📚 Docs

- **[game-rules.md](./game-rules.md)** — full rules + solo variant + strategy
- **[PROGRESS.md](./PROGRESS.md)** — status, changelog, and roadmap
- **[DEPLOY.md](./DEPLOY.md)** — GitHub Pages deploy steps
- **[archive/](./archive/)** — earlier Phaser prototype and planning notes

---

## 🙏 Credits

Harmonies is © **Libellud** (2024) — designed by Johan Benvenuto, art by Maëva Da Silva.
This is a fan-made solo implementation for personal use. Please support the official game.
