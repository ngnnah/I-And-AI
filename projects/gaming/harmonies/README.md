# Harmonies - Web Game

A beautiful, turn-based multiplayer spatial puzzle game where players build landscapes and create habitats for animals.

## Local Testing Instructions

### 1. Open the game

Simply open `index.html` in your browser. The Firebase Realtime Database is already configured.

### 2. Test multiplayer

Open the game in **2 browser windows** (or use incognito mode for the second window):

**Window 1 (Player 1):**

1. Enter username: `alice`
2. Click "Continue"
3. Click "+ Create New Game"
4. Wait for Player 2 to join

**Window 2 (Player 2):**

1. Enter username: `bob`
2. Click "Continue"
3. Look for Alice's game in "Join a Game" section
4. Click "Join"

**Back to Window 1:**

1. Click "Start Game" (host only)
2. Take your turn:
   - Click 3 tokens from central board
   - Click "Confirm Placement" (they'll auto-place for MVP)
   - Click "End Turn"

**Window 2:**

- Now it's Bob's turn!
- Repeat the same actions

### 3. Game Features to Test

✅ **Player persistence**: Refresh browser → auto-login with saved username
✅ **Multiplayer sync**: Changes in one window appear in the other
✅ **Turn-based flow**: Only current player can take actions
✅ **Solo mode**: Click "Play Solo" to practice alone
✅ **Score tracking**: Scores update automatically as you place tokens
✅ **Game end**: Game ends when pouch is empty or board is full

### 4. Run Tests

```bash
node --test tests/core-logic.test.js
```

Tests cover:

- Hex coordinate math
- Token stacking rules
- Terrain calculation
- All 6 scoring modules

## Architecture Highlights

### Core Logic (Pure Functions)

- `hex-grid.js` - Hex coordinate system (axial)
- `token-manager.js` - Stacking validation
- `scoring-engine.js` - 6 modular scoring systems
- `pattern-matcher.js` - Animal habitat matching with rotation/mirroring

### Firebase Integration

- `firebase-config.js` - Database setup and CRUD
- `firebase-sync.js` - Multiplayer write operations

### UI

- `board-renderer.js` - SVG hex board with 3D token stacking
- Screens: player-setup, lobby, game-room

### State Management

- `game-state.js` - Local state + localStorage persistence
- Real-time Firebase listeners for multiplayer sync

## Known MVP Limitations

⚠️ **Simplified for 2-3 hour implementation:**

1. **Token placement**: Auto-places tokens on adjacent hexes (no drag-drop yet)
2. **Animal cards**: Can take cards but placement logic is simplified
3. **Hex grid**: Shows expansion hexes but validation is basic
4. **UI polish**: Minimal styling, no animations yet

## Next Steps (Phase 3 - Polish)

- [ ] Drag-and-drop token placement
- [ ] Full animal card placement with pattern validation
- [ ] Score breakdown modal
- [ ] Better visual feedback and animations
- [ ] Mobile-responsive improvements
- [ ] Game abandonment feature

## Tech Stack

- **Vanilla JavaScript** (ES6 modules)
- **SVG** for hex grid rendering
- **Firebase Realtime Database** (Asia Southeast)
- **No framework** - lightweight and fast!

## File Structure

```
harmonies/
├── index.html
├── css/styles.css
├── js/
│   ├── main.js (router)
│   ├── game/
│   │   ├── hex-grid.js
│   │   ├── token-manager.js
│   │   ├── scoring-engine.js
│   │   ├── pattern-matcher.js
│   │   ├── game-state.js
│   │   ├── firebase-config.js
│   │   └── firebase-sync.js
│   ├── screens/
│   │   ├── player-setup.js
│   │   ├── lobby.js
│   │   └── game-room.js
│   ├── ui/
│   │   └── board-renderer.js
│   └── data/
│       ├── tokens-config.js
│       └── animal-cards.js (10 cards)
└── tests/
    └── core-logic.test.js
```

## Deploy to GitHub Pages

When ready to deploy:

```bash
# Sync to public/
rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='tests' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/

# Force-add data files (bypasses .gitignore)
git add -f public/projects/gaming/harmonies/js/data/*.js

# Commit and push
git add public/projects/gaming/harmonies
git commit -m "feat(harmonies): add turn-based multiplayer spatial puzzle game"
git push origin main
```

GitHub Pages will auto-deploy in ~1 minute.

---

**Have fun building beautiful landscapes! 🌿**
