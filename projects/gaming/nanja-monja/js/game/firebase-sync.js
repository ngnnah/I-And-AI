// Firebase real-time sync handlers for game actions
import { database, ref, get, update } from './firebase-config.js';
import { getRoundType, isGameOver } from './game-logic.js';

/**
 * Flip the next card in the deck
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export async function handleCardFlip(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();
  const nextIndex = game.deck.currentIndex + 1;

  // Check if game is over
  if (nextIndex >= game.deck.cards.length) {
    throw new Error("Deck exhausted");
  }

  const nextCard = game.deck.cards[nextIndex];

  // Initialize gameState if missing (Firebase drops empty objects/arrays/nulls)
  if (!game.gameState) {
    // Sort player IDs by joinedAt timestamp to ensure consistent ordering
    const playerIds = Object.keys(game.players).sort((a, b) =>
      game.players[a].joinedAt - game.players[b].joinedAt
    );
    game.gameState = {
      currentCard: null,
      currentPile: [],
      creatureNames: {},
      roundType: null,
      claimedBy: [],
      votes: {},
      currentTurnIndex: 0,
      currentTurnPlayerId: playerIds[0]
    };
  }

  const roundType = getRoundType(nextCard, game.gameState);

  // Add card to pile
  const newPile = [...(game.gameState.currentPile || []), nextCard];

  // Update game state (don't rotate turn yet - that happens after naming/shouting)
  await update(gameRef, {
    'deck/currentIndex': nextIndex,
    'gameState/currentCard': nextCard,
    'gameState/currentPile': newPile,
    'gameState/roundType': roundType,
    'gameState/claimedBy': [],  // Reset claims
    'gameState/votes': {}  // Reset votes
  });
}

/**
 * Handle naming a creature (first time seeing it)
 * Current turn player names the creature, but doesn't get points
 * Points are awarded in shouting rounds
 * @param {string} gameId - Game ID
 * @param {number} creatureId - Creature ID
 * @param {string} name - Creature name
 * @param {string} playerId - Player ID who named it
 * @param {object} acknowledgements - Optional acknowledgements object to set atomically
 * @returns {Promise<boolean>} True if name was set (first submission wins)
 */
export async function handleNaming(gameId, creatureId, name, playerId, acknowledgements = null) {
  const gameRef = ref(database, `games/${gameId}`);
  const creatureNameRef = ref(database, `games/${gameId}/gameState/creatureNames/${creatureId}`);

  // Check if already named
  const snapshot = await get(creatureNameRef);
  if (snapshot.exists()) {
    return false;  // Already named
  }

  // Get game data to rotate turn
  const gameSnapshot = await get(gameRef);
  const game = gameSnapshot.val();

  // Rotate turn to next player
  // Sort player IDs by joinedAt timestamp to ensure consistent ordering
  const playerIds = Object.keys(game.players)
    .filter(id => game.players[id].isActive)
    .sort((a, b) => game.players[a].joinedAt - game.players[b].joinedAt);
  const currentIndex = game.gameState.currentTurnIndex || 0;
  const nextTurnIndex = (currentIndex + 1) % playerIds.length;
  const nextTurnPlayerId = playerIds[nextTurnIndex];

  // Prepare atomic update
  const updates = {
    [`gameState/creatureNames/${creatureId}`]: name,
    'gameState/roundType': null,
    'gameState/currentTurnIndex': nextTurnIndex,
    'gameState/currentTurnPlayerId': nextTurnPlayerId
  };

  // Include acknowledgements if provided (for atomic update)
  if (acknowledgements) {
    updates['gameState/nameAcknowledgements'] = acknowledgements;
  }

  // Single atomic update to prevent race conditions
  await update(gameRef, updates);

  return true;
}

/**
 * Handle a player claiming they shouted first
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export async function handleShoutClaim(gameId, playerId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();
  const claimedBy = game.gameState.claimedBy || [];

  // Check if already claimed
  if (claimedBy.includes(playerId)) {
    return;  // Already claimed
  }

  // Add to claimants
  claimedBy.push(playerId);

  await update(gameRef, {
    'gameState/claimedBy': claimedBy
  });
}

/**
 * Handle player acknowledging a newly named creature
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export async function handleNameAcknowledgement(gameId, playerId) {
  await update(ref(database, `games/${gameId}/gameState/nameAcknowledgements`), {
    [playerId]: true
  });
}

/**
 * Check if all players have acknowledged the name, then clear acknowledgements
 * @param {string} gameId - Game ID
 * @returns {Promise<boolean>} True if all acknowledged and cleared
 */
