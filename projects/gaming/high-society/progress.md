# High Society — Progress Tracker

> AI session handoff document. Update this file at the start and end of every coding session.
> Format: check off completed items, move "Next Up" items to "In Progress" when starting them.

---

## Current Status

**Phase:** 1 — Scaffolding
**Last Updated:** 2026-03-07
**Branch:** main

---

## Completed

### Planning & Docs

- [x] Game rules researched (Reiner Knizia's High Society)
- [x] `how-to-play.md` — full rules, auction mechanics, scoring, app guide
- [x] `README.md` — architecture, Firebase schema, dev/deploy guide
- [x] `progress.md` — this file

---

## In Progress

_Nothing currently in progress._

---

## Next Up (Ordered)

### Phase 1 — Scaffolding & Data

1. `package.json` — minimal, ES6 modules, `node --test` script
2. `index.html` — 3 screen shells (player-setup, lobby, game-room)
3. `css/styles.css` — mobile-first base, color variables, screen layout
4. `js/data/cards.js` — 16 status card definitions (force-add to git!)
5. `js/data/room-names.js` — display name generator (adapt from codenames)
6. `js/main.js` — screen router (copy from codenames/js/main.js, rename)
7. `js/game/firebase-config.js` — Firebase init + CRUD (adapt from codenames; same DB URL)

### Phase 2 — Core Logic (TDD first)

8. `js/game/game-logic.js` — all pure functions (see below)
9. `tests/game-logic.test.js` — full test coverage before Phase 3

### Phase 3 — Firebase Sync

10. `js/game/game-state.js` — local state + localStorage (adapt from codenames)
11. `js/game/firebase-sync.js` — all Firebase writes for game lifecycle

### Phase 4 — Screens

12. `js/screens/player-setup.js` — name entry, UUID gen (adapt from codenames)
13. `js/screens/lobby.js` — create/join/list games
14. `js/screens/game-room.js` — bidding UI, card display, scores

### Phase 5 — Polish & Deploy

15. Mobile layout pass (test at 375px)
16. Edge cases (Thief deferred, tie money elimination, last remaining bidder forced)
17. Sync to `public/` + force-add data files + deploy

---

## Key Decisions

| Decision         | Choice                                                         | Reason                                              |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Tech stack       | Vanilla JS + Firebase                                          | Consistent with codenames/ito; no build step needed |
| Firebase project | Same as codenames                                              | Reuse existing credentials and DB URL               |
| Disgrace auction | First to pass takes card + retrieves money; bidders lose money | See how-to-play.md for full explanation             |
| Player colors    | crimson, navy, forest, gold, violet                            | 5 colors for max 5 players                          |
| Elimination tie  | Earlier joiner is eliminated                                   | Deterministic, consistent                           |
| Thief deferred   | `pendingThief: true` on player                                 | Resolved when next luxury card won                  |
| Money visibility | Public (all players see all money totals)                      | Standard High Society rule                          |

---

## Key Functions to Implement (game-logic.js)

```javascript
// Data
getBidTotal(cards: number[]): number
getMoneyTotal(cards: number[]): number
isRedCard(card: Card): boolean

// Deck
shuffleDeck(cardIds: number[]): number[]  // Fisher-Yates
checkGameEnd(redCardsRevealed: number): boolean  // >= 4

// Bidding
validateBid(newBidTotal: number, currentHighest: number): { valid, error }
getNextBidder(active: string, turnOrder: string[], passed: string[]): string

// Auction resolution
resolveLuxuryAuction(auction, players): { winnerId, moneyUpdates }
resolveDisgraceAuction(auction, players): { winnerId, moneyUpdates }

// Scoring & end game
calculateScore(statusCards: number[], allCards: Card[]): number
findEliminatedPlayer(players): string  // playerId with least money
getWinner(players, eliminatedId: string, allCards: Card[]): string
```

---

## Firebase Operations to Implement (firebase-sync.js)

```javascript
createGame(playerName, playerId) → gameId
joinGame(gameId, playerName, playerId)
leaveGame(gameId, playerId)
startGame(gameId)          // deal money, shuffle deck, reveal first card
placeBid(gameId, playerId, bidCards)
foldBid(gameId, playerId)  // luxury: fold out; disgrace: pass and take card
resolveAuction(gameId)     // called when auction ends; advance deck
discardLuxuryCard(gameId, playerId, cardId)  // Thief resolution
endGame(gameId)            // trigger from 4th red card; calc scores; save history
listenToGame(gameId, callback)
listenToAllGames(callback)
```

---

## Known Issues / Watch Out For

- **`data/` is gitignored globally** — always `git add -f js/data/*.js` for both `projects/` and `public/` copies before committing
- **Race conditions in disgrace auction** — two players might try to pass simultaneously; handle with Firebase transaction or check `passed` array before writing
- **Thief on empty collection** — set `pendingThief: true` on player, resolved on next luxury win
- **Spectators** — currently no plan; mid-game join not supported (set by host enforcement)
- **Same Firebase DB** as codenames — `games/` path is shared; no collision risk since gameIds are random 6-char codes

---

## Session Log

| Date       | Work Done                                              | Next                |
| ---------- | ------------------------------------------------------ | ------------------- |
| 2026-03-07 | Initial planning, docs (how-to-play, README, progress) | Phase 1 scaffolding |
