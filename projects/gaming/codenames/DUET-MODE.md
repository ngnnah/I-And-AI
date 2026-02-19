# Codenames Duet Mode 🤝

**Cooperative 2-player variant** — Work together to find all 15 green agents before running out of turns or making too many mistakes.

---

## How to Play

### Setup

1. Two players join a room (P1 and P2)
2. Select **"Duet"** game mode from the lobby
3. Host starts the game — board is generated with dual perspective color maps

### Game Mechanics

**Board:** 5×5 grid (25 picture cards)

---

### The Dual Key Card — Official Rules

Each player sees a **different perspective** of the same 25-card board, following strict mathematical rules:

**Every side always has exactly: 9 Green · 3 Black · 13 Tan**

| Position type            | P1 sees             | P2 sees             | Count  |
| ------------------------ | ------------------- | ------------------- | ------ |
| Shared agents            | Green               | Green               | 3      |
| P1-only agents †         | Green               | Tan (5) / Black (1) | **6**  |
| P2-only agents †         | Tan (5) / Black (1) | Green               | **6**  |
| Shared assassin          | Black               | Black               | 1      |
| P1 assassin (P2 neutral) | Black               | Tan                 | 1      |
| P2 assassin (P1 neutral) | Tan                 | Black               | 1      |
| Both neutral             | Tan                 | Tan                 | 7      |
| **Total**                | **9G 3B 13T**       | **9G 3B 13T**       | **25** |

† Within each player's 6 unique agents, **1 is the partner's assassin** (cross-danger card):

- 1 of P1's 6 unique greens is **Black on P2's map** — P2 must never guess it when P2 gives clues!
- 1 of P2's 6 unique greens is **Black on P1's map** — P1 must never guess it when P1 gives clues!

**Key facts:**

- **Shared agents:** Exactly 3 positions are Green on **both** sides — both players must find these
- **Shared assassin:** Exactly 1 position is Black on **both** sides — instant loss whoever reveals it
- **Cross-danger:** 1 of your agents is your partner's assassin — they must never clue toward it!
- **Total unique greens:** Always exactly 15 (3 shared + 6 P1-only + 6 P2-only)

---

### Turn Flow

