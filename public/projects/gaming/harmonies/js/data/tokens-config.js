/**
 * Harmonies - Token Configuration (CORRECTED v3.0)
 *
 * CRITICAL CORRECTION: GRAY tokens = Mountains, RED tokens = Buildings
 * (NOT the other way around!)
 */

export const TOKEN_COLORS = {
  BLUE: "blue",     // Water
  YELLOW: "yellow", // Fields
  BROWN: "brown",   // Tree trunks
  GREEN: "green",   // Tree leaves
  GRAY: "gray",     // Mountains (CORRECTED!)
  RED: "red",       // Buildings (CORRECTED!)
};

export const COLOR_HEX = {
  blue: "#4A90E2",
  yellow: "#F5A623",
  brown: "#8B4513",
  green: "#7ED321",
  gray: "#9B9B9B",    // Mountains
  red: "#D0021B",     // Buildings
};

// CORRECTED STACKING RULES (from official rules)
export const STACKING_RULES = {
  blue: {
    canStackOn: [],
    maxHeight: 1,
    description: "Ground only - Cannot stack on anything",
  },
  yellow: {
    canStackOn: [],
    maxHeight: 1,
    description: "Ground only - Cannot stack on anything",
  },
  brown: {
    canStackOn: ["brown"],
    maxHeight: 2,
    description: "Tree trunks - Can only stack on other brown, max 2 brown",
  },
  green: {
    canStackOn: ["brown"],
    maxHeight: 3,
    description: "Tree leaves - Must be on 1-2 brown tokens",
  },
  gray: {
    canStackOn: ["gray"],
    maxHeight: null, // Unlimited
    description: "Mountains - Can stack infinitely on other gray tokens",
  },
  red: {
    canStackOn: ["gray", "brown", "red"],
    maxHeight: 2,
    description: "Buildings - Can be alone OR as 2nd token on gray/brown/red, never 3rd",
  },
};

// Initial pouch distribution (120 tokens total)
export const INITIAL_POUCH = {
  blue: 23,
  gray: 23,  // Mountains
  brown: 21,
  green: 19,
  yellow: 19,
  red: 15,   // Buildings
};

// Token display names
export const TOKEN_NAMES = {
  blue: "Water",
  yellow: "Field",
  brown: "Tree Trunk",
  green: "Tree Leaves",
  gray: "Mountain Stone",
  red: "Building Brick",
};

// Terrain types calculated from stacks
export const TERRAIN_TYPES = {
  EMPTY: "empty",
  WATER: "water",
  FIELD: "field",
  TRUNK: "trunk",       // Incomplete tree (brown only)
  TREE: "tree",         // Complete tree (brown + green)
  ROCK: "rock",         // Single gray (incomplete mountain)
  MOUNTAIN: "mountain", // 2+ gray tokens
  BUILDING: "building", // Red on foundation or alone
};
