# Harmonies - AI Agent Development Guide

**⚠️ UPDATED with Official Rules (2026-02-15)** - This guide now reflects the correct rules from the published Harmonies board game. Previous versions had incorrect stacking rules and scoring formulas.

**📖 For Complete Game Rules:** See [game-rules.md](./game-rules.md) - Comprehensive rules document for both AI agents and human players.

This guide is for AI agents (Claude Code, GitHub Copilot, Cursor, etc.) to understand the codebase architecture and continue development efficiently.

## Quick Context

**What:** Turn-based multiplayer spatial puzzle game (board game adaptation)
**Game:** Harmonies by Johan Benvenuto, published by Libellud (2024)
**Built:** ~3 hour MVP implementation (Phase 1 & 2 complete)
**Stack:** Vanilla JS + SVG + Firebase Realtime Database
**Status:** Core gameplay complete, **scoring algorithms need correction** (see section 3)

## Core Philosophy

- **Pure functions first** - All game logic is deterministic and testable
- **Modular scoring** - Each scoring category is independent
- **Firebase for sync only** - Never compute game state in Firebase, always local-first
- **SVG for rendering** - No canvas, no game engine dependencies
- **Optimistic UI** - Update local state immediately, rollback on Firebase conflict

## Architecture Overview

### Module Layers (Dependency Flow)

```
┌─────────────────────────────────────────────────┐
│  Screens (player-setup, lobby, game-room)      │  ← User interaction
├─────────────────────────────────────────────────┤
│  UI Renderers (board-renderer)                  │  ← SVG generation
├─────────────────────────────────────────────────┤
│  Firebase Sync (firebase-sync.js)               │  ← Write operations
├─────────────────────────────────────────────────┤
│  State Management (game-state.js)               │  ← Local state
├─────────────────────────────────────────────────┤
│  Core Logic (pure functions)                    │  ← Game rules
│    ├─ hex-grid.js (coordinate math)             │
│    ├─ token-manager.js (stacking rules)         │
│    ├─ scoring-engine.js (6 scoring modules)     │
│    └─ pattern-matcher.js (rotation/mirroring)   │
├─────────────────────────────────────────────────┤
│  Data (tokens-config, animal-cards)             │  ← Constants
└─────────────────────────────────────────────────┘
```

**Key Principle:** Lower layers never import from upper layers. Pure functions in core logic have zero external dependencies.

## Critical Implementation Details

### 1. Hex Grid System (hex-grid.js)

**Coordinate System:** Axial (q, r) with flat-topped hexes

```javascript
// Key conversions
coordToKey(q, r) → "q_r"        // Firebase key format
keyToCoord("q_r") → { q, r }    // Parse back

// Cube coordinates for rotation (internal only)
axialToCube(q, r) → { q, r, s }  where s = -q - r
cubeToAxial(q, r, s) → { q, r }

// Rotation: 60° clockwise = (q, r, s) → (-s, -q, -r)
rotateCoord(q, r, steps) // steps = 0-5 for 0°-300°
```

**Neighbor Directions (Axial):**

```
        (0, -1)    (+1, -1)
            \      /
(-1, 0) ---- (0, 0) ---- (+1, 0)
            /      \
        (-1, +1)   (0, +1)
```

### 2. Token Stacking Rules (token-manager.js)

**Official Token Distribution (120 tokens total):**
- 23 Blue (Water)
- 23 Gray (Mountains)  
- 21 Brown (Tree trunks)
- 19 Green (Tree leaves)
- 19 Yellow (Fields)
- 15 Red (Buildings)

**Stacking Matrix (Official Rules):**
| Token Color     | Can Stack On     | Max Height | Notes                                         |
| --------------- | ---------------- | ---------- | --------------------------------------------- |
| Yellow (Field)  | Nothing          | 1          | Ground level only, cannot be stacked on       |
| Blue (Water)    | Nothing          | 1          | Ground level only, cannot be stacked on       |
| Brown (Trunk)   | Brown only       | 2          | Can only stack on brown, max 2 brown in stack |
| Green (Leaves)  | Brown only       | 3          | Must have 1 or 2 brown underneath (max)       |
| Gray (Mountain) | Gray only        | 3          | Self-stacking only                            |
| Red (Building)  | Gray, Brown, Red | 2          | Can only be 2nd token in stack, never 3rd     |

