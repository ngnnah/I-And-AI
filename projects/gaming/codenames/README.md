# Codenames

**Multiplayer word-guessing game** — Teams compete to identify agents using one-word clues. Real-time Firebase sync.

**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [How to Play](#how-to-play)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Features

- **Four game modes:** 
  - 📝 **Words** (5×5) — Classic competitive mode
  - 📷 **Pictures** (5×4) — Image-based competitive
  - ✂️ **DIY** (5×4) — Custom images competitive
  - 🤝 **Duet** (5×5) — 2-player cooperative ([see guide](DUET-MODE.md))
- **Multiplayer:** 2-8 players, 6-char room codes, real-time Firebase sync
- **Competitive & Cooperative:** Red vs Blue teams OR work together in Duet mode
- **Game History:** Completed games tracked with player rosters and results
- **Mobile-first:** Touch-friendly, responsive design

---

## Quick Start

```bash
open index.html              # No build needed
npm test                     # Run tests
```

---

## How to Play

### Competitive Mode (Words / Pictures / DIY)

1. **Setup:** Enter name → Pick mode → Create/join room → Choose team & role
2. **Spymaster's turn:** Give one-word clue + number (e.g., "ANIMAL 3")
3. **Operatives' turn:** Guess up to N+1 cards
   - ✅ Correct → Continue guessing
   - ❌ Wrong/Neutral → Turn ends
   - ☠️ Assassin → Instant loss
4. **Win:** First team to reveal all their agents wins

### Duet Mode (Cooperative) 🤝

2-player cooperative variant where both players work together to find 15 green agents before running out of 9 turns or making 9 mistakes. Each player sees different color maps for the same board.

**[→ Full Duet Mode Guide](DUET-MODE.md)**

---

## Architecture

### Phase-Based State Machine

```
setup → playing → finished
```

- **Setup:** Players join teams/roles, host starts game
- **Playing:** Alternating clue/guess phases per team
- **Finished:** Winner declared, game saved to history

### Screen Flow

1. **player-setup** → Enter name, generate UUID
2. **lobby** → Create/join games, view history
3. **game-room** → Unified screen for all phases

### Module Structure

```
js/
├── main.js                  # Screen router, event dispatcher
├── game/
│   ├── firebase-config.js   # Database CRUD operations
│   ├── firebase-sync.js     # Multiplayer sync, turn logic
│   ├── game-logic.js        # Win conditions, validation (pure functions)
│   └── game-state.js        # Local state (localStorage)
├── screens/
│   ├── player-setup.js      # Name entry
│   ├── lobby.js             # Game list, history display
│   └── game-room.js         # Main game UI (setup/playing/finished)
└── data/
    ├── word-lists.js        # 400 English words
    ├── picture-cards.js     # 100 image paths
    └── diy.js               # Custom image config
```

### Firebase Schema

```
/games/{gameId}
  ├── createdAt: timestamp
  ├── status: "setup" | "playing" | "finished"
  ├── displayName: "PHOENIX"
  ├── gameMode: "words" | "pictures" | "diy"
  ├── hostId: playerId
  ├── players/{playerId}
  │   ├── name, team, role, isActive
  ├── board
  │   ├── words: string[] (25 or 20)
  │   ├── colorMap: number[] (0=red, 1=blue, 2=neutral, 3=assassin)
  │   └── revealed: boolean[]
  ├── gameState
  │   ├── phase: "clue" | "guess"
  │   ├── currentTurn: "red" | "blue"
  │   ├── currentClue: {word, number}
  │   ├── guessesRemaining, redTotal, blueTotal
  │   ├── winner, winReason
  └── clueLog: [{clue, guesses[]}]

/gameHistory/{gameId}
  ├── gameId, finishedAt, duration
  ├── displayName, gameMode, winner, winReason
  └── players: {name, team, role}
```

### Sync Pattern

**Optimistic UI with Server Authority:**
1. User action → Instant UI update
2. Write to Firebase via `update()`
3. `onValue()` listener receives server state
4. UI reconciles with authoritative state

**Critical Operations:**
- Player join → `players/{playerId}`
- Start game → Generate board + gameState
- Give clue → Validate + update currentClue
- Make guess → Check result + update revealed[] + check win
- End game → Set finished + save history

---

## Tech Stack

- **Frontend:** Vanilla JS (ES6 modules), no framework
- **Database:** Firebase Realtime Database (Asia Southeast)
- **Testing:** Node.js test runner (built-in)
- **Hosting:** GitHub Pages (static)
- **Styling:** CSS Grid, mobile-first

**Config:** See [FIREBASE-RULES.md](FIREBASE-RULES.md) for security rules

---

## Development Guide

### Core Principles

1. **Server Authority** - Firebase is source of truth
2. **Optimistic UI** - Update immediately, rollback if needed
3. **No Build Step** - Pure ES6 modules, test in browser
4. **Mobile First** - 375px minimum, touch-friendly
5. **Atomic Updates** - Use `update()` with paths, never overwrite

### Code Conventions

```javascript
// ✅ Good: Scoped update
await update(ref(database, `games/${gameId}`), {
  'gameState/phase': 'guess',
  'gameState/currentClue': {word, number}
});

// ❌ Bad: Overwrites entire game
await set(ref(database, `games/${gameId}`), newGameData);
```

**Naming:**
- Functions: `camelCase` (`handleGuess`, `renderBoard`)
- Files: `kebab-case` (`game-logic.js`, `firebase-sync.js`)
- CSS: `kebab-case` (`.game-header`, `.btn-primary`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_PLAYERS`)

### Common Tasks

#### Add New Game Mode
1. Update Firebase rules (`gameMode` validation)
2. Create data file in `js/data/`
3. Update mode selector in `index.html`
4. Add emoji to `lobby.js` history display
5. Update board rendering in `game-room.js`

#### Add New Feature
1. Design data structure (update Firebase schema above)
2. Implement logic in `game-logic.js` (pure functions)
3. Add Firebase writes in `firebase-sync.js`
4. Update UI in `game-room.js`
5. Write tests before committing

#### Debug Multiplayer Issues
1. Check Firebase Rules ([FIREBASE-RULES.md](FIREBASE-RULES.md))
2. Verify atomic updates (no race conditions)
3. Test with 2+ browser windows
4. Check `onValue()` listener for re-entry
5. Inspect Firebase network tab

### File Workflow

**✅ DO:**
- Edit `projects/gaming/codenames/` (source)
- Test locally before syncing
- Sync to `public/projects/gaming/codenames/`
- Force-add `js/data/*.js` (gitignored by default)
- Update tests when changing logic

**❌ DON'T:**
- Edit `public/` directly (rsync overwrites)
- Add dependencies or build tools
- Change Firebase config without coordination
- Commit without multiplayer testing

### Debugging Checklists

**Game not syncing?**
- [ ] Firebase Rules (console: "Permission denied")
- [ ] `onValue()` listener attached
- [ ] Network tab shows Firebase requests
- [ ] Test in incognito (clear localStorage)

**Cards not clickable?**
- [ ] Phase is "guess"
- [ ] `currentTurn` matches player team
- [ ] Player role is "operative" (not spymaster)
- [ ] Card not already revealed

**Tests failing?**
- [ ] Run `npm test` for error details
- [ ] Check if Firebase mock needed
- [ ] Verify test data matches schema
- [ ] Update expectations if rules changed

---

## Testing

**Coverage:**
- ✅ Game logic (win conditions, turn rules)
- ✅ State transitions (setup → playing → finished)
- ✅ Word list validation (duplicates, profanity)
- ✅ Game mode scenarios
- ⏭️ Skip: Firebase sync, UI rendering, CSS

**Run:**
```bash
npm test                     # All tests
npm test -- game-logic       # Specific file
```

**Add Test:**
```javascript
// tests/new-feature.test.js
import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import { yourFunction } from '../js/game/your-module.js';

describe('Feature Name', () => {
  it('should handle edge case', () => {
    const result = yourFunction(input);
    assert.equal(result, expected);
  });
});
```

---

## Deployment

```bash
# 1. Edit in projects/gaming/codenames/
# 2. Test locally
# 3. Sync to public/
rsync -av --delete projects/gaming/codenames/ public/projects/gaming/codenames/

# 4. Force-add data files (.gitignore excludes data/)
git add -f projects/gaming/codenames/js/data/*.js
git add -f public/projects/gaming/codenames/js/data/*.js

# 5. Commit and push → Auto-deploys via GitHub Actions
```

---

## Reference

**Key Files:**
- `js/game/game-logic.js` - Pure functions, no Firebase
- `js/game/firebase-sync.js` - All state mutations
- `js/screens/game-room.js` - DOM manipulation
- `FIREBASE-RULES.md` - Security configuration

**Need Help?**
- Game rules → Official Codenames documentation
- Firebase patterns → Check `firebase-sync.js` examples
- Data structures → See Firebase Schema section above

---

**Remember:** Real-time multiplayer requires careful handling of race conditions, latency, and state reconciliation. Always test with multiple browser windows!
