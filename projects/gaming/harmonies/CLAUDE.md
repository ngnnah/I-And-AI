# CLAUDE.md — Harmonies

The single agent-facing doc for this project. Inherits the repo-wide
`/Users/nhat/repo-fun/I-And-AI/CLAUDE.md`. Human/player docs live elsewhere:
`README.md` (landing) and `game-rules.md` (full rules).

## What & scope

Solo digital build of Libellud's **Harmonies**, for casual "touch-and-go" play by the owner + wife,
each on their own device. Live: https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/

- **Mechanics are frozen & verified** against the real published Harmonies (BGA / official rules).
  Touch them only for a genuine bug.
- **Out of scope — don't build without asking:** multiplayer/networking, Side B (islands) board,
  Nature Spirit cards.
- **Current focus: 🎨 original art + design/layout + UI/UX.** Keep the calm aesthetic —
  soft/translucent, light colors, minimal motion, subtle over flashy.

## Architecture (no build step)

Static app. `index.html` (~2,870 lines) holds all UI/turn-flow/rendering/persistence inline in one
`<script type="module">` and imports **pure, testable** logic from `js/`:

| File | Responsibility |
| --- | --- |
| `js/game/scoring-engine.js` | all 6 scoring categories |
| `js/game/token-manager.js` | placement validation, stacking, terrain derivation |
| `js/game/hex-grid.js` | axial hex math + `getPatternOrientations` (6 rotations × mirror) |
| `js/data/tokens-config.js` | pouch distribution (120 tokens) + stacking rules |
| `js/data/animal-cards.js` | 32 animal cards (pattern, cube location, scoring) |

Rules: keep logic in `js/` pure, DOM/rendering in `index.html`, no bundler. State = one in-memory
`gameState` serialized to `localStorage` (`harmonies_solo_game`) after every scored change.
**Dead code, do not revive:** `js/main.js`, `js/phaser/**`, `js/game/{firebase-*,game-state}.js`
(old prototype / unused; `index.html` never imports them).

## Design & visual system (where art/UX work happens)

- **Hex render:** unclipped `.hex-cell` wraps a clipped `.hex-fill` (`clip-path` flat-top polygon) with
  an inset `::before` "grout" outline (a border on a clip-path fragments). All sizing flows from ONE
  CSS var `--hex-w` (`:root`, responsive ~62/52/46px); JS reads it via `getHexMetrics()`.
  **Change hex size = change `--hex-w` only.**
- **Terrain palette** — keep the CSS rules and the JS `TERRAIN_GRADIENTS` map in sync:
  water `#4A90E2→#357ABD` · field `#F5A623→#E09000` · trunk `#8B4513→#654321` ·
  leaves `#7ED321→#5FA518` · building `#D0021B→#A00116` · mountain `#7F8C8D→#5D6D6E` ·
  rock `#9aa4a5→#6f7d7e`.
- **Tokens are emoji** (`TOKEN_EMOJI`): blue 🌊 · yellow 🌼 · brown 🪵 · green 🍃 · red 🧱 · gray ⛰️.
  Composites: green-on-brown → 🌳; red-stacked → 🏡 (badge suppressed). **These are the main
  art-replacement target** — swap in `updateHexDisplay()` and mirror in the animal-card mini-pattern
  renderer. Swap emoji in JS with node `.split().join()`, never perl/sed (silent multibyte failures).
- **Branding:** one custom SVG `assets/harmonies-icon.svg` (Fuji + sun + sakura + Hokusai wave), used
  as favicon/header/apple-touch. New art → `assets/`, self-contained SVG or inline data URIs.

## Gotchas

- Animal scoring arrays are **descending**, scored `pointsArray[length - count]` → more cubes = more
  points. Don't "fix" the order.
- **Exact height matching** is the official rule: a `mountain` card needs the exact gray height; rock
  (1 gray) ≠ mountain (2+). Don't relax it.
- Firebase `DataSnapshot.forEach` **cancels on a truthy return** — use a block body, never
  `arr.push(...)` as the arrow expression.
- "New Game" sets `suppressSave` so `beforeunload` doesn't re-save the cleared board.
- 4-card hand limit counts **uncompleted** cards (`activeHandCount()`); completing one frees a slot.

## Workflow

```bash
# run (ES modules need http, not file://)
cd projects/gaming/harmonies && python3 -m http.server 8001   # → localhost:8001
npm test                    # node --test, no deps — pure-logic units
npx playwright test         # browser smoke: load, 3-token turn, persistence, Finish
```
Playwright: `page.reload({ waitUntil:'networkidle' })` after clearing localStorage so modules load
before clicks (see `/playwright` skill). Test logic + critical flows; skip CSS/animation detail.

**Deploy** (GitHub Pages from `public/`). From repo root, rsync source → `public/` **excluding `*.md`**
(docs must not go public), then commit `public/` + push (rebuilds ~1 min). Verify `.md` files 404.
```bash
rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='tests' \
  --exclude='test-results' --exclude='playwright-report' --exclude='playwright.config.js' \
  --exclude='package.json' --exclude='package-lock.json' --exclude='archive' \
  --exclude='public' --exclude='*.md' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/
```

## Optional Firebase scoreboard

Not multiplayer — finished games push `{name, score, suns, ts}` to a `scores` node (Realtime DB,
dynamic-imported v10 SDK; game runs fine offline if unreachable). Needs only `databaseURL`, no auth.
DB rules (open read/write is fine for a personal 2-player scoreboard):
```json
{ "rules": { "scores": { ".read": true, ".write": true, ".indexOn": ["ts"] } } }
```