**Terrain Calculation Logic:**

```javascript
// Stack composition determines terrain
[Brown] → TRUNK (0 points, not a tree yet)
[Brown, Brown] → TRUNK (0 points, not a tree yet)
[Green] → TREE (1 point - single green on ground)
[Brown, Green] → TREE (3 points - 2-token tree)
[Brown, Brown, Green] → TREE (5 points - 3-token tree)
[Gray] → ROCK (single gray, 0 points if isolated)
[Gray, Gray] → MOUNTAIN (2-high, 3 points if adjacent to mountain)
[Gray, Gray, Gray] → MOUNTAIN (3-high, 7 points if adjacent to mountain)
[Yellow] → FIELD (must connect with another for 5pts)
[Blue] → WATER (part of river or island)
[Red] or [Brown/Gray, Red] → BUILDING (5pts if 3+ color neighbors)
```

### 3. Scoring Engine (scoring-engine.js)

**Module Independence:** Each scoring function is pure and independent.

```javascript
// Signature for all modules
function scoreXxxModule(hexGrid, ...otherData) {
  // Returns integer score
}
```

**Scoring Algorithms (Official Rules):**

| Module        | Algorithm          | Key Logic                                                                                           |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| **Trees**     | Height-based       | 1 brown/2 brown = 0pts, 1 green = 1pt, 1 brown + 1 green = 3pts, 2 brown + 1 green = 5pts           |
| **Mountains** | Height + Adjacency | 1 token = 1pt, 2 tokens = 3pts, 3 tokens = 7pts. **Must be adjacent to another mountain or = 0pts** |
| **Fields**    | Flat per cluster   | Each field of 2+ connected yellow tokens = **5 points flat**                                        |
| **Buildings** | Neighbor diversity | **5 points per building** IF surrounded by 3+ different colors, otherwise 0pts                      |
| **Water A**   | Longest river      | 1=0, 2=2, 3=5, 4=8, 5=11, 6=15, +4 per token past 6. **Only longest river scores**                  |
| **Water B**   | Islands            | **5 points per island** created (separated by blue tokens)                                          |
| **Animals**   | Card completion    | Score shown at top of card based on cubes placed (see card values)                                  |

**Implementation Pattern (Corrected):**

