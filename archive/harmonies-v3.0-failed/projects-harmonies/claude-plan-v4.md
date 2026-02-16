# Harmonies v4.0 - Phaser.js Implementation Plan

**Date:** 2026-02-16
**Status:** Planning Phase - Awaiting User Approval

---

## Executive Summary

**Why v4.0?** v3.0 implementation has critical rendering bugs - hex grid is barely visible and badly positioned at bottom-right corner. CSS Grid + clip-path approach is too fragile for hexagonal game boards.

**Solution:** Rebuild using **Phaser.js** - a proven game framework with excellent hex grid support, mobile touch handling, and sprite management.

**What We Keep from v3.0:**

- ✅ All corrected game rules (GRAY=mountains, RED=buildings, 6 scoring formulas)
- ✅ Firebase Realtime Database multiplayer sync
- ✅ Game logic (token-manager.js, scoring-engine.js, hex-grid.js coordinate math)
- ✅ 64 passing tests
- ✅ Player profiles, lobby system, session management

**What We Rebuild:**

- ❌ CSS hex grid → ✅ Phaser.js hex rendering with Honeycomb plugin
- ❌ DOM-based board → ✅ Canvas-based game board
- ❌ CSS animations → ✅ Phaser tweens and particle effects
- ❌ Custom touch handling → ✅ Phaser input system

**Timeline:** 3-4 hours (faster than v3.0 because game logic already correct)

---

## Post-Mortem: Why v3.0 Failed

### Critical Bug: Hex Grid Not Rendering

**User Report:** "barely visible; badly positioned hexes" - hexes appeared at bottom-right corner, tiny size

**Root Cause Analysis:**

1. **CSS Grid Positioning Math Error**

   ```javascript
   // board-renderer-simple.js lines 83-88
   const col = q;
   const row = r + Math.floor(q / 2);
   hexEl.style.gridColumn = col + 10; // Offset to allow negative coords
   hexEl.style.gridRow = row + 10;
   ```

   - This offset-grid approach works in theory but CSS Grid doesn't handle sparse grids well
   - Grid columns/rows beyond viewport get collapsed or positioned weirdly
   - Clip-path hexagons have no fallback if grid positioning fails

2. **Fragile CSS Hexagon Shape**

   ```css
   /* styles.css line 199 */
   clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
   ```

   - Clip-path creates visual hex but element bounding box is still rectangular
   - Mouse/touch hit detection uses bounding box, not clipped shape
   - Stacking z-index issues when hexes overlap

3. **No Container Bounds Management**
   - Hex grid container has fixed 20×20 grid (lines 210-211 in styles.css)
   - Game board grows dynamically (expansion hexes)
   - No centering logic as board expands
   - Grid template doesn't adapt to actual hex count

### Architectural Issues

1. **Violated CLAUDE.md Guidelines**
   - CLAUDE.md explicitly recommends: "Games: Phaser.js, PixiJS, Kaboom.js, Godot"
   - I chose custom CSS implementation instead
   - User correctly called this out: "Why not use existing tools/libraries: e.g. Phaser ; HexPixiJs, von-grid"

2. **Reinvented Solved Problems**
   - Hex coordinate math: Red Blob Games has proven algorithms
   - Touch handling on mobile: Phaser has built-in mobile support
   - Sprite stacking: Phaser depth sorting handles this automatically
   - Drag-and-drop: Phaser input plugins

3. **Testing Blind Spot**
   - All 64 tests passed (scoring logic correct)
   - But never tested actual rendering in browser during development
   - No visual regression testing
   - "100% complete" claim was premature

---

## Phaser.js Architecture (v4.0)

### Why Phaser?

**Strengths:**

- ✅ **Canvas rendering** - Precise pixel control, no CSS layout bugs
- ✅ **Scene management** - Clean separation of lobby/game/endgame screens
- ✅ **Input system** - Touch, mouse, keyboard, drag-and-drop built-in
- ✅ **Sprite management** - Depth sorting, containers, groups
- ✅ **Tweens & animations** - Smooth token placement, score updates
- ✅ **Mobile-optimized** - Touch events, pinch-zoom, responsive scaling
- ✅ **Asset loading** - Preload images, handle loading states
- ✅ **Camera system** - Pan, zoom, bounds (perfect for expanding hex grid)

**Hex Grid Support:**

