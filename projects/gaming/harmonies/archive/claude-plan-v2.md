# plan v2.0

**Claude’s Plan**

# Harmonies - NEW Implementation Plan (v2.0)

## Context

**Why This Rewrite:** First implementation (completed in 3 hours) did not follow official Libellud game rules. Multiple critical scoring formulas and token placement rules were incorrect, making the game unplayable for fans of the original board game.

**Goal:** Build a faithful web adaptation of Harmonies that follows the **official rules exactly**, while maintaining the architectural strengths of the first attempt (modular design, Firebase sync, pure function core logic).

**Timeline:** Phase 1 + Phase 2 MVP in 2-3 hours (delete old implementation, rebuild from scratch with correct rules).

---

## Failed Attempt (v1.0) - Post-Mortem Analysis

### What We Built (3 hours, fully functional MVP)

- **29 files**: Complete game with multiplayer sync, 15/16 tests passing
- **Architecture**: Modular design with pure functions, Firebase Realtime Database, SVG hex grid
- **Features**: Player profiles, game history, cross-device login, solo mode, turn-based async play
- **Status**: Playable but **rules were wrong** - not usable for players who know the original game

### Critical Rule Violations

| Category | What We Built (WRONG) | Official Rules (CORRECT) |
| --- | --- | --- |
| **Trees Scoring** | `[0, 1, 3, 6][height]` | Green alone = 1pt, 1 brown + green = 3pts, 2 brown + green = 5pts |
| **Mountains Scoring** | `height × numAdjacentMountains` | Height determines base (1/3/7pts), BUT 0pts if isolated |
| **Fields Scoring** | `n(n+1)/2` (progressive cluster size) | **5 points per separate field** (flat rate, 2+ tokens) |
| **Buildings Scoring** | `2pts × uniqueAdjacentTerrains` | **5 points if 3+ different colors**, else 0pts (binary) |
| **Token Placement** | Auto-placed on `-1_0, 0_0, 1_0` | **Player manually chooses each hex location** |
| **Turn Structure** | Mandatory → Optional (lumped) | **Fixed sequence**: Take 3 tokens → optional actions |
| **Stacking Rules** | No Animal cube collision check | **Tokens cannot stack where Animal cubes placed** |

### Why This Matters

- **Fields**: Our formula rewarded large clusters; official rules reward **many small fields** (opposite strategy!)
- **Buildings**: Our scoring was proportional; official rules are **binary pass/fail** (3+ colors or nothing)
- **Mountains**: Our formula could give absurd scores (5-high mountain × 6 neighbors = 30pts); official caps at 7pts max per mountain
- **Token Placement**: Our auto-placement removed the core spatial puzzle mechanic

### Lessons Learned

1. **Always read official rules first** - Don't rely on memory or general board game patterns
2. **Verify scoring formulas with examples** - Test edge cases against rulebook examples
3. **Token placement is the core mechanic** - Can't simplify it away even for MVP

---

## Official Game Rules (Authoritative Reference)

### Setup

- **Central Board**: 5 spaces (multiplayer) or 3 spaces (solo), each holds 3 tokens
- **Pouch**: 120 tokens total:
    
    23 blue tokens
    23 gray tokens
    21 brown tokens
    19 green tokens
    19 yellow tokens
    15 red tokens
    
- **Animal Cards**: 5 cards faceup, draw pile nearby
- **Personal Board**: Each player gets hex board (sides A/B for water variants)
- **First Player**: Determined by "last to see magnificent landscape"

### Turn Structure (FIXED ORDER)

**Mandatory Action (exactly once per turn):**

1. Select ONE space on Central board
2. Take ALL THREE tokens from that space
3. Place each token on your Personal board (one at a time, following stacking rules)

**Optional Actions (up to 2, in any order):**

1. Take 1 Animal card (max 4 cards held simultaneously)
2. Place Animal cubes (multiple times per turn if patterns completed)

**End of Turn:**

- Refill Central board space with 3 tokens from pouch
- Refill Animal cards to 5 if any were taken

### Token Placement Rules (Stacking by Color)

| Token Color | Can Stack On | Max Height | Notes |
| --- | --- | --- | --- |
| **Blue** (Water) | Nothing | 1 | Ground level only |
| **Yellow** (Field) | Nothing | 1 | Ground level only |
| **Brown** (Trunk) | Brown only | 2 | Foundation for trees |
| **Green** (Leaves) | 1-2 Brown | 3 | Completes trees |
| **Red** (Building) | Gray, Brown, or Red | 2 | Versatile stacking |
| **Gray** (Rock) | Gray only | Unlimited | Mountains can be any height |

**Critical Rule**: Once an Animal cube is placed on a hex, **no more tokens can be added** to that stack.

### Scoring Rules (EXACT FORMULAS)

### 1. Trees (Brown + Green combinations)