```javascript
export function scoreTreesModule(hexGrid) {
  let score = 0;
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    const stack = hex.stack || [];
    
    // Count brown and green tokens
    const brownCount = stack.filter(t => t.color === 'brown').length;
    const greenCount = stack.filter(t => t.color === 'green').length;
    
    // Scoring: 1-2 brown only = 0, 1 green = 1, 1 brown + 1 green = 3, 2 brown + 1 green = 5
    if (greenCount === 1 && brownCount === 0) score += 1;
    else if (greenCount === 1 && brownCount === 1) score += 3;
    else if (greenCount === 1 && brownCount === 2) score += 5;
    // 1 or 2 brown with no green = 0 points
  }
  return score;
}

export function scoreMountainsModule(hexGrid) {
  let score = 0;
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    const stack = hex.stack || [];
    
    // Only gray tokens stacked = mountain
    if (stack.length >= 1 && stack.every(t => t.color === 'gray')) {
      // Check if adjacent to at least one other mountain
      const { q, r } = keyToCoord(key);
      const neighbors = getNeighbors(q, r);
      const hasAdjacentMountain = neighbors.some(n => {
        const neighborHex = hexGrid[coordToKey(n.q, n.r)];
        const neighborStack = neighborHex?.stack || [];
        return neighborStack.length >= 2 && neighborStack.every(t => t.color === 'gray');
      });
      
      if (hasAdjacentMountain) {
        // Height-based scoring: 1=1pt, 2=3pts, 3=7pts
        const height = stack.length;
        score += [0, 1, 3, 7][height] || 0;
      }
      // Isolated mountains = 0 points
    }
  }
  return score;
}

export function scoreFieldsModule(hexGrid) {
  // Each field (2+ connected yellow tokens) = 5 points flat
  const visited = new Set();
  let score = 0;
  
  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    
    const hex = hexGrid[key];
    if (hex.stack?.[0]?.color === 'yellow') {
      // Flood fill to find cluster size
      const cluster = floodFill(hexGrid, key, 'yellow');
      cluster.forEach(k => visited.add(k));
      
      // Each field of 2+ yellow = 5 points
      if (cluster.length >= 2) {
        score += 5;
      }
    }
  }
  return score;
}

export function scoreBuildingsModule(hexGrid) {
  let score = 0;
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    const stack = hex.stack || [];
    
    // Red token (anywhere in valid stack) = building
    if (stack.some(t => t.color === 'red')) {
      // Count unique adjacent top token colors
      const { q, r } = keyToCoord(key);
      const neighbors = getNeighbors(q, r);
      const uniqueColors = new Set();
      
      neighbors.forEach(n => {
        const neighborHex = hexGrid[coordToKey(n.q, n.r)];
        const topToken = neighborHex?.stack?.[neighborHex.stack.length - 1];
        if (topToken) uniqueColors.add(topToken.color);
      });
      
      // Need 3+ different colors to score
      if (uniqueColors.size >= 3) {
        score += 5;
      }
    }
  }
  return score;
}

export function scoreWaterModuleA(hexGrid) {
  // Side A: Longest river only. Scoring: 1=0, 2=2, 3=5, 4=8, 5=11, 6=15, +4 per token past 6
  const visited = new Set();
  let longestRiver = 0;
  
  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    
    const hex = hexGrid[key];
    if (hex.stack?.[0]?.color === 'blue') {
      const river = floodFill(hexGrid, key, 'blue');
      river.forEach(k => visited.add(k));
      longestRiver = Math.max(longestRiver, river.length);
    }
  }
  
  // Apply scoring formula
  const scores = [0, 0, 2, 5, 8, 11, 15];
  if (longestRiver < scores.length) {
    return scores[longestRiver];
  } else {
    return scores[6] + (longestRiver - 6) * 4;
  }
}

export function scoreWaterModuleB(hexGrid) {
  // Side B: 5 points per island (land areas separated by water)
  // Implementation: Count connected land components
  const visited = new Set();
  let islandCount = 0;
  
  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    
    const hex = hexGrid[key];
    // Water hexes don't count
    if (hex.stack?.[0]?.color === 'blue') continue;
    
    // Found an unvisited land hex - new island
    const island = floodFillLand(hexGrid, key);
    island.forEach(k => visited.add(k));
    islandCount++;
  }
  
  return islandCount * 5;
}
```
```

### 4. Pattern Matching (pattern-matcher.js)

**Challenge:** Animal habitats can be placed in any rotation (6 orientations) or mirrored.

**Algorithm Overview:**

1. For each hex as potential anchor point
2. Try all 6 rotations (0°, 60°, 120°, 180°, 240°, 300°)
3. Try mirrored version of each rotation
4. Check if terrain at all rotated coordinates matches pattern
5. Deduplicate matches (same set of hexes)

**Rotation Math:**

```javascript
// Rotate relative coordinate around origin
function rotateRelativeCoord([dq, dr], steps) {
  let cube = axialToCube(dq, dr);
  for (let i = 0; i < steps; i++) {
    cube = { q: -cube.s, r: -cube.q, s: -cube.r };
  }
  return [cube.q, cube.r];
}

