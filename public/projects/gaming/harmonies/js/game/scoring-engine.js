/**
 * Harmonies - Scoring Engine (CORRECTED v3.0)
 *
 * All scoring formulas match official Libellud rules exactly.
 * CRITICAL: Mountains are GRAY tokens, Buildings are RED tokens!
 */

import { TERRAIN_TYPES } from "../data/tokens-config.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert hex key "q_r" to coordinates {q, r}
 */
function keyToCoord(key) {
  const [q, r] = key.split("_").map(Number);
  return { q, r };
}

/**
 * Convert coordinates to key "q_r"
 */
function coordToKey(q, r) {
  return `${q}_${r}`;
}

/**
 * Get 6 neighboring hex coordinates (flat-topped hexes, axial coordinates)
 */
function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },     // East
    { q: q - 1, r: r },     // West
    { q: q, r: r + 1 },     // Southeast
    { q: q, r: r - 1 },     // Northwest
    { q: q + 1, r: r - 1 }, // Northeast
    { q: q - 1, r: r + 1 }, // Southwest
  ];
}

/**
 * Flood fill to count connected terrain of same type
 * @param {Object} hexGrid - Grid of hexes
 * @param {string} startKey - Starting hex key
 * @param {string} terrain - Terrain type to match
 * @param {Set} visited - Set of visited hex keys
 * @returns {number} Number of connected hexes
 */
function floodFill(hexGrid, startKey, terrain, visited) {
  const stack = [startKey];
  let count = 0;

  while (stack.length > 0) {
    const key = stack.pop();

    // Skip if already visited or doesn't exist
    if (visited.has(key)) continue;
    if (!hexGrid[key]) continue;
    if (hexGrid[key].terrain !== terrain) continue;

    // Mark as visited and count
    visited.add(key);
    count++;

    // Add neighbors to stack
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);

    for (const n of neighbors) {
      const nKey = coordToKey(n.q, n.r);
      if (!visited.has(nKey)) {
        stack.push(nKey);
      }
    }
  }

  return count;
}

// ============================================================================
// SCORING MODULES (CORRECTED)
// ============================================================================

/**
 * 1. TREES SCORING (CORRECTED)
 * - Green alone = 1 pt
 * - 1 brown + 1 green = 3 pts
 * - 2 brown + 1 green = 5 pts
 * - Brown alone (trunk) = 0 pts
 */
export function scoreTreesModule(hexGrid) {
  let score = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain !== TERRAIN_TYPES.TREE) continue;

    const stack = hex.stack || [];
    const greenCount = stack.filter((t) => t.color === "green").length;
    const brownCount = stack.filter((t) => t.color === "brown").length;

    // Scoring based on composition
    if (greenCount === 1 && brownCount === 0) score += 1; // Green alone
    else if (greenCount === 1 && brownCount === 1) score += 3; // 1 brown + 1 green
    else if (greenCount === 1 && brownCount === 2) score += 5; // 2 brown + 1 green
  }

  return score;
}

/**
 * 2. MOUNTAINS SCORING (CORRECTED - GRAY tokens!)
 * - 1 gray = 1 pt (if adjacent to another mountain)
 * - 2 gray = 3 pts (if adjacent)
 * - 3+ gray = 7 pts (if adjacent)
 * - Isolated = 0 pts
 */
export function scoreMountainsModule(hexGrid) {
  let score = 0;
  const mountainKeys = Object.keys(hexGrid).filter(
    (k) => hexGrid[k].terrain === TERRAIN_TYPES.MOUNTAIN || hexGrid[k].terrain === TERRAIN_TYPES.ROCK
  );

  for (const key of mountainKeys) {
    const hex = hexGrid[key];
    const stack = hex.stack || [];
    const grayCount = stack.filter((t) => t.color === "gray").length;

    // Check if adjacent to another mountain/rock
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);
    const hasAdjacentMountain = neighbors.some((n) => {
      const nKey = coordToKey(n.q, n.r);
      const nHex = hexGrid[nKey];
      return nHex && (nHex.terrain === TERRAIN_TYPES.MOUNTAIN || nHex.terrain === TERRAIN_TYPES.ROCK);
    });

    // Isolated mountains score 0
    if (!hasAdjacentMountain) continue;

    // Score by height (using gray token count)
    if (grayCount === 1) score += 1;
    else if (grayCount === 2) score += 3;
    else if (grayCount >= 3) score += 7;
  }

  return score;
}

/**
 * 3. FIELDS SCORING (CORRECTED)
 * - 5 points per separate field of 2+ connected yellow tokens
 * - Single isolated yellow = 0 pts
 */
export function scoreFieldsModule(hexGrid) {
  const visited = new Set();
  let score = 0;

  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    if (hexGrid[key].terrain !== TERRAIN_TYPES.FIELD) continue;

    // Count connected field size
    const fieldSize = floodFill(hexGrid, key, TERRAIN_TYPES.FIELD, visited);

    // Only fields of 2+ tokens score 5 points
    if (fieldSize >= 2) {
      score += 5;
    }
  }

  return score;
}

