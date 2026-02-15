// Modular scoring system for Harmonies

import { TERRAIN_TYPES } from '../data/tokens-config.js';
import { coordToKey, keyToCoord, getNeighbors } from './hex-grid.js';

// Main scoring function
export function calculateTotalScore(playerBoard) {
  const breakdown = {
    trees: scoreTreesModule(playerBoard.hexGrid),
    mountains: scoreMountainsModule(playerBoard.hexGrid),
    fields: scoreFieldsModule(playerBoard.hexGrid),
    buildings: scoreBuildingsModule(playerBoard.hexGrid),
    water: scoreWaterModule(playerBoard.hexGrid),
    animals: scoreAnimalsModule(playerBoard.placedAnimals, playerBoard.animalCards)
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { breakdown, total };
}

// Trees: Score based on height (1, 2, or 3 tokens high)
export function scoreTreesModule(hexGrid) {
  let score = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.TREE) {
      const height = hex.stack.length; // 2 or 3 tokens (brown + green)
      const points = [0, 1, 3, 6][height]; // Index 0 unused, 1=1pt, 2=3pts, 3=6pts
      score += points;
    }
  }

  return score;
}

// Mountains: Score based on height and adjacency
export function scoreMountainsModule(hexGrid) {
  let score = 0;
  const mountainCoords = [];

  // Find all mountains
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.MOUNTAIN) {
      mountainCoords.push(key);
    }
  }

  // Score each mountain based on adjacent mountains
  for (const key of mountainCoords) {
    const hex = hexGrid[key];
    const height = hex.stack.length; // 2 or 3 gray tokens
    const basePoints = height === 2 ? 1 : 3; // 2-high = 1pt, 3-high = 3pts

    // Count adjacent mountains
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);
    let adjacentMountains = 0;

    for (const neighbor of neighbors) {
      const neighborKey = coordToKey(neighbor.q, neighbor.r);
      const neighborHex = hexGrid[neighborKey];
      if (neighborHex && neighborHex.terrain === TERRAIN_TYPES.MOUNTAIN) {
        adjacentMountains++;
      }
    }

    // Isolated mountain = 0 points
    if (adjacentMountains === 0) continue;

    score += basePoints * adjacentMountains;
  }

  return score;
}

// Fields: Score contiguous areas progressively
export function scoreFieldsModule(hexGrid) {
  const visited = new Set();
  let totalScore = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.FIELD && !visited.has(key)) {
      const cluster = floodFill(hexGrid, key, TERRAIN_TYPES.FIELD, visited);
      // Progressive scoring: 1+2+3+4+... = n*(n+1)/2
      const size = cluster.size;
      totalScore += (size * (size + 1)) / 2;
    }
  }

  return totalScore;
}

// Buildings: Score based on unique adjacent terrain types
export function scoreBuildingsModule(hexGrid) {
  let score = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.BUILDING) {
      const { q, r } = keyToCoord(key);
      const neighbors = getNeighbors(q, r);
      const uniqueTerrains = new Set();

      for (const neighbor of neighbors) {
        const neighborKey = coordToKey(neighbor.q, neighbor.r);
        const neighborHex = hexGrid[neighborKey];
        if (neighborHex && neighborHex.terrain && neighborHex.terrain !== TERRAIN_TYPES.BUILDING) {
          uniqueTerrains.add(neighborHex.terrain);
        }
      }

      // 2 points per unique adjacent terrain type
      score += uniqueTerrains.size * 2;
    }
  }

  return score;
}

// Water: Score longest river (connected water hexes)
export function scoreWaterModule(hexGrid) {
  const visited = new Set();
  let maxRiverLength = 0;

  for (const key in hexGrid) {
    const hex = hexGrid[key];
    if (hex.terrain === TERRAIN_TYPES.WATER && !visited.has(key)) {
      const river = floodFill(hexGrid, key, TERRAIN_TYPES.WATER, visited);
      maxRiverLength = Math.max(maxRiverLength, river.size);
    }
  }

  // Progressive scoring: 1+2+3+...
  return (maxRiverLength * (maxRiverLength + 1)) / 2;
}

// Animals: Sum points from all placed animals
export function scoreAnimalsModule(placedAnimals, animalCards) {
  if (!placedAnimals || !animalCards) return 0;

  let score = 0;

  // Group placements by card ID
  const placementsByCard = {};
  for (const placement of placedAnimals) {
    if (!placementsByCard[placement.cardId]) {
      placementsByCard[placement.cardId] = 0;
    }
    placementsByCard[placement.cardId]++;
  }

  // Calculate points for each card
  for (const [cardId, count] of Object.entries(placementsByCard)) {
    const card = animalCards.find(c => c.id === cardId);
    if (!card) continue;

    // Sum points for all placements (e.g., 5 + 10 + 16 + 23)
    for (let i = 0; i < Math.min(count, card.maxPlacements); i++) {
      score += card.pointsPerPlacement[i];
    }
  }

  return score;
}

// Helper: Flood fill to find connected terrain clusters
function floodFill(hexGrid, startKey, targetTerrain, visited) {
  const cluster = new Set([startKey]);
  const queue = [startKey];
  visited.add(startKey);

  while (queue.length > 0) {
    const key = queue.shift();
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);

    for (const neighbor of neighbors) {
      const neighborKey = coordToKey(neighbor.q, neighbor.r);
      if (visited.has(neighborKey)) continue;

      const neighborHex = hexGrid[neighborKey];
      if (neighborHex && neighborHex.terrain === targetTerrain) {
        cluster.add(neighborKey);
        queue.push(neighborKey);
        visited.add(neighborKey);
      }
    }
  }

  return cluster;
}
