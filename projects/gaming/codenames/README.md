# Codenames

**Multiplayer word-guessing game** — Teams compete to identify agents using one-word clues. Real-time Firebase sync.

**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/

## Features

- **Three modes:** 📝 Words (5×5), 📷 Pictures (5×4), ✂️ DIY (5×4)
- **Multiplayer:** 2-8 players, 6-char room codes, real-time Firebase sync
- **Gameplay:** Red vs Blue teams, Spymaster/Operative roles, clue validation
- **Game History:** Completed games tracked with player rosters and results

## Quick Start

```bash
open index.html              # No build needed
npm test                     # Run tests
```

## Implementation Design

### Architecture Overview

**Phase-based State Machine:**
- `setup` → Players join teams/roles → Host starts
- `playing` → Spymaster gives clue → Operatives guess → Repeat
- `finished` → Winner declared, game saved to history

**Screen Flow:**
1. `player-setup` → Enter name, generate player ID (UUID)
2. `lobby` → Create/join games, view history
3. `game-room` → Unified screen handling all 3 phases

### Core Modules

```
js/
├── main.js                  # Screen router, event dispatcher
├── game/
│   ├── firebase-config.js   # Database helpers, game CRUD
│   ├── firebase-sync.js     # Multiplayer sync, turn logic
│   ├── game-logic.js        # Win conditions, validation
│   └── game-state.js        # Local state (player ID, current game)
├── screens/
│   ├── player-setup.js      # Name entry
│   ├── lobby.js             # Game list, history, join/create
│   └── game-room.js         # Setup/playing/finished phases
└── data/
    ├── word-lists.js        # 400 English words
    ├── picture-cards.js     # 100 image paths
    └── diy.js               # Custom image upload config
```

### Data Structures

**Firebase Database Schema:**
```
/games/{gameId}
  ├── createdAt: timestamp
  ├── status: "setup" | "playing" | "finished"
  ├── displayName: "PHOENIX"
  ├── gameMode: "words" | "pictures" | "diy"
  ├── hostId: playerId
  ├── players/{playerId}
  │   ├── name: string
  │   ├── team: "red" | "blue" | null
  │   ├── role: "spymaster" | "operative" | null
  │   └── isActive: boolean
  ├── board
  │   ├── words: string[] (25 or 20)
  │   ├── colorMap: number[] (0=red, 1=blue, 2=neutral, 3=assassin)
  │   └── revealed: boolean[]
  ├── gameState
  │   ├── phase: "clue" | "guess"
  │   ├── currentTurn: "red" | "blue"
  │   ├── currentClue: {word, number}
  │   ├── guessesRemaining: number
  │   ├── redTotal: 9 | 8 (words: 9 or 8, pictures: 7)
  │   ├── blueTotal: 8 | 7
  │   ├── winner: "red" | "blue" | null
  │   └── winReason: "assassin" | "all-cards" | null
  └── clueLog: array of {clue, guesses[]}

/gameHistory/{gameId}
  ├── gameId, finishedAt, duration
  ├── displayName, gameMode, createdBy
  ├── winner, winReason
  └── players: {name, team, role}
```

### Firebase Sync Pattern

**Optimistic UI Updates with Rollback:**
1. User action (e.g., click card) → Instant UI feedback
2. Write to Firebase via `update()`
3. Server authoritative via `onValue()` listener
4. Conflicts resolved by server state

**Critical Sync Points:**
- Player joins → Update `players/{playerId}`
- Start game → Generate board, initialize gameState
- Give clue → Validate, update currentClue
- Make guess → Check result, update revealed[], check win
- Game ends → Set status="finished", save to gameHistory

### Game Logic Flow

**Turn Cycle:**
```
CLUE phase (Spymaster's turn)
  ↓ Give clue (word + number)
GUESS phase (Operatives' turn)
  ↓ Click card → Validate → Update revealed[]
  ├─ Correct → Continue or switch (if guesses exhausted)
  ├─ Wrong/Neutral → Switch turn
  └─ Assassin → Immediate loss
```

**Win Conditions:**
- All team cards revealed → Winner
- Assassin revealed → Opponent wins

## How to Play

1. Enter name → (Pick mode → Create)/join room 
2. **Spymaster:** Give one-word clue + number
3. **Operative:** Guess N+1 cards (correct = continue, wrong/neutral = turn ends, assassin = lose)
4. First team to reveal all agents wins

## Tech Stack

- **Frontend:** Vanilla JS (ES6 modules), no framework
- **Database:** Firebase Realtime Database (Asia Southeast)
- **Testing:** Node.js test runner (built-in)
- **Hosting:** GitHub Pages (static)
- **Styling:** Mobile-first CSS Grid, no preprocessor

## Firebase Configuration

**Required Rules:** See [FIREBASE-RULES.md](FIREBASE-RULES.md)

**Database:** `codenames-game-f4ff8-default-rtdb.asia-southeast1.firebasedatabase.app`

