# Harmonies - Solo Board Game Implementation

**Version:** 5.0 (HTML/CSS/JS)  
**Status:** ✅ FULLY PLAYABLE  
**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/

---

## 🎮 PLAY NOW!

### Online
**Live URL:** https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/

### Local Development
```bash
cd /Users/nhat/repo-fun/I-And-AI/projects/gaming/harmonies
python3 -m http.server 8001
```
**Then open:** http://localhost:8001/

---

## ✅ Features

### Core Gameplay
- **Token Placement** - Drag & drop with full stacking validation (all 6 token types)
- **Real-time Scoring** - All 6 categories update live: trees, mountains, fields, buildings, water, animals
- **Sun Achievements** - Real-time sun count (1-8 ☀️) with hover tooltip showing score breakdown
- **Animal System** 
  - 2 sections: Available Cards (3 face-up) + Your Animal Cards (max 4 in hand)
  - Click "Take Card" to move card from available pool to your hand
  - Select card from your hand, click hex to place animal cube (specific emoji per animal)
  - Discard & Replace mechanic: Yellow button activates, click card to discard and draw replacement
  - Shows placement progress (e.g., "2/4 placed") and next points value

### Game Flow
- **Turn Management** - Select token space → Drag 3 tokens to hexes → End Turn
- **Token Economy** - 9 tokens drawn per turn, 3 placed, 6 discarded (proper solo mode rule)
- **End Game Detection** 
  - Ends when pouch <9 tokens (can't refill all 3 spaces)
  - OR when ≤2 empty hexes remain (can't place 3 tokens next turn)
  - Clear messaging explains why game ended
- **Game Over Protection** - No dragging, clicking, or space selection after game ends

### Visual Design
- **Modern UI** - Tailwind CSS with gradient backgrounds
- **Token Emojis** - 🌲 🪵 ⛰️ 🏠 🌾 💧 (trees, trunks, mountains, buildings, fields, water)
- **Animal Emojis** - 🐻 🦌 🐰 🦊 🦅 🦫 🦉 🐿️ 🐟 🐺 (specific to each animal card)
- **Responsive Layout** - Sidebar + main board + controls
- **Interactive States** - Green borders (available), yellow borders (discard mode), hover effects

---

## 📚 Documentation

- **[game-rules.md](./game-rules.md)** - Official Harmonies solo rules + strategy tips
  - Complete rules from official rulebook
  - Solo mode special rules (3 token spaces, discard & replace, max 4 cards in hand)
  - Sun scoring table (40-160+ points = 1-8 suns)
  - Strategy insights: token economy, timing, card management
  
- **[DEPLOY.md](./DEPLOY.md)** - How to deploy to GitHub Pages

- **[archive/](./archive/)** - Previous versions and planning documents

---

## 🏗️ Architecture

### Current: v5.0 - HTML/CSS/JS

**Why it works:**
- Single-file HTML (`index.html`) - no build step complexity
- Tailwind CSS CDN - rapid UI development
- ES6 modules for game logic - clean separation of concerns

**Key Files:**
- `index.html` - Main game (1381 lines, self-contained with inline JS)
- `js/game/scoring-engine.js` - Scoring logic for all 6 categories
- `js/game/token-manager.js` - Token placement & stacking validation
- `js/data/tokens-config.js` - Initial pouch config (120 tokens total)
- `js/data/animal-cards.js` - 10 animal cards with habitat patterns

**Game State:**
```javascript
gameState = {
  hexBoard: {},                    // 23 hexes (q,r coords, stack arrays, terrain)
  tokenSupply: [[],[],[]],        // 3 spaces × 3 tokens each
  pouch: {...},                   // Token counts by color
  selectedSpace: null,            // Currently selected space (0-2)
  selectedAnimalCard: null,       // Selected card for cube placement
  availableAnimalCards: [],       // 3 face-up cards (draw pool)
  playerAnimalCards: [],          // Cards in hand (max 4)
  placedAnimals: [],              // {cardId, hexKey} placements
  tokensPlaced: 0,                // Count for current turn (must = 3)
  takenCardThisTurn: false,       // Prevent multiple card takes per turn
  discardMode: false,             // Discard & replace mode active
  gameEnded: false,               // Flag to prevent gameplay after game over
  score: {...}                    // Breakdown by category + total
}
```

---

## 🎯 Game Mechanics

### Token Stacking Rules (All 6 Types)

| Token    | Can Place On            | Max Height | Notes                               |
| -------- | ----------------------- | ---------- | ----------------------------------- |
| Yellow 🌾 | Ground only             | 1          | Fields - no stacking                |
| Blue 💧   | Ground only             | 1          | Water - no stacking                 |
| Brown 🪵  | Brown only              | 2          | Tree trunks - stack on each other   |
| Green 🌲  | 1-2 Brown               | 3          | Tree leaves - need trunk underneath |
| Gray ⛰️   | Gray only               | 3          | Mountains - stack on each other     |
| Red 🏠    | Gray/Brown/Red or alone | 2          | Buildings - flexible placement      |

### Scoring Categories

1. **Trees** - 0/0/1/3/5 pts (brown only / 2 brown / lone green / brown+green / 2brown+green)
2. **Mountains** - 1/3/7 pts per cluster (must be adjacent, else 0)
3. **Fields** - 5 pts per cluster of 2+ connected yellow tokens
4. **Buildings** - 5 pts IF surrounded by 3+ different token colors
5. **Water (Side A)** - 0/2/5/8/11/15/+4... (longest river chain only)
6. **Animals** - Points from card progression (e.g., 5/10/16/23 for 1st/2nd/3rd/4th cube)

### Sun Scoring System

| Points  | Suns   | Points  | Suns       |
| ------- | ------ | ------- | ---------- |
| 40-69   | ☀️ 1    | 130-139 | ☀️☀️☀️☀️☀️ 5    |
| 70-89   | ☀️☀️ 2   | 140-149 | ☀️☀️☀️☀️☀️☀️ 6   |
| 90-109  | ☀️☀️☀️ 3  | 150-159 | ☀️☀️☀️☀️☀️☀️☀️ 7  |
| 110-129 | ☀️☀️☀️☀️ 4 | 160+    | ☀️☀️☀️☀️☀️☀️☀️☀️ 8 |

**Bonus:** +1 sun for using Side A (land/water board) over Side B (islands)

---

## 🎮 How to Play (Quick Start)

1. **Open** the game (online or local server)
2. **Select a token space** - Click one of 3 spaces at the top
3. **Drag tokens** - Drag tokens from selected space to hexes on board
4. **Take animal cards** (optional) - Click "Take Card" on available cards (max 1 per turn, max 4 in hand)
5. **Place animal cubes** (optional) - Select card from your hand → Click matching hex → Cube placed with emoji
6. **Discard & Replace** (optional) - Click yellow "Discard & Replace" button → Click card to discard
7. **End turn** - Click "End Turn" button when all 3 tokens placed
8. **Repeat** until game ends (pouch <9 tokens OR ≤2 empty hexes)
9. **Check score** - See final sun achievement (1-8 range)!

**Goal:** Earn as many suns ☀️ as possible (160+ points = 8 suns)

---

## 🧪 Testing

Run tests from repository root:
```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e
```

---

## 📋 Version History

### v5.0 (2026-02-16) - Current ✅
- Complete solo mode implementation
- All token stacking rules working
- Real-time scoring (all 6 categories)
- Sun achievement system with live display
- Animal card system (available pool + player hand)
- Animal cube placement with specific emoji
- Discard & replace mechanic
- Game end detection and protection
- Clean Tailwind CSS UI
- Deployed to GitHub Pages

### Previous Versions
See [archive/](./archive/) for v4 (Phaser.js) and v3 (HTML/CSS) attempts.

---

## 🚀 Future Enhancements (Optional)

### Polish
- [ ] Animations for token placement and scoring
- [ ] Sound effects (token drop, scoring, game end)
- [ ] Mobile touch optimization
- [ ] Save/load game state (localStorage)
- [ ] Undo last placement

### Gameplay
- [ ] Full 48 animal cards (currently 10)
- [ ] Complex animal patterns (currently simplified)
- [ ] Side B board (islands variant)
- [ ] Difficulty modes

### Multiplayer (Distant Future)
- [ ] Pass-and-play mode (2-4 players)
- [ ] Online multiplayer via Firebase
- [ ] Leaderboard for best solo scores

---

## 🙏 Credits

- **Game Designer:** Johan Benvenuto
- **Publisher:** Libellud (2024)
- **Artwork:** Maëva Da Silva
- **Digital Implementation:** This project (solo mode only for personal use)
- **References:** 
  - Official Harmonies rulebook
  - [Meeples and Mischief - Solo Review](https://meeplesandmischief.com/harmonies-a-solo-journey-through-natures-wonders/)

---

## 📄 License

This is a fan-made digital implementation for personal use only. Harmonies is © Libellud. Please support the official game by purchasing from your local game store!
