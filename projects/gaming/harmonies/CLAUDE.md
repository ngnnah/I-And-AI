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
  soft/translucent, light colors, minimal motion, subtle over flashy. **Next-steps backlog: `PLAN.md`.**

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
| `js/audio/sfx-palette.js` | **pure** — token-colour voices, pentatonic pitches, event cues |
| `js/audio/ambience-scenes.js` | **pure** — 3 ambience scenes as declarative layer specs |
| `js/audio/sound-engine.js` | the ONLY file touching `AudioContext`; renders those specs |

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
- **Tokens are ORIGINAL SVG art**, not emoji. One `<symbol>` per terrain in a sheet at the top of
  `<body>`, drawn by `tokenGlyph(symbolId, size)` as a `<use>`. **Nine glyphs, not six** — `tok-water`
  `tok-field` `tok-leaf` `tok-tree` `tok-trunk` `tok-brick` `tok-house` `tok-mountain` `tok-rock`,
  because rock (1 gray) is visually distinct from mountain (2+), as are leaf/tree and brick/building.
  Three call sites must agree, all keyed off the same symbols:
  `updateHexDisplay()` (board, via `TOKEN_SYMBOL` + composite rules), the two token-chip renderers,
  and `renderMiniPattern()` (animal cards, via `TERRAIN_SYMBOL_MINI`). Add a terrain → add it to
  *both* maps or board and cards silently diverge.
  - **`TOKEN_SYMBOL` holds the UN-STACKED shapes; `STACK_PROMOTES` upgrades them.** A drafted token
    in the supply is always singular, so its chip must show leaf / brick / **rock** — never tree /
    house / **mountain**. Only `updateHexDisplay()` promotes, and only when `stack.length > 1`.
    Putting a composite in `TOKEN_SYMBOL` silently breaks the chips. `COLOR_NAMES` is *only* the chip
    tooltip, so it names the loose token too (Brick, Rock — not Building, Mountain).
  - **No discs.** The hex/chip gradient carries the terrain colour; the glyph is a lit shape on top
    (`.tok-glyph` drop-shadow lifts it). Don't reintroduce a disc behind a glyph — it double-paints
    the colour and reads busy.
  - `TOKEN_EMOJI` / `TERRAIN_EMOJI_MINI` survive as `title=` labels + a fallback, and the sound
    system keys off token *colour*, so leave both maps alone.
  - **Iterate in `dev-token-lab.html`, never in `index.html`.** It copies the real hex CSS and
    gradients and renders all nine glyphs at 62/52/46/22px plus a board cluster and card
    mini-patterns. Edit the symbol block there, screenshot, then copy the block across — keep the two
    copies identical. Authoring notes learned the hard way: an S-curve alone reads as the letter "S";
    a smooth ellipse reads as "0", not a rock; open `<path>`s need explicit `fill="none"` or they
    fill black; 22px is where detail dies, so silhouette beats detail.
  - Editing emoji strings in JS: use node `.split().join()`, never perl/sed (multibyte failures).
- **Branding:** one custom SVG `assets/harmonies-icon.svg` (Fuji + sun + sakura + Hokusai wave), used
  as favicon/header/apple-touch. New art → `assets/`, self-contained SVG or inline data URIs.

## Sound system

Fully procedural WebAudio — **no audio files, zero asset bytes**. Controls live in the header 🔊
popover; prefs persist in `localStorage` (`harmonies_sound_prefs`). SFX default **on**, ambience
default **off** (uninvited background audio is jarring, and browsers block it pre-gesture anyway).

- **Placement is an instrument.** Every pitch comes from the D-major-pentatonic `LADDER` in
  `sfx-palette.js` — a pentatonic scale has no semitone clashes, so ~90 placements a game never
  sound sour. **Don't add off-ladder frequencies;** `tests/sound.test.js` fails if you do.
  Pitch = `LADDER[base + 3*(height-1)]`, so stacking climbs. Cues key off **token colour**, not
  derived terrain, and each colour has its own timbre so colours stay distinguishable when pitches
  overlap.
- **Ambience scenes** are lists of `noiseBed` / `drone` / `randomEvent` layer specs. `gain` is
  *relative* (0–1, must sum ≤ 1 per scene); the engine multiplies by `AMBIENCE_CAP` (**0.06**) so
  ambience can never climb over the game.
- **The mix is calibrated by measurement, not by guess.** Two Playwright tests render SFX and
  ambience through an `OfflineAudioContext` and compare **RMS**, asserting (a) ambience sits at
  0.05–0.9× the cues — above ~1.0 the bed masks them, which is what a naive cap did at 0.18 — and
  (b) no single placement voice is >4× quieter than its siblings. Peak alone can't catch either:
  ambience is continuous while cues are brief, so equal peaks still leave cues masked.
  **Beware narrow bandpass over pink noise** — at Q>1 it passes almost no energy, which is how the
  🍃 leaves voice ended up ~8× too quiet. Keep Q low (≲0.7) on noise voices.
- **Loudness has exactly one knob: `OUTPUT_TRIM` in `sound-engine.js`** (currently 7), applied at
  the master on top of the user's 0–1 volume. Per-part `vol` values are *relative weights* tuned
  against each other — rescaling them destroys the measured SFX/ambience and cross-voice balance.
  Change the trim, not the palette. A clipping test asserts the worst realistic case (ambience +
  placement + cue together) stays under 0.8.