1. **Clue Phase:** Active player gives one-word clue + number (e.g., "OCEAN 2")
2. **Guess Phase:** Partner guesses up to N+1 cards
   - 🟢 **Green card (clue giver's map):** Continue guessing (remaining guesses decrement)
   - ⚪ **Neutral card (clue giver's map):** Turn ends, mistake counter +1
   - ☠️ **Assassin (clue giver's map):** Game over — immediate loss
   - Players can **end guessing early** to preserve turns

   > The outcome of each guess is determined by the **clue giver's** color map, not the guesser's. A card that is the guesser's assassin but the clue giver's green counts as a success.

3. **Turn ends** → Switch to other player's clue phase

### Win/Loss Conditions

**Win:** Reveal all 15 green agents before limits are reached

**Loss:**

- ☠️ Reveal any assassin from the clue giver's map (immediate)
- 🔴 Use all 9 turns without finding all greens
- 🔴 Make 9 mistakes (neutral cards)

### Progress Tracking

- **Turns Used / 9** (top-left score)
- **Mistakes / 9** (top-right score)
- **Green cards found / 15** (shown in action prompt)

---

## Implementation Details

### Data Structure

**Game State:**

```javascript
{
  gameMode: 'duet',
  status: 'playing',
  board: {
    colorMapP1: [...],       // P1's perspective (25 colors)
    colorMapP2: [...],       // P2's perspective (25 colors)
    cardIds: [...],          // Image IDs for picture cards
    revealed: [...]          // Shared revelation state (25 booleans)
  },
  gameState: {
    currentPlayer: 1,        // 1 or 2 (whose turn to give clue)
    phase: 'clue' | 'guess',
    currentClue: { word, number, givenBy },
    guessesRemaining: number,
    turnsUsed: 0,            // Max 9
    mistakesMade: 0,         // Max 9
    greenRevealed: 0,        // Target: 15
    greenTotal: 15,
    winner: null | 'win' | 'loss',
    winReason: null | 'all-found' | 'assassin' | 'turns' | 'mistakes'
  }
}
```

### Key Implementation Differences from Competitive Mode

| Feature               | Competitive Mode               | Duet Mode                            |
| --------------------- | ------------------------------ | ------------------------------------ |
| **Teams**             | Red vs Blue                    | Cooperative (no teams)               |
| **Revealed tracking** | `gameState.revealedCards[]`    | `board.revealed[]`                   |
| **Turn tracking**     | `currentTurn: 'red' \| 'blue'` | `currentPlayer: 1 \| 2`              |
| **Color maps**        | Single `colorMap[]`            | Dual `colorMapP1[]` + `colorMapP2[]` |
| **Win condition**     | Team finds all agents          | Find all 15 greens                   |
| **Loss conditions**   | Opponent wins                  | Assassin, 9 turns, or 9 mistakes     |
| **Player roles**      | Spymaster/Operative            | Both give clues and guess            |

### Board Generation

```javascript
// generateDuetBoard() in game-logic.js
// Shuffle 25 positions and assign roles per official rules:

const sharedGreen      = positions[0..2];   // Green for BOTH
const p1OnlyGreen      = positions[3..7];   // Green P1, Neutral P2
const p2OnlyGreen      = positions[8..12];  // Green P2, Neutral P1
const sharedAssassin   = positions[13];     // Black for BOTH
const p1BlackIsP2Green = positions[14];     // Black P1, Green P2  ← cross-danger!
const p2BlackIsP1Green = positions[15];     // Black P2, Green P1  ← cross-danger!
const p1BlackIsP2Tan   = positions[16];     // Black P1, Neutral P2
const p2BlackIsP1Tan   = positions[17];     // Black P2, Neutral P1
// positions[18..24]: Neutral for both (7 cards)
```

### Card Reveal Logic

Outcome is always based on the **clue giver's** color map:

```javascript
// firebase-sync.js — handleCardReveal (Duet)
const clueGiver = currentPlayer === 1 ? 2 : 1; // opposite of guesser
const clueGiverMap = clueGiver === 1 ? colorMapP1 : colorMapP2;
const color = clueGiverMap[cardIndex];

if (color === "green") {
  greenRevealed++; /* continue */
}
if (color === "neutral") {
  mistakesMade++; /* end turn  */
}
if (color === "assassin") {
  /* immediate loss */
}

// greenRevealed = count of positions revealed that are green on EITHER map
```

### UI Adaptations

**Setup Phase:**

- No team selection UI
- Shows player count instead of team slots
- Requires minimum 2 players

**Playing Phase:**

- Shows both players as "P1" and "P2" (based on slot claimed during setup)
- Unified cooperative color scheme (no red/blue distinction)
- Score displays: Turns Used / Mistakes Made
- Action prompt shows green cards found progress
- Both players can give clues and guess (no role restrictions)

**Board Rendering:**

- Uses `board.revealed[]` instead of `gameState.revealedCards[]`
- Each player sees their own color map perspective
- Player perspective determined by `slotNumber` claimed during setup

---

## Strategy Tips

1. **Cross-danger awareness:** Your assassin might be your partner's green — avoid cluing toward it
2. **Shared assassin:** One card kills instantly no matter who picks it; treat it as absolutely forbidden
3. **Communicate perspectives:** Your partner sees different cards as green/neutral/black
4. **Safe clues:** Avoid clues that might lead to assassins from either perspective
5. **Manage resources:** Balance aggressive guessing against preserving turns
6. **Trust your partner:** They're working from information you don't have

---

## Technical Notes

- **Firebase sync:** Real-time updates for both players viewing same game state
- **Player ordering:** Consistent P1/P2 assignment via slot claimed during setup
- **Backward compatibility:** Duet mode coexists with competitive modes in same codebase
- **Reveal guard:** Prevents card reveals during clue phase (phase-based access control)

---

## Future Enhancements

- [ ] Add word-based Duet mode (currently pictures only)
- [ ] Configurable difficulty (fewer/more turns, mistakes)
- [ ] Spectator view showing both color maps
- [ ] Turn timer for competitive Duet play
- [ ] Statistics tracking (win rate, avg turns used)

---

**Related Files:**

- Implementation: `js/game/firebase-sync.js`, `js/game/game-logic.js`
- Configuration: `js/data/game-modes.js`
- UI: `js/screens/game-room.js`
- Tests: `tests/duet-mode.test.js`