- **Honeycomb plugin** - Phaser plugin for hex grids (axial coordinates)
- **Red Blob Games algorithms** - Reference for pathfinding, neighbors, rotation
- **HexPixiJS** - Alternative if Honeycomb doesn't fit (PixiJS-based)

**Firebase Integration:**

- Phaser runs game logic in scenes
- Firebase listeners update Phaser scene state
- No conflict - Phaser handles rendering, Firebase handles sync

### Technology Stack

```yaml
Frontend:
  - Phaser.js 3.80.1 (latest stable)
  - Honeycomb plugin for hex grids
  - Vanilla JS (ES6 modules) for non-Phaser code
  - HTML/CSS for UI overlays (lobby, modals)

Backend:
  - Firebase Realtime Database (same as v3.0)
  - Firebase Auth (optional - currently using username-only)

Assets:
  - Token sprites: 60×60px PNG (blue, yellow, brown, green, red, gray)
  - Animal card images: 160×240px
  - Hex tile sprites: 80×92px (flat-topped hexagon)
  - Background: Tiled pattern or solid color

Build:
  - No build step required (Phaser via CDN)
  - ES6 modules with type="module"
  - Deploy to GitHub Pages as static site
```

### File Structure (v4.0)

```
projects/gaming/harmonies/
├── index.html                     # Entry point
├── css/
│   └── styles.css                 # UI overlays only (lobby, modals)
├── js/
│   ├── main.js                    # Initialize Phaser, route to scenes
│   ├── phaser/
│   │   ├── config.js              # NEW: Phaser game config
│   │   ├── scenes/
│   │   │   ├── LobbyScene.js      # NEW: Lobby in Phaser
│   │   │   ├── GameScene.js       # NEW: Main gameplay (hex board)
│   │   │   ├── EndGameScene.js    # NEW: Score breakdown, winner
│   │   │   └── PreloadScene.js    # NEW: Asset loading
│   │   ├── objects/
│   │   │   ├── HexGrid.js         # NEW: Phaser hex grid manager
│   │   │   ├── TokenSprite.js     # NEW: Token game object
│   │   │   ├── AnimalCard.js      # NEW: Card game object
│   │   │   └── CentralBoard.js    # NEW: Token supply board
│   │   └── plugins/
│   │       └── honeycomb.js       # Honeycomb hex grid plugin
│   ├── game/
│   │   ├── hex-grid.js            # ✅ KEEP (coordinate math)
│   │   ├── token-manager.js       # ✅ KEEP (stacking rules)
│   │   ├── scoring-engine.js      # ✅ KEEP (all 6 formulas)
│   │   ├── game-state.js          # ✅ KEEP (localStorage)
│   │   ├── firebase-config.js     # ✅ KEEP (DB setup)
│   │   └── firebase-sync.js       # ⚠️ UPDATE (emit Phaser events)
│   ├── screens/
│   │   └── player-setup.js        # ✅ KEEP (username login)
│   ├── data/
│   │   ├── tokens-config.js       # ✅ KEEP (colors, stacking)
│   │   └── animal-cards.js        # ✅ KEEP (10 cards)
│   └── utils/
│       └── phaser-firebase-bridge.js  # NEW: Sync Phaser ↔ Firebase
├── assets/
│   ├── sprites/
│   │   ├── tokens/
│   │   │   ├── blue.png
│   │   │   ├── yellow.png
│   │   │   ├── brown.png
│   │   │   ├── green.png
│   │   │   ├── red.png
│   │   │   └── gray.png
│   │   ├── hex-tile.png           # Base hex sprite
│   │   └── hex-expansion.png      # Dashed border hex
│   ├── cards/
│   │   └── animal-{1-10}.png      # Animal card images
│   └── ui/
│       └── background.jpg
└── tests/
    ├── core-logic.test.js         # ✅ KEEP (64 tests)
    └── phaser-rendering.test.js   # NEW: Visual tests (optional)
```

### Key Architectural Changes

#### 1. Phaser Scene Management

**v3.0 (DOM routing):**

```javascript
// main.js
function showScreen(screenName) {
  document.getElementById("screen-" + screenName).classList.remove("hidden");
}
```

**v4.0 (Phaser scenes):**

```javascript
// js/phaser/config.js
const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  scene: [PreloadScene, LobbyScene, GameScene, EndGameScene],
  scale: {
    mode: Phaser.Scale.FIT, // Responsive scaling
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// main.js
const game = new Phaser.Game(config);
```

