# Codenames

**Multiplayer word-guessing game** — Teams compete to identify agents using one-word clues. Real-time Firebase sync.

**Live:** https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/

## Features

- **Three modes:** Words (5×5), Pictures (5×4), DIY (5×4)
- **Multiplayer:** 2-8 players, 6-char room codes, real-time Firebase sync
- **Gameplay:** Red vs Blue teams, Spymaster/Operative roles, clue validation

## Quick Start

```bash
open index.html              # No build needed
npm test                     # Run tests
```

## Structure

```
codenames/
├── js/
│   ├── main.js              # Screen routing
│   ├── game/                # Logic, state, Firebase sync
│   ├── screens/             # Setup, lobby, game room
│   └── data/                # Word lists, modes, DIY
├── images/cards/            # 100 picture cards
└── tests/                   # Unit + scenario tests
```

## How to Play

1. Enter name → Create/join room → Pick mode
2. **Spymaster:** Give one-word clue + number
3. **Operative:** Guess N+1 cards (correct = continue, wrong/neutral = turn ends, assassin = lose)
4. First team to reveal all agents wins

## Tech

- Vanilla JS (ES6 modules), Firebase Realtime Database
- Node.js test runner, GitHub Pages
- Mobile-first CSS Grid

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