| Composition | Points |
| --- | --- |
| 1 green alone | 1 |
| 1 brown + 1 green | 3 |
| 2 brown + 1 green | 5 |
| Brown alone (no green) | 0 |

### 2. Mountains (Red tokens)

| Number of Red Tokens | Base Points | Condition |
| --- | --- | --- |
| 1 token | 1 | Must be adjacent to another mountain |
| 2 tokens | 3 | Must be adjacent to another mountain |
| 3 tokens | 7 | Must be adjacent to another mountain |
| Isolated | 0 | No adjacent mountains = 0 points |

### 3. Fields (Yellow tokens)

- **5 points per separate connected group** of 2+ yellow tokens
- Small separated fields are better than large clusters!
- Single yellow tokens (isolated) = 0 points

### 4. Buildings (Multi-token stacks)

- **5 points** if surrounded by **3 or more different token colors** (adjacent hexes)
- **0 points** otherwise (binary scoring)
- Only count top token color of adjacent stacks

### 5. Water (Blue tokens - Two Variants)

**Side A - Rivers:**

| Shortest Path Length | Points |
| --- | --- |
| 2 tokens | 2 |
| 3 tokens | 5 |
| 4 tokens | 8 |
| 5 tokens | 11 |
| 6 tokens | 15 |
| 7+ tokens | 15 + (4 × excess) |

