/**
 * Harmonies - Token Manager (CORRECTED v3.0)
 *
 * CRITICAL: GRAY tokens = Mountains, RED tokens = Buildings
 */

import { STACKING_RULES, TERRAIN_TYPES } from "../data/tokens-config.js";
import { getNeighbors, coordToKey } from "./hex-grid.js";

/**
 * Check if a hex has an Animal cube (blocks further stacking)
 * @param {Object} hex - Hex object with q, r coordinates
 * @param {Array} placedAnimals - Array of placed animal cubes
 * @returns {boolean}
 */
export function hasAnimalCube(hex, placedAnimals) {
  if (!hex || !placedAnimals) return false;

  const hexKey = `${hex.q}_${hex.r}`;
  return placedAnimals.some((animal) =>
    animal.hexCoords?.some((coord) => `${coord.q}_${coord.r}` === hexKey)
  );
}

/**
 * Calculate terrain type from token stack (CORRECTED LOGIC)
 * @param {Array} stack - Array of token objects with 'color' property
 * @returns {string} Terrain type
 */
export function calculateTerrain(stack) {
  if (!stack || stack.length === 0) return TERRAIN_TYPES.EMPTY;

  const colors = stack.map((t) => t.color);
  const topColor = colors[colors.length - 1];
  const stackHeight = colors.length;

  // Mountains: GRAY tokens stacked (CORRECTED!)
  if (colors.every((c) => c === "gray")) {
    if (stackHeight >= 2) return TERRAIN_TYPES.MOUNTAIN;
    return TERRAIN_TYPES.ROCK; // Single gray = incomplete mountain
  }

  // Buildings: RED on top of gray/brown/red (CORRECTED!)
  if (topColor === "red") {
    // Red alone on ground is a valid building
    if (stackHeight === 1) return TERRAIN_TYPES.BUILDING;

    // Red as 2nd token on valid foundation
    if (stackHeight === 2) {
      const baseColor = colors[0];
      if (["gray", "brown", "red"].includes(baseColor)) {
        return TERRAIN_TYPES.BUILDING;
      }
    }
  }

  // Trees: Green on brown(s)
  if (topColor === "green") {
    const brownsBelow = colors.slice(0, -1);

    // Green alone on ground is a valid tree (1 point)
    if (brownsBelow.length === 0) return TERRAIN_TYPES.TREE;

    // Green on 1 or 2 brown tokens
    if (brownsBelow.every((c) => c === "brown") && brownsBelow.length <= 2) {
      return TERRAIN_TYPES.TREE;
    }

    // Invalid: Green on something other than brown
    return TERRAIN_TYPES.EMPTY;
  }

  // Ground-level single tokens
  if (stackHeight === 1) {
    if (topColor === "blue") return TERRAIN_TYPES.WATER;
    if (topColor === "yellow") return TERRAIN_TYPES.FIELD;
  }

  // Incomplete stacks
  if (colors.every((c) => c === "brown") && stackHeight <= 2) {
    return TERRAIN_TYPES.TRUNK; // Brown-only stacks (incomplete trees)
  }

  // Invalid or incomplete stacks
  return TERRAIN_TYPES.EMPTY;
}

/**
 * Validate if a token can be placed on a hex
 * @param {Object} hex - Hex object with stack array
 * @param {string} newColor - Color of token to place
 * @param {Array} placedAnimals - Array of placed animal cubes
 * @returns {Object} {valid: boolean, reason: string}
 */
export function canPlaceToken(hex, newColor, placedAnimals = []) {
  // Check if hex has an Animal cube
  if (hasAnimalCube(hex, placedAnimals)) {
    return {
      valid: false,
      reason: "Cannot place tokens on hexes with Animal cubes",
    };
  }

  const stack = hex?.stack || [];
  const rules = STACKING_RULES[newColor];

  if (!rules) {
    return {
      valid: false,
      reason: `Unknown token color: ${newColor}`,
    };
  }

  // Check max height
  if (rules.maxHeight !== null && stack.length >= rules.maxHeight) {
    return {
      valid: false,
      reason: `Max height ${rules.maxHeight} reached for ${newColor} tokens`,
    };
  }

  // Empty hex - any token can be placed
  if (stack.length === 0) {
    return { valid: true };
  }

  // Check if can stack on top token
  const topColor = stack[stack.length - 1].color;
  if (!rules.canStackOn.includes(topColor)) {
    return {
      valid: false,
      reason: `${newColor} cannot stack on ${topColor}`,
    };
  }

  return { valid: true };
}

/**
 * Get all valid hexes for placing a token
 * @param {Object} hexGrid - Grid of hexes
 * @param {string} tokenColor - Color of token to place
 * @param {Array} placedAnimals - Array of placed animal cubes
 * @returns {Array} Array of valid hex keys
 */
export function getValidPlacementHexes(hexGrid, tokenColor, placedAnimals = []) {
  const validHexes = [];

  // Check existing hexes
  for (const hexKey in hexGrid) {
    const hex = hexGrid[hexKey];
    const validation = canPlaceToken(hex, tokenColor, placedAnimals);
    if (validation.valid) {
      validHexes.push(hexKey);
    }
  }

  // FIXED: Also check expansion hexes (empty neighbors)
  const expansionHexes = new Set();
  for (const hexKey in hexGrid) {
    const [q, r] = hexKey.split("_").map(Number);
    const neighbors = getNeighbors(q, r);

    neighbors.forEach((n) => {
      const nKey = coordToKey(n.q, n.r);
      if (!hexGrid[nKey] && !expansionHexes.has(nKey)) {
        // Empty neighbor - check if token can be placed on empty hex
        const emptyHex = { q: n.q, r: n.r, stack: [], terrain: "empty" };
        const validation = canPlaceToken(emptyHex, tokenColor, placedAnimals);
        if (validation.valid) {
          validHexes.push(nKey);
          expansionHexes.add(nKey);
        }
      }
    });
  }

  return validHexes;
}

/**
 * Place a token on a hex and recalculate terrain
 * @param {Object} hex - Hex object
 * @param {Object} token - Token object with color property
 * @returns {Object} Updated hex object
 */
export function placeTokenOnHex(hex, token) {
  const updatedHex = {
    ...hex,
    stack: [...(hex.stack || []), token],
  };

  // Recalculate terrain
  updatedHex.terrain = calculateTerrain(updatedHex.stack);

  return updatedHex;
}

/**
 * Create a token object
 * @param {string} color - Token color
 * @param {string} id - Unique token ID
 * @returns {Object} Token object
 */
export function createToken(color, id = null) {
  return {
    color,
    id: id || `${color}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    placedAt: Date.now(),
  };
}