export async function checkAndClearAcknowledgements(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    return false;
  }

  const game = snapshot.val();
  // Sort player IDs by joinedAt timestamp to ensure consistent ordering
  const activePlayers = Object.keys(game.players)
    .filter(id => game.players[id].isActive)
    .sort((a, b) => game.players[a].joinedAt - game.players[b].joinedAt);
  const acknowledgements = game.gameState.nameAcknowledgements || {};
  const acknowledgedPlayers = Object.keys(acknowledgements).filter(id => acknowledgements[id]);

  // Check if all active players have acknowledged
  const allAcknowledged = activePlayers.every(id => acknowledgements[id] === true);

  if (allAcknowledged) {
    // Clear acknowledgements so next card can be flipped
    await update(gameRef, {
      'gameState/nameAcknowledgements': {}
    });
    return true;
  }

  return false;
}

/**
 * Handle voting for who shouted first
 * @param {string} gameId - Game ID
 * @param {string} voterId - Voter's player ID
 * @param {string} votedForId - Player ID being voted for
 * @returns {Promise<void>}
 */
export async function handleVoteSubmit(gameId, voterId, votedForId) {
  const voteRef = ref(database, `games/${gameId}/gameState/votes/${voterId}`);
  await update(ref(database, `games/${gameId}/gameState/votes`), {
    [voterId]: votedForId
  });
}

/**
 * Complete voting and award pile to winner
 * @param {string} gameId - Game ID
 * @returns {Promise<object>} Winner info {winnerId, voteCounts}
 */
export async function handleVoteComplete(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();
  const votes = game.gameState.votes || {};
  const claimants = game.gameState.claimedBy || [];

  // Import vote counting logic
  const { countVotes } = await import('./game-logic.js');
  const { winnerId, voteCounts, isTie } = countVotes(votes, claimants);

  if (!winnerId) {
    throw new Error("No winner determined");
  }

  // Award pile to winner
  await handlePileWin(gameId, winnerId);

  return { winnerId, voteCounts, isTie };
}

/**
 * Award the current pile to a player
 * @param {string} gameId - Game ID
 * @param {string} playerId - Winner's player ID
 * @returns {Promise<void>}
 */
export async function handlePileWin(gameId, playerId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();
  const pileSize = game.gameState.currentPile ? game.gameState.currentPile.length : 0;
  const currentCards = game.players[playerId].cardsWon || 0;

  // Rotate turn to next player
  // Sort player IDs by joinedAt timestamp to ensure consistent ordering
  const playerIds = Object.keys(game.players)
    .filter(id => game.players[id].isActive)
    .sort((a, b) => game.players[a].joinedAt - game.players[b].joinedAt);
  const currentIndex = game.gameState.currentTurnIndex || 0;
  const nextTurnIndex = (currentIndex + 1) % playerIds.length;
  const nextTurnPlayerId = playerIds[nextTurnIndex];

  // Update player's cards won
  await update(ref(database, `games/${gameId}/players/${playerId}`), {
    cardsWon: currentCards + pileSize
  });

  // Clear the pile, reset round, and rotate turn
  await update(gameRef, {
    'gameState/currentPile': [],
    'gameState/claimedBy': [],
    'gameState/votes': {},
    'gameState/roundType': null,  // Clear round type so next player can flip
    'gameState/currentTurnIndex': nextTurnIndex,
    'gameState/currentTurnPlayerId': nextTurnPlayerId
  });
}

/**
 * End the game and save to history
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export async function handleGameEnd(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();

  // Update game status
  await update(gameRef, {
    status: "finished",
    finishedAt: Date.now()
  });

  // Save to history
  const { saveGameHistory } = await import('./firebase-config.js');
  await saveGameHistory(gameId, game);
}

/**
 * Check if game should end and handle it
 * @param {string} gameId - Game ID
 * @returns {Promise<boolean>} True if game ended
 */
export async function checkAndHandleGameEnd(gameId, forceEnd = false) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    return false;
  }

  const game = snapshot.val();

  // Force end or check if deck is exhausted
  if (forceEnd || isGameOver(game.deck)) {
    await handleGameEnd(gameId);
    return true;
  }

  return false;
}

/**
 * Reset game state for a new round
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export async function resetForNewRound(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    'gameState/claimedBy': [],
    'gameState/votes': {},
    'gameState/roundType': null
  });
}
