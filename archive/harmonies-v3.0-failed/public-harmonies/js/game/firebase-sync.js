/**
 * Harmonies - Firebase Sync (v3.0)
 *
 * Handles all Firebase Realtime Database write operations
 * Sequential token placement for mobile-first UX
 */

import { ref, get, set, update, push, remove } from "./firebase-config.js";
import { calculateTerrain } from "./token-manager.js";
import { calculateTotalScore } from "./scoring-engine.js";
import { ANIMAL_CARDS } from "../data/animal-cards.js";

/**
 * Create a new game
 * @param {string} gameId - Game room code
 * @param {string} creatorUsername - Username of game creator
 * @param {Object} options - Game options (solo mode, board side, etc.)
 * @returns {Promise<Object>} Created game data
 */
export async function createGame(gameId, creatorUsername, options = {}) {
  const gameRef = ref(`games/${gameId}`);

  const gameData = {
    id: gameId,
    createdBy: creatorUsername,
    createdAt: Date.now(),
    status: "waiting", // waiting, playing, finished
    players: {
      [creatorUsername]: {
        username: creatorUsername,
        joinedAt: Date.now(),
        isReady: false,
        isActive: true,
      },
    },
    settings: {
      maxPlayers: options.solo ? 1 : 4,
      boardSide: options.boardSide || "A", // A = rivers, B = islands
      isSolo: options.solo || false,
    },
    currentTurn: creatorUsername,
    turnPhase: "setup", // setup, selecting, placing, optional, ending
    turnNumber: 0,
    centralBoard: {
      spaces: [], // Will be filled during game start
    },
    playerBoards: {
      [creatorUsername]: {
        hexGrid: {
          "0_0": { q: 0, r: 0, stack: [], terrain: "empty" },
        },
        tokensInHand: [], // Tokens currently being placed
        placedAnimals: [],
        score: { total: 0, breakdown: {} },
      },
    },
    animalCards: {
      available: [], // Will be populated on game start
      deck: [],
    },
    pouch: {
      blue: 23,
      gray: 23,
      brown: 21,
      green: 19,
      yellow: 19,
      red: 15,
    },
    gameLog: [],
  };

  await set(gameRef, gameData);
  return gameData;
}

/**
 * Join an existing game
 * @param {string} gameId - Game room code
 * @param {string} username - Username joining
 * @returns {Promise<Object>} Updated game data
 */
export async function joinGame(gameId, username) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.val()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();

  // Check if game is full
  const playerCount = Object.keys(game.players).length;
  if (playerCount >= game.settings.maxPlayers) {
    throw new Error("Game is full");
  }

  // Check if game already started
  if (game.status === "playing") {
    throw new Error("Game already in progress");
  }

  // Add player
  const updates = {};
  updates[`players/${username}`] = {
    username,
    joinedAt: Date.now(),
    isReady: false,
    isActive: true,
  };

  // Initialize player board
  updates[`playerBoards/${username}`] = {
    hexGrid: {
      "0_0": { q: 0, r: 0, stack: [], terrain: "empty" },
    },
    tokensInHand: [],
    placedAnimals: [],
    score: { total: 0, breakdown: {} },
  };

  await update(gameRef, updates);

  return (await get(gameRef)).val();
}

/**
 * Start the game (fill central board, draw animal cards)
 * @param {string} gameId - Game room code
 * @returns {Promise<void>}
 */
export async function startGame(gameId) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Fill central board with 3 or 5 spaces (solo vs multiplayer)
  const numSpaces = game.settings.isSolo ? 3 : 5;
  const centralSpaces = [];

  for (let i = 0; i < numSpaces; i++) {
    centralSpaces.push(drawTokensFromPouch(game.pouch, 3));
  }

  // FIXED: Load animal cards from data
  // Shuffle the cards for randomization
  const shuffledCards = [...ANIMAL_CARDS].sort(() => Math.random() - 0.5);

  const updates = {
    status: "playing",
    turnPhase: "selecting",
    "centralBoard/spaces": centralSpaces,
    "animalCards/available": shuffledCards.slice(0, 5),
    "animalCards/deck": shuffledCards.slice(5),
  };

  await update(gameRef, updates);
}

/**
 * Select a central board space (take 3 tokens)
 * @param {string} gameId - Game room code
 * @param {string} username - Player username
 * @param {number} spaceIndex - Index of central space (0-4)
 * @returns {Promise<void>}
 */
