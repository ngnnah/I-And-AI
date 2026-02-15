// Firebase write operations for multiplayer sync

import { ref, set, update, get, getServerTimestamp, generateGameCode, generateGameName } from './firebase-config.js';
import { TOKEN_COLORS, TOKEN_DISTRIBUTION } from '../data/tokens-config.js';
import { getInitialAnimalMarket, drawAnimalCard, getAnimalCard } from '../data/animal-cards.js';
import { coordToKey } from './hex-grid.js';
import { addTokenToHex, calculateTerrain } from './token-manager.js';
import { calculateTotalScore } from './scoring-engine.js';

// Create new game
export async function createGame(hostUsername, hostDisplayName, settings = {}) {
  const gameId = generateGameCode();
  const gameRef = ref(`games/${gameId}`);

  // Check if code already exists (rare collision)
  const existing = await get(gameRef);
  if (existing.exists()) {
    // Retry with new code
    return createGame(hostUsername, hostDisplayName, settings);
  }

  const defaultSettings = {
    maxPlayers: 4,
    soloMode: false,
    ...settings
  };

  // Initialize central board with 9 tokens
  const centralBoard = {
    tokens: generateInitialTokens(),
    availableAnimals: getInitialAnimalMarket()
  };

  // Initialize pouch
  const pouch = initializePouch();

  const gameData = {
    id: gameId,
    createdAt: getServerTimestamp(),
    status: defaultSettings.soloMode ? 'playing' : 'waiting', // Solo starts immediately
    displayName: settings.displayName || generateGameName(),
    hostId: hostUsername,
    currentPlayerTurn: hostUsername,
    turnPhase: 'mandatory',
    settings: defaultSettings,
    players: {
      [hostUsername]: {
        name: hostDisplayName,
        joinedAt: getServerTimestamp(),
        isActive: true,
        deviceId: null,
        lastSeenAt: getServerTimestamp()
      }
    },
    centralBoard,
    pouch,
    playerBoards: {
      [hostUsername]: {
        hexGrid: {
          '0_0': { stack: [], terrain: null }
        },
        animalCards: [],
        placedAnimals: [],
        score: {
          trees: 0,
          mountains: 0,
          fields: 0,
          buildings: 0,
          water: 0,
          animals: 0,
          total: 0
        }
      }
    },
    turnLog: []
  };

  await set(gameRef, gameData);
  return gameId;
}

// Start game (host action, when enough players joined)
export async function startGame(gameId) {
  const gameRef = ref(`games/${gameId}`);

  await update(gameRef, {
    status: 'playing',
    startedAt: getServerTimestamp()
  });
}

// Place tokens on player's board (mandatory action)
export async function placeTokens(gameId, username, placements) {
  // placements: [{ tokenIndex, color, hexCoord }]

  const playerBoardRef = ref(`games/${gameId}/playerBoards/${username}`);
  const snapshot = await get(playerBoardRef);
  const board = snapshot.val();

  const updates = {};

  // Apply each placement
  for (const placement of placements) {
    const { color, hexCoord } = placement;
    const key = coordToKey(hexCoord.q, hexCoord.r);

    // Get existing hex or create new one
    const existingHex = board.hexGrid[key] || { stack: [], terrain: null };

    // Add token to hex
    const updatedHex = addTokenToHex(existingHex, color);

    updates[`hexGrid/${key}`] = updatedHex;
  }

  // Apply updates
  await update(playerBoardRef, updates);

  // Remove tokens from central board and refill
  await refillCentralBoard(gameId, placements.length);

  // Log turn
  await logTurn(gameId, username, 'placed_tokens', { count: placements.length });

  // Transition to optional phase
  await update(ref(`games/${gameId}`), {
    turnPhase: 'optional'
  });
}