/**
 * 4. BUILDINGS SCORING (CORRECTED)
 * - 5 points if surrounded by 3+ different colors
 * - 0 points otherwise (binary scoring)
 * - Only count top token color of adjacent stacks
 */
export function scoreBuildingsModule(hexGrid) {
  let score = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain !== TERRAIN_TYPES.BUILDING) continue;

    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);

    // Get unique top token colors from adjacent hexes
    const adjacentColors = new Set();
    for (const n of neighbors) {
      const nKey = coordToKey(n.q, n.r);
      const nHex = hexGrid[nKey];

      if (nHex && nHex.stack && nHex.stack.length > 0) {
        const topColor = nHex.stack[nHex.stack.length - 1].color;
        adjacentColors.add(topColor);
      }
    }

    // Binary scoring: 5pts if 3+ different colors, else 0
    if (adjacentColors.size >= 3) {
      score += 5;
    }
  }

  return score;
}

/**
 * 5. WATER SCORING (CORRECTED)
 * Side A: Only longest river scores (progressive formula)
 * Side B: 5 points per island (not implemented yet)
 */
export function scoreWaterModule(hexGrid, boardSide = "A") {
  if (boardSide === "B") {
    return scoreWaterIslands(hexGrid);
  }

  // Side A: Longest river only
  const visited = new Set();
  let maxRiverLength = 0;

  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    if (hexGrid[key].terrain !== TERRAIN_TYPES.WATER) continue;

    const riverLength = floodFill(hexGrid, key, TERRAIN_TYPES.WATER, visited);
    maxRiverLength = Math.max(maxRiverLength, riverLength);
  }

  // Progressive scoring (from official rules table)
  if (maxRiverLength === 0 || maxRiverLength === 1) return 0;
  if (maxRiverLength === 2) return 2;
  if (maxRiverLength === 3) return 5;
  if (maxRiverLength === 4) return 8;
  if (maxRiverLength === 5) return 11;
  if (maxRiverLength === 6) return 15;
  if (maxRiverLength >= 7) return 15 + (maxRiverLength - 6) * 4;

  return 0;
}

/**
 * Side B: Islands scoring (land areas separated by water)
 * @param {Object} hexGrid - Grid of hexes
 * @returns {number} Score (5 points per island)
 */
function scoreWaterIslands(hexGrid) {
  const visited = new Set();
  let islandCount = 0;

  // Count all land areas (non-water hexes)
  for (const key in hexGrid) {
    if (visited.has(key)) continue;
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.WATER) continue;

    // Found a new island - flood fill to mark all connected land
    const stack = [key];
    while (stack.length > 0) {
      const currentKey = stack.pop();
      if (visited.has(currentKey)) continue;

      const currentHex = hexGrid[currentKey];
      if (!currentHex || currentHex.terrain === TERRAIN_TYPES.WATER) continue;

      visited.add(currentKey);

      // Add land neighbors
      const { q, r } = keyToCoord(currentKey);
      const neighbors = getNeighbors(q, r);
      for (const n of neighbors) {
        const nKey = coordToKey(n.q, n.r);
        if (!visited.has(nKey)) {
          stack.push(nKey);
        }
      }
    }

    islandCount++;
  }

  return islandCount * 5;
}

/**
 * 6. ANIMALS SCORING
 * Score topmost uncovered number on each completed Animal card
 * @param {Array} placedAnimals - Array of placed animal cubes
 * @param {Array} animalCards - Array of available animal cards
 * @returns {number} Total animal score
 */
export function scoreAnimalsModule(placedAnimals, animalCards) {
  let score = 0;

  // Group placed animals by card ID
  const animalsByCard = {};
  for (const placement of placedAnimals) {
    const cardId = placement.cardId;
    if (!animalsByCard[cardId]) {
      animalsByCard[cardId] = [];
    }
    animalsByCard[cardId].push(placement);
  }

  // Calculate score for each card
  for (const cardId in animalsByCard) {
    const card = animalCards.find((c) => c.id === cardId);
    if (!card) continue;

    const placementCount = animalsByCard[cardId].length;
    const pointsArray = card.pointsPerPlacement || [0];

    // Score is the value at the placement index
    if (placementCount > 0 && placementCount <= pointsArray.length) {
      score += pointsArray[placementCount - 1];
    }
  }

  return score;
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate total score with breakdown by category
 * @param {Object} playerBoard - Player's board with hexGrid and placedAnimals
 * @param {Array} animalCards - Available animal cards
 * @param {string} boardSide - "A" or "B" for water scoring variant
 * @returns {Object} {breakdown: {...}, total: number}
 */
export function calculateTotalScore(playerBoard, animalCards = [], boardSide = "A") {
  const hexGrid = playerBoard.hexGrid || {};
  const placedAnimals = playerBoard.placedAnimals || [];

  const breakdown = {
    trees: scoreTreesModule(hexGrid),
    mountains: scoreMountainsModule(hexGrid),
    fields: scoreFieldsModule(hexGrid),
    buildings: scoreBuildingsModule(hexGrid),
    water: scoreWaterModule(hexGrid, boardSide),
    animals: scoreAnimalsModule(placedAnimals, animalCards),
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { breakdown, total };
}
