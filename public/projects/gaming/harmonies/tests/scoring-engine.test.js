/**
 * Harmonies - Scoring Engine Tests
 *
 * Test all 6 corrected scoring formulas
 * CRITICAL: Verify GRAY = Mountains, RED = Buildings
 */

import {
  scoreTreesModule,
  scoreMountainsModule,
  scoreFieldsModule,
  scoreBuildingsModule,
  scoreWaterModule,
  scoreAnimalsModule,
  calculateTotalScore,
} from "../js/game/scoring-engine.js";

import { TERRAIN_TYPES } from "../js/data/tokens-config.js";

// Test helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message}\n   Expected: ${expected}\n   Got: ${actual}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

// ============================================================================
// TREES SCORING TESTS (CORRECTED)
// ============================================================================

console.log("\n🌲 TREES SCORING TESTS");

// Test 1: Green alone = 1 pt
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
  };
  const score = scoreTreesModule(hexGrid);
  assertEqual(score, 1, "Green alone = 1 pt");
})();

// Test 2: 1 brown + 1 green = 3 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "brown" }, { color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
  };
  const score = scoreTreesModule(hexGrid);
  assertEqual(score, 3, "1 brown + 1 green = 3 pts");
})();

// Test 3: 2 brown + 1 green = 5 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "brown" }, { color: "brown" }, { color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
  };
  const score = scoreTreesModule(hexGrid);
  assertEqual(score, 5, "2 brown + 1 green = 5 pts");
})();

// Test 4: Brown alone (trunk) = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "brown" }],
      terrain: TERRAIN_TYPES.TRUNK,
    },
  };
  const score = scoreTreesModule(hexGrid);
  assertEqual(score, 0, "Brown alone (trunk) = 0 pts");
})();

// Test 5: Multiple trees
(() => {
  const hexGrid = {
    "0_0": {
      stack: [{ color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
    "1_0": {
      stack: [{ color: "brown" }, { color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
    "2_0": {
      stack: [{ color: "brown" }, { color: "brown" }, { color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
  };
  const score = scoreTreesModule(hexGrid);
  assertEqual(score, 9, "Multiple trees: 1 + 3 + 5 = 9 pts");
})();

// ============================================================================
// MOUNTAINS SCORING TESTS (CORRECTED - GRAY tokens!)
// ============================================================================

console.log("\n⛰️  MOUNTAINS SCORING TESTS (GRAY = Mountains)");

// Test 6: Isolated mountain = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
  };
  const score = scoreMountainsModule(hexGrid);
  assertEqual(score, 0, "Isolated single gray mountain = 0 pts");
})();

// Test 7: Adjacent 1-gray mountains = 1 + 1 = 2 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
  };
  const score = scoreMountainsModule(hexGrid);
  assertEqual(score, 2, "Two adjacent 1-gray mountains = 1 + 1 = 2 pts");
})();

// Test 8: Adjacent 2-gray mountain = 3 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "gray" }, { color: "gray" }],
      terrain: TERRAIN_TYPES.MOUNTAIN,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
  };
  const score = scoreMountainsModule(hexGrid);
  assertEqual(score, 4, "2-gray mountain adjacent to 1-gray = 3 + 1 = 4 pts");
})();

// Test 9: Adjacent 3-gray mountain = 7 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "gray" }, { color: "gray" }, { color: "gray" }],
      terrain: TERRAIN_TYPES.MOUNTAIN,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
  };
  const score = scoreMountainsModule(hexGrid);
  assertEqual(score, 8, "3-gray mountain adjacent to 1-gray = 7 + 1 = 8 pts");
})();

// ============================================================================
// FIELDS SCORING TESTS (CORRECTED - 5 pts per field)
// ============================================================================

console.log("\n🌾 FIELDS SCORING TESTS (5 pts per separate field)");

// Test 10: Single yellow = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
  };
  const score = scoreFieldsModule(hexGrid);
  assertEqual(score, 0, "Single isolated yellow = 0 pts");
})();

// Test 11: 2 connected yellow = 5 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
  };
  const score = scoreFieldsModule(hexGrid);
  assertEqual(score, 5, "Field of 2 = 5 pts");
})();

// Test 12: Two separate fields of 2 = 10 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "3_0": {
      q: 3,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "4_0": {
      q: 4,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
  };
  const score = scoreFieldsModule(hexGrid);
  assertEqual(score, 10, "Two separate fields of 2 = 5 + 5 = 10 pts");
})();

// Test 13: Large field of 5 = 5 pts (flat rate)
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "2_0": {
      q: 2,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "3_0": {
      q: 3,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "4_0": {
      q: 4,
      r: 0,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
  };
  const score = scoreFieldsModule(hexGrid);
  assertEqual(score, 5, "Large field of 5 = 5 pts (flat rate, not progressive)");
})();

