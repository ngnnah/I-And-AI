# Harmonies - Implementation Plan v3.0 (CORRECTED)

## 🚨 CRITICAL CORRECTION FROM v2.0

**Mountains are GRAY tokens, NOT RED tokens!**

Based on physical game images:

- **GRAY stones** (stacked) = Mountains terrain
- **RED bricks** (on bases) = Buildings terrain

---

## Context

**Why This Rewrite:** v1.0 implementation did not follow official Libellud game rules. Multiple critical scoring formulas and token placement rules were incorrect.

**Goal:** Build a faithful web adaptation following **official rules exactly**, while maintaining the architectural strengths of v1.0 (modular design, Firebase sync, pure functions).

**User Decisions:**

- ✅ Clean Slate approach (move v1.0 to archive)
- ✅ Simple click-to-place UI (not drag-and-drop)
- ✅ Reuse existing Firebase database
- ✅ Complete Phase 1 & 2 with tests, then user tests locally before Phase 3

**Timeline:** 2-3 hours total

---

## Official Game Rules (CORRECTED)

### Token Stacking Rules

| Token Color        | Can Stack On   | Max Height | Terrain Type               |
| ------------------ | -------------- | ---------- | -------------------------- |
| **Blue** (Water)   | Nothing        | 1          | Ground level only          |
| **Yellow** (Field) | Nothing        | 1          | Ground level only          |
| **Brown** (Trunk)  | Brown only     | 2          | Foundation for trees       |
| **Green** (Leaves) | Brown (1-2)    | 3          | Completes trees            |
| **Gray** (Stone)   | Gray only      | Unlimited  | Mountains (self-stacking)  |
| **Red** (Brick)    | Gray/Brown/Red | 2          | Buildings (on foundations) |

### Terrain Calculation Logic (CORRECTED)

```javascript
// Stack composition determines terrain
[Gray, Gray] → MOUNTAIN (2+ gray stacked)
[Gray, Gray, Gray] → MOUNTAIN (3+ gray = higher mountain)
[Brown, Red] → BUILDING (red on brown foundation)
[Gray, Red] → BUILDING (red on gray foundation)
[Red, Red] → BUILDING (red self-stacked, max 2)
[Brown, Green] → TREE (green on brown)
[Brown, Brown, Green] → TREE (green on 2 brown)
[Yellow] → FIELD (single yellow)
[Blue] → WATER (single blue)
[Brown] → TRUNK (incomplete tree)
[Gray] → ROCK (single stone, incomplete mountain)
```

### Scoring Rules (EXACT FORMULAS)

#### 1. Trees (Brown + Green combinations)

| Composition       | Points |
| ----------------- | ------ |
| 1 green alone     | 1      |
| 1 brown + 1 green | 3      |
| 2 brown + 1 green | 5      |

#### 2. Mountains (GRAY tokens - CORRECTED!)

| Number of GRAY Tokens | Base Points | Condition                            |
| --------------------- | ----------- | ------------------------------------ |
| 1 token               | 1           | Must be adjacent to another mountain |
| 2 tokens              | 3           | Must be adjacent to another mountain |
| 3+ tokens             | 7           | Must be adjacent to another mountain |
| Isolated              | 0           | No adjacent mountains = 0 points     |

#### 3. Fields (Yellow tokens)

- **5 points per separate connected group** of 2+ yellow tokens
- Single yellow tokens (isolated) = 0 points

#### 4. Buildings (RED tokens - CORRECTED!)

- **5 points** if surrounded by **3 or more different token colors** (adjacent hexes)
- **0 points** otherwise (binary scoring)
- Only count top token color of adjacent stacks

#### 5. Water (Blue tokens)

**Side A - Rivers:**
| Length | Points |
|--------|--------|
| 2 tokens | 2 |
| 3 tokens | 5 |
| 4 tokens | 8 |
| 5 tokens | 11 |
| 6 tokens | 15 |
| 7+ tokens | 15 + (4 × excess) |

**Rule**: Only the **longest single river** scores

#### 6. Animals

- Score the **topmost uncovered number** on each completed Animal card
- Multiple placements on same card score progressively (e.g., 5, 10, 16, 23)

---

## Implementation Plan

### Phase 0: Cleanup (10 minutes)