**Security:**
- Scoped writes per game ID
- Status field validation
- Game history validation (gameId, finishedAt, winner required)
- Default deny for unknown paths

## Deployment

```bash
# Edit in projects/gaming/codenames/
# Test locally
# Sync to public/
rsync -av --delete projects/gaming/codenames/ public/projects/gaming/codenames/

# Force-add data files (.gitignore excludes data/)
git add -f projects/gaming/codenames/js/data/*.js
git add -f public/projects/gaming/codenames/js/data/*.js
```

## Testing Strategy

**Test Coverage:**
- ✅ Game logic (win conditions, turn validation)
- ✅ State transitions (setup → playing → finished)
- ✅ Word list validation (no duplicates, profanity check)
- ✅ Game mode scenarios (words, pictures, DIY)
- ⏭️ Skip: Firebase sync (integration tests), UI rendering, CSS

**Run Tests:**
```bash
npm test                     # All tests
npm test -- game-logic       # Specific file
```

## AI Coding Agent Instructions

**When working on Codenames, follow these guidelines:**

### Development Principles

1. **Server Authority** - Firebase state is source of truth. All game logic writes must go through Firebase sync.
2. **Optimistic UI** - Update UI immediately, rollback if Firebase rejects.
3. **No Build Step** - Pure ES6 modules, no transpilation. Test in browser directly.
4. **Mobile First** - Design for touch, 375px viewport minimum.
5. **Atomic Updates** - Use Firebase `update()` with path objects, never overwrite entire game.

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
- Functions: `camelCase` (e.g., `handleGuess`, `renderBoard`)
- Files: `kebab-case` (e.g., `game-logic.js`, `firebase-sync.js`)
- CSS classes: `kebab-case` (e.g., `.game-header`, `.btn-primary`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_PLAYERS`)

### Common Tasks

**Add New Game Mode:**
1. Add mode to `gameMode` field validation in Firebase rules
2. Create data file in `js/data/` (word list or image paths)
3. Update mode selector in `index.html` lobby section
4. Add mode emoji to `lobby.js` history display
5. Update board rendering in `game-room.js` for new grid size

**Add New Feature:**
1. Design data structure (update Firebase schema section in README)
2. Implement game logic in `game-logic.js` (pure functions, testable)
3. Add Firebase sync in `firebase-sync.js` (write operations)
4. Update UI in `screens/game-room.js` (render logic)
5. Write tests in `tests/` before committing

**Fix Multiplayer Bug:**
1. Check Firebase Rules (see [FIREBASE-RULES.md](FIREBASE-RULES.md))
2. Verify atomic updates (no race conditions)
3. Test with 2+ browser windows simultaneously
4. Check `onValue()` listener for re-entry issues
5. Console log Firebase operations (network tab)

### File Modification Guidelines

**DO:**
- ✅ Edit `projects/gaming/codenames/` first (source)
- ✅ Sync to `public/projects/gaming/codenames/` after testing
- ✅ Force-add `js/data/*.js` files (gitignored by default)
- ✅ Test in browser before committing
- ✅ Update tests when changing game logic

**DON'T:**
- ❌ Edit `public/` directly (gets overwritten by rsync)
- ❌ Use `npm install` or package managers (no dependencies)
- ❌ Add build tools (Vite, Webpack, etc.) - keep it simple
- ❌ Change Firebase config without coordinating (shared database)
- ❌ Commit without testing multiplayer sync

### Debugging Checklist

**Game not syncing?**
- [ ] Check Firebase Rules (console errors: "Permission denied")
- [ ] Verify `onValue()` listener is attached
- [ ] Check browser network tab for Firebase requests
- [ ] Test in incognito (clear localStorage)

**Cards not clickable?**
- [ ] Check `phase` ("guess" phase required)
- [ ] Verify `currentTurn` matches player team
- [ ] Confirm player role is "operative" (not spymaster)
- [ ] Check `revealed[]` array (already clicked?)

**Tests failing?**
- [ ] Run `npm test` to see specific error
- [ ] Check if Firebase mock is needed (state tests)
- [ ] Verify test data structure matches current schema
- [ ] Update test expectations if game rules changed

### Adding Tests

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

### Reference Files

**Core Logic:** `js/game/game-logic.js` - Pure functions, no Firebase  
**Firebase Writes:** `js/game/firebase-sync.js` - All game mutations  
**UI Rendering:** `js/screens/game-room.js` - DOM manipulation  
**State Schema:** This README (Firebase Database Schema section)

### Getting Help

- **Game rules unclear?** Read official Codenames rules online
- **Firebase pattern?** Check `firebase-sync.js` for examples
- **Data structure?** See "Data Structures" section above
- **Deployment?** Follow "Deployment" section exactly

---

**Remember:** This is a real-time multiplayer game. Every change must consider race conditions, network latency, and player sync. Test with multiple browser windows!
