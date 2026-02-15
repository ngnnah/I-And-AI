// Animal habitat pattern matching with rotation and mirroring

import { coordToKey, keyToCoord, rotateCoord, mirrorAndRotateCoord } from './hex-grid.js';

// Find all possible placements of a pattern on the board
export function findPatternMatches(hexGrid, pattern) {
  const matches = [];
  const hexKeys = Object.keys(hexGrid);

  // Try each hex as potential pattern anchor
  for (const anchorKey of hexKeys) {
    const { q: anchorQ, r: anchorR } = keyToCoord(anchorKey);

    // Try all 6 rotations (0° to 300° in 60° increments)
    for (let rotation = 0; rotation < 6; rotation++) {
      if (matchesPattern(hexGrid, anchorQ, anchorR, pattern, rotation, false)) {
        const coords = getPatternCoords(anchorQ, anchorR, pattern, rotation, false);
        matches.push({
          anchor: anchorKey,
          rotation,
          mirrored: false,
          coords
        });
      }
    }

    // Try mirrored versions (if pattern is asymmetric)
    for (let rotation = 0; rotation < 6; rotation++) {
      if (matchesPattern(hexGrid, anchorQ, anchorR, pattern, rotation, true)) {
        const coords = getPatternCoords(anchorQ, anchorR, pattern, rotation, true);
        matches.push({
          anchor: anchorKey,
          rotation,
          mirrored: true,
          coords
        });
      }
    }
  }

  // Remove duplicate matches (same set of coordinates)
  return removeDuplicateMatches(matches);
}

// Check if pattern matches at given anchor with rotation/mirror
function matchesPattern(hexGrid, anchorQ, anchorR, pattern, rotation, mirrored) {
  for (const { relativeCoord, terrain } of pattern) {
    const [relQ, relR] = relativeCoord;

    // Apply transformation
    const transformed = mirrored
      ? mirrorAndRotateCoord(relQ, relR, rotation)
      : rotateCoord(relQ, relR, rotation);

    // Get absolute coordinates
    const absQ = anchorQ + transformed.q;
    const absR = anchorR + transformed.r;
    const coordKey = coordToKey(absQ, absR);

    // Check if hex exists and has matching terrain
    const hex = hexGrid[coordKey];
    if (!hex || hex.terrain !== terrain) {
      return false;
    }
  }

  return true;
}

// Get pattern coordinates after transformation
function getPatternCoords(anchorQ, anchorR, pattern, rotation, mirrored) {
  return pattern.map(({ relativeCoord }) => {
    const [relQ, relR] = relativeCoord;

    const transformed = mirrored
      ? mirrorAndRotateCoord(relQ, relR, rotation)
      : rotateCoord(relQ, relR, rotation);

    const absQ = anchorQ + transformed.q;
    const absR = anchorR + transformed.r;

    return coordToKey(absQ, absR);
  });
}

// Remove duplicate matches (same hexes, different anchor/rotation)
function removeDuplicateMatches(matches) {
  const seen = new Set();
  const unique = [];

  for (const match of matches) {
    // Sort coords to create a unique signature
    const signature = match.coords.slice().sort().join(',');

    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(match);
    }
  }

  return unique;
}

// Check if player can place a specific animal card (has valid pattern)
export function canPlaceAnimalCard(hexGrid, card) {
  const matches = findPatternMatches(hexGrid, card.pattern);
  return matches.length > 0;
}

// Check if any animal cards in market can be placed
export function getPlaceableCards(hexGrid, availableCards) {
  return availableCards.filter(card => canPlaceAnimalCard(hexGrid, card));
}

// Validate that hexes aren't already occupied by other animals
export function canPlaceAnimalAt(placedAnimals, coords) {
  const occupiedCoords = new Set();

  // Collect all hexes currently occupied by animals
  for (const placement of placedAnimals) {
    for (const coord of placement.hexCoords) {
      occupiedCoords.add(coord);
    }
  }

  // Check if any of the new coords are already occupied
  for (const coord of coords) {
    if (occupiedCoords.has(coord)) {
      return false;
    }
  }

  return true;
}

// Place animal cube on pattern match
export function placeAnimal(cardId, matchCoords) {
  return {
    cardId,
    hexCoords: matchCoords,
    placedAt: Date.now()
  };
}
