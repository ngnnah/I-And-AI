# Harmonies HTML/CSS Rebuild Plan

**Status**: Ready to implement  
**Date**: February 16, 2026  
**Version**: v4.1 (HTML/CSS approach)

---

## 🎯 Objective

Build a **working solo-mode Harmonies game** using vanilla HTML/CSS/JS with Tailwind CSS, abandoning the failed Phaser.js canvas approach.

---

## 📋 What We Learned from v4.0 Phaser (FAILED)

### Why Phaser Failed
- ❌ **Coordinate confusion**: World vs screen coordinates made positioning unpredictable
- ❌ **Canvas interaction**: Clicking/dragging canvas elements is complex and unreliable
- ❌ **Over-engineered**: Camera controls, zoom, scrollFactor - unnecessary for a board game
- ❌ **Layout control**: Hard to position UI elements precisely on canvas
- ❌ **Development speed**: Simple changes required extensive debugging

### What Actually Works (from v3.0)
- ✅ **Game logic**: `js/game/` - 64 passing unit tests
  - `hex-grid.js` - Axial coordinate system, neighbor finding
  - `token-manager.js` - Stacking validation, canPlaceToken()
  - `scoring-engine.js` - All 6 scoring categories working
  - `animal-cards.js` - Card data and scoring
- ✅ **HTML/CSS UI**: Simple, responsive, mobile-friendly
- ✅ **DOM interaction**: Click handlers, drag-drop APIs work naturally
- ✅ **Firebase sync**: Already implemented and tested

---

## 🏗️ New Architecture: HTML/CSS + Tailwind

### Tech Stack
- **UI Framework**: Tailwind CSS (CDN - no build step)
- **Rendering**: HTML divs for hexes (CSS Grid or absolute positioning)
- **Interaction**: Native HTML5 Drag & Drop API
- **Game Logic**: Reuse existing `js/game/*.js` modules (already tested)
- **State Management**: Plain JS objects
- **Backend**: Firebase Realtime Database (optional for this phase)

### File Structure
```
harmonies-v4.1.html          # Single-file MVP (start here)
├── Tailwind CSS (CDN)
├── Game logic imports (js/game/*.js)
└── Inline styles for hex grid

OR (organized structure):
index.html                    # Main game file
css/
  └── game.css               # Hex grid + custom styles
js/
  ├── game/                  # Existing logic (don't touch)
  │   ├── hex-grid.js
  │   ├── token-manager.js
  │   ├── scoring-engine.js
  │   └── animal-cards.js
  └── ui/
      ├── hex-renderer.js    # Create hex DOM elements
      ├── central-board.js   # Token supply UI
      ├── game-controller.js # Orchestrates game flow
      └── drag-drop.js       # HTML5 drag & drop
```

---

## 🎮 Implementation Steps

### Phase 1: HTML Structure (1 hour)
**Goal**: Static layout with all UI elements visible

```html
<!-- Layout sections -->
<div class="game-container">
  <!-- Header -->
  <header class="game-header">
    <h1>Harmonies - Solo Mode</h1>
    <div class="turn-info">Turn 1/15</div>
  </header>
  
  <!-- Main game area -->
  <div class="game-board">
    <!-- Left: Animal Cards -->
    <aside class="animal-cards">
      <!-- 3 cards for solo -->
    </aside>
    
    <!-- Center: Hex Grid + Token Supply -->
    <main class="play-area">
      <div class="token-supply">
        <!-- 3 spaces, each with 3 tokens -->
      </div>
      <div class="hex-grid">
        <!-- Clickable hex divs -->
      </div>
    </main>
    
    <!-- Right: Score Panel -->
    <aside class="score-panel">
      <div class="total-score">0</div>
      <div class="category-scores">
        <!-- Trees, Mountains, Fields, Buildings, Water, Animals -->
      </div>
    </aside>
  </div>
  
  <!-- Footer: Turn Controls -->
  <footer class="turn-controls">
    <p class="instruction">Select a token space</p>
    <button class="end-turn-btn">End Turn</button>
  </footer>
</div>
```