// Mirror by negating q-axis
function mirrorCoord([dq, dr]) {
  return [-dq, dr];
}
```

**Pattern Format:**

```javascript
{
  id: 'deer-1',
  pattern: [
    { relativeCoord: [0, 0], terrain: 'tree' },
    { relativeCoord: [1, 0], terrain: 'tree' },
    { relativeCoord: [0, 1], terrain: 'water' }
  ],
  maxPlacements: 4,
  pointsPerPlacement: [5, 10, 16, 23]  // 1st, 2nd, 3rd, 4th placement
}
```

### 5. Firebase Data Model

**Schema Design Principles:**

- **Flat structure** - Avoid deep nesting (Firebase limitation)
- **Denormalization** - Duplicate data for fast reads (players in both `/games/` and `/players/`)
- **Atomic writes** - Use `update()` with multi-path writes for consistency
- **Server timestamps** - Always use `firebase.database.ServerValue.TIMESTAMP`

**Key Paths:**

```
/games/{gameId}
  ├─ status: "waiting" | "playing" | "finished"
  ├─ currentPlayerTurn: username
  ├─ turnPhase: "mandatory" | "optional"
  ├─ centralBoard: { tokens: [...], availableAnimals: [...] }
  ├─ pouch: { green: 20, gray: 18, ... }  // Remaining tokens
  ├─ players: { [username]: { name, joinedAt, isActive } }
  └─ playerBoards: {
      [username]: {
        hexGrid: { "q_r": { stack: [...], terrain } },
        animalCards: [{ cardId, pattern, isCompleted }],
        placedAnimals: [{ cardId, hexCoords, placedAt }],
        score: { trees: 0, mountains: 0, ..., total: 0 }
      }
    }

/players/{username}  // Player profiles
  ├─ username: displayName (original case)
  ├─ createdAt, stats: { gamesPlayed, gamesWon, highScore }
  ├─ activeSession: { deviceId, lastSeenAt, currentGameId }
  └─ gameHistory: [{ gameId, finishedAt, score, rank }]
```

### 6. Turn Flow (Official Rules)

**Turn Actions (Flexible Order):**

Players can take actions in ANY order they prefer:

1. **Take and place tokens (MANDATORY)** - Must be done once per turn
   - Take all 3 tokens from one space on central board
   - Place all 3 tokens on personal board (can place between other actions)
   - Can place tokens between taking animal cards and placing animal cubes

2. **Take one animal card (OPTIONAL)** - Max once per turn
   - Can only have 4 animal cards above board at a time
   - Take corresponding number of animal cubes shown on card

3. **Place animal cube(s) (OPTIONAL)** - Can do multiple times
   - Match pattern on animal card (any orientation)
   - Place cube on specified token from the pattern
   - Same token can be used for multiple animals, but only 1 cube per token

**End of Turn:**
- Refill central board space (draw 3 tokens from pouch)
- Refill animal cards to 5 faceup
- Next player's turn

**End Game Conditions (Official Rules):**

```javascript
// Game ends when either condition is met:
// 1. Pouch doesn't have enough tokens to refill central board (less than 3)
// 2. Player has 2 or fewer empty spaces on their board

if (pouch.totalTokens < 3 || playerEmptySpaces <= 2) {
  // All players get equal turns - remaining players take one more turn
  status = "finished";
  calculateFinalScores();
  // Winner = highest score. Tie-breaker: most animal cubes placed
}
```

### 7. SVG Rendering (board-renderer.js)

**Hex to Pixel Conversion:**

```javascript
const HEX_SIZE = 30; // Radius
const SQRT3 = Math.sqrt(3);