// Take animal card (optional action)
export async function takeAnimalCard(gameId, username, cardId) {
  const card = getAnimalCard(cardId);
  if (!card) throw new Error('Invalid card');

  // Add card to player's hand
  const playerBoardRef = ref(`games/${gameId}/playerBoards/${username}`);
  const snapshot = await get(playerBoardRef);
  const board = snapshot.val();

  const updatedCards = [...(board.animalCards || []), card];

  await update(playerBoardRef, {
    animalCards: updatedCards
  });

  // Remove card from central board and draw new one
  const gameRef = ref(`games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const game = gameSnapshot.val();

  const availableAnimals = game.centralBoard.availableAnimals.filter(id => id !== cardId);

  // Draw new card
  const usedCardIds = [
    ...availableAnimals,
    ...Object.values(game.playerBoards).flatMap(pb => pb.animalCards.map(c => c.id))
  ];
  const newCard = drawAnimalCard(usedCardIds);

  if (newCard) {
    availableAnimals.push(newCard);
  }

  await update(ref(`games/${gameId}/centralBoard`), {
    availableAnimals
  });

  // Log action
  await logTurn(gameId, username, 'took_animal', { cardId });
}

// Place animal cubes (optional action)
export async function placeAnimalCubes(gameId, username, cardId, hexCoords) {
  const playerBoardRef = ref(`games/${gameId}/playerBoards/${username}`);
  const snapshot = await get(playerBoardRef);
  const board = snapshot.val();

  const placement = {
    cardId,
    hexCoords,
    placedAt: Date.now()
  };

  const updatedAnimals = [...(board.placedAnimals || []), placement];

  await update(playerBoardRef, {
    placedAnimals: updatedAnimals
  });

  // Recalculate score
  await updateScore(gameId, username);

  // Log action
  await logTurn(gameId, username, 'placed_animal', { cardId, count: hexCoords.length });
}

// End turn (move to next player)
export async function endTurn(gameId, currentUsername) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Get players in order
  const players = Object.keys(game.players).sort((a, b) =>
    game.players[a].joinedAt - game.players[b].joinedAt
  );

  // Find next player
  const currentIndex = players.indexOf(currentUsername);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];

  // Check end game condition
  const endCondition = await checkEndGame(gameId);

  if (endCondition) {
    await endGame(gameId);
  } else {
    await update(gameRef, {
      currentPlayerTurn: nextPlayer,
      turnPhase: 'mandatory'
    });
  }
}

// Helper: Generate initial 9 tokens for central board
function generateInitialTokens() {
  const colors = Object.keys(TOKEN_COLORS);
  const tokens = [];

  for (let i = 0; i < 9; i++) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    tokens.push({ color: randomColor });
  }

  return tokens;
}

// Helper: Initialize pouch with all tokens
function initializePouch() {
  const tokens = [];

  for (const [color, count] of Object.entries(TOKEN_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      tokens.push({ color });
    }
  }

  // Shuffle
  return tokens.sort(() => Math.random() - 0.5);
}

// Helper: Refill central board from pouch
async function refillCentralBoard(gameId, count) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const pouch = game.pouch || [];
  const centralTokens = game.centralBoard.tokens || [];

  // Draw tokens from pouch
  const drawnTokens = pouch.splice(0, count);

  // Add to central board
  centralTokens.push(...drawnTokens);

  await update(gameRef, {
    'centralBoard/tokens': centralTokens,
    pouch
  });
}

// Helper: Update player score
async function updateScore(gameId, username) {
  const playerBoardRef = ref(`games/${gameId}/playerBoards/${username}`);
  const snapshot = await get(playerBoardRef);
  const board = snapshot.val();

  const { breakdown, total } = calculateTotalScore(board);

  await update(playerBoardRef, {
    score: { ...breakdown, total }
  });
}

// Helper: Log turn action
async function logTurn(gameId, username, action, data) {
  const turnLogRef = ref(`games/${gameId}/turnLog`);
  const snapshot = await get(turnLogRef);
  const log = snapshot.val() || [];

  log.push({
    turnNumber: log.length + 1,
    player: username,
    action,
    data,
    timestamp: Date.now()
  });

  await set(turnLogRef, log);
}

// Helper: Check end game conditions
async function checkEndGame(gameId) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Condition 1: Pouch is empty
  if (!game.pouch || game.pouch.length === 0) {
    return 'pouch_empty';
  }

  // Condition 2: Any player has ≤2 empty spaces
  for (const [username, board] of Object.entries(game.playerBoards)) {
    const hexCount = Object.keys(board.hexGrid).length;
    const fullHexes = Object.values(board.hexGrid).filter(hex => hex.stack && hex.stack.length >= 3).length;
    const emptySpaces = hexCount - fullHexes;

    if (emptySpaces <= 2) {
      return 'board_full';
    }
  }

  return null;
}

// Helper: End game and save results
async function endGame(gameId) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Recalculate all player scores
  for (const username of Object.keys(game.playerBoards)) {
    await updateScore(gameId, username);
  }

  // Get final scores
  const finalSnapshot = await get(gameRef);
  const finalGame = finalSnapshot.val();

  const players = Object.entries(finalGame.playerBoards).map(([username, board]) => ({
    username,
    name: finalGame.players[username].name,
    score: board.score.total
  }));

  // Sort by score
  players.sort((a, b) => b.score - a.score);

  // Determine winner
  const winner = players[0];

  // Add ranks
  players.forEach((player, index) => {
    player.rank = index + 1;
  });

  // Update game status
  await update(gameRef, {
    status: 'finished',
    finishedAt: getServerTimestamp(),
    winner: winner.username,
    finalStandings: players
  });

  // Save to game history
  await saveGameHistory(gameId, finalGame, players);
}

// Helper: Save game to history
async function saveGameHistory(gameId, game, players) {
  const historyRef = ref(`gameHistory/${gameId}`);

  await set(historyRef, {
    gameId,
    displayName: game.displayName,
    finishedAt: getServerTimestamp(),
    duration: Date.now() - game.createdAt,
    winner: players[0].username,
    players: players.reduce((acc, p) => {
      acc[p.username] = { name: p.name, score: p.score, rank: p.rank };
      return acc;
    }, {})
  });

  // Update each player's history
  for (const player of players) {
    const playerRef = ref(`players/${player.username}`);
    const snapshot = await get(playerRef);
    const playerData = snapshot.val();

    const gameHistory = playerData.gameHistory || [];
    gameHistory.push({
      gameId,
      finishedAt: Date.now(),
      score: player.score,
      rank: player.rank
    });

    const stats = playerData.stats || {};
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    if (player.rank === 1) {
      stats.gamesWon = (stats.gamesWon || 0) + 1;
    }
    if (player.score > (stats.highScore || 0)) {
      stats.highScore = player.score;
    }
    stats.totalScore = (stats.totalScore || 0) + player.score;

    await update(playerRef, {
      gameHistory,
      stats,
      'activeSession/currentGameId': null
    });
  }
}