// ============================================================================
// BUILDINGS SCORING TESTS (CORRECTED - Binary: 5 pts or 0)
// ============================================================================

console.log("\n🏘️  BUILDINGS SCORING TESTS (RED = Buildings, Binary Scoring)");

// Test 14: Building with 0 adjacent = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "red" }],
      terrain: TERRAIN_TYPES.BUILDING,
    },
  };
  const score = scoreBuildingsModule(hexGrid);
  assertEqual(score, 0, "Building with 0 adjacent colors = 0 pts");
})();

// Test 15: Building with 2 adjacent colors = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "red" }],
      terrain: TERRAIN_TYPES.BUILDING,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "0_1": {
      q: 0,
      r: 1,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreBuildingsModule(hexGrid);
  assertEqual(score, 0, "Building with 2 adjacent colors = 0 pts (need 3+)");
})();

// Test 16: Building with 3 adjacent colors = 5 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "red" }],
      terrain: TERRAIN_TYPES.BUILDING,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "0_1": {
      q: 0,
      r: 1,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "-1_1": {
      q: -1,
      r: 1,
      stack: [{ color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
  };
  const score = scoreBuildingsModule(hexGrid);
  assertEqual(score, 5, "Building with 3 adjacent colors = 5 pts (binary)");
})();

// Test 17: Building with 5 adjacent colors = 5 pts (not more!)
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "red" }],
      terrain: TERRAIN_TYPES.BUILDING,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "0_1": {
      q: 0,
      r: 1,
      stack: [{ color: "yellow" }],
      terrain: TERRAIN_TYPES.FIELD,
    },
    "-1_0": {
      q: -1,
      r: 0,
      stack: [{ color: "green" }],
      terrain: TERRAIN_TYPES.TREE,
    },
    "0_-1": {
      q: 0,
      r: -1,
      stack: [{ color: "gray" }],
      terrain: TERRAIN_TYPES.ROCK,
    },
    "1_-1": {
      q: 1,
      r: -1,
      stack: [{ color: "brown" }],
      terrain: TERRAIN_TYPES.TRUNK,
    },
  };
  const score = scoreBuildingsModule(hexGrid);
  assertEqual(score, 5, "Building with 5 adjacent colors = 5 pts (binary, not 10!)");
})();

// ============================================================================
// WATER SCORING TESTS (CORRECTED - Longest river only, progressive)
// ============================================================================

console.log("\n💧 WATER SCORING TESTS (Longest river only, progressive)");

// Test 18: Single blue = 0 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreWaterModule(hexGrid, "A");
  assertEqual(score, 0, "Single blue = 0 pts");
})();

// Test 19: River of 2 = 2 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreWaterModule(hexGrid, "A");
  assertEqual(score, 2, "River of 2 = 2 pts");
})();

