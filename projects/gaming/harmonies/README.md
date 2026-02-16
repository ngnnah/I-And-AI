# Harmonies - Solo Board Game Implementation

**Version:** v5.0.1 (HTML/CSS/JS)  
**Status:** ✅ FULLY PLAYABLE - POLISHED UI - READY FOR PHASE 6  
**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/  
**Last Updated:** 2026-02-17

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

### Core Gameplay (v5.0 - Polished)
- **Click-to-Place Interaction** - Simple, intuitive token placement (drag & drop REMOVED for better mobile UX)
  - Click any token to select it
  - Click a hex to place it
  - Invalid placements flash red with error message
- **Real-time Scoring** - All 6 categories update live: trees, mountains, fields, buildings, water, animals
- **Unified Stats Display** 
  - Desktop: Sidebar score breakdown (🌲⛰️🌼🏠💧🐾 | 🪙 Tokens | Total + ☀️)
  - Mobile: Horizontal score grid with same layout
  - Sun count (1-8 ☀️) shown inline with total score
  - Tokens left (🪙) on same line as total
- **Animal System** 
  - Available Cards section (3 face-up cards to take)
  - Your Cards section (max 4 in hand)
  - Click to take card (1 per turn)
  - Select from hand → Click hex to place cube with specific animal emoji
  - Discard & Replace: Yellow button → Click card to discard → Auto-draw replacement
  - Progress tracking: "2/4 placed" with next points value

