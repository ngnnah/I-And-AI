/**
 * Harmonies - Animal Cards Data
 *
 * All 32 normal animal cards with complex habitat patterns
 * Based on official Harmonies board game rules
 */

/**
 * Animal card structure:
 * {
 *   id: string - Unique card ID
 *   name: string - Animal name (with common alternative in parentheses)
 *   primaryType: string - Card type (Water, Building, Trees, Grass, Forest, Rocks, Hills, Mountains, Plains)
 *   animal: string - Animal emoji/identifier
 *   pattern: Array<{q, r, terrain, isPlacementHex}> - Habitat pattern with relative coordinates
 *   scoring: Array<number> - Points progression for placements
 *   description: string - Pattern description for UI
 * }
 *
 * Coordinate system: Axial (q, r) with (0, 0) as reference point
 * - East: q+1, r
 * - West: q-1, r
 * - Southeast: q, r+1
 * - Northwest: q, r-1
 * - Northeast: q+1, r-1
 * - Southwest: q-1, r+1
 *
 * Terrain types: water, field, tree, mountain, building, green (tree tops only), rock (single grey), trunk (brown only)
 */

export const ANIMAL_CARDS = [
  // === WATER ANIMALS (7 cards) ===
  
  {
    id: "gator",
    name: "Gator (Crocodile)",
    primaryType: "Water",
    animal: "🐊",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue hex
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },    // Blue hex (60-degree cluster)
    ],
    scoring: [15, 9, 4],
    description: "60° cluster: 1 Tree + 2 Blue hexes",
    maxPlacements: 3,
  },

  {
    id: "ray",
    name: "Ray",
    primaryType: "Water",
    animal: "🦈",
    pattern: [
      { q: 0, r: 0, terrain: "rock", isPlacementHex: false },     // Grey
      { q: 1, r: 0, terrain: "water", isPlacementHex: true },     // Blue (placement)
      { q: 2, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 3, r: 0, terrain: "rock", isPlacementHex: false },     // Grey (linear)
    ],
    scoring: [15, 10, 6, 4, 2],
    description: "Linear: Grey, Blue, Blue, Grey",
    maxPlacements: 5,
  },

  {
    id: "fish",
    name: "Fish",
    primaryType: "Water",
    animal: "🐟",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", isPlacementHex: false }, // Mountain (Ht 2)
      { q: 1, r: 0, terrain: "water", isPlacementHex: true },     // Blue hex (placement)
    ],
    scoring: [15, 10, 6, 3],
    description: "Mountain adjacent to Blue hex",
    maxPlacements: 4,
  },

  {
    id: "otter",
    name: "Otter",
    primaryType: "Water",
    animal: "🦦",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },     // Central Blue (placement)
      { q: 1, r: 0, terrain: "green", isPlacementHex: false },    // Green hex
      { q: 0, r: 1, terrain: "green", isPlacementHex: false },    // Green hex (60° cluster)
    ],
    scoring: [16, 10, 5],
    description: "Central Blue + 2 Green hexes (60°)",
    maxPlacements: 3,
  },

  {
    id: "frog",
    name: "Frog",
    primaryType: "Water",
    animal: "🐸",
    pattern: [
      { q: 0, r: 0, terrain: "green", isPlacementHex: true },     // Green hex (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue hex
      { q: 0, r: 1, terrain: "building", isPlacementHex: false }, // Building (60° cluster)
    ],
    scoring: [12, 5],
    description: "60° cluster: Green, Blue, Building",
    maxPlacements: 2,
  },

  {
    id: "duck",
    name: "Duck",
    primaryType: "Water",
    animal: "🦆",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", isPlacementHex: false }, // Mountain (Ht 2)
      { q: 1, r: 0, terrain: "field", isPlacementHex: true },     // Yellow hex (placement)
    ],
    scoring: [13, 8, 4, 2],
    description: "Mountain adjacent to Yellow hex",
    maxPlacements: 4,
  },

  {
    id: "flamingo",
    name: "Flamingo",
    primaryType: "Water",
    animal: "🦩",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Central Building (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue hex
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },    // Blue hex (60° cluster)
    ],
    scoring: [16, 10, 5],
    description: "Central Building + 2 Blue hexes (60°)",
    maxPlacements: 3,
  },

  // === BUILDING ANIMALS (3 cards) ===

  {
    id: "gecko",
    name: "Gecko (Lizard)",
    primaryType: "Building",
    animal: "🦎",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue hex
    ],
    scoring: [13, 8, 4, 2],
    description: "Building adjacent to Blue hex",
    maxPlacements: 4,
  },

  {
    id: "mouse",
    name: "Mouse",
    primaryType: "Building",
    animal: "🐭",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 2, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 1, r: 1, terrain: "field", isPlacementHex: false },    // Yellow (60° cluster of 3)
    ],
    scoring: [17, 10, 5],
    description: "Building + 60° cluster of 3 Yellow hexes",
    maxPlacements: 3,
  },

  {
    id: "peacock",
    name: "Peacock",
    primaryType: "Building",
    animal: "🦚",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 2, r: 0, terrain: "field", isPlacementHex: false },    // Yellow (linear)
    ],
    scoring: [16, 10, 4],
    description: "Linear: Building, Yellow, Yellow",
    maxPlacements: 3,
  },

  // === TREES ANIMALS (3 cards) ===

  {
    id: "squirrel",
    name: "Squirrel",
    primaryType: "Building",
    animal: "🐿️",
    pattern: [
      { q: 0, r: 0, terrain: "green", isPlacementHex: true },     // Central Green (placement)
      { q: 1, r: 0, terrain: "rock", isPlacementHex: false },     // Grey
      { q: 0, r: 1, terrain: "rock", isPlacementHex: false },     // Grey (60° cluster)
    ],
    scoring: [15, 11, 5],
    description: "Central Green + 2 Grey hexes (60°)",
    maxPlacements: 3,
  },

  {
    id: "hedgehog",
    name: "Hedgehog",
    primaryType: "Building",
    animal: "🦔",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", isPlacementHex: true },  // Central Mountain (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow (E)
      { q: -1, r: 0, terrain: "field", isPlacementHex: false },   // Yellow (W, 180°)
    ],
    scoring: [12, 5],
    description: "Mountain + 2 Yellow hexes opposite (180°)",
    maxPlacements: 2,
  },

  {
    id: "bumblebee",
    name: "Bumblebee",
    primaryType: "Trees",
    animal: "🐝",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 2, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 1, r: 1, terrain: "field", isPlacementHex: false },    // Yellow (60° cluster of 3)
    ],
    scoring: [18, 8],
    description: "Tree + 60° cluster of 3 Yellow hexes",
    maxPlacements: 2,
  },

  // === GRASS ANIMALS (2 cards) ===

  {
    id: "bear",
    name: "Bear",
    primaryType: "Grass",
    animal: "🐻",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 2, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 1, r: 1, terrain: "water", isPlacementHex: false },    // Blue (60° cluster of 3)
    ],
    scoring: [12, 6],
    description: "Building + 60° cluster of 3 Blue hexes",
    maxPlacements: 2,
  },

  {
    id: "rabbit",
    name: "Rabbit",
    primaryType: "Grass",
    animal: "🐰",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: -1, terrain: "rock", isPlacementHex: false },    // Grey (NE)
      { q: 0, r: 1, terrain: "rock", isPlacementHex: false },     // Grey (SE, 120° V-shape)
    ],
    scoring: [16, 9, 4],
    description: "Central Yellow + 2 Grey (120° V)",
    maxPlacements: 3,
  },

  // === TREES/FOREST ANIMALS (4 cards) ===

  {
    id: "macaw",
    name: "Macaw (Parrot)",
    primaryType: "Trees",
    animal: "🦜",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue hex
    ],
    scoring: [13, 8, 4],
    description: "Tree adjacent to Blue hex",
    maxPlacements: 3,
  },

  {
    id: "boar",
    name: "Boar",
    primaryType: "Trees",
    animal: "🐗",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 1, r: 0, terrain: "building", isPlacementHex: false }, // Building
    ],
    scoring: [14, 9, 4],
    description: "Tree adjacent to Building",
    maxPlacements: 3,
  },

  {
    id: "koala",
    name: "Koala",
    primaryType: "Trees",
    animal: "🐨",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Central Tree (placement)
      { q: 1, r: 0, terrain: "green", isPlacementHex: false },    // Green
      { q: 0, r: 1, terrain: "green", isPlacementHex: false },    // Green (60° cluster)
    ],
    scoring: [15, 10, 6, 3],
    description: "Central Tree + 2 Green hexes (60°)",
    maxPlacements: 4,
  },

  {
    id: "wolf",
    name: "Wolf",
    primaryType: "Forest",
    animal: "🐺",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Central Tree (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow
      { q: 0, r: 1, terrain: "field", isPlacementHex: false },    // Yellow (60° cluster)
    ],
    scoring: [16, 10, 4],
    description: "Central Tree + 2 Yellow hexes (60°)",
    maxPlacements: 3,
  },

  {
    id: "kookaburra",
    name: "Kookaburra (Kingfisher)",
    primaryType: "Forest",
    animal: "🦅",
    pattern: [
      { q: 0, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 2, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 1, r: 1, terrain: "water", isPlacementHex: false },    // Blue (60° cluster of 3)
    ],
    scoring: [18, 11, 5],
    description: "Tree + 60° cluster of 3 Blue hexes",
    maxPlacements: 3,
  },

  // === ROCKS ANIMALS (3 cards) ===

  {
    id: "penguin",
    name: "Penguin",
    primaryType: "Rocks",
    animal: "🐧",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: false },    // Central Blue
      { q: 1, r: 0, terrain: "mountain", isPlacementHex: true },  // Mountain (placement)
      { q: 0, r: 1, terrain: "mountain", isPlacementHex: false }, // Mountain (60° cluster)
    ],
    scoring: [16, 10, 4],
    description: "Central Blue + 2 Mountains (60°)",
    maxPlacements: 3,
  },

  {
    id: "bat",
    name: "Bat",
    primaryType: "Rocks",
    animal: "🦇",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Central Building (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Blue
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },    // Blue (60° cluster)
    ],
    scoring: [17, 10, 5],
    description: "Central Building + 2 Blue hexes (60°)",
    maxPlacements: 3,
  },

  {
    id: "fennec",
    name: "Fennec Fox (Desert Fox)",
    primaryType: "Rocks",
    animal: "🦊",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Central Building (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Yellow (E)
      { q: -1, r: 0, terrain: "field", isPlacementHex: false },   // Yellow (W, 180°)
    ],
    scoring: [15, 9, 4],
    description: "Building + 2 Yellow hexes opposite (180°)",
    maxPlacements: 3,
  },

  // === HILLS/MOUNTAINS/PLAINS ANIMALS (10 cards) ===

  {
    id: "macaque",
    name: "Macaque (Baboon)",
    primaryType: "Hills",
    animal: "🐵",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: false },    // Central Yellow
      { q: 1, r: 0, terrain: "tree", isPlacementHex: true },      // Tree (placement)
      { q: 0, r: 1, terrain: "tree", isPlacementHex: false },     // Tree (60° cluster)
    ],
    scoring: [11, 5],
    description: "Central Yellow + 2 Trees (60°)",
    maxPlacements: 2,
  },

  {
    id: "eagle",
    name: "Eagle (Vulture)",
    primaryType: "Mountains",
    animal: "🦅",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", isPlacementHex: false }, // Mountain (Ht 3)
      { q: 1, r: 0, terrain: "field", isPlacementHex: true },     // Yellow (placement)
    ],
    scoring: [11, 5],
    description: "Mountain (Ht 3) adjacent to Yellow",
    maxPlacements: 2,
  },

  {
    id: "meerkat",
    name: "Meerkat",
    primaryType: "Plains",
    animal: "🦦",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: 0, terrain: "green", isPlacementHex: false },    // Green
      { q: 0, r: 1, terrain: "field", isPlacementHex: false },    // Yellow (60° cluster)
    ],
    scoring: [17, 12, 8, 5, 2],
    description: "Central Yellow + Green + Yellow (60°)",
    maxPlacements: 5,
  },

  {
    id: "raven",
    name: "Raven",
    primaryType: "Plains",
    animal: "🦅",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: 0, terrain: "building", isPlacementHex: false }, // Building
      { q: 0, r: 1, terrain: "building", isPlacementHex: false }, // Building (60° cluster)
    ],
    scoring: [9, 4],
    description: "Central Yellow + 2 Buildings (60°)",
    maxPlacements: 2,
  },

  {
    id: "llama",
    name: "Llama (Alpaca)",
    primaryType: "Plains",
    animal: "🦙",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Yellow (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Adjacent Yellow (2+ contiguous field)
    ],
    scoring: [5], // Fixed bonus for contiguous field of 2+
    description: "Contiguous Field of 2+ Yellow hexes",
    maxPlacements: 1,
  },

  {
    id: "arctic-fox",
    name: "Arctic Fox (Snow Fox)",
    primaryType: "Plains",
    animal: "🦊",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: 0, terrain: "tree", isPlacementHex: false },     // Tree
      { q: 0, r: 1, terrain: "tree", isPlacementHex: false },     // Tree (60° cluster)
    ],
    scoring: [17, 10, 5],
    description: "Central Yellow + 2 Trees (60°)",
    maxPlacements: 3,
  },

  {
    id: "raccoon",
    name: "Raccoon",
    primaryType: "Plains",
    animal: "🦝",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "tree", isPlacementHex: false },     // Tree
    ],
    scoring: [13, 8, 4],
    description: "Building adjacent to Tree",
    maxPlacements: 3,
  },

  {
    id: "ladybug",
    name: "Ladybug",
    primaryType: "Plains",
    animal: "🐞",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: 0, terrain: "mountain", isPlacementHex: false }, // Mountain
      { q: 0, r: 1, terrain: "mountain", isPlacementHex: false }, // Mountain (60° cluster)
    ],
    scoring: [17, 10, 4],
    description: "Central Yellow + 2 Mountains (60°)",
    maxPlacements: 3,
  },

  {
    id: "panther",
    name: "Panther",
    primaryType: "Plains",
    animal: "🐆",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },     // Central Yellow (placement)
      { q: 1, r: 0, terrain: "mountain", isPlacementHex: false }, // Mountain
      { q: 0, r: 1, terrain: "tree", isPlacementHex: false },     // Tree (60° cluster)
    ],
    scoring: [14, 9, 5, 2],
    description: "Central Yellow + Mountain + Tree (60°)",
    maxPlacements: 4,
  },
];