- **📱 Phone is the primary platform, and phone speakers roll off hard below ~500 Hz.** This bit
  hard: a bare D3 (147 Hz) sine mountain voice kept only **3%** of its energy through a phone
  speaker, so the loudest laptop voice was the quietest phone voice — the mix was *inverted* where
  the game is actually played. Deep voices therefore carry explicit upper partials (for `gray`,
  3× D3 = A4 and 4× = D5, so the harmonic series lands in-scale for free); the ear infers the
  missing fundamental and it still reads as deep. `tests/ui.spec.js` renders every cue through a
  500 Hz highpass and asserts ≥30% of its energy survives, plus a phone-side balance spread <4×.
  **When a cue is too quiet on a phone, add upper harmonics — don't just raise `vol`.** For the
  error cue the fix was the opposite of loudness: *cutting* the sub-500 Hz parts a phone can't
  reproduce raised its phone-audible share while keeping it the quietest cue in the palette, which
  it must stay. Also: brown noise is −6 dB/oct and carries nothing above ~500 Hz — use pink there.
- **The main bug risk:** `randomEvent` layers are self-rescheduling `setTimeout` chains. They're held
  in a registry, cancelled on scene change, and guarded by a `generation` counter — a leak would
  silently stack scenes on top of each other. Covered by a dedicated test.
- **🍎 iOS Safari unlock — this shipped as total silence on iPhone once.** Safari only accepts
  *some* events as user activation for audio (`click`, `touchend`, `keydown`) — **not**
  `pointerdown`/`touchstart` — and it may refuse a `resume()` outright. The original code listened
  on `pointerdown` with `{ once: true }` and had `unlock()` return `true` whenever a context merely
  *existed*, so one refused resume meant silence for the whole session. Rules now:
  1. `unlock()` is **async** and returns whether the context is genuinely `running`. Never treat
     "a context exists" as success.
  2. Listen on all of `pointerdown`/`touchend`/`click`/`keydown`, in the **capture** phase (so the
     context wakes before a click handler plays a cue), and **keep listening until running** — no
     `{ once: true }`.
  3. **Never create a real `AudioContext` before a gesture** — `ensure()` refuses until
     `unlock()` is called. A cue during init (the pouch refill) used to create one, the worst
     starting state on iOS.
  4. iOS needs a 1-sample silent buffer played once to wake its output path (`state.primed`).
  5. Never schedule into a suspended realtime context — `currentTime` is frozen so the sound is
     lost. Note an `OfflineAudioContext` *also* reports `"suspended"` until `startRendering()`, so
     that guard checks for `startRendering` to tell the two apart.
- **Test Safari changes under WebKit:** `npx playwright test tests/safari-audio.spec.js --browser=webkit`.
  Every other audio test injects a fake/offline context and therefore never touches the real unlock
  path — which is exactly how the iPhone silence got through a green suite.
- Audio failure is always silent, never fatal: the engine latches `dead` on first error so a broken
  context isn't retried ~90 times a game. Context suspends on `visibilitychange` (phone battery).
- **Audition by ear:** `dev-sound-lab.html` (dev-only, excluded from deploy by `--exclude='dev-*'`)
  plays every voice/cue/scene in isolation. Use it before/after touching the palette — automated
  tests confirm a signal exists and stays under the cap, but only your ears judge *calm*.
- Known limitation, don't chase: iOS Safari honours the hardware mute switch for WebAudio.

## Gotchas

- Animal scoring arrays are **descending**, scored `pointsArray[length - count]` → more cubes = more
  points. Don't "fix" the order.
- **Exact height matching** is the official rule: a `mountain` card needs the exact gray height; rock
  (1 gray) ≠ mountain (2+). Don't relax it.
- Firebase `DataSnapshot.forEach` **cancels on a truthy return** — use a block body, never
  `arr.push(...)` as the arrow expression.
- "New Game" sets `suppressSave` so `beforeunload` doesn't re-save the cleared board.
- 4-card hand limit counts **uncompleted** cards (`activeHandCount()`); completing one frees a slot.
- The `<header>` must **not** have `overflow-hidden` — it clips the sound popover. The emoji
  watermark self-clips via `.header-emojis { overflow:hidden; border-radius:inherit }` instead.
- `showMessage(..., 'error')` is the single hook for the error cue — every blocked action funnels
  through it, so don't add per-site error sounds.

## Workflow

```bash
# run (ES modules need http, not file://)
cd projects/gaming/harmonies && python3 -m http.server 8001   # → localhost:8001
                                                              # → /dev-sound-lab.html to audition audio
npm test                    # node --test, no deps — pure-logic units (incl. sound palette/scenes)
npx playwright test         # browser smoke + OfflineAudioContext render checks
```
Playwright: `page.reload({ waitUntil:'networkidle' })` after clearing localStorage so modules load
before clicks (see `/playwright` skill). Test logic + critical flows; skip CSS/animation detail.

**Deploy** (GitHub Pages from `public/`). From repo root, rsync source → `public/` **excluding `*.md`**
(docs must not go public) **and `dev-*`** (dev-only tools like the sound lab), then commit `public/` +
push (rebuilds ~1 min). Verify `.md` and `dev-*` files 404.
```bash
rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='tests' \
  --exclude='test-results' --exclude='playwright-report' --exclude='playwright.config.js' \
  --exclude='package.json' --exclude='package-lock.json' --exclude='archive' \
  --exclude='public' --exclude='*.md' --exclude='dev-*' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/
```

## Optional Firebase scoreboard

Not multiplayer — finished games push `{name, score, suns, ts}` to a `scores` node (Realtime DB,
dynamic-imported v10 SDK; game runs fine offline if unreachable). Needs only `databaseURL`, no auth.
DB rules (open read/write is fine for a personal 2-player scoreboard):
```json
{ "rules": { "scores": { ".read": true, ".write": true, ".indexOn": ["ts"] } } }
```
