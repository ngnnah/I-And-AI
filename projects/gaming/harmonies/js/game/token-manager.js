// Token placement and stacking rules

import { TOKEN_COLORS, TERRAIN_TYPES, STACKING_RULES } from '../data/tokens-config.js';

// Validate if a token can be placed on a hex
export function canPlaceToken(hex, newTokenColor) {
  const stack = hex?.stack || [];

  // Rule 1: Max 3 tokens high
  if (stack.length >= STACKING_RULES.MAX_HEIGHT) {
    return { valid: false, reason: 'Stack full (max 3 tokens)' };
  }

  // Rule 2: If empty hex, any token can be placed
  if (stack.length === 0) {
    return { valid: true };
  }

  // Rule 3: Check stacking rules
  const topToken = stack[stack.length - 1];
  const allowedColors = STACKING_RULES.canStackOn[newTokenColor];

  if (allowedColors.length === 0) {
    return { valid: false, reason: `${newTokenColor} tokens can't be stacked` };
  }

  // Check if we can stack on the top token
  if (!allowedColors.includes(topToken.color)) {
    return { valid: false, reason: `${newTokenColor} can only stack on ${allowedColors.join(' or ')}` };
  }

  // Additional check for green (trees): max 2 brown underneath
  if (newTokenColor === TOKEN_COLORS.GREEN && stack.length > 2) {
    return { valid: false, reason: 'Trees can only be placed on 1-2 brown tokens' };
  }

  return { valid: true };
}

// Calculate terrain type based on token stack
export function calculateTerrain(stack) {
  if (!stack || stack.length === 0) return TERRAIN_TYPES.EMPTY;

  const colors = stack.map(t => t.color);
  const topColor = colors[colors.length - 1];

  // Trees: green on top of brown(s)
  if (topColor === TOKEN_COLORS.GREEN) {
    const allBrownBelow = colors.slice(0, -1).every(c => c === TOKEN_COLORS.BROWN);
    if (allBrownBelow) {
      return TERRAIN_TYPES.TREE;
    }
  }

  // Mountains: 2-3 gray tokens
  if (colors.every(c => c === TOKEN_COLORS.GRAY) && colors.length >= 2) {
    return TERRAIN_TYPES.MOUNTAIN;
  }

  // Single tokens
  if (stack.length === 1) {
    const terrainMap = {
      [TOKEN_COLORS.YELLOW]: TERRAIN_TYPES.FIELD,
      [TOKEN_COLORS.BLUE]: TERRAIN_TYPES.WATER,
      [TOKEN_COLORS.RED]: TERRAIN_TYPES.BUILDING,
      [TOKEN_COLORS.BROWN]: TERRAIN_TYPES.TRUNK,
      [TOKEN_COLORS.GRAY]: TERRAIN_TYPES.ROCK
    };
    return terrainMap[topColor] || TERRAIN_TYPES.EMPTY;
  }

  // Mixed/invalid combinations
  return TERRAIN_TYPES.EMPTY;
}

// Add token to hex and return updated hex
export function addTokenToHex(hex, tokenColor) {
  const newStack = [...(hex?.stack || []), { color: tokenColor, tokenId: generateTokenId() }];
  const terrain = calculateTerrain(newStack);

  return {
    stack: newStack,
    terrain
  };
}

// Generate unique token ID
function generateTokenId() {
  return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get empty space count (hexes with < 3 tokens or expansion potential)
export function getEmptySpaceCount(hexGrid) {
  let emptyCount = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (!hex.stack || hex.stack.length < STACKING_RULES.MAX_HEIGHT) {
      emptyCount++;
    }
  }

  return emptyCount;
}

// Check if game end condition is met (≤2 empty spaces)
export function isGameEndCondition(hexGrid) {
  return getEmptySpaceCount(hexGrid) <= 2;
}