/**
 * Get all animal cards
 * @returns {Array} Array of animal card objects
 */
export function getAllAnimalCards() {
  return [...ANIMAL_CARDS];
}

/**
 * Get animal card by ID
 * @param {string} cardId - Card ID
 * @returns {Object|null} Animal card or null
 */
export function getAnimalCardById(cardId) {
  return ANIMAL_CARDS.find((card) => card.id === cardId) || null;
}

/**
 * Shuffle animal cards for game setup
 * @returns {Array} Shuffled array of animal cards
 */
export function shuffleAnimalCards() {
  const cards = [...ANIMAL_CARDS];

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

/**
 * Get starting animal cards for a new game
 * @param {number} count - Number of cards to draw (default 3 for available cards)
 * @returns {Object} { available: Array, deck: Array }
 */
export function getStartingAnimalCards(count = 3) {
  const shuffled = shuffleAnimalCards();

  return {
    available: shuffled.slice(0, count),
    deck: shuffled.slice(count),
  };
}

/**
 * Get animal cards by primary type
 * @param {string} type - Primary type (Water, Building, Trees, etc.)
 * @returns {Array} Array of matching animal cards
 */
export function getAnimalCardsByType(type) {
  return ANIMAL_CARDS.filter((card) => card.primaryType === type);
}

/**
 * Get animal emoji by card ID
 * @param {string} cardId - Card ID
 * @returns {string} Animal emoji or default
 */
export function getAnimalEmoji(cardId) {
  const card = getAnimalCardById(cardId);
  return card ? card.animal : "🐾";
}
