# Harmonies v4.0 → v4.1 Pivot

**Date**: February 16, 2026  
**Decision**: Abandon Phaser.js canvas approach, rebuild with HTML/CSS

---

## 🔄 What Happened

### v4.0 Phaser Implementation (FAILED)
We attempted to rebuild Harmonies using Phaser.js game engine to create a modern canvas-based game. After extensive work on:
- Scene architecture (Preload, Lobby, Game, EndGame)
- Camera controls and coordinate systems
- Canvas rendering for hex grid
- Drag & drop on canvas elements
- Screen-fixed vs world coordinate layouts

**Result**: Too complex, unreliable interactions, coordinate confusion, not suitable for a board game.

### Key Learnings
1. **Canvas is overkill** for a turn-based board game
2. **DOM interactions work better** - clicks, drags, hovers are well-understood
3. **Game logic works** - All 64 unit tests passing, scoring system solid
4. **Layout should be simple** - CSS Grid/Flexbox, not camera transforms

---

## 🎯 Path Forward: v4.1 HTML/CSS

### New Approach
- ✅ Vanilla HTML/CSS with Tailwind CSS
- ✅ DOM-based hex grid (divs with clip-path)
- ✅ HTML5 Drag & Drop API
- ✅ Reuse all existing game logic (no changes to `js/game/`)
- ✅ Mobile-first responsive design

### Why This Will Work
1. **Proven approach** - v3.0 used HTML/CSS and worked well
2. **Simpler debugging** - Inspect elements, see what's happening
3. **Better UX** - Native browser interactions, accessibility built-in
4. **Faster development** - No learning curve, straightforward implementation
5. **Mobile friendly** - Touch events, responsive utilities in Tailwind

---

## 📋 Next Steps

1. **Read**: [HTML-REBUILD-PLAN.md](./HTML-REBUILD-PLAN.md) - Detailed implementation guide
2. **Start new session**: Fresh agent without Phaser baggage
3. **Follow phases**: 6 clear phases from static layout to polish
4. **Keep testing** - Manual testing after each phase
5. **Ship MVP** - Working solo-mode game in single session

---

## 📂 File Organization

### Keep (Working Code)
```
js/game/
  ├── hex-grid.js          ✅ Coordinate system
  ├── token-manager.js     ✅ Stacking validation  
  ├── scoring-engine.js    ✅ All 6 categories
  └── animal-cards.js      ✅ Card definitions

js/data/
  └── animal-cards.js      ✅ Card data

tests/
  └── *.test.js            ✅ 64 passing tests
```

### Archive (Failed Attempt)
```
js/phaser/               ❌ Move to archive/
js/main.js              ❌ Phaser config
index.html (current)    ❌ Replace with new version
```

### Create (New Implementation)
```
harmonies-v4.1.html     🆕 Single-file MVP
OR
index.html              🆕 Clean HTML structure
css/game.css           🆕 Hex grid styles
js/ui/                 🆕 UI controllers
  ├── hex-renderer.js
  ├── central-board.js
  ├── game-controller.js
  └── drag-drop.js
```

---

## 🎮 Expected Timeline

| Phase     | Task                       | Duration    |
| --------- | -------------------------- | ----------- |
| 1         | HTML structure + Tailwind  | 1 hour      |
| 2         | Hex grid rendering         | 2 hours     |
| 3         | Token supply UI            | 1 hour      |
| 4         | Drag & drop                | 2 hours     |
| 5         | Game flow                  | 1 hour      |
| 6         | Polish & mobile            | 1 hour      |
| **Total** | **Working solo-mode game** | **8 hours** |

---

## 📚 Resources for Next Session

### Must Read First
- [HTML-REBUILD-PLAN.md](./HTML-REBUILD-PLAN.md) - Complete implementation guide

### Quick Reference
- **Tailwind CDN**: `<script src="https://cdn.tailwindcss.com"></script>`
- **Hex CSS**: `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)`
- **Game state**: `import { initializePersonalBoard } from './js/game/hex-grid.js'`
- **Validation**: `import { canPlaceToken } from './js/game/token-manager.js'`
- **Scoring**: `import { calculateTotalScore } from './js/game/scoring-engine.js'`

### Testing
```bash
# Start server
cd /Users/nhat/repo-fun/I-And-AI/projects/gaming/harmonies
python3 -m http.server 8001

# Open in browser
open http://localhost:8001/harmonies-v4.1.html
```

---

## ✅ Success Criteria

The new implementation succeeds when:
1. Game loads and displays all UI elements
2. Can click to select token space
3. Can drag tokens to hex grid
4. Placement validation works (shows errors for invalid moves)
5. Score updates in real-time
6. Can complete 15-turn game
7. Mobile responsive and playable on touch devices
8. All 64 existing unit tests still pass

---

## 💪 Confidence Level: HIGH

**Why we'll succeed**:
- ✅ Game logic already works (64 passing tests)
- ✅ HTML/CSS approach proven in v3.0
- ✅ Tailwind makes styling fast
- ✅ Clear, actionable plan with examples
- ✅ No framework complexity, just vanilla JS + CSS

**Avoid these mistakes**:
- ❌ Don't modify game logic in `js/game/`
- ❌ Don't add complex state management
- ❌ Don't overthink animations initially
- ❌ Don't optimize prematurely

**Follow the plan, build incrementally, test often.** 🚀