### Game Flow
- **Turn Management** - Click token → Click hex (3 times) → End Turn
- **Token Economy** - 9 tokens drawn per turn (3 spaces × 3 tokens), 3 placed, 6 discarded
- **End Game Detection** 
  - Ends when pouch <9 tokens (can't refill)
  - OR when ≤2 empty hexes (can't place 3 next turn)
  - Clear messaging explains end condition
- **Game Over Protection** - All interactions disabled after game ends

### Visual Design (2026-02-17 Polish Update)
- **Modern UI** - Tailwind CSS with gradient backgrounds, clean layout
- **Token Emojis** - 💧 🌼 🪵 🌿 🏠 ⛰️ (water, fields, trunks, leaves, buildings, mountains)
- **Stack Display** - Overlay count (×2, ×3) positioned on emoji with subtle text shadow
- **Animal Emojis** - 🐻 🦌 🐰 🦊 🦅 🦫 🦉 🐿️ 🐟 🐺 (specific to each card)
- **Responsive Layout** 
  - Desktop: Sidebar (cards + score) + Center (board + tokens) + End Turn
  - Mobile: Vertical stack with horizontal card rows + score grid
- **Interactive States** - Green available, yellow discard mode, red invalid, hover effects
- **Single End Turn Button** - Below board, works on all devices

---

## 📚 Documentation

- **[game-rules.md](./game-rules.md)** - Official Harmonies solo rules + strategy tips
  - Complete rules from official rulebook
  - Solo mode special rules (3 token spaces, discard & replace, max 4 cards in hand)
  - Sun scoring table (40-160+ points = 1-8 suns)
  - Strategy insights: token economy, timing, card management

- **[PROGRESS.md](./PROGRESS.md)** - Implementation roadmap and progress tracking
  - ✅ Completed phases (v5.0 MVP)
  - 🔄 Next priorities (Enhanced Animal System)
  - 🎯 Future enhancements (Polish, Multiplayer)
  - Living document updated as features are implemented
  
- **[DEPLOY.md](./DEPLOY.md)** - How to deploy to GitHub Pages

- **[archive/](./archive/)** - Previous versions and planning documents

---

## 🏗️ Architecture

### Current: v5.0.1 - HTML/CSS/JS (Polished - 2026-02-17)

**Why it works:**
- Single-file HTML (`index.html`) - 1846 lines, no build step
- Tailwind CSS CDN - rapid UI prototyping
- Vanilla JavaScript - clean, performant, no framework overhead
- Click-only interaction - removed drag & drop for simpler code and better mobile UX

**Key Files:**
- `index.html` - Complete game (1845 lines, self-contained with inline JS)
- `js/game/scoring-engine.js` - All 6 scoring categories
- `js/game/token-manager.js` - Placement validation & stacking rules
- `js/data/tokens-config.js` - Initial pouch (120 tokens)
- `js/data/animal-cards.js` - 10 animal cards with habitat patterns

**Game State:**
```javascript
gameState = {
  selectedToken: null,            // {color, space, index} for click-to-place
  hexBoard: {},                   // 23 hexes (axial coords, stacks, terrain)
  tokenSupply: [[],[],[]],        // 3 spaces × 3 tokens each
  pouch: {...},                   // Token counts by color
  selectedAnimalCard: null,       // Selected card for cube placement
  availableAnimalCards: [],       // 3 face-up cards (draw pool)
  playerAnimalCards: [],          // Cards in hand (max 4)
  placedAnimals: [],              // [{cardId, hexKey}] placements
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
| Yellow � | Ground only             | 1          | Fields - no stacking                |
| Blue 💧   | Ground only             | 1          | Water - no stacking                 |
| Brown 🪵  | Brown only              | 2          | Tree trunks - stack on each other   |
| Green 🌿  | 1-2 Brown               | 3          | Tree leaves - need trunk underneath |
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
2. **Click a token** - Click any token in one of the 3 spaces (auto-selects space)
3. **Click a hex** - Click a hex on the board to place the token
   - Valid placements: Token appears on hex with visual feedback
   - Invalid placements: Hex flashes red with error message
4. **Repeat** - Click 2 more tokens and hexes (3 tokens total per turn)
5. **Take animal cards** (optional) - Click green-bordered cards in "Available Cards" (max 1/turn, max 4 in hand)
6. **Place animal cubes** (optional) - Click card in "Your Cards" → Click matching hex → Cube placed
7. **Discard & Replace** (optional) - Click "⟳ Discard" button → Click card to remove → Auto-draw replacement
8. **End turn** - Click "✓ End Turn" button when 3 tokens placed
9. **Repeat** until game ends (pouch <9 tokens OR ≤2 empty hexes)
10. **Check score** - Final sun achievement shown (1-8 ☀️ range, 160+ = 8 suns)

**Goal:** Maximize score through strategic token stacking and animal habitat creation

**Interaction Model:**
- Click-to-select → Click-to-place (no dragging required)
- Works seamlessly on both desktop and mobile
- Visual feedback for all actions (selections, validations, errors)

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

### v5.0.1 (2026-02-17) - UI/UX Polish ✨
**Major Improvements:**
- ✅ Removed ALL drag & drop - pure click-to-place interaction (311 lines deleted)
- ✅ Unified stats display (sidebar + mobile grid with identical layouts)
- ✅ Sun count (☀️) integrated inline with total score
- ✅ Tokens left (🪙) on same line as total
- ✅ Single "End Turn" button (works on all devices)
- ✅ Stack count (×2, ×3) overlaid on emoji with responsive sizing
  - Desktop: 36px emoji, 18px count
  - Tablet: 24px emoji, 14px count
  - Mobile: 20px emoji, 11px count
- ✅ Updated emojis: 🌼 fields (better browser support), 🪙 tokens left
- ✅ Reduced file size: 2156 → 1846 lines
- ✅ Cleaner, more responsive mobile layout with proper touch targets

**Performance:**
- Faster rendering (no drag event listeners)
- Better touch interaction on mobile
- Simpler codebase for future maintenance

### v5.0 (2026-02-16) - Initial Release ✅
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

See **[PROGRESS.md](./PROGRESS.md)** for detailed roadmap and tracking.

### Next Priority: Enhanced Animal System (Phase 6)
- Full 48 animal cards (currently 10)
- Complex habitat patterns with proper validation
- Visual pattern preview system
- Animal card draw pile mechanics

### Future Phases
- **Polish** - Animations, sound effects, mobile optimization
- **Additional Modes** - Side B board, difficulty levels
- **Multiplayer** - Pass-and-play, online play, leaderboard
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