**Tailwind Classes to Use**:
- `grid`, `grid-cols-3` for layout
- `flex`, `flex-col`, `items-center` for alignment
- `bg-blue-500`, `text-white` for colors
- `p-4`, `m-2`, `gap-4` for spacing
- `rounded-lg`, `shadow-lg` for styling
- `hover:bg-blue-600` for interactions

**Deliverable**: Static HTML page with all sections visible, properly styled with Tailwind

---

### Phase 2: Hex Grid Rendering (2 hours)
**Goal**: Display clickable hexagons using CSS

#### Option A: CSS Hexagons (Recommended)
```css
.hex {
  width: 60px;
  height: 69.28px; /* sqrt(3) * width */
  position: absolute;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  background: #ecf0f1;
  border: 2px solid #666;
  cursor: pointer;
  transition: background 0.2s;
}

.hex:hover {
  background: #d5dbdb;
}

.hex.water { background: #4A90E2; }
.hex.field { background: #F5A623; }
.hex.tree { background: #7ED321; }
/* ... more terrain types */
```

#### Positioning Logic
```javascript
// Use existing hex-grid.js for coordinates
import { getNeighbors, coordToKey } from './js/game/hex-grid.js';

function hexToPixel(q, r, hexSize = 30) {
  const x = hexSize * (3/2 * q);
  const y = hexSize * (Math.sqrt(3) * (r + q/2));
  return { x, y };
}

function createHexElement(q, r, terrain) {
  const hex = document.createElement('div');
  hex.className = `hex terrain-${terrain}`;
  hex.dataset.q = q;
  hex.dataset.r = r;
  
  const pos = hexToPixel(q, r);
  hex.style.left = `${pos.x}px`;
  hex.style.top = `${pos.y}px`;
  
  // Click handler
  hex.addEventListener('click', () => handleHexClick(q, r));
  
  return hex;
}
```

**Deliverable**: Hex grid displays 7 starting hexes (from initializePersonalBoard()), positioned correctly, clickable

---

### Phase 3: Token Supply (1 hour)
**Goal**: Display 3 token spaces with draggable tokens

```html
<div class="token-supply flex gap-4 justify-center mb-4">
  <div class="token-space" data-space="0">
    <div class="space-label">Space 1</div>
    <div class="tokens flex gap-2">
      <div class="token" draggable="true" data-color="blue">🔵</div>
      <div class="token" draggable="true" data-color="yellow">🟡</div>
      <div class="token" draggable="true" data-color="green">🟢</div>
    </div>
  </div>
  <!-- Repeat for spaces 2 and 3 -->
</div>
```

**JavaScript**:
```javascript
// Generate random tokens for each space
function populateTokenSupply() {
  const colors = ['blue', 'yellow', 'brown', 'green', 'red', 'gray'];
  const spaces = document.querySelectorAll('.token-space');
  
  spaces.forEach(space => {
    const tokens = space.querySelectorAll('.token');
    tokens.forEach(token => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      token.dataset.color = randomColor;
      token.textContent = getTokenEmoji(randomColor);
    });
  });
}
```

**Deliverable**: 3 token spaces displayed, tokens show colored emojis or styled divs, clickable to select space

---

### Phase 4: Drag & Drop (2 hours)
**Goal**: Drag tokens to hex grid with validation