**Rule**: Only the **longest single river** scores (multiple rivers don't add up)

**Side B - Islands:**

- **5 points per island** (spaces separated by blue tokens)
- Requires different board layout

### 6. Animals (Cubes on completed patterns)

- Score the **topmost uncovered number** on each completed Animal card
- Multiple placements on same card score progressively (e.g., 5, 10, 16, 23 points)

### End Game Conditions

Game ends when **either** condition is met:

1. **Pouch cannot refill** Central board (insufficient tokens remaining)
2. **Any player has ≤2 empty hexes** on their Personal board

**Important**: All players get equal number of turns. Winner = highest total score; ties broken by most Animal cubes placed.

### Solo Mode Differences

- **Central Board**: Use 3-space side (smaller)
- **Token Removal**: After each turn, remove 6 tokens from circulation (increases scarcity)
- **Scoring**: Convert points to "suns" with board-side bonuses
- **Goal**: Beat personal high score

---

## New Implementation Plan (v2.0)

### What to Keep from v1.0

✅ **Good Architecture:**

- Modular design (pure functions, separation of concerns)
- Firebase Realtime Database integration
- Player profiles and game history
- SVG hex grid rendering (works well)
- Hex coordinate system (axial q, r)
- Pattern matching algorithm (rotation/mirroring for animals)
- Turn-based async multiplayer flow
- Cross-device session management

✅ **Good Code:**

- hex-grid.js - Coordinate math, rotation, neighbors (REUSE)
- pattern-matcher.js - Animal habitat detection (REUSE with modifications)
- game-state.js - localStorage player persistence (REUSE)
- firebase-config.js - DB CRUD operations (REUSE)
- player-setup.js - Username login screen (REUSE)
- lobby.js - Game browser (REUSE)

### What to Completely Rewrite

❌ **Scoring Engine** - All formulas are wrong (trees, mountains, fields, buildings)
❌ **Token Manager** - Missing Animal cube collision detection, terrain calculation logic needs updates
❌ **Game Room UI** - Must support manual hex placement (not auto-placement)
❌ **Firebase Sync** - Turn flow needs to enforce sequential token placement
❌ **Tests** - Need new tests for correct scoring formulas

### Technology Stack (Same as v1.0)

- **Vanilla JavaScript** (ES6 modules) - No framework
- **SVG** - Hex grid rendering with 3D token stacking
- **Firebase Realtime Database** - Multiplayer sync (proven from Codenames/Ito)
- **Official Assets**: Use images from `/data/harmonies/03_CONTENT/`

---

## Implementation Phases (2-3 Hours Total)

### Phase 0: Cleanup (10 minutes)

1. **Delete old implementation** - Move to `projects/gaming/harmonies-v1-failed/` for reference
2. **Create fresh directory** - `projects/gaming/harmonies/`
3. **Copy reusable files** from v1:
    - `js/game/hex-grid.js` (✅ keep as-is)
    - `js/game/game-state.js` (✅ keep as-is)
    - `js/game/firebase-config.js` (✅ keep as-is, update DB URL if needed)
    - `js/screens/player-setup.js` (✅ keep as-is)
    - `js/screens/lobby.js` (✅ keep as-is)
    - `css/styles.css` (✅ keep most styling, update game-room specific CSS)
    - `index.html` (✅ keep structure, update game-room HTML)

### Phase 1: Core Game Logic (1 hour)

### 1.1 Token Configuration (10 min)

**File**: `js/data/tokens-config.js`

`export const TOKEN_COLORS = {
  BLUE: "blue", // Water
  YELLOW: "yellow", // Fields
  BROWN: "brown", // Tree trunks
  GREEN: "green", // Tree leaves
  RED: "red", // Buildings/Mountains (CORRECTED)
  GRAY: "gray", // Rocks (mountains base)
};

export const COLOR_HEX = {
  blue: "#4A90E2",
  yellow: "#F5A623",
  brown: "#8B4513",
  green: "#7ED321",
  red: "#D0021B",
  gray: "#9B9B9B",
};

// CORRECTED STACKING RULES (from official rules)
export const STACKING_RULES = {
  blue: { canStackOn: [], maxHeight: 1 }, // Ground only
  yellow: { canStackOn: [], maxHeight: 1 }, // Ground only
  brown: { canStackOn: ["brown"], maxHeight: 2 }, // Trees base
  green: { canStackOn: ["brown"], maxHeight: 3 }, // Tree tops (1-2 brown underneath)
  red: { canStackOn: ["gray", "brown", "red"], maxHeight: 2 }, // Buildings
  gray: { canStackOn: ["gray"], maxHeight: null }, // Mountains (unlimited)
};`

### 1.2 Token Manager (20 min)

**File**: `js/game/token-manager.js`

**Key Functions** (REWRITE with correct rules):

`// CORRECTED: Check if hex has Animal cube (blocks further stacking)
export function hasAnimalCube(hex, placedAnimals) {
  const hexKey = coordToKey(hex.q, hex.r);
  return placedAnimals.some((animal) =>
    animal.hexCoords.some((coord) => coordToKey(coord.q, coord.r) === hexKey),
  );
}

// CORRECTED: Terrain calculation based on official rules
export function calculateTerrain(stack) {
  if (!stack || stack.length === 0) return "empty";

  const colors = stack.map((t) => t.color);
  const topColor = colors[colors.length - 1];

  // Trees: Green on brown(s)
  if (topColor === "green") {
    const brownsBelow = colors.slice(0, -1).every((c) => c === "brown");
    if (brownsBelow && colors.length >= 2) return "tree";
  }

  // Mountains: Red tokens (any height, must be adjacent to other mountains for scoring)
  if (colors.every((c) => c === "red")) return "mountain";

  // Buildings: Red on top of gray/brown/red
  if (topColor === "red" && colors.length >= 2) return "building";

  // Ground-level single tokens
  if (colors.length === 1) {
    if (topColor === "blue") return "water";
    if (topColor === "yellow") return "field";
  }

  // Incomplete stacks
  if (colors.every((c) => c === "brown")) return "trunk";
  if (colors.every((c) => c === "gray")) return "rock";

  return "empty";
}

// Validation includes Animal cube check
export function canPlaceToken(hex, newColor, placedAnimals) {
  if (hasAnimalCube(hex, placedAnimals)) {
    return { valid: false, reason: "Cannot place tokens on Animal cubes" };
  }

  const stack = hex?.stack || [];
  const rules = STACKING_RULES[newColor];

  if (rules.maxHeight && stack.length >= rules.maxHeight) {
    return { valid: false, reason: `Max height ${rules.maxHeight} reached` };
  }

  if (stack.length === 0) return { valid: true };

  const topColor = stack[stack.length - 1].color;
  if (!rules.canStackOn.includes(topColor)) {
    return { valid: false, reason: `${newColor} cannot stack on ${topColor}` };
  }

  return { valid: true };
}`

### 1.3 Scoring Engine (30 min)

**File**: `js/game/scoring-engine.js`

**CORRECTED FORMULAS:**

`// 1. TREES (CORRECTED)
export function scoreTreesModule(hexGrid) {
  let score = 0;
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === "tree") {
      const stack = hex.stack;
      const greenCount = stack.filter((t) => t.color === "green").length;
      const brownCount = stack.filter((t) => t.color === "brown").length;

      if (greenCount === 1 && brownCount === 0) score += 1; // Green alone
      if (greenCount === 1 && brownCount === 1) score += 3; // 1 brown + 1 green
      if (greenCount === 1 && brownCount === 2) score += 5; // 2 brown + 1 green
    }
  }
  return score;
}

// 2. MOUNTAINS (CORRECTED - Red tokens, adjacency required)
export function scoreMountainsModule(hexGrid) {
  let score = 0;
  const mountainKeys = Object.keys(hexGrid).filter(
    (k) => hexGrid[k].terrain === "mountain",
  );

  for (const key of mountainKeys) {
    const hex = hexGrid[key];
    const redCount = hex.stack.filter((t) => t.color === "red").length;

    // Check if adjacent to another mountain
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);
    const hasAdjacentMountain = neighbors.some((n) => {
      const nKey = coordToKey(n.q, n.r);
      return hexGrid[nKey]?.terrain === "mountain";
    });

    if (!hasAdjacentMountain) continue; // Isolated = 0 points

    // Score by height
    if (redCount === 1) score += 1;
    else if (redCount === 2) score += 3;
    else if (redCount >= 3) score += 7;
  }
  return score;
}

// 3. FIELDS (CORRECTED - 5 points per separate field)
export function scoreFieldsModule(hexGrid) {
  const visited = new Set();
  let score = 0;

  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    if (hexGrid[key].terrain !== "field") continue;

    const clusterSize = floodFill(hexGrid, key, "field", visited);
    if (clusterSize >= 2) score += 5; // Each field of 2+ = 5 points
  }
  return score;
}

// 4. BUILDINGS (CORRECTED - Binary: 5pts if 3+ different colors, else 0)
export function scoreBuildingsModule(hexGrid) {
  let score = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain !== "building") continue;

    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);

    // Get unique top token colors from adjacent hexes
    const adjacentColors = new Set();
    for (const n of neighbors) {
      const nKey = coordToKey(n.q, n.r);
      const nHex = hexGrid[nKey];
      if (nHex && nHex.stack.length > 0) {
        const topColor = nHex.stack[nHex.stack.length - 1].color;
        adjacentColors.add(topColor);
      }
    }

    // Binary scoring: 5pts if 3+ different colors, else 0
    if (adjacentColors.size >= 3) score += 5;
  }
  return score;
}

// 5. WATER (CORRECTED - Longest river only, progressive scoring)
export function scoreWaterModule(hexGrid, boardSide = "A") {
  if (boardSide === "B") return scoreWaterIslands(hexGrid);

  // Side A: Longest river
  const visited = new Set();
  let maxRiverLength = 0;

  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    if (hexGrid[key].terrain !== "water") continue;

    const riverLength = floodFill(hexGrid, key, "water", visited);
    maxRiverLength = Math.max(maxRiverLength, riverLength);
  }

  // Progressive scoring (from official rules table)
  if (maxRiverLength === 2) return 2;
  if (maxRiverLength === 3) return 5;
  if (maxRiverLength === 4) return 8;
  if (maxRiverLength === 5) return 11;
  if (maxRiverLength === 6) return 15;
  if (maxRiverLength >= 7) return 15 + (maxRiverLength - 6) * 4;

  return 0;
}

// 6. ANIMALS (Same as v1 - this was correct)
export function scoreAnimalsModule(placedAnimals, animalCards) {
  // Sum topmost uncovered numbers from completed Animal cards
  // (Implementation same as v1.0)
}`

### Phase 2: Game Room UI (1 hour)

### 2.1 Manual Token Placement (40 min)

**File**: `js/screens/game-room.js`

**New Flow:**

1. Player selects 1 space on Central board (takes all 3 tokens)
2. UI enters "placement mode" - shows 3 tokens in hand
3. **For each token** (one at a time):
    - Hex grid highlights valid placement spots (green border)
    - Player clicks a hex
    - Token places, terrain recalculates
    - Next token becomes active
4. After all 3 tokens placed → Optional phase (take animal card, place animal cubes)
5. "End Turn" button refills Central board

**Key UI Changes:**

- **Token Hand Display**: Show 3 tokens from selected Central space
- **Clickable Hexes**: Show valid placement locations (respecting stacking rules)
- **Sequential Placement**: Enforce one-token-at-a-time flow
- **Visual Feedback**: Highlight selected hex, show validation errors

### 2.2 Firebase Sync Updates (20 min)

**File**: `js/game/firebase-sync.js`

**Updated Functions:**

`// New: Select Central board space (takes 3 tokens)
export async function selectCentralSpace(gameId, username, spaceIndex) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const tokens = game.centralBoard.tokens[spaceIndex];
  const updates = {};

  // Mark tokens as "in hand" for this player
  updates[`playerBoards/${username}/tokensInHand`] = tokens;
  updates[`centralBoard/tokens/${spaceIndex}`] = []; // Clear space
  updates[`turnPhase`] = "placing"; // New phase: placing tokens

  await update(gameRef, updates);
}

// Updated: Place single token (sequential)
export async function placeSingleToken(gameId, username, tokenIndex, hexCoord) {
  // Place token at hexCoord
  // Remove from tokensInHand
  // If all 3 placed → turnPhase = 'optional'
}`

### Phase 3: Testing (30 min)

### 3.1 Update Tests

**File**: `tests/core-logic.test.js`

**New Tests:**

`describe("Scoring - Trees (CORRECTED)", () => {
  it("scores green alone = 1pt", () => {
    const hexGrid = {
      "0_0": { stack: [{ color: "green" }], terrain: "tree" },
    };
    assert.equal(scoreTreesModule(hexGrid), 1);
  });

  it("scores 1 brown + 1 green = 3pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "brown" }, { color: "green" }],
        terrain: "tree",
      },
    };
    assert.equal(scoreTreesModule(hexGrid), 3);
  });

  it("scores 2 brown + 1 green = 5pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "brown" }, { color: "brown" }, { color: "green" }],
        terrain: "tree",
      },
    };
    assert.equal(scoreTreesModule(hexGrid), 5);
  });
});

describe("Scoring - Mountains (CORRECTED)", () => {
  it("isolated mountain scores 0pts", () => {
    const hexGrid = {
      "0_0": { stack: [{ color: "red" }], terrain: "mountain" },
    };
    assert.equal(scoreMountainsModule(hexGrid), 0);
  });

  it("adjacent 2-red mountain = 3pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "red" }, { color: "red" }],
        terrain: "mountain",
      },
      "1_0": { stack: [{ color: "red" }], terrain: "mountain" },
    };
    const score = scoreMountainsModule(hexGrid);
    assert.equal(score, 3 + 1); // 3pts + 1pt = 4pts
  });
});

describe("Scoring - Fields (CORRECTED)", () => {
  it("2 separate fields = 10pts", () => {
    const hexGrid = {
      "0_0": { stack: [{ color: "yellow" }], terrain: "field" },
      "1_0": { stack: [{ color: "yellow" }], terrain: "field" }, // Field 1
      "3_0": { stack: [{ color: "yellow" }], terrain: "field" },
      "4_0": { stack: [{ color: "yellow" }], terrain: "field" }, // Field 2
    };
    const score = scoreFieldsModule(hexGrid);
    assert.equal(score, 10); // 5 + 5 = 10pts
  });
});

describe("Scoring - Buildings (CORRECTED)", () => {
  it("building with 2 adjacent colors = 0pts", () => {
    const hexGrid = {
      "0_0": { stack: [{ color: "red" }], terrain: "building" },
      "1_0": { stack: [{ color: "blue" }], terrain: "water" },
      "0_1": { stack: [{ color: "blue" }], terrain: "water" },
    };
    assert.equal(scoreBuildingsModule(hexGrid), 0); // Only 2 colors, not 3+
  });

  it("building with 3 adjacent colors = 5pts", () => {
    const hexGrid = {
      "0_0": { stack: [{ color: "red" }], terrain: "building" },
      "1_0": { stack: [{ color: "blue" }], terrain: "water" },
      "0_1": { stack: [{ color: "yellow" }], terrain: "field" },
      "1_1": { stack: [{ color: "green" }], terrain: "tree" },
    };
    assert.equal(scoreBuildingsModule(hexGrid), 5);
  });
});`

---

## File Structure (v2.0)

`projects/gaming/harmonies/
├── index.html                     # Keep from v1
├── css/styles.css                 # Keep + update game-room CSS
├── js/
│   ├── main.js                    # Keep from v1
│   ├── game/
│   │   ├── hex-grid.js            # ✅ KEEP (reuse from v1)
│   │   ├── game-state.js          # ✅ KEEP (reuse from v1)
│   │   ├── firebase-config.js     # ✅ KEEP (reuse from v1)
│   │   ├── token-manager.js       # ❌ REWRITE (fix terrain, add Animal cube check)
│   │   ├── scoring-engine.js      # ❌ REWRITE (all formulas wrong)
│   │   ├── firebase-sync.js       # ❌ REWRITE (add sequential placement)
│   │   └── pattern-matcher.js     # ⚠️ MINOR EDITS (mostly reuse)
│   ├── screens/
│   │   ├── player-setup.js        # ✅ KEEP (reuse from v1)
│   │   ├── lobby.js               # ✅ KEEP (reuse from v1)
│   │   └── game-room.js           # ❌ REWRITE (manual token placement)
│   ├── ui/
│   │   └── board-renderer.js      # ⚠️ UPDATE (add placement mode UI)
│   └── data/
│       ├── tokens-config.js       # ❌ REWRITE (fix stacking rules, color meanings)
│       └── animal-cards.js        # ✅ KEEP (reuse from v1)
└── tests/
    └── core-logic.test.js         # ❌ REWRITE (new tests for correct formulas)`

---

## Verification (End-to-End Testing with Official Rules)

After implementation, verify these scenarios match official rules:

### Test 1: Tree Scoring

**Setup:**

- Hex A: 1 green token alone
- Hex B: 1 brown + 1 green
- Hex C: 2 brown + 1 green

**Expected Score:** 1 + 3 + 5 = **9 points** ✅

### Test 2: Mountain Scoring (Adjacency)

**Setup:**

- Hex A: 2 red tokens (adjacent to Hex B)
- Hex B: 1 red token (adjacent to Hex A)
- Hex C: 3 red tokens (isolated, no adjacent mountains)

**Expected Score:** 3 + 1 + 0 = **4 points** ✅ (isolated mountain scores 0)

### Test 3: Field Scoring (Multiple Small Fields Better)

**Setup:**

- Field 1: 2 connected yellow tokens
- Field 2: 3 connected yellow tokens
- Single isolated yellow token

**Expected Score:** 5 + 5 + 0 = **10 points** ✅ (5 per field, single token = 0)

### Test 4: Building Scoring (Binary)

**Setup:**

- Building A: Red token with 2 different adjacent colors
- Building B: Red token with 3 different adjacent colors

**Expected Score:** 0 + 5 = **5 points** ✅ (need 3+ colors or nothing)

### Test 5: Water Scoring (Longest River Only)

**Setup:**

- River 1: 4 connected blue tokens
- River 2: 6 connected blue tokens

**Expected Score:** 15 points ✅ (only longest counts, not 8 + 15 = 23)

### Test 6: Manual Token Placement

**User Flow:**

1. Player selects Central space #2 (gets 3 tokens: blue, green, brown)
2. Places blue on empty hex → terrain = 'water'
3. Places brown on empty hex → terrain = 'trunk'
4. Places green on brown hex → terrain = 'tree', score updates
5. Optional phase allows animal card or animal placement
6. End Turn refills Central space #2

**Expected Behavior:** Player has full control over placement locations ✅

### Test 7: Animal Cube Blocking

**Setup:**

1. Place 1 brown + 1 green to create tree
2. Place Animal cube on that hex
3. Try to stack another brown token on same hex

**Expected Result:** Error - "Cannot place tokens on Animal cubes" ✅

### Test 8: Multiplayer Sync

**Setup:** 2 players in different browser windows

**Expected Behavior:**

- Player 1 places tokens → Player 2 sees updates immediately
- Player 1 ends turn → Player 2's turn activates automatically
- All score updates sync in real-time
- Game ends when pouch empty or board full (≤2 spaces)

---

## Success Criteria (v2.0)

✅ **Rules Compliance:**

- All scoring formulas match official rules exactly (tested with examples)
- Token stacking rules enforced (blue/yellow ground only, red on gray/brown/red, etc.)
- Animal cube blocking prevents further token placement
- Manual hex placement (no auto-placement)
- Turn structure: mandatory → optional → end turn

✅ **Core Gameplay:**

- Player can select Central space and manually place each token
- Hex grid highlights valid placement locations
- Terrain calculates correctly (trees, mountains, buildings, fields, water)
- Score updates immediately after each placement
- End game triggers on correct conditions (pouch empty or ≤2 spaces)

✅ **Multiplayer:**

- Real-time Firebase sync (changes appear in all windows)
- Turn-based flow (only current player can act)
- Player profiles and game history preserved
- Cross-device login and rejoin works

✅ **Testing:**

- All unit tests pass with correct formulas
- 2-window multiplayer test completes full game
- Scoring breakdown matches official examples

✅ **Timeline:**

- Phase 0 (cleanup): 10 min
- Phase 1 (core logic): 1 hour
- Phase 2 (game UI): 1 hour
- Phase 3 (tests): 30 min
- **Total: 2 hours 40 minutes** (within 2-3 hour target)

---

## Summary

**v1.0 Failed** because we didn't read official rules first. We built working architecture but with incorrect game logic.

**v2.0 Plan** leverages the good parts of v1.0 (hex grid, Firebase sync, pattern matching, UI structure) while completely rewriting the game logic to match **official Libellud rules exactly**:

- ✅ **Trees**: Green alone (1pt), 1 brown + green (3pts), 2 brown + green (5pts)
- ✅ **Mountains**: Red tokens, height-based (1/3/7pts), 0 if isolated
- ✅ **Fields**: 5 points per separate field (2+ tokens)
- ✅ **Buildings**: 5 points if 3+ different adjacent colors, else 0
- ✅ **Water**: Only longest river scores, progressive formula
- ✅ **Token Placement**: Player manually chooses each hex location
- ✅ **Animal Cubes**: Block further token stacking

**Reusable from v1.0:** hex-grid.js, game-state.js, firebase-config.js, player-setup.js, lobby.js, styles.css (7 files = ~1000 lines)

**Rewrite from scratch:** scoring-engine.js, token-manager.js, game-room.js, firebase-sync.js, tokens-config.js, tests (6 files = ~800 lines)

**Net effort:** ~2.5 hours to rebuild with correct rules.

---

**Ready for implementation approval!** This plan provides a clear path to correct implementation while learning from v1.0's mistakes.

### Local State (game-state.js)

`// localStorage (persisted)
{
  player: {
    username: "alice",        // Lowercase (ID)
    displayName: "Alice",     // Original case
    deviceId: "uuid"
  }
}

// Memory (ephemeral)
{
  currentGame: { id: "ABC123", data: {...} },
  ui: {
    selectedTokens: [],       // For mandatory turn
    draggedToken: { color, source },
    hoveredHex: "0_0",
    showScoreBreakdown: false
  }
}`

## Key Features (Improvements Over Existing Games)

### 1. Player Identity & Session Management

- **Username-based login** (case insensitive, alphanumeric + underscore, 3-20 chars)
- Username = player ID in database (persistent identity)
- **Cross-device support**: Login from any device, last device is active session
- **Seamless rejoin**: Refresh/switch devices → auto-rejoin ongoing games with same seat/role

### 2. Player Profiles & History

- Track all games (current + past) per player
- Stats: games played, win rate, high score
- Game history: See past games with scores and rankings
- Solo mode high score leaderboard (personal)

### 3. Enhanced Lobby

- **Categorized game list**:
    - 🎮 Your Active Games (resume instantly)
    - ⏱️ Waiting for Players
    - 🔍 Join a Game (public games)
- **Player stats display**: Win rate, high score, recent games

### 4. Solo Mode

- Practice alone without waiting for players
- Track personal high scores
- Try different strategies and board configurations

### 5. Turn-Based Async Play

- No real-time pressure - play on your own schedule
- Clear turn indicators (whose turn, what phase)
- Game persists indefinitely until completion

## Core Algorithms

### Hex Grid (hex-grid.js)

- **Coordinate system**: Axial (q, r) using Honeycomb library
- **Flat-topped hexes** (better for rectangular boards)
- **Key operations**:
    - `getNeighbors(q, r)` - 6 adjacent hexes
    - `hexDistance(q1, r1, q2, r2)` - Distance between hexes
    - `coordToKey(q, r)` → `"q_r"` for Firebase keys
    - `keyToCoord("q_r")` → `{ q, r }`

### Token Stacking (token-manager.js)

**Rules:**

- Max 3 tokens per hex
- Yellow/Blue (fields/water) can't stack - ground level only
- Gray (mountains) can only stack on gray
- Green (trees) can only stack on brown (trunk), max 2 brown underneath
- Terrain calculated from stack composition

### Pattern Matching (pattern-matcher.js)

**Challenge:** Match animal habitat patterns in any rotation/orientation

`// Each animal card defines a pattern
{
  id: "bear-1",
  pattern: [
    { relativeCoord: [0, 0], terrain: "tree" },
    { relativeCoord: [1, 0], terrain: "tree" },
    { relativeCoord: [0, 1], terrain: "water" }
  ],
  maxPlacements: 4,
  pointsPerPlacement: [5, 10, 16, 23]
}

// Algorithm:
1. Try each hex as anchor point
2. For each anchor, try all 6 rotations (60° increments)
3. Also try mirrored versions (if asymmetric pattern)
4. Check if pattern matches terrain at rotated coordinates
5. Return all valid matches`

**Rotation math:** Use cube coordinates for clean 60° rotation

### Scoring Engine (scoring-engine.js)

**Modular design** - each category is independent:

`const scoringModules = {
  trees: scoreTreesModule, // Height-based
  mountains: scoreMountainsModule, // Adjacency-based
  fields: scoreFieldsModule, // Cluster size (flood fill)
  buildings: scoreBuildingsModule, // Neighbor diversity
  water: scoreWaterModule, // Longest river (flood fill)
  animals: scoreAnimalsModule, // Sum card points
};

function calculateTotalScore(playerBoard) {
  let breakdown = {},
    total = 0;
  for (const [category, scoreFn] of Object.entries(scoringModules)) {
    breakdown[category] = scoreFn(playerBoard);
    total += breakdown[category];
  }
  return { breakdown, total };
}`

**Key algorithms:**

- **Flood fill** for clusters (fields, water rivers)
- **Adjacency checks** for mountains (must touch another mountain to score)
- **Neighbor counting** for buildings (unique terrain types)

## Implementation Phases (2-3 Hours)

### Phase 1: MVP Core (2 hours)

**Goal:** Basic playable multiplayer

1. **Setup** (20 min)
    - Copy structure from Codenames
    - Firebase config
    - HTML shell with 3 screens
2. **Player + Lobby** (20 min)
    - Username login (validation only)
    - Create/join game in lobby
    - localStorage for username
3. **Hex Grid Rendering** (30 min)
    - Integrate Honeycomb library
    - SVG hex renderer (dynamic expansion)
    - Coordinate helpers
4. **Token Placement** (30 min)
    - Central board (3x3 grid)
    - Drag-drop to hex grid
    - Stacking validation
    - Turn system (mandatory phase)
5. **Basic Scoring** (20 min)
    - Trees module (simplest)
    - End game + winner

### Phase 2: Complete Gameplay (1 hour)

1. **All Scoring Modules** (30 min)
    - Mountains, Fields, Buildings, Water
    - Score breakdown modal
2. **Animal Cards** (30 min)
    - Load 10 simple cards initially
    - Pattern matching (rotation/mirror)
    - Optional turn: take card + place cubes
    - Animal scoring

### Phase 3: Polish (30 min - 1 hour)

1. **Player Profiles** (15 min)
    - `/players/` schema
    - Track history on game finish
    - Display stats in lobby
2. **Session Management** (10 min)
    - Device ID tracking
    - Rejoin with `isActive` flag
3. **Solo Mode** (10 min)
    - Toggle in create screen
    - Auto-start with 1 player
4. **Visual Polish** (15 min)
    - Token colors + icons
    - Turn indicator
    - Loading states

### Phase 4: Testing & Deployment (30 min)

1. **Tests**
    - Hex math, pattern matching, scoring
    - 2-window multiplayer testing
2. **Deploy**
    - Sync to `public/`
    - Force-add data files (`git add -f`)
    - Push to main

## Critical Files for Implementation

### Priority 1: Core Logic (Must be correct)

1. **hex-grid.js** - Foundation for all spatial logic
2. **pattern-matcher.js** - Most complex algorithm (rotation/mirroring)
3. **scoring-engine.js** - Modular scoring (easiest to test/extend)
4. **token-manager.js** - Stacking rules validation

### Priority 2: UI & Sync

1. **game-room.js** - Main UI orchestration + Firebase sync
2. **board-renderer.js** - SVG hex grid + drag-drop
3. **firebase-sync.js** - Write operations (turn actions)

### Priority 3: Data & Assets

1. **animal-cards.js** - 48 animal cards with patterns (start with 10 simple ones)
2. **tokens-config.js** - 6 token colors + stacking rules

## Assets Available

- **Logo**: `/data/harmonies/HARMONIES_LOGO.png`
- **Animal graphics**: `/data/harmonies/03_CONTENT/_GRAPHICS/` (bird, boar, rabbit, mouse, fennec, etc.)
- **Card images**: `/data/harmonies/03_CONTENT/_CARDS/` (official card prints)
- **Background**: `FOND-CLAIR_HARMONIES.jpg`

## Design Decisions (User Confirmed)

1. **Animal cards**: Start with 10 simplified patterns, parametrized for easy expansion to 48
2. **Central board refill**: Auto-refill (no manual action needed)
3. **Turn timer**: No timer in MVP (home game, no pressure). Track game duration for metrics only.
4. **Undo move**: No undo functionality (keeps game spirit, simpler implementation)
5. **Hex grid size**: Follow original game board (grows dynamically, ends at ≤2 empty spaces)
6. **Game abandonment** (Stage 2): Allow games to be abandoned if all players agree, recorded in history

## Testing Strategy

**Test priorities:**

- ✅ **Hex coordinate math** (adjacency, distance, rotation)
- ✅ **Pattern matching** (all 6 rotations + mirrors work correctly)
- ✅ **Scoring modules** (pure functions, easy to unit test)
- ✅ **Stacking rules** (all token placement constraints enforced)
- ✅ **Multiplayer sync** (turn transitions, race conditions)

**Skip testing:**

- ❌ CSS/styling details
- ❌ Animation timing
- ❌ Third-party library internals (Firebase, Honeycomb)

## Verification (End-to-End Test)

After implementation:

1. **Create game** as Player 1 (username login)
2. **Join game** as Player 2 (separate browser/incognito)
3. **Play full turn** for Player 1:
    - Take 3 tokens from central board
    - Place them on hex grid (test stacking: brown → green for tree)
    - Take 1 animal card
    - Place animal cube on completed habitat
    - End turn
4. **Verify Player 2 sees updates** (real-time sync)
5. **Play turn** as Player 2
6. **Trigger end game** (empty pouch or ≤2 spaces)
7. **Verify scoring**:
    - Check breakdown (trees, mountains, fields, buildings, water, animals)
    - Confirm winner declared
8. **Check player profile**:
    - Game added to history
    - Stats updated (games played, high score)
9. **Test rejoin**:
    - Close Player 1 tab
    - Login again with same username
    - Verify auto-rejoin to ongoing game with same seat
10. **Test solo mode**:
    - Create solo game
    - Play full game
    - Verify high score tracking

## Success Criteria

✅ **Gameplay**: Full turn-based multiplayer with all scoring systems working
✅ **Features**: Player profiles, game history, session management, solo mode
✅ **Architecture**: Clean separation (pure logic, Firebase sync, UI)
✅ **Performance**: Smooth hex grid rendering, responsive drag-drop
✅ **Accessibility**: Keyboard nav, mobile-friendly, clear turn indicators
✅ **Timeline**: Vibecode-ready in 2-3 hours post-approval

---

**Ready for approval!** This plan provides a clear path to implementing Harmonies with superior architecture and features compared to existing games, while maintaining the proven patterns that made Codenames/Ito/Nanja-monja successful.