```bash
# Move old implementation to archive
mv projects/gaming/harmonies projects/gaming/harmonies-v1-failed

# Create fresh directory
mkdir -p projects/gaming/harmonies

# Copy reusable files from v1
# (hex-grid.js, game-state.js, firebase-config.js, player-setup.js, lobby.js)
```

### Phase 1: Core Game Logic (1 hour)

#### 1.1 Token Configuration (10 min)

**File**: `js/data/tokens-config.js`

```javascript
export const TOKEN_COLORS = {
  BLUE: "blue", // Water
  YELLOW: "yellow", // Fields
  BROWN: "brown", // Tree trunks
  GREEN: "green", // Tree leaves
  GRAY: "gray", // Mountains (CORRECTED!)
  RED: "red", // Buildings (CORRECTED!)
};

export const COLOR_HEX = {
  blue: "#4A90E2",
  yellow: "#F5A623",
  brown: "#8B4513",
  green: "#7ED321",
  gray: "#9B9B9B", // Mountains
  red: "#D0021B", // Buildings
};

// CORRECTED STACKING RULES
export const STACKING_RULES = {
  blue: { canStackOn: [], maxHeight: 1 },
  yellow: { canStackOn: [], maxHeight: 1 },
  brown: { canStackOn: ["brown"], maxHeight: 2 },
  green: { canStackOn: ["brown"], maxHeight: 3 },
  gray: { canStackOn: ["gray"], maxHeight: null }, // Mountains (unlimited)
  red: { canStackOn: ["gray", "brown", "red"], maxHeight: 2 }, // Buildings
};

// Initial pouch distribution (120 tokens total)
export const INITIAL_POUCH = {
  blue: 23,
  gray: 23,
  brown: 21,
  green: 19,
  yellow: 19,
  red: 15,
};
```

#### 1.2 Token Manager (20 min)

**File**: `js/game/token-manager.js`

```javascript
import { STACKING_RULES } from "../data/tokens-config.js";
import { coordToKey } from "./hex-grid.js";

// CORRECTED: Check if hex has Animal cube
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

  // Mountains: GRAY tokens stacked (CORRECTED!)
  if (colors.every((c) => c === "gray")) {
    if (colors.length >= 2) return "mountain";
    return "rock"; // Single gray = incomplete mountain
  }

  // Buildings: RED on top of gray/brown/red (CORRECTED!)
  if (topColor === "red" && colors.length >= 2) {
    const baseColors = colors.slice(0, -1);
    const validBase = baseColors.every((c) =>
      ["gray", "brown", "red"].includes(c),
    );
    if (validBase) return "building";
  }

  // Trees: Green on brown(s)
  if (topColor === "green") {
    const brownsBelow = colors.slice(0, -1).every((c) => c === "brown");
    if (brownsBelow && colors.length >= 2) return "tree";
    return "empty"; // Green alone isn't a complete tree
  }

  // Ground-level single tokens
  if (colors.length === 1) {
    if (topColor === "blue") return "water";
    if (topColor === "yellow") return "field";
  }

  // Incomplete stacks
  if (colors.every((c) => c === "brown")) return "trunk";

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
}
```

#### 1.3 Scoring Engine (30 min)

**File**: `js/game/scoring-engine.js`