```javascript
// Drag start
document.querySelectorAll('.token').forEach(token => {
  token.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('color', token.dataset.color);
    e.dataTransfer.effectAllowed = 'move';
    token.classList.add('dragging');
  });
  
  token.addEventListener('dragend', (e) => {
    token.classList.remove('dragging');
  });
});

// Drop zones (hexes)
document.querySelectorAll('.hex').forEach(hex => {
  hex.addEventListener('dragover', (e) => {
    e.preventDefault();
    hex.classList.add('drag-over');
  });
  
  hex.addEventListener('dragleave', (e) => {
    hex.classList.remove('drag-over');
  });
  
  hex.addEventListener('drop', (e) => {
    e.preventDefault();
    hex.classList.remove('drag-over');
    
    const color = e.dataTransfer.getData('color');
    const q = parseInt(hex.dataset.q);
    const r = parseInt(hex.dataset.r);
    
    handleTokenDrop(q, r, color);
  });
});

// Validation
import { canPlaceToken } from './js/game/token-manager.js';

function handleTokenDrop(q, r, color) {
  const hexKey = `${q}_${r}`;
  const hexState = gameState[hexKey];
  
  if (!hexState) {
    showError('Cannot place on empty space');
    return;
  }
  
  if (!canPlaceToken(hexState.stack, color, hexState.terrain)) {
    showError('Invalid placement - check stacking rules');
    return;
  }
  
  // Valid placement
  hexState.stack.push({ color });
  renderHexTokens(q, r, hexState.stack);
  updateScore();
  advanceTurn();
}
```

**Deliverable**: Tokens draggable to hexes, validation works, invalid placements show error message

---

### Phase 5: Game Flow (1 hour)
**Goal**: Turn management, score updates, end game

```javascript
class GameController {
  constructor() {
    this.gameState = {};
    this.currentTurn = 1;
    this.turnPhase = 'SELECT_SPACE';
    this.selectedSpace = null;
    this.tokensToPlace = [];
    this.tokensPlaced = 0;
  }
  
  selectSpace(spaceIndex) {
    if (this.turnPhase !== 'SELECT_SPACE') return;
    
    this.selectedSpace = spaceIndex;
    this.tokensToPlace = getSpaceTokens(spaceIndex);
    this.turnPhase = 'PLACE_TOKENS';
    
    updateInstruction('Place token 1/3 - drag to hex grid');
  }
  
  placeToken(q, r, color) {
    // Validate and place
    // Increment tokensPlaced
    // When tokensPlaced === 3, enable end turn
  }
  
  endTurn() {
    // Refresh token supply (solo mode)
    // Reset turn state
    // Check for end game (turn 15 or board full)
  }
  
  calculateScore() {
    import { 
      scoreTreesModule,
      scoreMountainsModule,
      scoreFieldsModule,
      scoreBuildingsModule,
      scoreWaterModule,
      calculateTotalScore 
    } from './js/game/scoring-engine.js';
    
    const scores = {
      trees: scoreTreesModule(this.gameState),
      mountains: scoreMountainsModule(this.gameState),
      fields: scoreFieldsModule(this.gameState),
      buildings: scoreBuildingsModule(this.gameState),
      water: scoreWaterModule(this.gameState, 'A'),
      animals: 0 // TODO when animal cards implemented
    };
    
    return calculateTotalScore(scores);
  }
}
```

**Deliverable**: Full turn cycle works, score updates in real-time, game ends after 15 turns

---

### Phase 6: Polish & Mobile (1 hour)
**Goal**: Responsive design, animations, UX improvements

- [ ] Mobile-friendly touch events (touchstart, touchend)
- [ ] Smooth animations (token placement, score updates)
- [ ] Visual feedback (hover states, selected states)
- [ ] Error messages display nicely
- [ ] Loading states
- [ ] Celebration on high score

