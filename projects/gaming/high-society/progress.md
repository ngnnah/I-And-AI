# High Society — Progress Tracker

> AI session handoff document. Update this file at the start and end of every coding session.
> Format: check off completed items, move "Next Up" items to "In Progress" when starting them.

---

## Current Status

**Phase:** Complete — shipped and deployed
**Last Updated:** 2026-03-07
**Branch:** main

---

## Completed

### Planning & Docs

- [x] Game rules researched (Reiner Knizia's High Society)
- [x] `how-to-play.md` — full rules, auction mechanics, scoring, app guide
- [x] `README.md` — architecture, Firebase schema, dev/deploy guide
- [x] `progress.md` — this file

### Phase 1 — Scaffolding & Data

- [x] `package.json` — ES6 modules, `node --test`, `@playwright/test` dev dep
- [x] `index.html` — 3 screen shells with all bidding UI elements
- [x] `css/styles.css` — mobile-first, card animations, player colors, bidding layout
- [x] `js/data/cards.js` — 16 status card definitions (force-added to git)
- [x] `js/data/room-names.js` — display name generator
- [x] `js/main.js` — screen router, dynamic module loading

### Phase 2 — Core Logic

- [x] `js/game/game-logic.js` — all pure functions (75 tests passing)
- [x] `tests/game-logic.test.js` — full coverage

### Phase 3 — Firebase Sync

- [x] `js/game/game-state.js` — local state + localStorage
- [x] `js/game/firebase-sync.js` — full auction lifecycle
- [x] `js/game/firebase-config.js` — Firebase init + CRUD

### Phase 4 — Screens

- [x] `js/screens/player-setup.js` — name entry, UUID gen
- [x] `js/screens/lobby.js` — create/join/list games
- [x] `js/screens/game-room.js` — bidding UI, card display, scores, auction log

### Phase 5 — Polish & Deploy

- [x] Mobile layout (390px, no horizontal scroll)
- [x] Sound effects via Web Audio API (`js/game/sounds.js`) — procedural, no files
- [x] Card reveal animations, bidder glow, disgrace pulse, turn flash
- [x] Cumulative bid system — cards irrevocable once placed on table
- [x] Committed bid display ("On table 🔒") vs staged cards
- [x] Fold without bidding — critical UX fix (fold button always enabled on your turn)
- [x] `getNextBidder` turn order fix — index-based traversal from folder's position
- [x] Thief deferred effect via `pendingThief` flag + UI modal
- [x] Auction log (last 5 resolved cards shown)
- [x] Sync to `public/` + force-added data files + deployed to GitHub Pages

### Phase 6 — E2E Testing (Playwright)

- [x] `@playwright/test` + Chromium browser installed
- [x] `playwright.config.js` — serial worker, 30s timeout, retries: 1
- [x] `tests/ui.spec.js` — **26/26 tests pass**, no retries needed
  - Player setup: validation, error states, Enter key
  - Lobby: create/join, code validation, name change
  - Game room: room code, waiting phase, back button
  - **Multi-player**: 3 browser contexts join same room, host starts game, verify all see bidding phase
  - **Bidding flow**: active bidder selects card → confirm bid works; fold without selecting any cards works
  - Accessibility: all buttons labelled, error messages have visible text
  - Layout: mobile no-scroll (390px)
- [x] Root cause fix: `waitUntil: 'networkidle'` in `goToSetup()` — ensures dynamic JS imports finish before test interacts with buttons

---

## In Progress

_Nothing currently in progress._

---

## Next Up

_All phases complete. Possible future additions:_

- Spectator mode (join game as observer)
- Chat / emoji reactions during auction
- Game replay / history detail view
- Sound volume control
- Playwright test: complete a full game to "finished" screen

---

## Key Decisions

| Decision         | Choice                                                         | Reason                                                |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Tech stack       | Vanilla JS + Firebase                                          | Consistent with codenames/ito; no build step needed   |
| Firebase project | Same as codenames                                              | Reuse existing credentials and DB URL                 |
| Disgrace auction | First to pass takes card + retrieves money; bidders lose money | See how-to-play.md for full explanation               |
| Player colors    | crimson, navy, forest, gold, violet                            | 5 colors for max 5 players                            |
| Elimination tie  | Earlier joiner is eliminated                                   | Deterministic, consistent                             |
| Thief deferred   | `pendingThief: true` on player                                 | Resolved when next luxury card won                    |
| Money visibility | Public (all players see all money totals)                      | Standard High Society rule                            |
| Cumulative bids  | New cards added to committed bid, not replaced                 | Correct High Society rule; irrevocable once placed    |
| Sound            | Web Audio API procedural synthesis                             | No file downloads, works offline                      |
| Playwright setup | `waitUntil: 'networkidle'` on page reload                      | Dynamic imports must complete before clicking buttons |

---

## Known Issues / Watch Out For

- **`data/` is gitignored globally** — always `git add -f js/data/*.js` for both `projects/` and `public/` copies
- **Race conditions in disgrace auction** — two players might try to pass simultaneously; Firebase read-before-write mitigates but not fully transactional
- **Same Firebase DB** as codenames — path is `hs-games/` (not `games/`) to avoid collision

---

## Session Log

| Date       | Work Done                                                           | Next                |
| ---------- | ------------------------------------------------------------------- | ------------------- |
| 2026-03-07 | Initial planning, docs (how-to-play, README, progress)              | Phase 1 scaffolding |
| 2026-03-07 | Full implementation: all phases 1-5, deployed, UX polish, sounds    | E2E testing         |
| 2026-03-07 | Playwright E2E: 26 tests, multi-player flow, networkidle fix, skill | Done                |
