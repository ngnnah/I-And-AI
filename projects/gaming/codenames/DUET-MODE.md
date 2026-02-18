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

**The Shared Key Card Mechanic:**

Like the physical Duet game's two-sided key card, each player sees a **different perspective** of the same board:

- **P1 sees:** 9 green cards from their side
- **P2 sees:** 9 green cards from their side  
- **3 cards are SHARED** — both players see them as green
- **Total unique greens:** 15 cards (6 P1-only + 3 shared + 6 P2-only)

**Example:**
```
P1's view: Cards 1,2,3,4,5,6,★7,★8,★9 are green (9 total)
P2's view: Cards ★7,★8,★9,10,11,12,13,14,15 are green (9 total)
Shared: ★7, ★8, ★9 (3 cards both see as green)
Goal: Find all 15 unique greens together
```

**Assassins (Different per Player):**
- **P1 has 3 assassins** at certain positions (instant loss if P1 reveals them)
- **P2 has 3 DIFFERENT assassins** at other positions (instant loss if P2 reveals them)
- Players must avoid BOTH sets of assassins
- What's safe for P1 might be deadly for P2!

**Neutral Cards:**
- Remaining cards are neutral for that player
- Revealing neutral = 1 mistake (max 9 allowed)
- One player's neutral might be another's green or assassin

**Key Insight:**
Players must give clues based on their unique perspective while considering their partner sees different dangers and targets.

### Turn Flow

1. **Clue Phase:** Active player gives one-word clue + number (e.g., "OCEAN 2")
2. **Guess Phase:** Partner guesses up to N+1 cards
   - 🟢 **Green card:** Continue guessing (remaining guesses decrement)
   - ⚪ **Neutral card:** Turn ends, mistake counter +1
   - ☠️ **Assassin:** Game over — immediate loss
   - Players can **end guessing early** to preserve turns

3. **Turn ends** → Switch to other player's clue phase

### Win/Loss Conditions

**Win:** Reveal all 15 green agents before limits are reached

**Loss:**
- ☠️ Reveal any assassin (immediate)
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
function generateDuetBoard(gameMode) {
  const config = getModeConfig('duet');
  
  // 1. Pick 15 random positions for green cards
  const greenPositions = selectRandomPositions(15, 25);
  const greenArray = Array.from(greenPositions);
  
  // 2. Create shared key card mechanic:
  //    P1 sees first 9 greens (indices 0-8)
  //    P2 sees last 9 greens (indices 6-14)
  //    Overlap: indices 6,7,8 (3 shared greens)
  const p1Green = greenArray.slice(0, 9);   // 9 greens for P1
  const p2Green = greenArray.slice(6, 15);  // 9 greens for P2 (3 overlap)
  
  // 3. Assign different assassins to each player
  const remaining = nonGreenPositions(greenPositions, 25);
  shuffleArray(remaining);
  const p1Assassins = remaining.slice(0, 3);  // P1's 3 assassins
  const p2Assassins = remaining.slice(3, 6);  // P2's 3 assassins (different!)
  
  // 4. Build color maps (rest are neutral)
  const colorMapP1 = buildColorMap(p1Green, p1Assassins, 25);
  const colorMapP2 = buildColorMap(p2Green, p2Assassins, 25);
  
  return {
    colorMapP1,      // P1's perspective
    colorMapP2,      // P2's perspective  
    cardIds: selectRandomCards(config),
    revealed: new Array(25).fill(false)  // Shared revelation state
  };
}
```

### Card Reveal Logic

**Duet-specific handling in `handleCardReveal()`:**

```javascript
// firebase-sync.js
if (config.isDuet) {
  // Use current player's perspective
  const currentPlayer = gs.currentPlayer || 1;
  const colorMap = currentPlayer === 1 
    ? game.board.colorMapP1 
    : game.board.colorMapP2;
  
  const color = colorMap[cardIndex];
  
  if (color === 'green') {
    greenRevealed++;
    // Continue guessing if guesses remain
  } else if (color === 'neutral') {
    mistakesMade++;
    // End turn, switch player
  } else if (color === 'assassin') {
    // Immediate loss
  }
  
  // Switch player (1 ↔ 2)
  updates['gameState/currentPlayer'] = currentPlayer === 1 ? 2 : 1;
}
```

### UI Adaptations

**Setup Phase:**
- No team selection UI
- Shows player count instead of team slots
- Requires minimum 2 players

**Playing Phase:**
- Shows both players as "P1" and "P2" (based on join order)
- Unified cooperative color scheme (no red/blue distinction)
- Score displays: Turns Used / Mistakes Made
- Action prompt shows green cards found progress
- Both players can give clues and guess (no role restrictions)

**Board Rendering:**
- Uses `board.revealed[]` instead of `gameState.revealedCards[]`
- Each player sees their own color map perspective
- Player perspective determined by sorted player ID order

---

## Testing

```bash
# Run Duet mode tests
node --test tests/duet-mode.test.js

# Test coverage includes:
# - Board generation with dual color maps
# - Correct card reveal (green)
# - Neutral card reveal (mistake)
# - Assassin reveal (loss)
# - Win condition (all greens found)
# - Turn limit loss
# - Mistake limit loss
# - Player switching logic
```

---

## Strategy Tips

1. **Communicate perspectives:** Remember your partner sees different cards as green/neutral
2. **Safe clues:** Avoid clues that might lead to assassins from either perspective
3. **Manage resources:** Balance between aggressive guessing and preserving turns
4. **Pattern recognition:** Look for clusters of greens only you can see
5. **Trust your partner:** They're working from information you don't have

---

## Technical Notes

- **Firebase sync:** Real-time updates for both players viewing same game state
- **Player ordering:** Consistent P1/P2 assignment via sorted active player IDs
- **Backward compatibility:** Duet mode coexists with competitive modes in same codebase
- **Gatekeeping:** Prevents card reveals during clue phase (phase-based access control)

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
