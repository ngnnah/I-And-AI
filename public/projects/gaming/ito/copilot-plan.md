# Plan: Ito - Social Connection Game

Create a multiplayer cooperative card game where players learn about each other through creative interpretations of themes. Players receive secret numbers (1-100), describe them using a shared theme (e.g., "How scary?"), then arrange themselves in order. The twist: custom DIY themes let families, friends, and strangers share perspectives and discover each other's experiences.

**MVP Scope:** Cooperative mode only, 3-6 players, room-based Firebase multiplayer, custom theme creation, mobile-friendly for video call play.

## Steps

### 1. Create project structure
Following existing pattern:
- Create `projects/gaming/ito/` directory
- Copy base structure from `projects/gaming/codenames/`
- Set up: `index.html`, `package.json`, `css/styles.css`
- Create subdirectories: `js/data/`, `js/game/`, `js/screens/`, `tests/`

### 2. Implement game data in `js/data/`
Create `theme-packs.js` - Built-in theme collections:
- **Kid-Friendly Pack** (20 themes): "How fun?", "How yummy?", "How colorful?", "How fast?", "How loud?"
- **Family Pack** (20 themes): "Mom's favorite?", "Most memorable?", "Funniest moment?", "How exciting?"
- **Get-to-Know-You Pack** (20 themes): "Childhood memory?", "Dream vacation?", "Comfort level?", "First impression?"
- **Universal Pack** (20 themes): "How spicy?", "How expensive?", "How scary?", "Temperature?", "Size?"

Each theme object: `{id, text, examples: [], category, ageAppropriate: boolean}`

Export `THEME_PACKS` array and helper `getAllThemes()`

### 3. Build pure game logic in `js/game/game-logic.js`
- `generateNumberCards(playerCount)` - Shuffle and deal 1-100 cards, returns `{playerId: number}` map
- `checkOrder(playerOrder, numberMap)` - Validate if sequence is ascending, returns `{correct: boolean, mistakes: []}`
- `canStartGame(players)` - Check min 3, max 6 players
- `createCustomTheme(text, examples)` - Validate and sanitize user input
- `getRandomTheme(themePacks, excludeIds)` - Select theme with exclusion list
- `calculateScore(attempts, successes)` - Track game stats

Pure functions, fully testable, no Firebase dependencies

### 4. Configure Firebase in `js/game/firebase-config.js`
- Copy Firebase init pattern from `projects/gaming/codenames/js/game/firebase-config.js`
- Reuse: `generateGameId()`, `generatePlayerId()`, `generateDisplayName()`
- Add: `createItoGame(hostName, hostId, customTheme)` - Initialize game with theme selection
- Add: `joinGame(gameId, playerName, playerId)`
- Add: `listenToGame(gameId, callback)` and `listenToAllGames(callback)`

### 5. Implement Firebase sync in `js/game/firebase-sync.js`
- `handleThemeSelection(gameId, themeId, isCustom, customText)` - Host picks theme
- `handleStartRound(gameId)` - Generate and assign number cards (hidden from UI)
- `handleSubmitDescription(gameId, playerId, description)` - Player enters their metaphor
- `handleSubmitOrder(gameId, orderedPlayerIds)` - Host or group submits arrangement
- `handleCheckResult(gameId)` - Reveal numbers and validate order
- `handleNewRound(gameId)` - Reset for next theme

Use atomic `update()` operations, handle race conditions

### 6. Create local state manager in `js/game/game-state.js`
Reuse pattern from `projects/gaming/codenames/js/game/game-state.js`:
- `setLocalPlayer(id, name)`, `getLocalPlayer()`, `restorePlayer()`
- `setCurrentGame(id, data)`, `getCurrentGame()`
- `isLocalPlayerHost()`, `getLocalPlayerNumber()` (if assigned)
- LocalStorage persistence for player identity

### 7. Build player setup screen in `js/screens/player-setup.js`
Copy structure from `projects/gaming/codenames/js/screens/player-setup.js`:
- Name input with validation
- Generate UUID player ID on first visit
- LocalStorage save
- Navigate to lobby after setup

### 8. Build lobby screen in `js/screens/lobby.js`
Adapt from `projects/gaming/codenames/js/screens/lobby.js`:
- **Create Game** section: Theme pack selector (display name only, hide custom at creation)
- **Join Game** section: 6-character code input
- **Active Games** list: Show game code, display name, player count (3-6), status
- Resume/rejoin existing games
- Firebase listener for real-time game list updates

### 9. Build game room screen in `js/screens/game-room.js`
- **Phase: Setup** (status=waiting)
  - Display room code prominently
  - Player list with ready indicators
  - Host controls: Theme picker (with custom theme option), Start button
  - Non-host: "Waiting for host" message
- **Phase: Describing** (status=describing)
  - Show selected theme prominently
  - Display your secret number (large, bold)
  - Text input for metaphorical description
  - Submit button
  - Show who has submitted (without revealing descriptions)
- **Phase: Ordering** (status=ordering)
  - Display all player descriptions in random order
  - Drag-and-drop interface to arrange from lowest (1) to highest (100)
  - Submit order button (host or collaborative - TBD)
