# Harmonies - Solo Board Game Implementation

**Latest Version:** v5.0 (HTML/CSS/JS)  
**Status:** ✅ FULLY PLAYABLE - Solo Mode Complete with Animals!  
**Date Started:** 2026-02-16  
**Last Updated:** 2026-02-16

---

## 🎮 PLAY NOW!

**Server must be running on port 8001:**

```bash
cd /Users/nhat/repo-fun/I-And-AI/projects/gaming/harmonies
python3 -m http.server 8001
```

**Then open:** 
- **v5.html** (Latest - Recommended): http://localhost:8001/v5.html
- v4.0 (Phaser - Old): http://localhost:8001/index.html

---

## ✅ v5.0 Features (COMPLETE)

### Core Gameplay

1. **✅ Token Placement** - Drag & drop with full stacking validation (all 6 token types)
2. **✅ Real-time Scoring** - All 6 categories update live: trees, mountains, fields, buildings, water, animals
3. **✅ Sun Achievements** - Real-time sun count (1-8 ☀️) displayed with hover tooltip
4. **✅ Animal System** 
   - Click animal card to select/deselect
   - Click hex to place/remove animal cube
   - 🐾 paw print indicator on hexes with animals
   - Blue ring highlights selected card
   - Shows placement progress (e.g., "2/4 placed")
   - Next points indicator for each card

### Game Flow

5. **✅ Turn Management**
   - Select token space → Drag 3 tokens to hexes → End Turn
   - 6 unused tokens properly discarded (not returned to pouch)
   - Refill all 3 spaces with 9 new tokens
   
