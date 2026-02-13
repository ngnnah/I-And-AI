# Codenames

**Online multiplayer word-guessing game** with real-time Firebase sync. Teams compete to identify their agents using one-word clues.

**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/

## Features

**Three Game Modes**
- **Words** (5×5 grid) — Classic 25-word codenames
- **Pictures** (5×4 grid) — Visual variant with 20 image cards
- **DIY** (5×4 grid) — Custom images via file upload

**Multiplayer**
- Real-time sync via Firebase Realtime Database
- 6-character room codes for easy joining
- Supports 2-8 players per game

**Gameplay**
- Red vs Blue team competition
- Spymaster and Operative roles
- Clue validation (single word, number 0-9 or unlimited)
- Turn-based guessing with pass option
- Win by revealing all team agents (avoid the assassin!)

## Quick Start

**Local Development**
```bash
# Open directly in browser (no build needed)
open index.html

# Or use a local server
python3 -m http.server 8000
# Visit http://localhost:8000
```

**Testing**
```bash
npm test  # Run all unit tests
```

## Project Structure

```
codenames/
├── index.html                 # Main entry point
├── css/styles.css             # All styles (mobile-first)
├── js/
│   ├── main.js                # Screen routing, initialization
│   ├── game/
│   │   ├── game-logic.js      # Pure functions (board gen, validation)
│   │   ├── game-state.js      # State management (players, turns, guesses)
│   │   ├── firebase-config.js # Firebase setup, room helpers
│   │   └── firebase-sync.js   # Real-time sync logic
│   ├── screens/
│   │   ├── player-setup.js    # Name entry
│   │   ├── lobby.js           # Mode select, room creation
│   │   └── game-room.js       # Main game UI
│   └── data/
│       ├── word-lists.js      # 800+ English words
│       ├── game-modes.js      # Mode configs (cards, colors)
│       └── diy-cards.js       # DIY image upload/storage
├── images/
│   ├── cards/                 # 100 picture cards
│   ├── diy/                   # Example DIY images
│   └── docs/                  # Screenshots
└── tests/
    ├── game-logic.test.js     # Board, validation, win logic (424 lines)
    ├── game-modes.test.js     # Mode configs, DIY uploads
    ├── gameplay-scenarios.test.js  # End-to-end game flows
    └── word-lists.test.js     # Word pool validation
```

## How to Play

1. **Setup**
   - Enter your name
   - Create/join a room (6-char code)
   - Choose game mode (Words/Pictures/DIY)
   - Players join teams (Red/Blue) and pick roles (Spymaster/Operative)

2. **Spymaster Turn**
   - See the secret color map
   - Give a one-word clue + number (e.g., "ANIMAL 3")
   - Number indicates how many cards relate to the clue

3. **Operative Turn**
   - Guess cards based on the clue
   - Get N+1 guesses (clue number + bonus guess)
   - Correct guess → continue | Wrong team/neutral → turn ends | Assassin → lose instantly

4. **Win Condition**
   - First team to reveal all their agents wins
   - Revealing the assassin = immediate loss

## Tech Stack

- **Frontend:** Vanilla JS (ES6 modules), semantic HTML, CSS Grid
- **Backend:** Firebase Realtime Database (Asia Southeast)
- **Testing:** Node.js built-in test runner
- **Deployment:** GitHub Pages (static site)

## Game Balance

**Words Mode (5×5)**
- Starting team: 9 cards
- Other team: 8 cards
- Neutral: 7 cards
- Assassin: 1 card

**Pictures/DIY Mode (5×4)**
- Starting team: 7 cards
- Other team: 6 cards
- Neutral: 6 cards
- Assassin: 1 card

## Firebase Structure

```javascript
rooms/{roomId}/
  ├── gameId: "ABC123"
  ├── gameMode: "words" | "pictures" | "diy"
  ├── startingTeam: "red" | "blue"
  ├── currentTeam: "red" | "blue"
  ├── phase: "waiting" | "spymaster" | "operative"
  ├── players: { playerId: { name, team, role, joinedAt } }
  ├── board: { words[], colorMap[], revealed[] }
  ├── clue: { word, number, remainingGuesses }
  └── gameOver: { winner, reason }
```

## Testing Coverage

- **game-logic.test.js** — Board generation, validation, win conditions (424 lines)
- **game-modes.test.js** — Mode configs, DIY image handling (162 lines)
- **gameplay-scenarios.test.js** — Turn flows, team switching, edge cases (279 lines)
- **word-lists.test.js** — Word pool integrity (76 lines)

**Run tests:** `npm test`

## Deployment

**Workflow:**
1. Edit in `projects/gaming/codenames/`
2. Test locally
3. Sync to `public/projects/gaming/codenames/`
   ```bash
   rsync -av --delete --exclude='.git' --exclude='node_modules' \
     projects/gaming/codenames/ public/projects/gaming/codenames/
   ```
4. Commit and push to `main` → Auto-deploys via GitHub Actions

**Note:** Force-add data files (excluded by `.gitignore`):
```bash
git add -f projects/gaming/codenames/js/data/*.js
git add -f public/projects/gaming/codenames/js/data/*.js
```

## Development Notes

**Mobile-First Design**
- Touch-friendly buttons (min 44×44px)
- Responsive grid (auto-fit, minmax)
- Safe areas for iOS devices

**State Management**
- Optimistic UI updates (instant feedback)
- Firebase sync with rollback on conflict
- Local storage for player name persistence

**Security**
- Room codes auto-expire (no cleanup implemented yet)
- Client-side validation (server-side rules recommended for production)
- No authentication (anonymous gameplay)

## Known Limitations

- No reconnection handling (refresh loses state)
- Room codes don't expire automatically
- DIY images stored in localStorage (size limit ~5MB)
- No spectator mode
- No game history/replay

## Future Enhancements

- [ ] Timer for turns
- [ ] Chat/emoji reactions
- [ ] Game stats/leaderboard
- [ ] Rematch button
- [ ] Word pack themes (e.g., movies, places)
- [ ] AI spymaster opponent

---

**Ship fast, iterate smart.** Built for rapid MVP deployment on GitHub Pages.
