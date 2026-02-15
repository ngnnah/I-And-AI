/**
 * Harmonies - Token Manager Tests
 *
 * Test terrain calculation and stacking rules
 * CRITICAL: Verify GRAY = Mountains, RED = Buildings
 */

import {
  calculateTerrain,
  canPlaceToken,
  hasAnimalCube,
  placeTokenOnHex,
  getValidPlacementHexes,
} from "../js/game/token-manager.js";

import { TERRAIN_TYPES, STACKING_RULES } from "../js/data/tokens-config.js";

// Test helper
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message}\n   Expected: ${expected}\n   Got: ${actual}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

// ============================================================================
// TERRAIN CALCULATION TESTS (CORRECTED)
// ============================================================================

console.log("\n🌍 TERRAIN CALCULATION TESTS");

// Test 1: Empty hex
(() => {
  const terrain = calculateTerrain([]);
  assertEqual(terrain, TERRAIN_TYPES.EMPTY, "Empty stack = empty terrain");
})();

// Test 2: Single blue = water
(() => {
  const terrain = calculateTerrain([{ color: "blue" }]);
  assertEqual(terrain, TERRAIN_TYPES.WATER, "Single blue = water");
})();

// Test 3: Single yellow = field
(() => {
  const terrain = calculateTerrain([{ color: "yellow" }]);
  assertEqual(terrain, TERRAIN_TYPES.FIELD, "Single yellow = field");
})();

// Test 4: Single brown = trunk
(() => {
  const terrain = calculateTerrain([{ color: "brown" }]);
  assertEqual(terrain, TERRAIN_TYPES.TRUNK, "Single brown = trunk (incomplete tree)");
})();

// Test 5: Single green = tree
(() => {
  const terrain = calculateTerrain([{ color: "green" }]);
  assertEqual(terrain, TERRAIN_TYPES.TREE, "Single green = tree (1 pt)");
})();

// Test 6: Single gray = rock (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "gray" }]);
  assertEqual(terrain, TERRAIN_TYPES.ROCK, "Single gray = rock (incomplete mountain)");
})();

// Test 7: Single red = building (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "red" }]);
  assertEqual(terrain, TERRAIN_TYPES.BUILDING, "Single red = building");
})();

// Test 8: Brown + green = tree
(() => {
  const terrain = calculateTerrain([{ color: "brown" }, { color: "green" }]);
  assertEqual(terrain, TERRAIN_TYPES.TREE, "Brown + green = tree (3 pts)");
})();

// Test 9: 2 brown + green = tree
(() => {
  const terrain = calculateTerrain([{ color: "brown" }, { color: "brown" }, { color: "green" }]);
  assertEqual(terrain, TERRAIN_TYPES.TREE, "2 brown + green = tree (5 pts)");
})();

// Test 10: 2 brown = trunk
(() => {
  const terrain = calculateTerrain([{ color: "brown" }, { color: "brown" }]);
  assertEqual(terrain, TERRAIN_TYPES.TRUNK, "2 brown = trunk (incomplete tree)");
})();

// Test 11: 2 gray = mountain (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "gray" }, { color: "gray" }]);
  assertEqual(terrain, TERRAIN_TYPES.MOUNTAIN, "2 gray = mountain");
})();

// Test 12: 3 gray = mountain (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "gray" }, { color: "gray" }, { color: "gray" }]);
  assertEqual(terrain, TERRAIN_TYPES.MOUNTAIN, "3 gray = mountain (7 pts if adjacent)");
})();

// Test 13: Gray + red = building (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "gray" }, { color: "red" }]);
  assertEqual(terrain, TERRAIN_TYPES.BUILDING, "Gray + red = building");
})();

// Test 14: Brown + red = building (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "brown" }, { color: "red" }]);
  assertEqual(terrain, TERRAIN_TYPES.BUILDING, "Brown + red = building");
})();

// Test 15: Red + red = building (CORRECTED!)
(() => {
  const terrain = calculateTerrain([{ color: "red" }, { color: "red" }]);
  assertEqual(terrain, TERRAIN_TYPES.BUILDING, "Red + red = building");
})();

// Test 16: Invalid stack (blue + green) = empty
(() => {
  const terrain = calculateTerrain([{ color: "blue" }, { color: "green" }]);
  assertEqual(terrain, TERRAIN_TYPES.EMPTY, "Blue + green = empty (invalid stack)");
})();

// Test 17: Invalid stack (yellow + brown) = empty
(() => {
  const terrain = calculateTerrain([{ color: "yellow" }, { color: "brown" }]);
  assertEqual(terrain, TERRAIN_TYPES.EMPTY, "Yellow + brown = empty (invalid stack)");
})();

// Test 18: Invalid stack (green on yellow) = empty
(() => {
  const terrain = calculateTerrain([{ color: "yellow" }, { color: "green" }]);
  assertEqual(terrain, TERRAIN_TYPES.EMPTY, "Yellow + green = empty (invalid)");
})();

