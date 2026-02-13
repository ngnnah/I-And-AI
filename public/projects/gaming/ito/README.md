# 🎴 Ito — Cooperative Number Game

**Production-Ready • 100 Tests Passing**

Play remotely over video call. Get to know each other through numbers!

Players receive secret numbers and a theme (e.g., "How much do you like pizza?"). Without revealing numbers, everyone describes theirs using the theme. The group then arranges players from lowest to highest. Flip to check!

---

## 🚀 Quick Start

### 1. Firebase Setup (10 min)
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Create Realtime Database in **test mode**
3. Update `js/game/firebase-config.js` with your credentials

### 2. Test Locally
```bash
open index.html
# OR
python3 -m http.server 8000
```

### 3. Deploy
```bash
# Sync to public
rsync -av --delete --exclude='node_modules' --exclude='tests' \
  projects/gaming/ito/ public/projects/gaming/ito/

# Force-add data files
git add -f projects/gaming/ito/js/data/themes.js
git add -f public/projects/gaming/ito/js/data/themes.js

# Commit and push
git add . && git commit -m "feat: add Ito game" && git push
```

---

## 🎮 How to Play

1. **Host creates game** → Choose difficulty (Kids 1-10 / Adults 1-100) → Share room code
2. **Players join** → Enter room code
3. **Each round**:
   - Host starts round
   - Everyone sees theme + secret number
   - Discuss on video call (without revealing numbers!)
   - Host arranges players lowest → highest
   - Click "Reveal" to check
4. **Win**: Complete all rounds (Kids: 8 rounds, Adults: 10 rounds)

---

## 🎯 Design Decisions

| Decision             | Choice                       | Rationale                                         |
| -------------------- | ---------------------------- | ------------------------------------------------- |
| **Target Audience**  | Family (kids 5-10 + adults)  | Simple cooperative play, "get to know you" themes |
| **Difficulty Modes** | Kids (1-10) / Adults (1-100) | Kid-friendly MVP, scalable complexity             |
| **Player Ordering**  | Host-led (tap to arrange)    | ✅ Avoids mobile drag/drop issues & sync conflicts |
| **Communication**    | External video call          | App handles cards + themes only, keep it simple   |
| **Mistake Handling** | Continue, track success      | Kid-friendly, no frustration                      |
| **Secrecy**          | Trust-based                  | Family game, social engineering > technical auth  |
| **Stack**            | Vanilla JS + Firebase RTDB   | Fast MVP, matches existing games pattern          |
| **Testing**          | Vitest with 100 tests        | Production-ready, comprehensive coverage          |

---

## 📁 File Structure

```
ito/
├── index.html              # SPA: 4 screens
├── css/styles.css          # Mobile-first styling
├── js/
│   ├── main.js             # App initialization & routing
│   ├── data/
│   │   └── themes.js       # 55 themes across 6 categories
│   ├── game/
│   │   ├── firebase-config.js    # Firebase setup
│   │   ├── firebase-sync.js      # Round lifecycle
│   │   ├── game-logic.js         # Core game functions ⭐
│   │   └── game-state.js         # State persistence
│   └── screens/
│       ├── player-setup.js       # Name entry
│       ├── lobby.js              # Create/join game
│       ├── game-room.js          # Main gameplay
│       └── game-over.js          # Results
└── tests/                  # 100 tests ✅
```

---

## 🎨 Features

**Two Difficulty Modes**
- **Kids**: 1-10, 8 rounds (ages 5-10)
- **Adults**: 1-100, 10 rounds

**55 Family-Friendly Themes** across 6 categories:
- Food (15), Animals (10), Activities (12), Feelings (7), Silly (5), Personal (6)

**Cooperative Gameplay**
- No punishment for mistakes, continue playing
- Track success count for fun

**Mobile-First Design**
- Large touch-friendly buttons
- Big 72px number display
- Works on any device

---

## 🧪 Testing

**100 tests, all passing ✅**

```bash
npm install
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Test Coverage:**
- 31 tests: game logic (theme selection, number dealing, order checking)
- 23 tests: theme data integrity
- 26 tests: state management & localStorage
- 20 tests: full gameplay scenarios (kids/adults modes, edge cases)

**Code Quality:**
- Pure functions (fully testable)
- Input validation everywhere
- Fisher-Yates shuffle for randomness
- Theme exhaustion auto-reset
- Error handling with descriptive messages

---

## 🔥 Firebase Data Model

```javascript
games/{GAME_ID}/
  status: "waiting" | "playing" | "finished"
  hostId, createdBy, displayName
  settings: { difficulty, rangeMax, roundsTotal }
  players: { [playerId]: { name, isActive, joinedAt } }
  gameState: {
    phase: "waiting" | "discuss" | "placing" | "reveal"
    theme: { id, text, category }
    hands: { [playerId]: secretNumber }
    placedOrder: [playerId, ...]
    revealed, wasCorrect, firstErrorIndex
    successCount, roundsPlayed, usedThemeIds
  }
```

---

## 🐛 Troubleshooting

**Firebase not connecting:**
- Check config credentials in `firebase-config.js`
- Verify RTDB rules: `{ ".read": true, ".write": true }`

**Themes not loading:**
```bash
git add -f projects/gaming/ito/js/data/themes.js
git add -f public/projects/gaming/ito/js/data/themes.js
```

**404 on GitHub Pages:**
- Verify files synced to `public/`
- Check paths are relative (not absolute)
- Clear browser cache

---

## 🚀 Future Enhancements

**v1.1** - Custom themes, text input  
**v1.2** - 20-30 more themes, Family Memories category  
**v1.3** - Rejoin mid-game, game history, avatars  
**v2.0** - Competitive mode, team-based, leaderboards

---

## 📚 Documentation

- **[tests/README.md](tests/README.md)** - Test suite details
- **[copilot-plan.md](copilot-plan.md)** - Original design plan
- **[archive/](archive/)** - Development history docs

---

**Status**: ✅ Production Ready  
**Implementation**: February 13, 2026  
**Tests**: 100/100 passing ✅

See [tests/README.md](tests/README.md) for detailed test documentation.

## 🚀 Next Steps

1. **Create Firebase project** — new RTDB, paste config into `firebase-config.js`
2. **Set RTDB rules** — `{ ".read": true, ".write": true }` for MVP
3. **Test locally** — open `index.html`, create + join game in two tabs
4. **Deploy** — rsync to `public/projects/gaming/ito/`, push to main
5. **Update landing page** — add Ito to `public/index.html`

## 🔮 Future Ideas

- Custom themes (host enters their own)
- More theme packs (travel, movies, school, holidays)
- Player avatars/colors for kids
- Rejoin mid-game support
- Game history
- Bilingual themes (English + Vietnamese)