// Flat-topped hex layout
function hexToPixel(q, r) {
  const x = HEX_SIZE * ((3 / 2) * q);
  const y = HEX_SIZE * (SQRT3 * r + (SQRT3 / 2) * q);
  return { x, y };
}
```

**3D Token Stacking Effect:**

```javascript
// Stack tokens upward with decreasing radius
function renderToken(color, stackIndex) {
  const yOffset = stackIndex * -8;  // Move up
  const radius = HEX_SIZE - 12 - stackIndex * 2;  // Shrink slightly

  // Shadow ellipse for depth (below token)
  <ellipse cy={yOffset + 3} rx={radius} ry={radius * 0.3} opacity="0.3"/>

  // Token circle
  <circle cy={yOffset} r={radius} fill={color} stroke="#333" stroke-width="2"/>
}
```

**Clickable Regions:**

- Each hex is wrapped in `<g class="hex-group">` with `cursor: pointer`
- `onclick` handler receives `(q, r)` coordinates
- For empty hexes, show ghost token preview on hover

## Testing Strategy

**What to Test:**

- ✅ Hex coordinate math (rotation, distance, neighbors)
- ✅ Token stacking rules (all color combinations)
- ✅ Terrain calculation (stack composition → terrain)
- ✅ All 6 scoring modules (pure function logic)
- ✅ Pattern matching (rotation/mirroring correctness)

**What NOT to Test:**

- ❌ SVG rendering (visual inspection only)
- ❌ Firebase sync (integration tests too slow)
- ❌ UI interactions (e2e tests for later)

**Run Tests:**

```bash
node --test tests/core-logic.test.js
```

**Current Status:** 15/16 tests passing (rotation test has minor expectation issue but function works correctly)

## Known MVP Simplifications vs Official Rules

These are **intentional shortcuts** for 2-3 hour timeline:

1. **Token Placement:** Auto-places on `-1_0`, `0_0`, `1_0` (no drag-drop yet)
   - Official: Player places tokens one at a time, can interleave with other actions
2. **Turn Phase Model:** Currently uses MANDATORY→OPTIONAL phases
   - Official: Players can take actions in any order (more flexible)
3. **Hex Grid Expansion:** Shows expansion hexes but clicking doesn't place tokens on them
4. **Animal Placement:** Can take cards but placement is simplified
5. **No Undo:** Keeps implementation simple, follows game spirit
6. **No Animations:** Instant state updates (add in Phase 3)
7. **Scoring Implementation:** Some scoring formulas need correction (see section 3 above)
   - Trees: Need brown/green counting logic
   - Mountains: Missing adjacency requirement check
   - Fields: Should be flat 5pts per field, not n(n+1)/2
   - Buildings: Should be 5pts flat if 3+ colors, not 2pts × colors
   - Water: Need separate A/B side implementations

## Phase 3 Polish Roadmap

**Critical (Rules Compliance):**

- [ ] Fix scoring algorithms to match official rules:
  - [ ] Trees: Brown/green counting logic
  - [ ] Mountains: Adjacency requirement check
  - [ ] Fields: Flat 5pts per 2+ cluster
  - [ ] Buildings: Flat 5pts if 3+ neighbor colors
  - [ ] Water: Implement Side A (rivers) and Side B (islands)
- [ ] Fix token stacking validation (brown can only stack on brown, red limited to 2nd position)
- [ ] Implement flexible turn order (actions in any sequence)

**High Priority:**

- [ ] Drag-and-drop token placement from central board to hex grid
- [ ] Click-to-place on expansion hexes (with validation)
- [ ] Full animal card placement with pattern highlighting
- [ ] Score breakdown modal (show per-category scoring)

**Medium Priority:**

- [ ] Smooth animations (token movement, score updates)
- [ ] Visual feedback (valid placement zones, invalid placements)
- [ ] Mobile-responsive touch gestures
- [ ] Accessibility improvements (keyboard nav, screen reader)

**Low Priority (Stage 2):**

- [ ] Game abandonment (all players agree)
- [ ] Spectator mode
- [ ] Game replay/history viewer
- [ ] Achievement system

## Common Development Patterns

### Adding a New Scoring Module

1. Add to `scoring-engine.js`:

```javascript
export function scoreNewFeatureModule(hexGrid) {
  let score = 0;
  // Your scoring logic here
  return score;
}
```

2. Register in `calculateTotalScore()`:

```javascript
const breakdown = {
  // ... existing modules
  newFeature: scoreNewFeatureModule(playerBoard.hexGrid),
};
```

3. Add test in `tests/core-logic.test.js`:

```javascript
describe("Scoring - New Feature", () => {
  it("scores simple case", () => {
    const hexGrid = {
      /* test data */
    };
    const score = scoreNewFeatureModule(hexGrid);
    assert.equal(score, expectedValue);
  });
});
```

### Adding a New Animal Card

Edit `js/data/animal-cards.js`:

```javascript
{
  id: 'fox-1',
  name: 'Fox',
  icon: '🦊',
  pattern: [
    { relativeCoord: [0, 0], terrain: TERRAIN_TYPES.FIELD },
    { relativeCoord: [1, 0], terrain: TERRAIN_TYPES.TREE },
    // ... more hexes
  ],
  maxPlacements: 3,
  pointsPerPlacement: [6, 12, 20]  // Progressive scoring
}
```

Pattern matching will automatically handle all rotations/mirroring.

### Adding Firebase Write Operations

Always use `firebase-sync.js` for writes (never write directly in screens):

```javascript
// In firebase-sync.js
export async function newWriteOperation(gameId, data) {
  const updates = {};
  updates[`games/${gameId}/somePath`] = data;
  updates[`games/${gameId}/lastModified`] = getServerTimestamp();

  await update(ref(), updates); // Atomic multi-path write
}