**Tailwind Responsive Classes**:
```html
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
  <!-- Responsive grid -->
</div>

<div class="text-sm md:text-base lg:text-lg">
  <!-- Responsive text -->
</div>
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Load game in browser - all UI visible
- [ ] Click token space - space highlights, tokens visible
- [ ] Drag token to valid hex - token placed, score updates
- [ ] Try invalid placement - error message shows
- [ ] Complete turn - token supply refreshes
- [ ] Play 15 turns - end game screen shows
- [ ] Test on mobile - touch works, layout responsive

### Automated Tests (Optional)
- Reuse existing 64 unit tests in `tests/*.test.js`
- All tests should still pass (game logic unchanged)

---

## 📦 Deliverables

### Minimum Viable Product (MVP)
1. **Single HTML file** (`harmonies-v4.1.html`) - fully playable solo mode
2. **Working game flow** - select space → place 3 tokens → end turn → repeat
3. **Real-time scoring** - all 6 categories update after each placement
4. **Mobile responsive** - playable on phone/tablet
5. **No errors** - stable, no console errors

### Stretch Goals (if time permits)
- [ ] Undo last placement
- [ ] Save game state (localStorage)
- [ ] Multiple difficulty levels
- [ ] Sound effects
- [ ] Animations for token placement
- [ ] Tutorial mode

---

## 🚀 Quick Start Command

```bash
# Start development server
cd /Users/nhat/repo-fun/I-And-AI/projects/gaming/harmonies
python3 -m http.server 8001

# Open in browser
open http://localhost:8001/harmonies-v4.1.html

# Or use the organized structure
open http://localhost:8001/index.html
```

---

## 📚 Reference Materials

### Keep These Working Modules
- `js/game/hex-grid.js` - Axial coordinates, neighbor finding
- `js/game/token-manager.js` - Stacking validation
- `js/game/scoring-engine.js` - All scoring logic
- `js/data/animal-cards.js` - Card definitions

### Archive/Remove These Failed Files
- `js/phaser/` - Entire Phaser implementation
- `js/main.js` - Phaser game config
- Current `index.html` - Phaser container

### Hex Grid CSS Resources
- [CSS Hexagons Guide](https://css-tricks.com/hexagons-and-beyond/)
- Clip-path: `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)`
- Flat-topped hex: width × height ratio = 1 : 1.1547 (√3)

### Tailwind CSS Utilities
- Layout: `grid`, `flex`, `absolute`, `relative`
- Spacing: `p-{n}`, `m-{n}`, `gap-{n}`
- Colors: `bg-{color}-{shade}`, `text-{color}-{shade}`
- Interactive: `hover:`, `active:`, `focus:`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`

---

## ✅ Success Criteria

The implementation is complete when:
1. ✅ Game loads without errors
2. ✅ Can select token space and see tokens
3. ✅ Can drag tokens to hex grid
4. ✅ Invalid placements are rejected with clear feedback
5. ✅ Score updates correctly after each placement
6. ✅ Can play full 15-turn game
7. ✅ End game shows final score
8. ✅ Responsive on mobile devices
9. ✅ All existing unit tests still pass

---

## 💡 Key Implementation Tips

### Coordinate System
- Use **screen coordinates** only (CSS pixels)
- No world/camera transforms
- Hexes positioned with `absolute` or CSS Grid
- Simple: `left: ${x}px; top: ${y}px`

### State Management
- Keep gameState as simple object: `{ "q_r": { q, r, terrain, stack: [] } }`
- Update DOM on state change
- No complex state libraries needed

### Performance
- Start with simple approach (render all hexes each time)
- Optimize later if needed (virtual scrolling, canvas for large boards)
- Solo mode = small board (23 hexes max) = no performance issues

### Mobile-First
- Use `touch` events alongside `mouse` events
- Test on actual mobile device
- Minimum tap target: 44×44px
- Avoid hover-dependent interactions

---

## 🎯 Next Steps for Implementation

1. **Create new branch**: `git checkout -b html-rebuild`
2. **Archive Phaser code**: `mv js/phaser archive/phaser-attempt/`
3. **Start with MVP**: Single HTML file approach
4. **Test frequently**: Open in browser after each phase
5. **Keep game logic**: Don't modify `js/game/*.js`
6. **Commit often**: Small, working increments

---

**Ready to build!** This plan is actionable and references all existing working code.
