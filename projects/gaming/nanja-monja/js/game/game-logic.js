// Core game logic for Nanja Monja
import { CREATURES } from '../data/creatures.js';

/**
 * Create a deck of cards (N creatures × 5 copies each)
 * Dynamically uses the number of creatures defined in CREATURES array
 * @returns {number[]} Array of creature IDs
 */
/**
 * Create a deck of cards with configurable variation and duplication
 * @param {number} variation - Number of different cards to use (1-12, default: 12)
 * @param {number} duplication - Number of copies of each card (default: 5)
 * @returns {number[]} Array of creature IDs
 */
export function createDeck(variation = 12, duplication = 5) {
  const deck = [];
  const numCreatures = Math.min(variation, CREATURES.length);
  
  for (let creatureId = 0; creatureId < numCreatures; creatureId++) {
    for (let copy = 0; copy < duplication; copy++) {
      deck.push(creatureId);
    }
  }
  return deck;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 * @param {number[]} deck - Array of creature IDs
 * @returns {number[]} Shuffled deck
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if this is the first time seeing a creature
 * @param {number} creatureId - Creature ID
 * @param {object} gameState - Current game state
 * @returns {boolean} True if first time
 */
export function isFirstTime(creatureId, gameState) {
  return !gameState.creatureNames || !gameState.creatureNames[creatureId];
}

/**
 * Get the round type based on whether creature has been named
 * @param {number} creatureId - Creature ID
 * @param {object} gameState - Current game state
 * @returns {string} "naming" or "shouting"
 */
export function getRoundType(creatureId, gameState) {
  return isFirstTime(creatureId, gameState) ? "naming" : "shouting";
}

/**
 * Award the current pile to a player
 * @param {string} playerId - Winner's player ID
 * @param {object} gameState - Current game state
 * @param {object} players - Players object
 * @returns {object} Updated players object
 */
export function collectPile(playerId, gameState, players) {
  const pileSize = gameState.currentPile ? gameState.currentPile.length : 0;

  if (!players[playerId]) {
    console.error(`Player ${playerId} not found`);
    return players;
  }

  players[playerId].cardsWon = (players[playerId].cardsWon || 0) + pileSize;
  gameState.currentPile = [];

  return players;
}

/**
 * Check if game is over (all cards flipped)
 * @param {object} deck - Deck object with cards and currentIndex
 * @returns {boolean} True if game over
 */
export function isGameOver(deck) {
  // Deck size is dynamically calculated as cards.length
  return deck.currentIndex >= deck.cards.length - 1;
}

/**
 * Calculate the winner based on cards won
 * @param {object} players - Players object
 * @returns {object} {winnerId, maxCards, isTie, tiedPlayers}
 */
export function calculateWinner(players) {
  let maxCards = 0;
  let winnerId = null;
  const playerScores = [];

  for (const [playerId, player] of Object.entries(players)) {
    const cardsWon = player.cardsWon || 0;
    playerScores.push({ playerId, cardsWon });

    if (cardsWon > maxCards) {
      maxCards = cardsWon;
      winnerId = playerId;
    }
  }

  // Check for ties
  const tiedPlayers = playerScores.filter(p => p.cardsWon === maxCards);
  const isTie = tiedPlayers.length > 1;

  // If winnerId is still null (all players have 0 cards), pick the first tied player
  if (winnerId === null && tiedPlayers.length > 0) {
    winnerId = tiedPlayers[0].playerId;
  }

  return {
    winnerId,
    maxCards,
    isTie,
    tiedPlayers: isTie ? tiedPlayers.map(p => p.playerId) : [],
  };
}

/**
 * Count votes and determine winner
 * @param {object} votes - Votes object {voterId: votedForId}
 * @param {string[]} claimants - Array of player IDs who claimed
 * @returns {object} {winnerId, voteCounts, isTie}
 */
export function countVotes(votes, claimants) {
  // Safety check: if no claimants, pick first claimant or null
  if (!claimants || claimants.length === 0) {
    return {
      winnerId: null,
      voteCounts: {},
      isTie: false,
      tiedPlayers: [],
    };
  }

  const voteCounts = {};

  // Initialize vote counts for all claimants
  claimants.forEach(playerId => {
    voteCounts[playerId] = 0;
  });

  // Count votes
  Object.values(votes).forEach(votedForId => {
    if (voteCounts.hasOwnProperty(votedForId)) {
      voteCounts[votedForId]++;
    }
  });

  // Find winner
  let maxVotes = -1;
  let winnerId = null;
  const winners = [];

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = playerId;
      winners.length = 0;
      winners.push(playerId);
    } else if (count === maxVotes) {
      winners.push(playerId);
    }
  }

  // Check for tie
  const isTie = winners.length > 1;

  // If tie (or no votes), random selection among tied players
  if (isTie) {
    winnerId = winners[Math.floor(Math.random() * winners.length)];
  }

  // Final safety check - if still null, pick first claimant
  if (!winnerId && claimants.length > 0) {
    winnerId = claimants[0];
  }

  return {
    winnerId,
    voteCounts,
    isTie,
    tiedPlayers: isTie ? winners : [],
  };
}

/**
 * Validate player name
 * @param {string} name - Player name
 * @returns {object} {valid: boolean, error: string|null}
 */
export function validatePlayerName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }

  if (name.trim().length > 20) {
    return { valid: false, error: "Name must be 20 characters or less" };
  }

  return { valid: true, error: null };
}

/**
 * Validate creature name
 * @param {string} name - Creature name
 * @returns {object} {valid: boolean, error: string|null}
 */
export function validateCreatureName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }

  if (name.trim().length > 50) {
    return { valid: false, error: "Name must be 50 characters or less" };
  }

  return { valid: true, error: null };
}