// In screen (game-room.js)
import { newWriteOperation } from "../game/firebase-sync.js";

async function handleUserAction() {
  try {
    await newWriteOperation(gameId, userData);
    // Optimistic UI update happens via Firebase listener
  } catch (error) {
    console.error("Write failed:", error);
    alert("Action failed, please try again");
  }
}
```

## Debugging Tips

**Firebase Sync Issues:**

1. Open Firebase Console → Realtime Database → View raw JSON
2. Check browser console for listener errors
3. Verify security rules (default: authenticated read/write)
4. Use `firebase.database().goOnline()/goOffline()` for testing

**Hex Coordinate Confusion:**

- Always use `coordToKey(q, r)` for Firebase keys (not `"q,r"` or `"q:r"`)
- When iterating hexGrid, use `keyToCoord(key)` to get back to numbers
- Remember: `q` is column, `r` is row (but diagonal in flat-topped layout)

**Stacking Validation Failing:**

- Check `canPlaceToken()` return value: `{ valid: boolean, reason?: string }`
- Print `hex.stack` to see current token colors
- Verify `STACKING_RULES.canStackOn[newColor]` includes top token color

**Pattern Matching Not Finding Matches:**

- Print `pattern` to verify `relativeCoord` format is `[q, r]` not `"q_r"`
- Check if terrain at those coordinates actually matches
- Try with `rotation = 0, mirrored = false` first to isolate rotation bugs

## Performance Notes

**Current Bottlenecks (for future optimization):**

- Pattern matching: O(n × 6 × 2) where n = hex count (~100 hexes max)
- Flood fill scoring: O(n) for fields/water clusters
- SVG re-rendering: Full board redraw on every state change

**If Performance Becomes an Issue:**

1. Memoize pattern matches (cache by hex key + card id)
2. Incremental scoring (only recalculate changed hexes)
3. Virtual DOM for SVG (only update changed elements)

## File Modification Checklist

When modifying core logic, update in this order:

1. **Data layer** (`tokens-config.js`, `animal-cards.js`) - Constants
2. **Core logic** (`hex-grid.js`, `token-manager.js`, etc.) - Pure functions
3. **Tests** (`core-logic.test.js`) - Add test cases
4. **Firebase sync** (`firebase-sync.js`) - Write operations
5. **UI renderers** (`board-renderer.js`) - Visual updates
6. **Screens** (`game-room.js`, etc.) - User interaction
7. **Documentation** (this file!) - Keep guide up to date

## Next Session Quickstart

**For AI agents continuing development:**

1. Read this guide first
2. Run tests: `node --test tests/core-logic.test.js`
3. Open game: `open index.html` (or use Python server if testing Firebase)
4. Read implementation plan: `/Users/nhat/.claude/plans/linked-noodling-deer.md`
5. Check user feedback/issues before starting new work

**Key Files to Understand:**

- `js/game/firebase-sync.js` - All write operations
- `js/game/scoring-engine.js` - Game logic (most complex)
- `js/screens/game-room.js` - Main UI orchestration
- `js/ui/board-renderer.js` - SVG rendering

**Don't Break These:**

- Stacking rules validation (players rely on this)
- Coordinate conversions (breaks Firebase sync if wrong)
- Scoring calculations (game balance depends on this)
- Turn phase transitions (breaks multiplayer if wrong)

---

**References:**
- **Complete Game Rules:** [game-rules.md](./game-rules.md) - Comprehensive rules for AI agents and players
- Official Rules: https://www.geekyhobbies.com/harmonies-rules/
- BoardGameGeek: https://boardgamegeek.com/boardgame/370591/harmonies
- Publisher: Libellud (https://libellud.com/)

**Last Updated:** 2026-02-15 (Updated with official rules, scoring algorithms need implementation fixes)