#### 2. Hex Grid Rendering

**v3.0 (CSS Grid - BROKEN):**

```javascript
// board-renderer-simple.js
const hexEl = document.createElement("div");
hexEl.style.gridColumn = col + 10;
hexEl.style.gridRow = row + 10;
```

**v4.0 (Phaser + Honeycomb):**

```javascript
// js/phaser/objects/HexGrid.js
import Honeycomb from "honeycomb-grid";

class HexGrid extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    // Create hex grid with Honeycomb
    const Hex = Honeycomb.extendHex({
      size: 40, // Radius in pixels
      orientation: "flat", // Flat-topped hexes
    });

    this.Grid = Honeycomb.defineGrid(Hex);
    this.hexSprites = new Map(); // Map of "q_r" -> Phaser.Image
  }

  addHex(q, r, terrain) {
    const hex = this.Grid.pointToHex(q, r);
    const point = hex.toPoint();

    // Create hex sprite at correct pixel position
    const hexSprite = this.scene.add.image(point.x, point.y, "hex-tile");
    hexSprite.setData("coord", { q, r });

    // Add to container (auto-handles depth sorting)
    this.add(hexSprite);
    this.hexSprites.set(`${q}_${r}`, hexSprite);

    return hexSprite;
  }
}
```

#### 3. Token Stacking

**v3.0 (CSS z-index):**

```javascript
// board-renderer-simple.js
tokenEl.style.bottom = `${index * 8}px`; // Stack effect
```

**v4.0 (Phaser depth + containers):**

```javascript
// js/phaser/objects/TokenSprite.js
class TokenSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, color) {
    super(scene, x, y);

    // Add token sprite
    const sprite = scene.add.sprite(0, 0, `token-${color}`);
    this.add(sprite);

    // Tokens auto-stack with container.add()
    // Phaser handles depth sorting
  }

  stackOnHex(hexSprite, stackIndex) {
    const offset = stackIndex * 12; // Vertical offset
    this.setPosition(hexSprite.x, hexSprite.y - offset);
    this.setDepth(hexSprite.depth + stackIndex + 1);
  }
}
```

#### 4. Touch Input & Drag-and-Drop

**v3.0 (Custom touch handlers):**

```javascript
// game-room.js
container.addEventListener("touchstart", handleTouchStart);
container.addEventListener("touchmove", handleTouchMove);
```

**v4.0 (Phaser input system):**

```javascript
// js/phaser/scenes/GameScene.js
class GameScene extends Phaser.Scene {
  create() {
    // Enable drag on token sprites
    this.input.on("dragstart", (pointer, gameObject) => {
      gameObject.setScale(1.2); // Visual feedback
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      this.placeToken(gameObject, dropZone);
    });

    // Hex sprites are drop zones
    this.hexGrid.hexSprites.forEach((hexSprite) => {
      hexSprite.setInteractive();
      this.input.setDropZone(hexSprite);
    });
  }
}
```

#### 5. Firebase ↔ Phaser Bridge

**v3.0 (DOM updates):**

```javascript
// firebase-sync.js
gameRef.on("value", (snapshot) => {
  const game = snapshot.val();
  document.getElementById("score").textContent = game.score;
});
```

**v4.0 (Phaser events):**

```javascript
// js/utils/phaser-firebase-bridge.js
export class PhaserFirebaseBridge {
  constructor(scene) {
    this.scene = scene;
    this.gameRef = null;
  }

  listenToGame(gameId) {
    this.gameRef = firebase.database().ref(`games/${gameId}`);

    this.gameRef.on("value", (snapshot) => {
      const gameData = snapshot.val();

      // Emit Phaser events (scenes listen to these)
      this.scene.events.emit("firebase:gameUpdate", gameData);
      this.scene.events.emit("firebase:scoreUpdate", gameData.score);
      this.scene.events.emit("firebase:boardUpdate", gameData.board);
    });
  }
}

// In GameScene.js
this.events.on("firebase:boardUpdate", (board) => {
  this.hexGrid.updateFromState(board.hexGrid);
});
```

---

## Implementation Plan (Phases)

### Phase 0: Setup & Proof of Concept (30 min)

**Goal:** Verify Phaser + Honeycomb can render hexagons correctly

