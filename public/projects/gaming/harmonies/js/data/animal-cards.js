/**
 * Harmonies - Animal Cards Data
 *
 * Simplified animal cards for MVP (10 cards)
 * Full implementation: 48 cards with complex patterns
 */

/**
 * Animal card structure:
 * {
 *   id: string - Unique card ID
 *   name: string - Animal name
 *   animal: string - Animal type (for graphics)
 *   pattern: Array<{relativeCoord, terrain}> - Habitat pattern
 *   maxPlacements: number - Max cubes on this card
 *   pointsPerPlacement: Array<number> - Points for 1st, 2nd, 3rd, 4th placement
 * }
 */

export const ANIMAL_CARDS = [
  // 1. BEAR - Simple tree pattern
  {
    id: "bear-01",
    name: "Bear",
    animal: "bear",
    pattern: [
      { relativeCoord: [0, 0], terrain: "tree" },
      { relativeCoord: [1, 0], terrain: "tree" },
    ],
    maxPlacements: 4,
    pointsPerPlacement: [5, 10, 16, 23],
  },

  // 2. DEER - Tree + field pattern
  {
    id: "deer-01",
    name: "Deer",
    animal: "deer",
    pattern: [
      { relativeCoord: [0, 0], terrain: "tree" },
      { relativeCoord: [1, 0], terrain: "field" },
    ],
    maxPlacements: 4,
    pointsPerPlacement: [4, 9, 15, 22],
  },

  // 3. RABBIT - Simple field pattern
  {
    id: "rabbit-01",
    name: "Rabbit",
    animal: "rabbit",
    pattern: [
      { relativeCoord: [0, 0], terrain: "field" },
      { relativeCoord: [1, 0], terrain: "field" },
    ],
    maxPlacements: 4,
    pointsPerPlacement: [3, 7, 12, 18],
  },

  // 4. BIRD - Tree cluster (3 hexes)
  {
    id: "bird-01",
    name: "Bird",
    animal: "bird",
    pattern: [
      { relativeCoord: [0, 0], terrain: "tree" },
      { relativeCoord: [1, 0], terrain: "tree" },
      { relativeCoord: [0, 1], terrain: "tree" },
    ],
    maxPlacements: 3,
    pointsPerPlacement: [7, 14, 22],
  },

  // 5. FENNEC - Mountain pattern
  {
    id: "fennec-01",
    name: "Fennec Fox",
    animal: "fennec",
    pattern: [
      { relativeCoord: [0, 0], terrain: "mountain" },
      { relativeCoord: [1, 0], terrain: "mountain" },
    ],
    maxPlacements: 4,
    pointsPerPlacement: [6, 12, 19, 27],
  },

  // 6. BOAR - Tree + water pattern
  {
    id: "boar-01",
    name: "Boar",
    animal: "boar",
    pattern: [
      { relativeCoord: [0, 0], terrain: "tree" },
      { relativeCoord: [1, 0], terrain: "water" },
    ],
    maxPlacements: 4,
    pointsPerPlacement: [5, 11, 18, 26],
  },

  // 7. DUCK - Water cluster
  {
    id: "duck-01",
    name: "Duck",
    animal: "duck",
    pattern: [
      { relativeCoord: [0, 0], terrain: "water" },
      { relativeCoord: [1, 0], terrain: "water" },
      { relativeCoord: [0, 1], terrain: "water" },
    ],
    maxPlacements: 3,
    pointsPerPlacement: [6, 13, 21],
  },

  // 8. LYNX - Mountain + tree pattern
  {
    id: "lynx-01",
    name: "Lynx",
    animal: "lynx",
    pattern: [
      { relativeCoord: [0, 0], terrain: "mountain" },
      { relativeCoord: [1, 0], terrain: "tree" },
    ],
    maxPlacements: 3,
    pointsPerPlacement: [7, 15, 24],
  },

  // 9. SALMON - Water line (4 hexes)
  {
    id: "salmon-01",
    name: "Salmon",
    animal: "salmon",
    pattern: [
      { relativeCoord: [0, 0], terrain: "water" },
      { relativeCoord: [1, 0], terrain: "water" },
      { relativeCoord: [2, 0], terrain: "water" },
      { relativeCoord: [3, 0], terrain: "water" },
    ],
    maxPlacements: 2,
    pointsPerPlacement: [10, 21],
  },

  // 10. EAGLE - Mixed habitat (tree + mountain + field)
  {
    id: "eagle-01",
    name: "Eagle",
    animal: "eagle",
    pattern: [
      { relativeCoord: [0, 0], terrain: "mountain" },
      { relativeCoord: [1, 0], terrain: "tree" },
      { relativeCoord: [0, 1], terrain: "field" },
    ],
    maxPlacements: 3,
    pointsPerPlacement: [8, 17, 27],
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
 * @param {number} count - Number of cards to draw (default 5)
 * @returns {Object} { available: Array, deck: Array }
 */
export function getStartingAnimalCards(count = 5) {
  const shuffled = shuffleAnimalCards();

  return {
    available: shuffled.slice(0, count),
    deck: shuffled.slice(count),
  };
}