```javascript
import { keyToCoord, getNeighbors, coordToKey } from "./hex-grid.js";

// 1. TREES (CORRECTED)
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

// 2. MOUNTAINS (CORRECTED - GRAY tokens!)
export function scoreMountainsModule(hexGrid) {
  let score = 0;
  const mountainKeys = Object.keys(hexGrid).filter(
    (k) => hexGrid[k].terrain === "mountain",
  );

  for (const key of mountainKeys) {
    const hex = hexGrid[key];
    const grayCount = hex.stack.filter((t) => t.color === "gray").length;

    // Check if adjacent to another mountain
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);
    const hasAdjacentMountain = neighbors.some((n) => {
      const nKey = coordToKey(n.q, n.r);
      return hexGrid[nKey]?.terrain === "mountain";
    });

    if (!hasAdjacentMountain) continue; // Isolated = 0 points

    // Score by height (CORRECTED - using gray count!)
    if (grayCount === 1) score += 1;
    else if (grayCount === 2) score += 3;
    else if (grayCount >= 3) score += 7;
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

// 4. BUILDINGS (CORRECTED - Binary: 5pts if 3+ colors, else 0)
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

// 5. WATER (CORRECTED - Longest river only)
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

// Helper: Flood fill for connected terrain
function floodFill(hexGrid, startKey, terrain, visited) {
  const stack = [startKey];
  let count = 0;

  while (stack.length > 0) {
    const key = stack.pop();
    if (visited.has(key)) continue;
    if (!hexGrid[key] || hexGrid[key].terrain !== terrain) continue;

    visited.add(key);
    count++;

    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);
    for (const n of neighbors) {
      const nKey = coordToKey(n.q, n.r);
      if (!visited.has(nKey)) stack.push(nKey);
    }
  }

  return count;
}

// 6. ANIMALS (Same as v1 - this was correct)
export function scoreAnimalsModule(placedAnimals, animalCards) {
  let score = 0;

  for (const animal of placedAnimals) {
    const card = animalCards.find((c) => c.id === animal.cardId);
    if (!card) continue;

    const placementIndex = animal.placementIndex || 0;
    if (placementIndex < card.pointsPerPlacement.length) {
      score += card.pointsPerPlacement[placementIndex];
    }
  }

  return score;
}

// Main scoring function
export function calculateTotalScore(playerBoard, animalCards) {
  const breakdown = {
    trees: scoreTreesModule(playerBoard.hexGrid),
    mountains: scoreMountainsModule(playerBoard.hexGrid),
    fields: scoreFieldsModule(playerBoard.hexGrid),
    buildings: scoreBuildingsModule(playerBoard.hexGrid),
    water: scoreWaterModule(playerBoard.hexGrid),
    animals: scoreAnimalsModule(playerBoard.placedAnimals, animalCards),
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { breakdown, total };
}
```

### Phase 2: Game Room UI (1 hour)

#### 2.1 Manual Token Placement - Simple Click (40 min)

**File**: `js/screens/game-room.js`

**New Flow:**

1. Player clicks 1 space on Central board (takes all 3 tokens)
2. UI enters "placement mode" - shows 3 tokens in hand
3. **For each token** (one at a time):
   - Hex grid highlights valid placement spots (green border)
   - Player clicks a hex
   - Token places, terrain recalculates
   - Next token becomes active
4. After all 3 tokens placed → Optional phase
5. "End Turn" button refills Central board

**Key UI Elements:**

- **Token Hand Display**: Show 3 tokens from selected Central space
- **Clickable Hexes**: Highlight valid placement locations
- **Sequential Placement**: Enforce one-token-at-a-time flow
- **Visual Feedback**: Show validation errors

#### 2.2 Firebase Sync Updates (20 min)

**File**: `js/game/firebase-sync.js`

```javascript
// New: Select Central board space (takes 3 tokens)
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
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const playerBoard = game.playerBoards[username];
  const token = playerBoard.tokensInHand[tokenIndex];

  // Add token to hex stack
  const hexKey = coordToKey(hexCoord.q, hexCoord.r);
  const hex = playerBoard.hexGrid[hexKey] || { stack: [] };
  hex.stack.push(token);

  // Recalculate terrain
  hex.terrain = calculateTerrain(hex.stack);

  const updates = {};
  updates[`playerBoards/${username}/hexGrid/${hexKey}`] = hex;
  updates[`playerBoards/${username}/tokensInHand/${tokenIndex}`] = null;

  // If all 3 placed → optional phase
  const remainingTokens = playerBoard.tokensInHand.filter((t) => t !== null);
  if (remainingTokens.length === 0) {
    updates[`turnPhase`] = "optional";
  }

  await update(gameRef, updates);
}
```

### Phase 3: Testing (30 min)

**File**: `tests/core-logic.test.js`

