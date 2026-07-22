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
  // === WATER ANIMALS — cube sits on WATER (7 cards) ===

  {
    id: "gator",
    name: "Gator (Crocodile)",
    primaryType: "Water",
    animal: "🐊",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: false },        // Water (center)
      { q: 1, r: 0, terrain: "water", isPlacementHex: true },         // Water (placement)
      { q: -1, r: 0, terrain: "tree", height: 3, isPlacementHex: false }, // Tall Tree (Ht 3)
    ],
    scoring: [15, 9, 4],
    description: "Line: Tall Tree (Ht 3) — Water — Water (animal on the far Water)",
    maxPlacements: 3,
  },

  {
    id: "ray",
    name: "Ray",
    primaryType: "Water",
    animal: "🦈",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },     // Water (placement)
      { q: 1, r: 0, terrain: "rock", isPlacementHex: false },     // Rock (single grey, Ht 1)
      { q: 0, r: 1, terrain: "rock", isPlacementHex: false },     // Rock (60° cluster)
    ],
    scoring: [16, 10, 4],
    description: "Water + 2 Rocks (Ht 1) in a 60° cluster",
    maxPlacements: 3,
  },

  {
    id: "fish",
    name: "Fish",
    primaryType: "Water",
    animal: "🐟",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },                 // Water (placement)
      { q: 1, r: 0, terrain: "mountain", height: 3, isPlacementHex: false },  // Mountain (Ht 3)
    ],
    scoring: [16, 10, 6, 3],
    description: "Water adjacent to a Mountain (Ht 3)",
    maxPlacements: 4,
  },

  {
    id: "otter",
    name: "Otter",
    primaryType: "Water",
    animal: "🦦",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 1, isPlacementHex: false },  // Tree (Ht 1, center)
      { q: -1, r: 0, terrain: "tree", height: 1, isPlacementHex: false }, // Tree (Ht 1)
      { q: 1, r: 0, terrain: "water", isPlacementHex: true },             // Water (placement)
    ],
    scoring: [16, 10, 5],
    description: "Line: Tree (Ht 1) — Tree (Ht 1) — Water (animal on the Water)",
    maxPlacements: 3,
  },

  {
    id: "frog",
    name: "Frog",
    primaryType: "Water",
    animal: "🐸",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },             // Water (placement)
      { q: 1, r: 0, terrain: "tree", height: 1, isPlacementHex: false },  // Tree (Ht 1)
    ],
    scoring: [15, 10, 6, 4, 2],
    description: "Water adjacent to a Tree (Ht 1)",
    maxPlacements: 5,
  },

  {
    id: "duck",
    name: "Duck",
    primaryType: "Water",
    animal: "🦆",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },      // Water (placement)
      { q: 1, r: 0, terrain: "building", isPlacementHex: false },  // Building
    ],
    scoring: [13, 8, 4, 2],
    description: "Water adjacent to a Building",
    maxPlacements: 4,
  },

  {
    id: "flamingo",
    name: "Flamingo",
    primaryType: "Water",
    animal: "🦩",
    pattern: [
      { q: 0, r: 0, terrain: "water", isPlacementHex: true },   // Water (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },  // Field
      { q: 0, r: 1, terrain: "field", isPlacementHex: false },  // Field (60° cluster)
    ],
    scoring: [16, 10, 4],
    description: "Water + 2 Fields in a 60° cluster",
    maxPlacements: 3,
  },

  // === BUILDING ANIMALS — cube sits on a BUILDING (5 cards) ===

  {
    id: "hedgehog",
    name: "Hedgehog",
    primaryType: "Building",
    animal: "🦔",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },          // Building (placement)
      { q: 1, r: 0, terrain: "tree", height: 2, isPlacementHex: false },  // Tree (Ht 2)
      { q: 0, r: 1, terrain: "tree", height: 2, isPlacementHex: false },  // Tree (Ht 2, 60° cluster)
    ],
    scoring: [12, 5],
    description: "Building + 2 Trees (Ht 2) in a 60° cluster",
    maxPlacements: 2,
  },

  {
    id: "squirrel",
    name: "Squirrel",
    primaryType: "Building",
    animal: "🐿️",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },          // Building (placement)
      { q: 1, r: 0, terrain: "tree", height: 3, isPlacementHex: false },  // Tall Tree (Ht 3)
    ],
    scoring: [15, 9, 4],
    description: "Building adjacent to a Tall Tree (Ht 3)",
    maxPlacements: 3,
  },

  {
    id: "gecko",
    name: "Gecko (Lizard)",
    primaryType: "Building",
    animal: "🦎",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: false },     // Field (center)
      { q: -1, r: 0, terrain: "field", isPlacementHex: false },    // Field
      { q: 1, r: 0, terrain: "building", isPlacementHex: true },   // Building (placement)
    ],
    scoring: [16, 10, 5],
    description: "Line: Field — Field — Building (animal on the Building)",
    maxPlacements: 3,
  },

  {
    id: "mouse",
    name: "Mouse",
    primaryType: "Building",
    animal: "🐭",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },    // Field
      { q: 0, r: -1, terrain: "field", isPlacementHex: false },   // Field (120° V-shape)
    ],
    scoring: [17, 10, 5],
    description: "Building + 2 Fields in a 120° V",
    maxPlacements: 3,
  },

  {
    id: "peacock",
    name: "Peacock",
    primaryType: "Building",
    animal: "🦚",
    pattern: [
      { q: 0, r: 0, terrain: "building", isPlacementHex: true },  // Building (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },    // Water
      { q: 0, r: -1, terrain: "water", isPlacementHex: false },   // Water (120° V-shape)
    ],
    scoring: [17, 10, 5],
    description: "Building + 2 Water in a 120° V",
    maxPlacements: 3,
  },

  // === TREE ANIMALS — cube sits on a TREE (8 cards) ===

  {
    id: "bumblebee",
    name: "Bumblebee",
    primaryType: "Tree",
    animal: "🐝",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 2, isPlacementHex: true },  // Tree (Ht 2, placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },           // Field
      { q: 0, r: 1, terrain: "field", isPlacementHex: false },           // Field
      { q: -1, r: 1, terrain: "field", isPlacementHex: false },          // Field (arc of 3)
    ],
    scoring: [18, 8],
    description: "Tree (Ht 2) + arc of 3 Fields",
    maxPlacements: 2,
  },

  {
    id: "bear",
    name: "Bear",
    primaryType: "Tree",
    animal: "🐻",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 1, isPlacementHex: true },  // Tree (Ht 1, placement)
      { q: 1, r: 0, terrain: "rock", isPlacementHex: false },            // Rock (Ht 1)
      { q: 0, r: 1, terrain: "rock", isPlacementHex: false },            // Rock (60° cluster)
    ],
    scoring: [11, 5],
    description: "Tree (Ht 1) + 2 Rocks (Ht 1) in a 60° cluster",
    maxPlacements: 2,
  },

  {
    id: "macaw",
    name: "Macaw (Parrot)",
    primaryType: "Tree",
    animal: "🦜",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 2, isPlacementHex: true },  // Tree (Ht 2, placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },           // Water
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },           // Water (60° cluster)
    ],
    scoring: [14, 9, 4],
    description: "Tree (Ht 2) + 2 Water in a 60° cluster",
    maxPlacements: 3,
  },

  {
    id: "boar",
    name: "Boar",
    primaryType: "Tree",
    animal: "🐗",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 2, isPlacementHex: true },  // Tree (Ht 2, placement)
      { q: 1, r: 0, terrain: "building", isPlacementHex: false },        // Building
    ],
    scoring: [13, 8, 4],
    description: "Tree (Ht 2) adjacent to a Building",
    maxPlacements: 3,
  },

  {
    id: "koala",
    name: "Koala",
    primaryType: "Tree",
    animal: "🐨",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 2, isPlacementHex: true },   // Tree (Ht 2, placement)
      { q: 1, r: 0, terrain: "tree", height: 1, isPlacementHex: false },  // Tree (Ht 1)
    ],
    scoring: [15, 10, 6, 3],
    description: "Tree (Ht 2) adjacent to a Tree (Ht 1)",
    maxPlacements: 4,
  },

  {
    id: "wolf",
    name: "Wolf",
    primaryType: "Tree",
    animal: "🐺",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 3, isPlacementHex: true },  // Tall Tree (Ht 3, placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },           // Field (E)
      { q: -1, r: 0, terrain: "field", isPlacementHex: false },          // Field (W, 180°)
    ],
    scoring: [16, 10, 4],
    description: "Tall Tree (Ht 3) + 2 Fields opposite (180°)",
    maxPlacements: 3,
  },

  {
    id: "rabbit",
    name: "Rabbit",
    primaryType: "Tree",
    animal: "🐰",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 1, isPlacementHex: false },  // Tree (Ht 1, center)
      { q: 1, r: 0, terrain: "tree", height: 1, isPlacementHex: true },   // Tree (Ht 1, placement)
      { q: -1, r: 0, terrain: "building", isPlacementHex: false },        // Building
    ],
    scoring: [17, 10, 5],
    description: "Line: Building — Tree (Ht 1) — Tree (Ht 1) (animal on the far Tree)",
    maxPlacements: 3,
  },

  {
    id: "kookaburra",
    name: "Kookaburra (Kingfisher)",
    primaryType: "Tree",
    animal: "🐦",
    pattern: [
      { q: 0, r: 0, terrain: "tree", height: 3, isPlacementHex: true },  // Tall Tree (Ht 3, placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },           // Water
      { q: 0, r: -1, terrain: "water", isPlacementHex: false },          // Water (120° V-shape)
    ],
    scoring: [18, 11, 5],
    description: "Tall Tree (Ht 3) + 2 Water in a 120° V",
    maxPlacements: 3,
  },

  // === FIELD ANIMALS — cube sits on a FIELD (6 cards) ===

  {
    id: "raven",
    name: "Raven",
    primaryType: "Field",
    animal: "🐦‍⬛",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },      // Field (placement)
      { q: 1, r: 0, terrain: "building", isPlacementHex: false },  // Building
      { q: 0, r: -1, terrain: "building", isPlacementHex: false }, // Building (120° V-shape)
    ],
    scoring: [9, 4],
    description: "Field + 2 Buildings in a 120° V",
    maxPlacements: 2,
  },

  {
    id: "llama",
    name: "Llama (Alpaca)",
    primaryType: "Field",
    animal: "🦙",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: false },               // Field (center)
      { q: 1, r: 0, terrain: "field", isPlacementHex: true },                // Field (placement)
      { q: -1, r: 0, terrain: "mountain", height: 2, isPlacementHex: false },// Mountain (Ht 2)
    ],
    scoring: [12, 5],
    description: "Line: Mountain (Ht 2) — Field — Field (animal on the far Field)",
    maxPlacements: 2,
  },

  {
    id: "arctic-fox",
    name: "Arctic Fox (Snow Fox)",
    primaryType: "Field",
    animal: "🦊",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },             // Field (placement)
      { q: 1, r: 0, terrain: "tree", height: 2, isPlacementHex: false },  // Tree (Ht 2)
      { q: 0, r: -1, terrain: "tree", height: 2, isPlacementHex: false }, // Tree (Ht 2, 120° V-shape)
    ],
    scoring: [17, 10, 5],
    description: "Field + 2 Trees (Ht 2) in a 120° V",
    maxPlacements: 3,
  },

  {
    id: "raccoon",
    name: "Raccoon",
    primaryType: "Field",
    animal: "🦝",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },   // Field (placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },  // Water
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },  // Water
      { q: -1, r: 1, terrain: "water", isPlacementHex: false }, // Water (arc of 3)
    ],
    scoring: [12, 6],
    description: "Field + arc of 3 Water",
    maxPlacements: 2,
  },

  {
    id: "ladybug",
    name: "Ladybug",
    primaryType: "Field",
    animal: "🐞",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },             // Field (placement)
      { q: 1, r: 0, terrain: "tree", height: 1, isPlacementHex: false },  // Tree (Ht 1)
    ],
    scoring: [17, 12, 8, 5, 2],
    description: "Field adjacent to a Tree (Ht 1)",
    maxPlacements: 5,
  },

  {
    id: "panther",
    name: "Panther",
    primaryType: "Field",
    animal: "🐆",
    pattern: [
      { q: 0, r: 0, terrain: "field", isPlacementHex: true },            // Field (placement)
      { q: 1, r: 0, terrain: "tree", height: 2, isPlacementHex: false }, // Tree (Ht 2)
      { q: 0, r: 1, terrain: "tree", height: 2, isPlacementHex: false }, // Tree (Ht 2, 60° cluster)
    ],
    scoring: [11, 5],
    description: "Field flanked by 2 Trees (Ht 2) in a 60° cluster",
    maxPlacements: 2,
  },

  // === MOUNTAIN ANIMALS — cube sits on a MOUNTAIN/ROCK (6 cards) ===

  {
    id: "penguin",
    name: "Penguin",
    primaryType: "Mountain",
    animal: "🐧",
    pattern: [
      { q: 0, r: 0, terrain: "rock", isPlacementHex: true },     // Rock (Ht 1, placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },   // Water
      { q: 0, r: -1, terrain: "water", isPlacementHex: false },  // Water (120° V-shape)
    ],
    scoring: [16, 10, 4],
    description: "Rock (Ht 1) + 2 Water in a 120° V",
    maxPlacements: 3,
  },

  {
    id: "bat",
    name: "Bat",
    primaryType: "Mountain",
    animal: "🦇",
    pattern: [
      { q: 0, r: 0, terrain: "rock", isPlacementHex: true },              // Rock (Ht 1, placement)
      { q: 1, r: 0, terrain: "tree", height: 3, isPlacementHex: false },  // Tall Tree (Ht 3)
    ],
    scoring: [15, 10, 6, 3],
    description: "Rock (Ht 1) adjacent to a Tall Tree (Ht 3)",
    maxPlacements: 4,
  },

  {
    id: "fennec",
    name: "Fennec Fox (Desert Fox)",
    primaryType: "Mountain",
    animal: "🦊",
    pattern: [
      { q: 0, r: 0, terrain: "rock", isPlacementHex: false },   // Rock (Ht 1, center)
      { q: 1, r: 0, terrain: "rock", isPlacementHex: true },    // Rock (Ht 1, placement)
      { q: -1, r: 0, terrain: "field", isPlacementHex: false }, // Field
    ],
    scoring: [16, 9, 4],
    description: "Line: Field — Rock — Rock (animal on the far Rock)",
    maxPlacements: 3,
  },

  {
    id: "macaque",
    name: "Macaque (Baboon)",
    primaryType: "Mountain",
    animal: "🐵",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", height: 2, isPlacementHex: true },  // Mountain (Ht 2, placement)
      { q: 1, r: 0, terrain: "water", isPlacementHex: false },               // Water
      { q: 0, r: 1, terrain: "water", isPlacementHex: false },               // Water (60° cluster)
    ],
    scoring: [11, 5],
    description: "Mountain (Ht 2) + 2 Water in a 60° cluster",
    maxPlacements: 2,
  },

  {
    id: "eagle",
    name: "Eagle (Vulture)",
    primaryType: "Mountain",
    animal: "🦅",
    pattern: [
      { q: 0, r: 0, terrain: "mountain", height: 3, isPlacementHex: true },  // Mountain (Ht 3, placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },               // Field
    ],
    scoring: [11, 5],
    description: "Mountain (Ht 3) adjacent to a Field",
    maxPlacements: 2,
  },

  {
    id: "meerkat",
    name: "Meerkat",
    primaryType: "Mountain",
    animal: "🦫",
    pattern: [
      { q: 0, r: 0, terrain: "rock", isPlacementHex: true },    // Rock (Ht 1, placement)
      { q: 1, r: 0, terrain: "field", isPlacementHex: false },  // Field
    ],
    scoring: [14, 9, 5, 2],
    description: "Rock (Ht 1) adjacent to a Field",
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