// ============================================================================
// STACKING RULES TESTS (CORRECTED)
// ============================================================================

console.log("\n📚 STACKING RULES TESTS");

// Test 19: Blue cannot stack
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "blue" }],
    terrain: TERRAIN_TYPES.WATER,
  };
  const result = canPlaceToken(hex, "blue");
  assertEqual(result.valid, false, "Blue cannot stack (max height 1)");
})();

// Test 20: Yellow cannot stack
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "yellow" }],
    terrain: TERRAIN_TYPES.FIELD,
  };
  const result = canPlaceToken(hex, "yellow");
  assertEqual(result.valid, false, "Yellow cannot stack (max height 1)");
})();

// Test 21: Brown can stack on brown
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "brown" }],
    terrain: TERRAIN_TYPES.TRUNK,
  };
  const result = canPlaceToken(hex, "brown");
  assertEqual(result.valid, true, "Brown can stack on brown");
})();

// Test 22: Brown cannot stack 3 high
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "brown" }, { color: "brown" }],
    terrain: TERRAIN_TYPES.TRUNK,
  };
  const result = canPlaceToken(hex, "brown");
  assertEqual(result.valid, false, "Brown cannot stack 3 high (max height 2)");
})();

// Test 23: Green can stack on brown
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "brown" }],
    terrain: TERRAIN_TYPES.TRUNK,
  };
  const result = canPlaceToken(hex, "green");
  assertEqual(result.valid, true, "Green can stack on brown");
})();

// Test 24: Green cannot stack on blue
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "blue" }],
    terrain: TERRAIN_TYPES.WATER,
  };
  const result = canPlaceToken(hex, "green");
  assertEqual(result.valid, false, "Green cannot stack on blue");
})();

// Test 25: Gray can stack on gray (CORRECTED - unlimited!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "gray" }, { color: "gray" }, { color: "gray" }],
    terrain: TERRAIN_TYPES.MOUNTAIN,
  };
  const result = canPlaceToken(hex, "gray");
  assertEqual(result.valid, true, "Gray can stack on gray (unlimited height)");
})();

// Test 26: Red can stack on gray (CORRECTED!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "gray" }],
    terrain: TERRAIN_TYPES.ROCK,
  };
  const result = canPlaceToken(hex, "red");
  assertEqual(result.valid, true, "Red can stack on gray (building)");
})();

// Test 27: Red can stack on brown (CORRECTED!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "brown" }],
    terrain: TERRAIN_TYPES.TRUNK,
  };
  const result = canPlaceToken(hex, "red");
  assertEqual(result.valid, true, "Red can stack on brown (building)");
})();

// Test 28: Red can stack on red (CORRECTED!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "red" }],
    terrain: TERRAIN_TYPES.BUILDING,
  };
  const result = canPlaceToken(hex, "red");
  assertEqual(result.valid, true, "Red can stack on red (building)");
})();

// Test 29: Red cannot stack 3 high (CORRECTED - max 2!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "gray" }, { color: "red" }],
    terrain: TERRAIN_TYPES.BUILDING,
  };
  const result = canPlaceToken(hex, "red");
  assertEqual(result.valid, false, "Red cannot stack 3 high (max height 2)");
})();

// Test 30: Any token on empty hex
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [],
    terrain: TERRAIN_TYPES.EMPTY,
  };

  const colors = ["blue", "yellow", "brown", "green", "gray", "red"];
  colors.forEach((color) => {
    const result = canPlaceToken(hex, color);
    assertEqual(result.valid, true, `${color} can be placed on empty hex`);
  });
})();

// ============================================================================
// ANIMAL CUBE BLOCKING TESTS
// ============================================================================

console.log("\n🦊 ANIMAL CUBE BLOCKING TESTS");

// Test 31: Has animal cube check
(() => {
  const hex = { q: 0, r: 0 };
  const placedAnimals = [
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
    },
  ];

  const hasAnimal = hasAnimalCube(hex, placedAnimals);
  assertEqual(hasAnimal, true, "Hex (0,0) has animal cube");
})();

// Test 32: Does not have animal cube
(() => {
  const hex = { q: 2, r: 2 };
  const placedAnimals = [
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
    },
  ];

  const hasAnimal = hasAnimalCube(hex, placedAnimals);
  assertEqual(hasAnimal, false, "Hex (2,2) does not have animal cube");
})();

// Test 33: Cannot place token on hex with animal cube
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "green" }],
    terrain: TERRAIN_TYPES.TREE,
  };
  const placedAnimals = [
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
    },
  ];

  const result = canPlaceToken(hex, "brown", placedAnimals);
  assertEqual(result.valid, false, "Cannot place token on hex with animal cube");
  assert(
    result.reason.includes("Animal cube"),
    "Error reason mentions Animal cube"
  );
})();

// ============================================================================
// TOKEN PLACEMENT TESTS
// ============================================================================

console.log("\n🎯 TOKEN PLACEMENT TESTS");

