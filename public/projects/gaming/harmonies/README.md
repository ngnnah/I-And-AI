# 🌿 Harmonies

A beautiful turn-based multiplayer spatial puzzle game where you build landscapes and create habitats for animals.

**📖 Complete Game Rules:** See [game-rules.md](./game-rules.md) for comprehensive rules and strategy guide.

## What is Harmonies?

Harmonies is a contemplative board game adaptation for web browsers. Play with friends and family at your own pace - no time pressure, no rushing. Build harmonious landscapes by stacking colorful tokens on a hexagonal grid, create animal habitats, and score points through multiple strategic systems.

**Perfect for:** Thoughtful gameplay with your partner, family game nights, or strategic puzzle enthusiasts.

## Game Features

✅ **Turn-based async play** - Take your time, play on your schedule
✅ **Multiplayer sync** - Changes appear instantly in all windows
✅ **Player profiles** - Track your games, scores, and history
✅ **Solo mode** - Practice alone and improve your strategy
✅ **Cross-device support** - Start on your phone, continue on your laptop
✅ **Beautiful hex grid** - Build 3D stacked landscapes with SVG graphics

## How to Play

### Game Overview

Each turn, you'll:

1. **Take 3 tokens** from the central board
2. **Place them** on your hex grid (following stacking rules)
3. **Optionally take 1 animal card** from the market
4. **Place animals** on completed habitat patterns
5. **End your turn** and pass to the next player

### Scoring Systems

- 🌲 **Trees** - Stack brown + green tokens high for more points
- ⛰️ **Mountains** - Gray tokens score when adjacent to other mountains
- 🌾 **Fields** - Large yellow areas score progressively
- 🏘️ **Buildings** - Red buildings score by terrain diversity
- 🌊 **Water** - Blue rivers score for longest connected path
- 🦌 **Animals** - Complete habitat patterns for big bonuses

**Game ends when:** The token pouch runs empty OR a player fills their board.

## Quick Start

### 1. Start a Local Server

The game requires a web server (ES6 modules don't work with `file://` URLs).

```bash
# Option 1: Python (recommended)
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: npm (if you have package.json)
npm run dev
```

Then open **http://localhost:8080** in your browser.

### 2. Play Multiplayer

Open the game in **2 browser windows** (or use incognito for the second):

**Window 1 (Player 1):**

1. Enter your username (e.g., `alice`)
2. Click **"+ Create New Game"**
3. Wait for Player 2 to join
4. Click **"Start Game"**

**Window 2 (Player 2):**

1. Enter your username (e.g., `bob`)
2. Find Player 1's game in **"Join a Game"** section
3. Click **"Join"**

**Take Turns:**

- Click 3 tokens from the central 3×3 grid
- Click **"Confirm Placement"** (they auto-place for now)
- Click **"End Turn"**

### 3. Solo Mode

Want to practice alone?

1. Click **"🎯 Play Solo"** from the lobby
2. Game starts immediately with just you
3. Track your high scores and improve your strategy

## Current Status (MVP Complete)

**Phase 1 & 2 Complete:**

- ✅ Core gameplay (token stacking, turn system)
- ✅ All 6 scoring modules working
- ✅ 10 animal cards with pattern matching
- ✅ Multiplayer real-time sync
- ✅ Player profiles and game history
- ✅ Solo mode
- ✅ Cross-device login/rejoin
- ✅ 15/16 tests passing

**Coming in Phase 3:**

- 🚧 Drag-and-drop token placement (currently auto-places)
- 🚧 Click-to-place on expansion hexes
- 🚧 Full animal card placement with visual pattern highlighting
- 🚧 Score breakdown modal (see per-category details)
- 🚧 Smooth animations and visual polish

**Future Enhancements:**

- Game abandonment (if all players agree)
- Mobile touch gestures
- Accessibility improvements
- More animal cards (expand from 10 to 48)

## Troubleshooting

**Game won't load?**

1. Make sure you're using a web server (not opening `index.html` directly)
2. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Check browser console (F12) for errors

**Multiplayer not syncing?**

- Verify both players are in the same game (check game name)
- Refresh both browser windows
- Check your internet connection (Firebase requires online access)

## Tech Stack

Built with simplicity and speed:

- **Vanilla JavaScript** (ES6 modules) - No framework bloat
- **SVG** - Beautiful hex grid rendering with 3D stacking effect
- **Firebase Realtime Database** - Multiplayer sync and persistence
- **localStorage** - Player identity across sessions

## For Developers

Want to contribute or understand the codebase?

📖 **Read the [AI Agent Development Guide](./AI-AGENT-GUIDE.md)** - Comprehensive technical documentation covering:

- Architecture and design patterns
- Core algorithms (hex grid, pattern matching, scoring)
- Firebase data model
- Testing strategy
- How to add new features

**Run Tests:**

```bash
node --test tests/core-logic.test.js
```

**File Structure:**

```
harmonies/
├── js/
│   ├── game/          # Core logic (pure functions)
│   ├── screens/       # UI screens (player-setup, lobby, game-room)
│   ├── ui/            # SVG renderers
│   └── data/          # Game configuration
├── css/               # Styling
├── tests/             # Unit tests
└── index.html         # Main entry point
```

## Deployment

When ready to deploy to GitHub Pages:

```bash
# Sync to public/
rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='tests' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/

# Force-add data files (bypasses .gitignore)
git add -f public/projects/gaming/harmonies/js/data/*.js

# Commit and push
git add public/projects/gaming/harmonies
git commit -m "feat(harmonies): update spatial puzzle game"
git push origin main
```

GitHub Pages auto-deploys in ~1 minute.

## Credits

**Original Game:** [Harmonies by Libellud](https://www.libellud.com/en/our-games/harmonies/)
**Implementation:** Built with Claude Code in ~3 hours as an MVP
**Design Philosophy:** Ship fast, iterate smart - prioritize playability over perfection

---

**Have fun building beautiful landscapes! 🌿✨**

_Questions or feedback? Open an issue or start a discussion!_
