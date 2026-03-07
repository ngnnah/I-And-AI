# High Society

**Multiplayer bidding game** — Compete for the most prestigious collection of luxury cards. Real-time Firebase sync for 3–5 players.

**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/high-society/

---

## Table of Contents

- [Game Overview](#game-overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Firebase Schema](#firebase-schema)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Game Overview

Players bid using a hand of 11 money cards (denominations: 1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25) to win 16 status cards. The player with the least money at game end is eliminated before scoring.

**See [how-to-play.md](how-to-play.md) for full rules.**

### Card Types

| Type     | Count | Effect                           |
| -------- | ----- | -------------------------------- |
| Luxury   | 10    | Values 1–10, add to score        |
| Prestige | 3     | ×2 score multiplier (red border) |
| Disgrace | 3     | Negative effects (red border)    |

Game ends when the **4th red card** is revealed.

---

## Quick Start

```bash
open index.html    # No build needed
npm test           # Run game logic tests
```

---

## Architecture

### Phase-Based State Machine

```
lobby → playing → finished
```

- **Lobby:** Players join (3–5 required), host starts game
- **Playing:** Sequential auctions; bidding phase per card
- **Finished:** Poorest player eliminated, scores calculated, winner declared

### Auction Flow

```
reveal card
  ├── luxury/prestige → normal auction (highest bid wins)
  └── disgrace        → reverse auction (first to pass takes card for free;
                        all who bid lose their money)
```

### Screen Flow

1. **player-setup** — Enter name, generate UUID, save to localStorage
2. **lobby** — Create/join game by 6-char room code
3. **game-room** — Unified screen: lobby waiting → bidding → finished

### Module Structure

```
js/
├── main.js                  # Screen router, app init
├── game/
│   ├── firebase-config.js   # Database CRUD, generateGameId/PlayerId
│   ├── firebase-sync.js     # All Firebase writes (auction lifecycle)
│   ├── game-logic.js        # Pure functions — scoring, validation, auction rules
│   └── game-state.js        # Local state + localStorage
├── screens/
│   ├── player-setup.js      # Name entry
│   ├── lobby.js             # Game list, create/join
│   └── game-room.js         # Main game UI
└── data/
    ├── cards.js             # 16 status card definitions  ← force-add to git
    └── room-names.js        # Display names (VELVET MANOR, etc.)
```

---

## Tech Stack

- **Frontend:** Vanilla JS (ES6 modules), no framework, no build step
- **Database:** Firebase Realtime Database (Asia Southeast region)
- **Testing:** Node.js built-in test runner
- **Hosting:** GitHub Pages (static)
- **Styling:** CSS Grid, mobile-first

---

## Firebase Schema

```
/games/{gameId}
  ├── status: "lobby" | "playing" | "finished"
  ├── hostId: string
  ├── displayName: string             # e.g. "VELVET MANOR"
  ├── createdAt: timestamp
  ├── players/{playerId}
  │   ├── name: string
  │   ├── color: string               # unique per player: crimson/navy/forest/gold/violet
  │   ├── moneyCards: number[]        # remaining denominations
  │   ├── statusCards: number[]       # won card IDs (indices into cards.js)
  │   ├── pendingThief: boolean       # true = next luxury won is auto-discarded
  │   ├── isActive: boolean
  │   └── joinedAt: timestamp
  ├── deck
  │   ├── cardOrder: number[]         # shuffled card IDs
  │   ├── currentIndex: number        # next card to reveal
  │   └── redCardsRevealed: number    # 0–3; game ends at 4
  ├── auction
  │   ├── cardId: number              # current card being bid on
  │   ├── auctionType: "luxury" | "disgrace"
  │   ├── bids/{playerId}: number[]   # cards currently on table per player
  │   ├── passed: string[]            # playerIds who folded/passed (in order)
  │   ├── activeBidder: string        # whose turn it is
  │   ├── currentHighest: number      # sum of leading bid
  │   └── leadBidder: string          # playerId with current highest (luxury only)
  └── gameState
      ├── phase: "bidding" | "resolving" | "finished"
      ├── turnOrder: string[]          # playerIds in clockwise order
      ├── lastWinner: string           # starts next auction
      └── winner: string | null

/gameHistory/{gameId}
  ├── finishedAt, duration, displayName
  ├── winner: string (playerId)
  └── players/{id}: { name, color, score, moneyLeft, eliminated }
```

### Sync Pattern

**Server authority with real-time listeners:**

1. User action → Write to Firebase via `update()` (atomic)
2. `onValue()` listener receives authoritative state
3. UI re-renders from server state

**Key atomic operations:**

- `placeBid(gameId, playerId, cards)` → update bids + currentHighest + activeBidder
- `fold/pass(gameId, playerId)` → update passed[] + activeBidder or trigger resolution
- `resolveAuction(gameId)` → update player money/cards + start next auction
- `endGame(gameId)` → calculate scores + save to history

---

## Development Guide

### Core Principles

1. **Server authority** — Firebase is source of truth
2. **Atomic updates** — use `update()` with paths, never `set()` entire game
3. **No build step** — pure ES6 modules
4. **Mobile-first** — 375px minimum, touch targets ≥44px

### Code Conventions

```javascript
// Correct: scoped update
await update(ref(database, `games/${gameId}`), {
  "auction/activeBidder": nextPlayerId,
  "auction/currentHighest": newTotal,
  [`auction/bids/${playerId}`]: bidCards,
});

// Wrong: overwrites entire game
await set(ref(database, `games/${gameId}`), newData);
```

**Naming:**

- Functions: `camelCase`
- Files: `kebab-case`
- CSS classes: `kebab-case`
- Constants: `UPPER_SNAKE_CASE`

### File Workflow

1. Edit source in `projects/gaming/high-society/`
2. Test locally (`open index.html`)
3. Sync to `public/projects/gaming/high-society/`
4. Force-add data files (gitignored by default)
5. Commit and push

### Debugging Multiplayer Issues

- **Game not syncing?** → Check `onValue()` listener is attached; open Firebase console
- **Wrong player's turn?** → Verify `activeBidder` in Firebase matches local player ID
- **Bid not updating?** → Check atomic `update()` paths; verify no race conditions
- **Test with 2+ incognito windows** to simulate multiple players

---

## Testing

**What's tested (`tests/game-logic.test.js`):**

- Score calculation (0–3 prestige cards, Scandale, Passée, Thief)
- Luxury auction resolution (winner gets card, bid consumed; others refunded)
- Disgrace auction resolution (first passer gets card + money back; bidders lose money)
- Game end trigger (4th red card)
- Elimination logic (least money; tie-break by joinedAt)
- Bid validation (must exceed current highest)

**What's skipped:** Firebase sync, UI rendering, CSS, animation timing

```bash
npm test               # Run all tests
npm test -- game-logic # Run specific file
```

---

## Deployment

```bash
# 1. Edit in projects/gaming/high-society/
# 2. Test locally
# 3. Sync to public/
rsync -av --delete \
  --filter='+ /css/***' \
  --filter='+ /js/***' \
  --filter='+ /index.html' \
  --filter='- *' \
  projects/gaming/high-society/ public/projects/gaming/high-society/

# 4. Force-add data files (.gitignore excludes data/ globally)
git add -f projects/gaming/high-society/js/data/*.js
git add -f public/projects/gaming/high-society/js/data/*.js

# 5. Commit and push → GitHub Actions auto-deploys to GitHub Pages
```

---

## Key Files

| File                       | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `js/game/game-logic.js`    | Pure functions — no Firebase, fully testable |
| `js/game/firebase-sync.js` | All state mutations and game lifecycle       |
| `js/screens/game-room.js`  | DOM manipulation, bidding UI                 |
| `js/data/cards.js`         | Card definitions (force-add to git)          |
| `how-to-play.md`           | Full rules with examples                     |
| `progress.md`              | AI session handoff and task tracking         |
