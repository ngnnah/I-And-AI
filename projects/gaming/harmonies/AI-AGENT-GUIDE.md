# Harmonies - AI Agent Development Guide

This guide is for AI agents (Claude Code, GitHub Copilot, Cursor, etc.) to understand the codebase architecture and continue development efficiently.

## Quick Context

**What:** Turn-based multiplayer spatial puzzle game (board game adaptation)
**Built:** ~3 hour MVP implementation (Phase 1 & 2 complete)
**Stack:** Vanilla JS + SVG + Firebase Realtime Database
**Status:** Core gameplay complete, ready for Phase 3 polish

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

**Stacking Matrix:**
| Token Color | Can Stack On | Max Height | Notes |
|-------------|--------------|------------|-------|
| Yellow (Field) | Nothing | 1 | Ground level only |
| Blue (Water) | Nothing | 1 | Ground level only |
| Brown (Trunk) | Yellow, Blue, Brown | 3 | Foundation for trees |
| Green (Leaves) | Brown only | 3 | Must have brown underneath |
| Gray (Mountain) | Gray only | 3 | Self-stacking only |
| Red (Building) | Yellow, Blue, Brown | 3 | Any ground terrain |

**Terrain Calculation Logic:**

```javascript
// Stack composition determines terrain
[Brown, Green] → TREE (green on brown)
[Gray, Gray] → MOUNTAIN (2+ gray stacked)
[Yellow] → FIELD (single yellow)
[Blue] → WATER (single blue)
[Brown, Red] → BUILDING (red on ground)
```

### 3. Scoring Engine (scoring-engine.js)

**Module Independence:** Each scoring function is pure and independent.

```javascript
// Signature for all modules
function scoreXxxModule(hexGrid, ...otherData) {
  // Returns integer score
}
```

**Scoring Algorithms:**

| Module        | Algorithm          | Key Logic                                              |
| ------------- | ------------------ | ------------------------------------------------------ |
| **Trees**     | Height-based       | `[0, 1, 3, 6][height]` - progressive points            |
| **Mountains** | Adjacency          | `height × numAdjacentMountains` - isolated = 0pts      |
| **Fields**    | Cluster size       | `n(n+1)/2` - flood fill for contiguous yellow          |
| **Buildings** | Neighbor diversity | `2pts × uniqueAdjacentTerrains` - count distinct types |
| **Water**     | Longest river      | `n(n+1)/2` - flood fill, take max cluster              |
| **Animals**   | Card completion    | Sum `pointsPerPlacement[i]` for each placed animal     |

**Implementation Pattern:**

```javascript
export function scoreTreesModule(hexGrid) {
  let score = 0;
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.TREE) {
      const height = hex.stack.length;
      score += [0, 1, 3, 6][height];
    }
  }
  return score;
}
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

### 6. Turn Flow State Machine

**Phases:**

```
MANDATORY → OPTIONAL → [Next Player] MANDATORY → ...
```

**Mandatory Phase:**

- Player must take exactly 3 tokens from central board
- Tokens auto-place on adjacent hexes (MVP simplification)
- After placement: `turnPhase = "optional"`

**Optional Phase:**

- Player may take 1 animal card (once per turn)
- Player may place unlimited animals on completed patterns
- Click "End Turn": Refill central board → Next player → `turnPhase = "mandatory"`

**End Game Conditions:**

```javascript
// Check after every turn end
if (pouch.totalTokens === 0 || playerHasLessThan3EmptyHexes()) {
  status = "finished";
  calculateFinalScores();
  declareWinner();
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

## Known MVP Simplifications

These are **intentional shortcuts** for 2-3 hour timeline:

1. **Token Placement:** Auto-places on `-1_0`, `0_0`, `1_0` (no drag-drop yet)
2. **Hex Grid Expansion:** Shows expansion hexes but clicking doesn't place tokens on them
3. **Animal Placement:** Can take cards but placement is simplified (no full pattern validation UI)
4. **No Undo:** Keeps implementation simple, follows game spirit
5. **No Animations:** Instant state updates (add in Phase 3)

## Phase 3 Polish Roadmap

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

**Last Updated:** 2026-02-15 (Phase 1 & 2 complete, ready for testing)