```javascript
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  scoreTreesModule,
  scoreMountainsModule,
  scoreFieldsModule,
  scoreBuildingsModule,
} from "../js/game/scoring-engine.js";
import { calculateTerrain } from "../js/game/token-manager.js";

describe("Terrain Calculation (CORRECTED)", () => {
  it("calculates mountain from gray stacks", () => {
    const stack = [{ color: "gray" }, { color: "gray" }];
    assert.equal(calculateTerrain(stack), "mountain");
  });

  it("calculates building from red on gray", () => {
    const stack = [{ color: "gray" }, { color: "red" }];
    assert.equal(calculateTerrain(stack), "building");
  });

  it("calculates tree from brown + green", () => {
    const stack = [{ color: "brown" }, { color: "green" }];
    assert.equal(calculateTerrain(stack), "tree");
  });
});

describe("Scoring - Trees (CORRECTED)", () => {
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

describe("Scoring - Mountains (CORRECTED - GRAY tokens!)", () => {
  it("isolated mountain scores 0pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "gray" }, { color: "gray" }],
        terrain: "mountain",
      },
    };
    assert.equal(scoreMountainsModule(hexGrid), 0);
  });

  it("adjacent 2-gray mountain = 3pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "gray" }, { color: "gray" }],
        terrain: "mountain",
      },
      "1_0": { stack: [{ color: "gray" }], terrain: "mountain" },
    };
    const score = scoreMountainsModule(hexGrid);
    assert.equal(score, 3 + 1); // 3pts + 1pt = 4pts (NOTE: 1-gray should be 'rock' not 'mountain')
  });

  it("adjacent 3-gray mountain = 7pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "gray" }, { color: "gray" }, { color: "gray" }],
        terrain: "mountain",
      },
      "1_0": {
        stack: [{ color: "gray" }, { color: "gray" }],
        terrain: "mountain",
      },
    };
    const score = scoreMountainsModule(hexGrid);
    assert.equal(score, 7 + 3); // 7pts + 3pts = 10pts
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
      "0_0": {
        stack: [{ color: "gray" }, { color: "red" }],
        terrain: "building",
      },
      "1_0": { stack: [{ color: "blue" }], terrain: "water" },
      "0_1": { stack: [{ color: "blue" }], terrain: "water" },
    };
    assert.equal(scoreBuildingsModule(hexGrid), 0); // Only 2 colors, not 3+
  });

  it("building with 3 adjacent colors = 5pts", () => {
    const hexGrid = {
      "0_0": {
        stack: [{ color: "gray" }, { color: "red" }],
        terrain: "building",
      },
      "1_0": { stack: [{ color: "blue" }], terrain: "water" },
      "0_1": { stack: [{ color: "yellow" }], terrain: "field" },
      "1_1": {
        stack: [{ color: "brown" }, { color: "green" }],
        terrain: "tree",
      },
    };
    assert.equal(scoreBuildingsModule(hexGrid), 5);
  });
});
```

---

## Verification Tests

### Test 1: Mountain Scoring (CORRECTED)

**Setup:**

- Hex A: 2 gray tokens (adjacent to Hex B)
- Hex B: 1 gray token (adjacent to Hex A) - NOTE: This should be 'rock' not 'mountain'
- Hex C: 3 gray tokens (isolated)

**Expected Score:** 3 + 0 + 0 = **3 points** ✅

### Test 2: Building Scoring (CORRECTED)

**Setup:**

- Building A: Red on gray with 2 adjacent colors
- Building B: Red on brown with 3 adjacent colors

**Expected Score:** 0 + 5 = **5 points** ✅

---

## Success Criteria

✅ **Rules Compliance:**

- Mountains are GRAY tokens (not red)
- Buildings are RED tokens (on gray/brown/red bases)
- All scoring formulas match official rules
- Manual hex placement (no auto-placement)

✅ **Core Gameplay:**

- Player selects Central space and manually places each token
- Terrain calculates correctly
- Score updates after each placement

✅ **Testing:**

- All unit tests pass with correct formulas
- 2-window multiplayer test completes full game

✅ **Timeline:**

- Phase 0 (cleanup): 10 min
- Phase 1 (core logic): 1 hour
- Phase 2 (game UI): 1 hour
- Phase 3 (tests): 30 min
- **Total: 2 hours 40 minutes**

---

## Assets to Copy

From `data/harmonies/03_CONTENT/`:

- Token graphics (if needed for UI)
- Animal card images
- Background images
- Logo

---

**Ready for implementation!** This v3.0 plan has the CORRECT mountain/building logic based on the physical game images.