// Test 34: Place token on hex updates terrain
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "brown" }],
    terrain: TERRAIN_TYPES.TRUNK,
  };

  const updatedHex = placeTokenOnHex(hex, { color: "green" });

  assertEqual(updatedHex.stack.length, 2, "Stack has 2 tokens after placement");
  assertEqual(updatedHex.terrain, TERRAIN_TYPES.TREE, "Terrain updated to tree");
  assertEqual(updatedHex.stack[0].color, "brown", "First token is brown");
  assertEqual(updatedHex.stack[1].color, "green", "Second token is green");
})();

// Test 35: Place gray on gray creates mountain (CORRECTED!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "gray" }],
    terrain: TERRAIN_TYPES.ROCK,
  };

  const updatedHex = placeTokenOnHex(hex, { color: "gray" });

  assertEqual(updatedHex.stack.length, 2, "Stack has 2 gray tokens");
  assertEqual(updatedHex.terrain, TERRAIN_TYPES.MOUNTAIN, "Terrain updated to mountain");
})();

// Test 36: Place red on gray creates building (CORRECTED!)
(() => {
  const hex = {
    q: 0,
    r: 0,
    stack: [{ color: "gray" }],
    terrain: TERRAIN_TYPES.ROCK,
  };

  const updatedHex = placeTokenOnHex(hex, { color: "red" });

  assertEqual(updatedHex.stack.length, 2, "Stack has 2 tokens");
  assertEqual(updatedHex.terrain, TERRAIN_TYPES.BUILDING, "Terrain updated to building");
  assertEqual(updatedHex.stack[0].color, "gray", "First token is gray (foundation)");
  assertEqual(updatedHex.stack[1].color, "red", "Second token is red (building)");
})();

// ============================================================================
// EXPANSION HEX TESTS (NEW!)
// ============================================================================

console.log("\n🔷 EXPANSION HEX TESTS");

// Test 37: Valid hexes includes existing hexes
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [], terrain: "empty" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "blue", []);
  assert(validHexes.includes("0_0"), "Existing hex 0_0 is valid for blue placement");
})();

// Test 38: Valid hexes includes expansion hexes (ground-level tokens)
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [{ color: "blue" }], terrain: "water" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "yellow", []);

  // Yellow is ground-level, so should be valid on expansion hexes
  // Neighbors of 0,0 are: 1_0, 1_-1, 0_-1, -1_0, -1_1, 0_1
  const hasExpansionHex = validHexes.some(key =>
    ["1_0", "1_-1", "0_-1", "-1_0", "-1_1", "0_1"].includes(key)
  );

  assert(hasExpansionHex, "Expansion hexes included for ground-level token (yellow)");
  assert(validHexes.length >= 6, "At least 6 expansion hexes available");
})();

// Test 39: Green can be placed on expansion hexes (ground-level) AND on brown
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [{ color: "brown" }], terrain: "trunk" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "green", []);

  // Green can stack on brown (0_0) AND be placed on empty expansion hexes
  assert(validHexes.includes("0_0"), "Green can be placed on existing brown hex");
  assert(validHexes.length >= 7, "Green can also be placed on expansion hexes (6+1)");
})();

// Test 40: Multiple existing hexes create multiple expansion zones
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [{ color: "blue" }], terrain: "water" },
    "2_0": { q: 2, r: 0, stack: [{ color: "blue" }], terrain: "water" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "yellow", []);

  // Should have expansion hexes around both 0,0 and 2,0
  // Total = 6 neighbors of 0,0 + 6 neighbors of 2,0 (minus overlaps)
  assert(validHexes.length >= 10, "Multiple expansion zones created");
})();

// Test 41: Gray can be placed on expansion hexes (ground-level)
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [{ color: "gray" }], terrain: "rock" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "gray", []);

  // Gray can stack on gray OR be placed on empty expansion hexes
  assert(validHexes.includes("0_0"), "Gray can stack on existing gray");
  assert(validHexes.length >= 7, "Gray can also be placed on expansion hexes (6+1)");
})();

// Test 42: Red can be placed on expansion hexes (ground-level)
(() => {
  const hexGrid = {
    "0_0": { q: 0, r: 0, stack: [{ color: "red" }], terrain: "building" },
  };
  const validHexes = getValidPlacementHexes(hexGrid, "red", []);

  // Red can stack on red OR be placed on empty expansion hexes
  assert(validHexes.includes("0_0"), "Red can stack on existing red");
  assert(validHexes.length >= 7, "Red can also be placed on expansion hexes (6+1)");
})();

// ============================================================================
// SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(60));
console.log("✅ ALL TESTS PASSED! Token Manager Verified");
console.log("=".repeat(60));
console.log("✅ GRAY = Mountains (unlimited height)");
console.log("✅ RED = Buildings (max 2 height, on gray/brown/red)");
console.log("✅ Terrain calculation matches official rules");
console.log("✅ Stacking rules enforced correctly");
console.log("✅ Animal cube blocking works");
console.log("✅ Expansion hex placement works correctly");
console.log("=".repeat(60) + "\n");