// Test 20: River of 3 = 5 pts
(() => {
  const hexGrid = {
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "2_0": {
      q: 2,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreWaterModule(hexGrid, "A");
  assertEqual(score, 5, "River of 3 = 5 pts");
})();

// Test 21: River of 4 = 8 pts
(() => {
  const hexGrid = {
    "0_0": {
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "1_0": {
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "2_0": {
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "3_0": {
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreWaterModule(hexGrid, "A");
  assertEqual(score, 8, "River of 4 = 8 pts");
})();

// Test 22: Two rivers (4 and 6) = 15 pts (only longest counts!)
(() => {
  const hexGrid = {
    // River 1 (length 4)
    "0_0": {
      q: 0,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "1_0": {
      q: 1,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "2_0": {
      q: 2,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "3_0": {
      q: 3,
      r: 0,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    // River 2 (length 6)
    "0_2": {
      q: 0,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "1_2": {
      q: 1,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "2_2": {
      q: 2,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "3_2": {
      q: 3,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "4_2": {
      q: 4,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
    "5_2": {
      q: 5,
      r: 2,
      stack: [{ color: "blue" }],
      terrain: TERRAIN_TYPES.WATER,
    },
  };
  const score = scoreWaterModule(hexGrid, "A");
  assertEqual(score, 15, "Two rivers (4 and 6) = 15 pts (only longest counts, not 8+15=23!)");
})();

// ============================================================================
// ANIMALS SCORING TESTS
// ============================================================================

console.log("\n🦊 ANIMALS SCORING TESTS");

// Test 23: No animals = 0 pts
(() => {
  const placedAnimals = [];
  const animalCards = [];
  const score = scoreAnimalsModule(placedAnimals, animalCards);
  assertEqual(score, 0, "No animals = 0 pts");
})();

// Test 24: 1 placement on card = first value
(() => {
  const placedAnimals = [
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
    },
  ];
  const animalCards = [
    {
      id: "bear-01",
      name: "Bear",
      pointsPerPlacement: [5, 10, 16, 23],
    },
  ];
  const score = scoreAnimalsModule(placedAnimals, animalCards);
  assertEqual(score, 5, "1 placement on bear card = 5 pts");
})();

// Test 25: 2 placements on card = second value
(() => {
  const placedAnimals = [
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
    },
    {
      cardId: "bear-01",
      hexCoords: [
        { q: 2, r: 0 },
        { q: 3, r: 0 },
      ],
    },
  ];
  const animalCards = [
    {
      id: "bear-01",
      name: "Bear",
      pointsPerPlacement: [5, 10, 16, 23],
    },
  ];
  const score = scoreAnimalsModule(placedAnimals, animalCards);
  assertEqual(score, 10, "2 placements on bear card = 10 pts (topmost uncovered number)");
})();

// ============================================================================
// TOTAL SCORE INTEGRATION TEST
// ============================================================================

console.log("\n🎯 TOTAL SCORE INTEGRATION TEST");

// Test 26: Full board scenario
(() => {
  const playerBoard = {
    hexGrid: {
      // 1 tree (green alone) = 1 pt
      "0_0": {
        stack: [{ color: "green" }],
        terrain: TERRAIN_TYPES.TREE,
      },
      // 1 tree (1 brown + 1 green) = 3 pts
      "1_0": {
        stack: [{ color: "brown" }, { color: "green" }],
        terrain: TERRAIN_TYPES.TREE,
      },
      // 2 adjacent mountains (1 gray each) = 1 + 1 = 2 pts
      "2_0": {
        q: 2,
        r: 0,
        stack: [{ color: "gray" }],
        terrain: TERRAIN_TYPES.ROCK,
      },
      "3_0": {
        q: 3,
        r: 0,
        stack: [{ color: "gray" }],
        terrain: TERRAIN_TYPES.ROCK,
      },
      // 1 field (2 yellow) = 5 pts
      "0_1": {
        q: 0,
        r: 1,
        stack: [{ color: "yellow" }],
        terrain: TERRAIN_TYPES.FIELD,
      },
      "1_1": {
        q: 1,
        r: 1,
        stack: [{ color: "yellow" }],
        terrain: TERRAIN_TYPES.FIELD,
      },
      // 1 building with 3+ colors adjacent = 5 pts
      "2_1": {
        q: 2,
        r: 1,
        stack: [{ color: "red" }],
        terrain: TERRAIN_TYPES.BUILDING,
      },
      // River of 3 = 5 pts
      "0_2": {
        q: 0,
        r: 2,
        stack: [{ color: "blue" }],
        terrain: TERRAIN_TYPES.WATER,
      },
      "1_2": {
        q: 1,
        r: 2,
        stack: [{ color: "blue" }],
        terrain: TERRAIN_TYPES.WATER,
      },
      "2_2": {
        q: 2,
        r: 2,
        stack: [{ color: "blue" }],
        terrain: TERRAIN_TYPES.WATER,
      },
    },
    placedAnimals: [
      {
        cardId: "deer-01",
        hexCoords: [
          { q: 0, r: 0 },
          { q: 0, r: 1 },
        ],
      },
    ],
  };

  const animalCards = [
    {
      id: "deer-01",
      name: "Deer",
      pointsPerPlacement: [4, 9, 15, 22],
    },
  ];

  const result = calculateTotalScore(playerBoard, animalCards, "A");

  console.log("\n📊 Score Breakdown:");
  console.log(`   Trees: ${result.breakdown.trees} (expected 4: 1 + 3)`);
  console.log(`   Mountains: ${result.breakdown.mountains} (expected 2: 1 + 1)`);
  console.log(`   Fields: ${result.breakdown.fields} (expected 5)`);
  console.log(`   Buildings: ${result.breakdown.buildings} (expected 5)`);
  console.log(`   Water: ${result.breakdown.water} (expected 5)`);
  console.log(`   Animals: ${result.breakdown.animals} (expected 4)`);
  console.log(`   TOTAL: ${result.total} (expected 25)`);

  assertEqual(result.total, 25, "Full board scenario = 25 pts total");
})();

// ============================================================================
// SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(60));
console.log("✅ ALL TESTS PASSED! Harmonies v3.0 Scoring Engine Verified");
console.log("=".repeat(60));
console.log("✅ GRAY = Mountains (corrected)");
console.log("✅ RED = Buildings (corrected)");
console.log("✅ All 6 scoring formulas match official rules");
console.log("=".repeat(60) + "\n");