1. **Create minimal Phaser test** (10 min)
   - New file: `phaser-hex-test.html`
   - Load Phaser from CDN
   - Create simple scene with 7 hex sprites (1 center + 6 neighbors)
   - Verify hexes are visible, centered, correct size

2. **Test Honeycomb plugin** (10 min)
   - Integrate Honeycomb library
   - Create hex grid with axial coordinates
   - Convert hex coords to pixel positions
   - Verify math matches our coordinate system from v3.0

3. **Create token sprites** (10 min)
   - Generate 60×60px colored circles in Figma/Canvas
   - Export as PNG: blue.png, yellow.png, brown.png, green.png, red.png, gray.png
   - Load in Phaser, render on top of hex
   - Verify stacking with depth

**Deliverable:** Working Phaser hex grid with 7 hexagons and 3 stacked tokens

### Phase 1: Phaser Game Structure (1 hour)

**Goal:** Migrate v3.0 screens to Phaser scenes

1. **Create Phaser config** (10 min)
   - `js/phaser/config.js` - Game dimensions, scenes, scale mode
   - `main.js` - Initialize Phaser game instance
   - Test scene transitions

2. **PreloadScene** (10 min)
   - Load all sprite assets (tokens, hexes, cards)
   - Loading bar
   - Transition to LobbyScene

3. **LobbyScene** (20 min)
   - Port player-setup.js username login
   - Game creation/join UI (Phaser text + buttons)
   - Firebase integration (same as v3.0)
   - Transition to GameScene on game start

4. **GameScene shell** (20 min)
   - Create empty GameScene
   - Add camera (pan, zoom, bounds)
   - Add placeholder hex grid container
   - Add UI layer (score, turn indicator)
   - Test scene initialization

### Phase 2: Hex Grid & Token Rendering (1 hour)

**Goal:** Render dynamic hex board with token stacking

1. **HexGrid class** (30 min)
   - `js/phaser/objects/HexGrid.js`
   - Initialize Honeycomb grid
   - Methods:
     - `addHex(q, r, terrain)` - Create hex sprite at coord
     - `removeHex(q, r)` - Remove hex (expansion hexes)
     - `getHexAt(q, r)` - Get sprite by coord
     - `highlightHex(q, r, color)` - Show valid placement
     - `updateFromState(hexGrid)` - Sync with Firebase state

2. **TokenSprite class** (20 min)
   - `js/phaser/objects/TokenSprite.js`
   - Container with token sprite + optional label
   - Methods:
     - `stackOnHex(hexSprite, stackIndex)` - Position token on hex
     - `animatePlacement(duration)` - Tween from drag position
     - `showDrag()` / `hideDrag()` - Visual feedback

3. **Integration test** (10 min)
   - Load initial game state from Firebase (starting hex "0_0")
   - Render hex grid with expansion hexes (7 total)
   - Place 3 tokens on center hex
   - Verify:
     - Hexes visible and centered on screen
     - Tokens stack vertically (12px offset)
     - Camera can pan/zoom
     - No positioning bugs

### Phase 3: Token Placement Interaction (45 min)

**Goal:** Full token placement flow (select space → drag tokens → validate → place)

1. **CentralBoard class** (15 min)
   - `js/phaser/objects/CentralBoard.js`
   - Render 5 spaces (3×3 grid of tokens each)
   - Interactive buttons to select space
   - Visual feedback (highlight selected space)

2. **Drag-and-drop system** (20 min)
   - Make token sprites draggable
   - Hex sprites as drop zones
   - Validation on drop:
     - `canPlaceToken(hex, token, placedAnimals)` from token-manager.js
     - Show error message if invalid
   - Animate token to hex center if valid
   - Update Firebase on successful placement

3. **Turn flow** (10 min)
   - Sequential placement: token 1/3 → 2/3 → 3/3
   - Disable drag during opponent's turn
   - Progress indicator (Phaser text)
   - "End Turn" button
   - Refill central board on turn end

### Phase 4: Scoring & Game End (30 min)

**Goal:** Integrate v3.0 scoring engine, show score updates, end game

1. **Score display** (10 min)
   - Phaser text object (top-right corner)
   - Update on `firebase:scoreUpdate` event
   - Animate score increase (tween + particle effect)

2. **Score calculation** (10 min)
   - Call scoring-engine.js functions on token placement
   - Send updates to Firebase
   - All 6 scoring modules already correct from v3.0