- **Phase: Results** (status=results)
  - Show final arrangement with revealed numbers
  - Highlight correct/incorrect positions
  - Success/failure message
  - Stats: Attempts, successes
  - "Play Again" button (new theme, new numbers)
- Real-time sync: Listen to game updates, render UI reactively

### 10. Implement drag-and-drop ordering in `js/screens/game-room.js`
- Use HTML5 Drag and Drop API or touch-friendly library (Sortable.js - if needed)
- Mobile-friendly: Large touch targets, smooth animations
- Visual feedback: Drop zones, reordering transitions
- Accessibility: Keyboard navigation support

### 11. Create entry point in `js/main.js`
Copy routing pattern from `projects/gaming/codenames/js/main.js`:
- Screen router: `navigateTo(screenName, data)`
- Initialize Firebase on load
- Restore player from localStorage
- Show player-setup or lobby based on restore success

### 12. Style the game in `css/styles.css`
Mobile-first responsive design:
- **Theme Display:** Large, centered, easy to read during video calls
- **Number Card:** Big, bold display of player's secret number
- **Description Input:** Large text area, touch-friendly submit button
- **Drag-and-drop:** Clear visual hierarchy, drop indicators, smooth transitions
- **Room Code:** Extra-large font for easy sharing over video call
- Color scheme: Warm, inviting, kid-friendly
- Accessibility: High contrast, readable fonts (16px+ base size)

### 13. Write tests in `tests/`
- `game-logic.test.js`:
  - `generateNumberCards()` - Correct distribution, no duplicates, range 1-100
  - `checkOrder()` - Ascending validation, mistake detection
  - `createCustomTheme()` - Sanitization, validation
- `theme-packs.test.js`:
  - Validate theme structure
  - Check age-appropriate flags
  - No duplicate IDs
- `gameplay-scenarios.test.js`:
  - Full game flow simulation
  - Edge cases: min/max players, all correct, all wrong

Use Vitest following existing pattern from `projects/gaming/codenames/tests/`

### 14. Sync to deployment directory
```bash
rsync -av --delete --exclude='.git' --exclude='node_modules' \
  projects/gaming/ito/ public/projects/gaming/ito/
```

### 15. Update landing page `public/index.html`
- Add Ito to game gallery
- Description: "Learn about each other through creative number interpretations"
- Link: `/projects/gaming/ito/`
- Screenshot/icon placeholder

### 16. Force-add data files and commit
```bash
git add -f projects/gaming/ito/js/data/*.js
git add -f public/projects/gaming/ito/js/data/*.js
git add projects/gaming/ito/
git add public/projects/gaming/ito/
git add public/index.html
git commit -m "feat: add Ito social connection game - MVP cooperative mode"
git push origin main
```

## Verification
- Open `https://ngnnah.github.io/I-And-AI/projects/gaming/ito/`
- Create game with custom theme
- Join from second device/incognito window
- Complete full round: describe numbers → arrange → check result
- Verify mobile responsiveness on phone
- Test with 3, 4, 5, 6 players
- Run tests: `cd projects/gaming/ito && npm test`

## Decisions
- **No authentication** - Following existing pattern (Codenames/Nanja Monja) for quick MVP
- **Host controls ordering** - Simplifies MVP; can add collaborative drag later
- **Numbers 1-100** - Full range for adults; kid mode (1-30) can be added post-MVP
- **Custom themes at game creation** - Not just built-in packs; encourages personalization
- **No timer** - Keep it relaxed for family/phone play; can add optional timer later
- **Static site** - Firebase only, no backend server needed
- **DIY emphasis** - Custom themes are first-class feature, not afterthought

## Context

### Ito Core Gameplay
- Each player receives a number card (1-100)
- A theme is chosen (e.g., "How spicy?", "How expensive?", "How scary?")
- Players describe their number using the theme metaphorically WITHOUT saying numbers
- Players try to arrange themselves in ascending order
- Win if order is correct, lose if wrong

### Technical Patterns (from existing games)
**Reuse ~60-70% of boilerplate from Codenames/Nanja Monja:**
- Firebase config pattern (99% identical)
- Player setup + lobby screens (minor tweaks)
- Room code system (6-character alphanumeric)
- Local state management (localStorage for player identity)
- Screen routing (main.js pattern)

**Firebase Database Structure:**
```
games/
  {GAME_ID}/
    createdAt: timestamp
    status: "waiting" | "describing" | "ordering" | "results"
    displayName: "PHOENIX"
    hostId: "player-uuid"
    themeId: string
    customTheme: {text, examples} | null
    players/
      {PLAYER_ID}/
        name: string
        joinedAt: timestamp
        isActive: boolean
        secretNumber: number (1-100)
        description: string
        hasSubmitted: boolean
    gameState/
      playerOrder: string[] (playerIds in submitted order)
      isCorrect: boolean
      mistakes: [{expected, actual}]
      roundNumber: number
      stats: {attempts, successes}
```

### Design Philosophy
**Ship Fast, Iterate Smart:**
- Working MVP beats perfect architecture
- Progressive complexity - start simple, scale based on real usage
- User delight first - playability and UX over technical perfection
- Test core game logic and critical user flows

**For playing with 5-10 year olds:**
- Very simple cooperative mode
- No scoring initially, just success/failure
- Kid-friendly themes only
- Large, touch-friendly UI elements
- Easy to understand over video calls
