# 🎴 Ito — Cooperative Number Game

**Play remotely over video call. Get to know each other!**

Players receive secret numbers and a theme (e.g., "How much do you like pizza?"). Without revealing numbers, everyone describes theirs using the theme. The group then arranges players from lowest to highest. Flip to check!

## 🎯 Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Target audience | Family (kids 5–7 + adults), friends, strangers | Simple cooperative play, "get to know you" themes |
| Difficulty | Kids (1–10, 8 rounds) / Adults (1–100, 10 rounds) | Host picks per game |
| On mistakes | Continue, track rounds cleared | Kid-friendly, no frustration |
| Placement | Host-led (tap to arrange) | Avoids mobile drag/drop + sync conflicts |
| Secrecy | Trust-based (no Firebase Auth) | Family game, DevTools won't be an issue |
| Communication | External video call | App handles cards + themes only |
| Stack | Vanilla JS + Firebase RTDB + GitHub Pages | Matches existing games (nanja-monja, codenames) |

## 📁 File Structure

```
ito/
├── index.html              # SPA: 4 screens
├── css/styles.css           # Mobile-first, kid-friendly UI
├── js/
│   ├── main.js              # Screen router + app init
│   ├── data/
│   │   └── themes.js        # 55 themes (food, animals, activities, feelings, silly, personal)
│   ├── game/
│   │   ├── firebase-config.js   # Firebase RTDB setup + CRUD
│   │   ├── firebase-sync.js     # Round lifecycle actions
│   │   ├── game-logic.js        # Deal numbers, check order, difficulty presets
│   │   └── game-state.js        # localStorage player + game state
│   └── screens/
│       ├── player-setup.js      # Name entry
│       ├── lobby.js             # Create/join game, pick difficulty
│       ├── game-room.js         # All 4 game phases
│       └── game-over.js         # Results summary
```

## 🎮 Game Flow

```
Player Setup → Lobby → Game Room → Game Over
                         │
                         ├─ Waiting   (host: Start Round)
                         ├─ Discuss   (see theme + secret number, talk on video call)
                         ├─ Placing   (host arranges players lowest→highest)
                         ├─ Reveal    (flip cards, check ascending order)
                         └─ repeat until all rounds done
```

## 🔥 Firebase Data Model

```
games/{GAME_ID}/
  status: waiting | playing | finished
  hostId, createdBy, displayName
  settings: { difficulty, rangeMax, roundsTotal }
  players: { [playerId]: { name, isActive, joinedAt } }
  gameState:
    phase: waiting | discuss | placing | reveal | finished
    theme: { id, text, category }
    hands: { [playerId]: secretNumber }
    placedOrder: [playerId, ...]
    revealed, wasCorrect, firstErrorIndex
    successCount, roundsPlayed, usedThemeIds
```

## ✅ Done (MVP)

- [x] 4-screen SPA (setup → lobby → game room → game over)
- [x] Firebase RTDB sync (create/join/leave game, real-time listeners)
- [x] Full round lifecycle (startRound → discuss → placing → reveal → nextRound)
- [x] Host-led placement UI (add, move ↑↓, remove ✕)
- [x] Secret number display with hide/show toggle
- [x] 55 family-friendly themes across 6 categories
- [x] Kids (1–10) and Adults (1–100) difficulty modes
- [x] Cooperative scoring (rounds cleared, emoji rating)
- [x] Mobile-first CSS (big buttons, 72px numbers, warm palette)

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