export async function selectCentralSpace(gameId, username, spaceIndex) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Validation
  if (game.currentTurn !== username) {
    throw new Error("Not your turn");
  }

  if (game.turnPhase !== "selecting") {
    throw new Error("Cannot select central space in this phase");
  }

  // FIXED: Ensure spaces is an array and tokens is an array
  const spaces = Array.isArray(game.centralBoard.spaces) ? game.centralBoard.spaces : [];
  const tokens = Array.isArray(spaces[spaceIndex]) ? spaces[spaceIndex] : [];

  if (tokens.length === 0) {
    throw new Error("Selected space is empty");
  }

  const updates = {};
  updates[`playerBoards/${username}/tokensInHand`] = tokens;
  updates[`centralBoard/spaces/${spaceIndex}`] = []; // Clear space
  updates["turnPhase"] = "placing";

  // Log action
  const logEntry = {
    timestamp: Date.now(),
    player: username,
    action: "select_central",
    data: { spaceIndex, tokens },
  };
  updates[`gameLog/${Date.now()}`] = logEntry;

  await update(gameRef, updates);
}

/**
 * Place a single token on hex grid
 * @param {string} gameId - Game room code
 * @param {string} username - Player username
 * @param {number} tokenIndex - Index in tokensInHand (0-2)
 * @param {Object} hexCoord - {q, r} coordinates
 * @returns {Promise<void>}
 */
export async function placeSingleToken(gameId, username, tokenIndex, hexCoord) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Validation
  if (game.currentTurn !== username) {
    throw new Error("Not your turn");
  }

  if (game.turnPhase !== "placing") {
    throw new Error("Cannot place tokens in this phase");
  }

  const playerBoard = game.playerBoards[username];
  const tokensInHand = playerBoard.tokensInHand || [];

  if (tokenIndex < 0 || tokenIndex >= tokensInHand.length) {
    throw new Error("Invalid token index");
  }

  const token = tokensInHand[tokenIndex];
  const hexKey = `${hexCoord.q}_${hexCoord.r}`;

  // Get or create hex
  let hex = playerBoard.hexGrid[hexKey];
  if (!hex) {
    hex = { q: hexCoord.q, r: hexCoord.r, stack: [], terrain: "empty" };
  }

  // FIXED: Ensure hex.stack is an array (Firebase sometimes returns objects)
  const currentStack = Array.isArray(hex.stack) ? hex.stack : [];

  // Add token to stack
  const updatedStack = [...currentStack, token];
  const updatedTerrain = calculateTerrain(updatedStack);

  // Update hex
  const updatedHex = {
    ...hex,
    stack: updatedStack,
    terrain: updatedTerrain,
  };

  // Remove token from hand
  const updatedTokensInHand = tokensInHand.filter((_, i) => i !== tokenIndex);

  const updates = {};
  updates[`playerBoards/${username}/hexGrid/${hexKey}`] = updatedHex;
  updates[`playerBoards/${username}/tokensInHand`] = updatedTokensInHand;

  // Check if all tokens placed
  if (updatedTokensInHand.length === 0) {
    updates["turnPhase"] = "optional";

    // Recalculate score
    const score = calculateTotalScore(
      { ...playerBoard, hexGrid: { ...playerBoard.hexGrid, [hexKey]: updatedHex } },
      game.animalCards.available,
      game.settings.boardSide
    );
    updates[`playerBoards/${username}/score`] = score;
  }

  // Log action
  const logEntry = {
    timestamp: Date.now(),
    player: username,
    action: "place_token",
    data: { token, hexCoord, terrain: updatedTerrain },
  };
  updates[`gameLog/${Date.now()}`] = logEntry;

  await update(gameRef, updates);
}

/**
 * End current turn and pass to next player
 * @param {string} gameId - Game room code
 * @param {string} username - Player username
 * @returns {Promise<void>}
 */
export async function endTurn(gameId, username) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Validation
  if (game.currentTurn !== username) {
    throw new Error("Not your turn");
  }

  if (game.turnPhase !== "optional") {
    throw new Error("Cannot end turn - must place all tokens first");
  }

  // Get next player
  const playerList = Object.keys(game.players);
  const currentIndex = playerList.indexOf(username);
  const nextIndex = (currentIndex + 1) % playerList.length;
  const nextPlayer = playerList[nextIndex];

  // Refill central board space(s)
  // FIXED: Ensure centralSpaces is an array
  const centralSpaces = Array.isArray(game.centralBoard.spaces) ? game.centralBoard.spaces : [];
  for (let i = 0; i < centralSpaces.length; i++) {
    // FIXED: Ensure each space is an array
    const space = Array.isArray(centralSpaces[i]) ? centralSpaces[i] : [];
    if (space.length === 0) {
      centralSpaces[i] = drawTokensFromPouch(game.pouch, 3);
    }
  }

  // Check end game conditions
  const playerBoard = game.playerBoards[username];
  const hexCount = Object.keys(playerBoard.hexGrid).length;
  const emptyHexes = Object.values(playerBoard.hexGrid).filter(
    (h) => h.terrain === "empty"
  ).length;

  let gameStatus = game.status;
  if (emptyHexes <= 2 || !canRefillCentralBoard(game.pouch)) {
    gameStatus = "finished";
  }

  const updates = {
    currentTurn: nextPlayer,
    turnPhase: "selecting",
    turnNumber: game.turnNumber + 1,
    "centralBoard/spaces": centralSpaces,
    status: gameStatus,
  };

  // Log action
  const logEntry = {
    timestamp: Date.now(),
    player: username,
    action: "end_turn",
    data: { nextPlayer, turnNumber: game.turnNumber + 1 },
  };
  updates[`gameLog/${Date.now()}`] = logEntry;

  await update(gameRef, updates);
}