3. **EndGameScene** (10 min)
   - Triggered when game ends (pouch empty or ≤2 spaces)
   - Show final scores for all players
   - Score breakdown modal (trees, mountains, fields, buildings, water, animals)
   - Winner announcement
   - "Play Again" button

### Phase 5: Polish & Mobile (45 min)

**Goal:** Mobile-first optimizations, animations, accessibility

1. **Touch optimizations** (15 min)
   - Increase touch target size for mobile (Phaser hitArea)
   - Pinch-zoom (Phaser camera zoom)
   - Pan with touch drag (camera pan)
   - Haptic feedback (Vibration API)

2. **Animations** (15 min)
   - Token placement: fly-in tween (0.3s ease-out)
   - Hex highlight: pulse tween (0.5s loop)
   - Score update: count-up animation
   - Turn transition: confetti particles

3. **Accessibility** (15 min)
   - Keyboard navigation (Tab, Enter)
   - ARIA labels on UI overlay elements
   - High contrast mode support
   - Reduced motion (disable tweens if `prefers-reduced-motion`)

### Phase 6: Testing & Deployment (30 min)

**Goal:** Verify correctness, deploy to GitHub Pages

1. **Visual verification** (10 min)
   - Open in Chrome, test on localhost:8080
   - Verify hex grid renders centered, visible, correct size
   - Test token placement (drag-and-drop)
   - Test scoring updates
   - Test multiplayer sync (2 browser windows)

2. **Mobile testing** (10 min)
   - Test on iPhone (Safari)
   - Test on Android (Chrome)
   - Verify touch targets ≥ 44px
   - Verify pinch-zoom works

3. **Deploy** (10 min)
   - Rsync to public/
   - Force-add assets: `git add -f public/projects/gaming/harmonies/assets/`
   - Commit and push
   - Verify live site works

---

## Key Technical Decisions

### Decision 1: Pure Phaser vs. Hybrid Approach?

**Option A: Pure Phaser (Recommended)**

- All UI in Phaser (lobby, game, modals)
- No DOM elements except root `<canvas>`
- Pros: Consistent rendering, no CSS bugs, easier mobile
- Cons: More Phaser code, text input harder

**Option B: Hybrid (Phaser game + HTML UI)**

- Lobby/modals in HTML/CSS (current v3.0 screens)
- Only game board in Phaser canvas
- Pros: Reuse v3.0 UI code, easier forms
- Cons: Mixing rendering contexts, potential z-index issues

**Recommendation:** Option B (Hybrid) for v4.0 MVP

- Faster implementation (reuse lobby.js, player-setup.js)
- Phaser only for game board (where we need pixel-perfect hex grid)
- Can migrate to pure Phaser in v5.0 if needed

### Decision 2: Honeycomb vs. HexPixiJS vs. von-grid?

**Honeycomb Grid:**

- Mature library (10k+ downloads/month)
- Works with Phaser (not Phaser-specific)
- Clean API for axial coordinates, neighbors, rotation
- Cons: Not actively maintained (last update 2020)

**HexPixiJS:**