6. **✅ End Game Detection**
   - Ends when pouch <9 tokens (can't refill all spaces)
   - OR when ≤2 empty hexes remain (can't place 3 tokens next turn)
   - Clear messaging explains WHY game ended
   
7. **✅ Game Over Protection**
   - Can't drag tokens after game ends
   - Can't select spaces after game ends
   - Clear error messages guide players

### Visual Polish

8. **✅ Beautiful UI**
   - Tailwind CSS for modern, clean design
   - Animal emoji icons (🐻 🦌 🐰 🦊 🦅 etc)
   - Color-coded token emojis (🌲 ⛰️ 🌾 🏠 💧)
   - Responsive layout (sidebar + main board + controls)
   - Real-time score breakdown by category

---

## 📚 Documentation

- **[game-rules.md](./game-rules.md)** - Official Harmonies solo rules + strategy tips
  - Complete rules from official rulebook
  - Solo mode special rules (token discard, animal card refresh)
  - Sun scoring table (40-160+ points = 1-8 suns)
  - Strategy section with token economy insights
  - Review insights from Meeples and Mischief article
  
- **[PLAYING-GUIDE.md](./PLAYING-GUIDE.md)** - How to play the digital version

- **[v5-plan.md](./v5-plan.md)** - Implementation plan and progress tracker

---

## 🏗️ Architecture

### v5.0 - HTML/CSS/JS (Current)

**Why it works:**
- Single-file HTML - no build step complexity
- Tailwind CSS CDN - rapid UI development
- ES6 modules for game logic - clean separation
- Reuses tested scoring engine (64 passing tests)

**Key Files:**
- `v5.html` - Main game (1140+ lines, self-contained)
- `js/game/scoring-engine.js` - Tested scoring logic (trees, mountains, fields, buildings, water, animals)
- `js/game/token-manager.js` - Token placement & stacking validation
- `js/data/tokens-config.js` - Initial pouch (120 tokens: 23 blue, 23 gray, 21 brown, 19 green, 19 yellow, 15 red)
- `js/data/animal-cards.js` - 10 animal cards (bear, deer, rabbit, fox, eagle, beaver, owl, squirrel, salmon, wolf)

**Game State:**
```javascript
gameState = {
  hexBoard: {},              // 23 hexes with q,r coords, stack arrays, terrain
  tokenSupply: [[],[],[]],  // 3 spaces × 3 tokens
  pouch: {...},             // Token counts by color
  selectedSpace: null,      // Currently selected space (0-2)
  selectedAnimalCard: null, // Currently selected animal card ID
  animalCards: [],          // 3 random cards for this game
  placedAnimals: [],        // Array of {cardId, hexKey} placements
  tokensPlaced: 0,          // Count for current turn (must = 3)
  gameEnded: false,         // Flag to prevent gameplay after game over
  score: {...}              // Breakdown + total
}
```

---

## 🎯 Game Mechanics Implemented

### Token Stacking Rules (All 6 Types)

| Token | Can Place On | Max Height | Notes |
|-------|--------------|------------|-------|
| Yellow 🌾 | Ground only | 1 | Fields - no stacking |
| Blue 💧 | Ground only | 1 | Water - no stacking |
| Brown 🪵 | Brown only | 2 | Tree trunks - stack on each other |
| Green 🌲 | 1-2 Brown | 3 | Tree leaves - need trunk underneath |
| Gray ⛰️ | Gray only | 3 | Mountains - stack on each other |
| Red 🏠 | Gray/Brown/Red or alone | 2 | Buildings - flexible placement |

### Scoring Categories (All Working)

1. **Trees** - 0/0/1/3/5 pts (brown only / 2 brown / lone green / brown+green / 2brown+green)
2. **Mountains** - 1/3/7 pts per cluster (must be adjacent, else 0)
3. **Fields** - 5 pts per cluster of 2+ connected yellow tokens
4. **Buildings** - 5 pts IF surrounded by 3+ different token colors
5. **Water (Side A)** - 0/2/5/8/11/15/+4... (longest river chain only)
6. **Animals** - Points from animal card progression (e.g., 5/10/16/23 for 1st/2nd/3rd/4th placement)

### Sun Scoring System

| Points | Suns | Points | Suns |
|--------|------|--------|------|
| 40-69 | ☀️ 1 | 130-139 | ☀️☀️☀️☀️☀️ 5 |
| 70-89 | ☀️☀️ 2 | 140-149 | ☀️☀️☀️☀️☀️☀️ 6 |
| 90-109 | ☀️☀️☀️ 3 | 150-159 | ☀️☀️☀️☀️☀️☀️☀️ 7 |
| 110-129 | ☀️☀️☀️☀️ 4 | 160+ | ☀️☀️☀️☀️☀️☀️☀️☀️ 8 |

**Bonus:** +1 sun for using Side A (land/water board) instead of Side B (islands)

---

## 🧪 Testing

- **64 tests passing** in `tests/` directory
- Scoring engine fully validated
- Token placement rules verified
- Stacking logic tested for all combinations

Run tests:
```bash
npm test                # Vitest unit tests
npm run test:e2e       # Playwright E2E tests
```

---

## 📋 Implementation History

### v5.0 (2026-02-16) - HTML/CSS Success ✅
- Complete solo mode in single HTML file
- All features working: tokens, scoring, animals, game end
- Real-time sun display with tooltip
- Animal cube placement with visual indicators
- Game over protection (no dragging/clicking after end)
- Clean Tailwind CSS UI

### v4.0 (2026-02-16) - Phaser.js Partial Success
- 23-hex board rendering in Phaser canvas
- Drag & drop working but complex
- Scoring engine integrated
- Abandoned due to coordinate system complexity

### v3.0 (2026-02-15) - HTML/CSS Failed
- Attempted CSS hex layout
- Coordinate confusion between CSS positioning and game logic
- Led to decision to try Phaser, then return to HTML with better planning

---

## 🚀 Future Enhancements (Optional)

### Phase 6: Polish (Not Required for Playable MVP)

- [ ] Animal card draw pile simulation (currently shows same 3 all game)
- [ ] Animal card refresh mechanic (discard unused card option)
- [ ] Full pattern matching for animal placement (currently simplified)
- [ ] Undo last token placement
- [ ] Animations for token placement and scoring
- [ ] Sound effects
- [ ] Mobile touch optimization
- [ ] Save/load game state (localStorage)

### Multiplayer Ideas (Distant Future)

- [ ] Pass-and-play mode (2-4 players on same device)
- [ ] Online multiplayer via Firebase
- [ ] Leaderboard for best solo scores

---

## 🎮 How to Play (Quick Start)

1. **Start server:** `python3 -m http.server 8001`
2. **Open:** http://localhost:8001/v5.html
3. **Select a token space** (click one of 3 spaces)
4. **Drag tokens** from selected space to hexes on board
5. **Optional:** Click animal card, then click hex to place cube
6. **End turn** when all 3 tokens placed
7. **Repeat** until game ends (pouch empty or board full)
8. **Check score** with sun achievement!

**Goal:** Earn as many suns ☀️ as possible (1-8 range based on final score)

---

## 🙏 Credits

- **Game Designer:** Johan Benvenuto
- **Publisher:** Libellud (2024)
- **Artwork:** Maëva Da Silva
- **Digital Implementation:** This project (solo mode only)
- **Review Reference:** [Meeples and Mischief - Harmonies Solo Review](https://meeplesandmischief.com/harmonies-a-solo-journey-through-natures-wonders/)

---

## 📄 License

This is a fan-made digital implementation for personal use only. Harmonies is © Libellud. Please support the official game!