/**
 * Take an animal card from available cards
 * @param {string} gameId - Game room code
 * @param {string} username - Player username
 * @param {string} cardId - Animal card ID
 * @returns {Promise<void>}
 */
export async function takeAnimalCard(gameId, username, cardId) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Validation
  if (game.currentTurn !== username) {
    throw new Error("Not your turn");
  }

  if (game.turnPhase !== "optional") {
    throw new Error("Can only take cards during optional phase");
  }

  const playerBoard = game.playerBoards[username];
  const playerCards = playerBoard.animalCards || [];

  if (playerCards.length >= 4) {
    throw new Error("Cannot hold more than 4 animal cards");
  }

  // FIXED: Ensure availableCards is an array
  const availableCards = Array.isArray(game.animalCards.available) ? game.animalCards.available : [];
  const cardIndex = availableCards.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    throw new Error("Card not available");
  }

  const card = availableCards[cardIndex];

  // Remove from available, add to player hand
  const updatedAvailable = availableCards.filter((c) => c.id !== cardId);

  // Draw new card from deck if available
  const deck = game.animalCards.deck || [];
  if (deck.length > 0) {
    updatedAvailable.push(deck[0]);
    deck.shift();
  }

  const updates = {};
  updates[`playerBoards/${username}/animalCards`] = [...playerCards, card];
  updates["animalCards/available"] = updatedAvailable;
  updates["animalCards/deck"] = deck;

  // Log action
  const logEntry = {
    timestamp: Date.now(),
    player: username,
    action: "take_animal_card",
    data: { cardId },
  };
  updates[`gameLog/${Date.now()}`] = logEntry;

  await update(gameRef, updates);
}

/**
 * Place animal cubes on matched habitat pattern
 * @param {string} gameId - Game room code
 * @param {string} username - Player username
 * @param {string} cardId - Animal card ID
 * @param {Array} hexCoords - Array of {q, r} coordinates for cube placement
 * @returns {Promise<void>}
 */
export async function placeAnimalCubes(gameId, username, cardId, hexCoords) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Validation
  if (game.currentTurn !== username) {
    throw new Error("Not your turn");
  }

  if (game.turnPhase !== "optional") {
    throw new Error("Can only place animals during optional phase");
  }

  const playerBoard = game.playerBoards[username];
  const placedAnimals = playerBoard.placedAnimals || [];

  // Add new placement
  const newPlacement = {
    cardId,
    hexCoords,
    placedAt: Date.now(),
  };

  const updates = {};
  updates[`playerBoards/${username}/placedAnimals`] = [...placedAnimals, newPlacement];

  // Recalculate score
  const score = calculateTotalScore(
    { ...playerBoard, placedAnimals: [...placedAnimals, newPlacement] },
    game.animalCards.available,
    game.settings.boardSide
  );
  updates[`playerBoards/${username}/score`] = score;

  // Log action
  const logEntry = {
    timestamp: Date.now(),
    player: username,
    action: "place_animal",
    data: { cardId, hexCoords },
  };
  updates[`gameLog/${Date.now()}`] = logEntry;

  await update(gameRef, updates);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Draw N tokens from pouch
 * @param {Object} pouch - Token counts by color
 * @param {number} count - Number of tokens to draw
 * @returns {Array} Array of token objects
 */
function drawTokensFromPouch(pouch, count) {
  const tokens = [];
  const availableColors = Object.keys(pouch).filter((color) => pouch[color] > 0);

  for (let i = 0; i < count; i++) {
    if (availableColors.length === 0) break;

    // Random color
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const color = availableColors[randomIndex];

    tokens.push({
      color,
      id: `${color}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Decrement pouch
    pouch[color]--;
    if (pouch[color] === 0) {
      availableColors.splice(randomIndex, 1);
    }
  }

  return tokens;
}

/**
 * Check if central board can be refilled
 * @param {Object} pouch - Token counts by color
 * @returns {boolean}
 */
function canRefillCentralBoard(pouch) {
  const totalTokens = Object.values(pouch).reduce((sum, count) => sum + count, 0);
  return totalTokens >= 3;
}