- Built for PixiJS (Phaser's renderer)
- More features (pathfinding, fog of war)
- Cons: Heavier library, overkill for our needs

**von-grid:**

- Lightweight (2KB)
- Simple hex math utilities
- Cons: No built-in rendering, just math

**Recommendation:** Start with Honeycomb

- Best fit for our coordinate system (already uses axial)
- Can swap to von-grid if Honeycomb has issues
- HexPixiJS is overkill for v4.0

### Decision 3: Asset Generation Strategy?

**Option A: Generate sprites programmatically**

- Use Phaser.Graphics to draw tokens, hexes
- Pros: No asset files needed, easy color tweaks
- Cons: Harder to make visually appealing

**Option B: Pre-made sprites**

- Create PNG sprites in Figma/Photoshop
- Pros: Better visual quality, can add textures
- Cons: Need design tool, more files to manage

**Option C: Use official Harmonies assets**

- Extract from `/data/harmonies/03_CONTENT/`
- Pros: Authentic look
- Cons: May need resizing, licensing unclear

**Recommendation:** Option A for MVP, Option C for polish

- Use Phaser.Graphics for v4.0 (colored circles, simple hex outline)
- Upgrade to official assets later if licensing allows

### Decision 4: Camera Bounds & Zoom?

**Requirements:**

- Board starts small (1 hex) and grows dynamically
- Camera should center on board and zoom to fit
- User should be able to pan/zoom manually

**Implementation:**

```javascript
// GameScene.js
this.cameras.main.setBounds(-1000, -1000, 2000, 2000);
this.cameras.main.setZoom(1);

// When board grows, re-center camera
recenterCamera() {
  const bounds = this.hexGrid.getBounds();
  this.cameras.main.centerOn(bounds.centerX, bounds.centerY);

  // Auto-zoom to fit board
  const zoom = Math.min(
    this.cameras.main.width / bounds.width,
    this.cameras.main.height / bounds.height
  );
  this.cameras.main.setZoom(zoom * 0.8);  // 80% to add margin
}
```

---

## Migration Strategy (v3.0 → v4.0)

### Files to Keep (No Changes)

1. **Game logic** (100% reuse):
   - `js/game/hex-grid.js` - Coordinate math
   - `js/game/token-manager.js` - Stacking validation
   - `js/game/scoring-engine.js` - All 6 scoring formulas
   - `js/data/tokens-config.js` - Token colors, stacking rules
   - `js/data/animal-cards.js` - 10 animal cards

2. **Firebase** (100% reuse):
   - `js/game/firebase-config.js` - DB setup
   - `js/game/game-state.js` - localStorage player profiles
   - Firebase data schema (no changes)

3. **Tests** (100% reuse):
   - `tests/core-logic.test.js` - 64 tests still valid

### Files to Update (Minor Changes)

1. **firebase-sync.js** (add Phaser event emission):

   ```javascript
   // OLD: Update DOM
   document.getElementById("score").textContent = game.score;

   // NEW: Emit Phaser event
   window.phaserGame.scene.scenes[1].events.emit(
     "firebase:scoreUpdate",
     game.score,
   );
   ```

2. **main.js** (initialize Phaser):

   ```javascript
   // OLD: DOM routing
   showScreen("lobby");

   // NEW: Phaser game instance
   window.phaserGame = new Phaser.Game(config);
   ```

### Files to Replace (Complete Rewrite)

1. **Rendering**:
   - ❌ `js/ui/board-renderer-simple.js` → ✅ `js/phaser/objects/HexGrid.js`
   - ❌ `js/ui/board-renderer.js` (SVG version) → ✅ Delete

2. **Game UI**:
   - ❌ `js/screens/game-room.js` → ✅ `js/phaser/scenes/GameScene.js`

3. **CSS** (minimal):
   - Keep `css/styles.css` for UI overlays (lobby, modals)
   - Remove all hex-grid-specific CSS (lines 187-256)

---

## Testing Strategy

### Visual Regression Tests

**Test 1: Hex Grid Centering**

- Load game with 1 starting hex
- Expected: Hex centered on screen, 80px side length, clearly visible
- Success criteria: Hex at viewport center ± 20px

**Test 2: Hex Expansion**

- Place 3 tokens (triggers expansion)
- Expected: 7 hexes total (1 center + 6 neighbors), evenly spaced
- Success criteria: Neighbor hexes 120px from center (center-to-center distance)

**Test 3: Token Stacking**

- Place 3 tokens on same hex (brown, brown, green)
- Expected: Tokens stack vertically, 12px offset each, green on top
- Success criteria: Green token depth > brown tokens

**Test 4: Camera Zoom**

- Grow board to 20+ hexes
- Expected: Camera auto-zooms out to fit board, maintains center
- Success criteria: All hexes visible, no clipping

**Test 5: Mobile Touch**

- Test on iPhone 14 (390×844px)
- Expected: Touch targets ≥ 44px, drag-and-drop works, pinch-zoom works
- Success criteria: No missed taps, smooth drag, zoom 0.5× to 2×

### Functional Tests (Same as v3.0)

All 64 tests from `tests/core-logic.test.js` should still pass (no changes to game logic).

---

## Timeline & Effort Estimate

**Total: 3-4 hours**

| Phase               | Duration | Notes                                  |
| ------------------- | -------- | -------------------------------------- |
| Phase 0 (POC)       | 30 min   | Verify Phaser + Honeycomb              |
| Phase 1 (Structure) | 1 hour   | Scenes, config, asset loading          |
| Phase 2 (Hexes)     | 1 hour   | Hex grid + token rendering (critical)  |
| Phase 3 (Input)     | 45 min   | Drag-and-drop, turn flow               |
| Phase 4 (Scoring)   | 30 min   | Score display, end game                |
| Phase 5 (Polish)    | 45 min   | Mobile, animations, accessibility      |
| Phase 6 (Deploy)    | 30 min   | Testing, sync to public/, push to main |

**Why Faster than v3.0?**

- Game logic already correct (no scoring rewrites)
- No debugging CSS positioning issues
- Phaser handles rendering complexity
- Honeycomb provides hex math

---

## Success Criteria (v4.0)

✅ **Hex Grid Rendering:**

- [ ] 7 hexes render at game start (1 center + 6 expansion)
- [ ] Hexes are centered on screen, clearly visible (80px side length)
- [ ] No positioning bugs (no tiny hexes at bottom-right)
- [ ] Camera auto-centers and zooms to fit board

✅ **Token Placement:**

- [ ] Drag-and-drop works (tokens follow pointer)
- [ ] Hex sprites highlight on hover (green glow for valid, red for invalid)
- [ ] Tokens stack vertically with 12px offset
- [ ] Stacking rules enforced (token-manager.js validation)

✅ **Scoring:**

- [ ] All 6 scoring formulas work (64 tests pass)
- [ ] Score updates in real-time on placement
- [ ] Score breakdown modal shows category details
- [ ] Winner declared correctly at game end

✅ **Multiplayer:**

- [ ] Firebase sync works (2 windows test)
- [ ] Turn-based flow (only current player can act)
- [ ] Board updates appear in all clients
- [ ] No race conditions or desyncs

✅ **Mobile-First:**

- [ ] Touch targets ≥ 44px (iOS HIG)
- [ ] Drag-and-drop works on mobile (iPhone, Android)
- [ ] Pinch-zoom works (0.5× to 2×)
- [ ] Responsive scaling (FIT mode, auto-center)

✅ **Polish:**

- [ ] Token placement animates (0.3s fly-in tween)
- [ ] Score updates with count-up animation
- [ ] Turn transitions smooth (no flicker)
- [ ] Keyboard navigation works (Tab, Enter)

---

## Open Questions for User Review

### 1. Phaser Approach Validation

**Question:** Should we go with hybrid approach (Phaser game board + HTML UI) or pure Phaser (all UI in canvas)?

**Recommendation:** Hybrid for v4.0 (reuse lobby code), pure Phaser for v5.0 if needed.

**Trade-offs:**

- Hybrid: Faster implementation, familiar HTML forms
- Pure Phaser: More consistent, better mobile performance

### 2. Asset Strategy

**Question:** Should we use programmatic sprites (Phaser.Graphics) or pre-made PNG assets?

**Recommendation:** Programmatic for MVP (colored circles), upgrade to official assets later.

**Trade-offs:**

- Programmatic: Fast to implement, easy to tweak colors
- PNG assets: Better visual quality, more authentic

### 3. Honeycomb Alternatives

**Question:** Should we use Honeycomb plugin or try HexPixiJS / von-grid?

**Recommendation:** Start with Honeycomb (best fit), swap if issues arise.

**Trade-offs:**

- Honeycomb: Clean API, good docs, not actively maintained
- HexPixiJS: More features, heavier, overkill for our needs
- von-grid: Lightweight, but just math (no rendering helpers)

### 4. Scope of v4.0

**Question:** Should v4.0 include all features from v3.0 (animal cards, solo mode, game history)?

**Recommendation:** Start with core gameplay (hex grid, token placement, scoring), add features incrementally.

**MVP Features for v4.0:**

- ✅ Hex grid rendering (fixed from v3.0)
- ✅ Token placement (drag-and-drop)
- ✅ Scoring (all 6 formulas)
- ✅ Multiplayer (Firebase sync)
- ✅ Mobile-first (touch, responsive)

**Defer to v4.1+:**

- ⏸️ Animal cards (pattern matching works but not critical)
- ⏸️ Solo mode (focus on multiplayer first)
- ⏸️ Game history (localStorage works, not urgent)
- ⏸️ Player stats (nice-to-have)

### 5. Testing Approach

**Question:** Should we add visual regression tests for Phaser rendering?

**Recommendation:** Manual testing for v4.0, automated visual tests for v5.0.

**Trade-offs:**

- Manual: Fast to implement, flexible
- Automated: Better coverage, but setup overhead (Playwright, Percy)

---

## Risk Analysis

### High Risk (Must Address)

1. **Honeycomb library outdated** (last update 2020)
   - **Mitigation:** Have fallback plan (von-grid), test early in Phase 0

2. **Phaser + Firebase integration complexity**
   - **Mitigation:** Use event emitter bridge (phaser-firebase-bridge.js), test in Phase 1

3. **Mobile performance** (canvas rendering can be heavy)
   - **Mitigation:** Use Phaser.AUTO (picks WebGL or Canvas), limit particle effects

### Medium Risk (Monitor)

1. **Asset loading time** (if using many PNG sprites)
   - **Mitigation:** Use sprite sheets, show loading bar (PreloadScene)

2. **Camera zoom/pan UX** (users may get lost)
   - **Mitigation:** Add "Reset Camera" button, auto-recenter on turn start

3. **Touch input conflicts** (Phaser vs. browser gestures)
   - **Mitigation:** Disable browser zoom (`touch-action: none`), test early on mobile

### Low Risk (Acceptable)

1. **Learning curve for Phaser** (if unfamiliar)
   - Already mitigated: Phaser has excellent docs, large community

2. **Code duplication** (Phaser objects + game logic)
   - Acceptable: Clean separation (Phaser for rendering, JS for logic)

---

## Comparison: v3.0 vs. v4.0

| Aspect                 | v3.0 (CSS)                         | v4.0 (Phaser)                         |
| ---------------------- | ---------------------------------- | ------------------------------------- |
| **Hex Rendering**      | CSS Grid + clip-path (BROKEN)      | Phaser sprites + Honeycomb (RELIABLE) |
| **Token Stacking**     | CSS z-index + bottom offset        | Phaser depth + container              |
| **Touch Input**        | Custom event handlers              | Phaser input system (built-in)        |
| **Animations**         | CSS transitions                    | Phaser tweens + particles             |
| **Camera**             | N/A (scrolling DIV)                | Phaser camera (pan, zoom, bounds)     |
| **Mobile Performance** | Good (DOM is fast)                 | Excellent (WebGL accelerated)         |
| **Visual Quality**     | CSS-limited                        | Full control (sprites, effects)       |
| **Code Complexity**    | High (custom hex math + CSS hacks) | Medium (Phaser + Honeycomb)           |
| **Maintainability**    | Low (fragile CSS positioning)      | High (standard game framework)        |
| **Learning Curve**     | Low (familiar HTML/CSS)            | Medium (need to learn Phaser API)     |
| **Time to MVP**        | 3 hours (but broken)               | 3-4 hours (working)                   |

---

## Next Steps

1. **User Review** - Please review this plan and provide feedback:
   - Are the architectural decisions sound?
   - Should we adjust scope (add/remove features)?
   - Any concerns about Phaser approach?

2. **Approval** - Once approved, I'll begin implementation:
   - Phase 0: Proof of concept (30 min)
   - Share screenshots of working hex grid
   - Proceed to Phase 1-6 if POC succeeds

3. **Iterative Updates** - I'll share progress after each phase:
   - Screenshots of hex grid, token placement, scoring
   - Report any blockers or deviations from plan
   - Adjust plan if needed based on findings

---

## Summary

**v4.0 Strategy:** Rebuild Harmonies with Phaser.js to fix critical hex rendering bugs from v3.0. Use proven game framework (Phaser) + hex library (Honeycomb) instead of custom CSS implementation. Keep all correct game logic from v3.0 (scoring, stacking rules, Firebase sync, 64 passing tests).

**Timeline:** 3-4 hours (faster than v3.0 because game logic is already correct).

**Key Improvements:**

- ✅ Hex grid renders correctly (centered, visible, no positioning bugs)
- ✅ Better touch input (Phaser's built-in mobile support)
- ✅ Smooth animations (tweens, particles)
- ✅ Scalable architecture (add features without CSS hacks)

**Risk Mitigation:**

- Test Phaser + Honeycomb in Phase 0 (30 min POC)
- Hybrid approach (reuse v3.0 UI code for lobby)
- Fallback plan if Honeycomb has issues (swap to von-grid)

---

**Ready for your review!** Please share feedback, and I'll proceed with implementation once approved. 🎮
