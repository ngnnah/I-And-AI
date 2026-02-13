// Firebase configuration and helper functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  push,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://ito-game-ef4b2-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export database for use in other modules
export { database, ref, set, get, update, onValue, serverTimestamp };

/**
 * Generate a random 6-character game ID for Firebase key (unique)
 * @returns {string} Game ID
 */
export function generateGameId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar-looking chars
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Generate a random word-based display name (user-friendly)
 * @returns {string} Display name
 */
export function generateDisplayName() {
  const words = [
    "SUNSET", "OCEAN", "RIVER", "MOUNTAIN", "FOREST", "DESERT", "ISLAND", "VALLEY",
    "TIGER", "LION", "BEAR", "WOLF", "FOX", "EAGLE", "HAWK", "OWL",
    "DOLPHIN", "WHALE", "SHARK", "TURTLE", "BIRD", "RABBIT", "DEER", "HORSE",
    "RAINBOW", "THUNDER", "STORM", "SNOW", "MOON", "STAR", "CLOUD", "SKY",
    "GARDEN", "MEADOW", "POND", "STREAM", "HILL", "PEAK", "CANYON", "CAVE",
    "PHOENIX", "DRAGON", "UNICORN", "GRIFFIN", "PEGASUS", "KRAKEN", "HYDRA", "SPHINX",
    "AURORA", "COMET", "METEOR", "GALAXY", "NEBULA", "PLANET", "COSMOS", "VOID"
  ];

  return words[Math.floor(Math.random() * words.length)];
}

/**
 * Generate a unique player ID (UUID v4)
 * @returns {string} Player ID
 */
export function generatePlayerId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new game
 * @param {string} playerName - Host player name
 * @param {string} playerId - Host player ID
 * @param {string} difficulty - 'kids' or 'adults'
 * @returns {Promise<string>} Game ID
 */
export async function createGame(playerName, playerId, difficulty = 'adults') {
  const gameId = generateGameId();
  const displayName = generateDisplayName();
  const gameRef = ref(database, `games/${gameId}`);

  // Import game logic
  const { getDifficultyPreset } = await import('./game-logic.js');

  const preset = getDifficultyPreset(difficulty);

  const gameData = {
    createdAt: Date.now(),
    status: "waiting",
    displayName: displayName,
    createdBy: playerName,
    hostId: playerId,
    settings: {
      difficulty: difficulty,
      rangeMax: preset.rangeMax,
      roundsTotal: preset.roundsTotal
    },
    players: {
      [playerId]: {
        name: playerName,
        joinedAt: Date.now(),
        isActive: true
      }
    },
    gameState: {
      roundIndex: 0,
      phase: "waiting",
      theme: null,
      hands: {},
      placedOrder: [],
      revealed: false,
      wasCorrect: null,
      successCount: 0,
      roundsPlayed: 0,
      usedThemeIds: []
    }
  };

  await set(gameRef, gameData);
  return gameId;
}

/**
 * Join an existing game
 * @param {string} gameId - Game ID to join
 * @param {string} playerName - Player name
 * @param {string} playerId - Player ID
 * @returns {Promise<boolean>} Success status
 */
export async function joinGame(gameId, playerName, playerId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const game = snapshot.val();

  // Don't allow joining finished games
  if (game.status === "finished") {
    throw new Error("Game is finished");
  }

  // Check if player already in game
  if (game.players && game.players[playerId]) {
    // Player already exists - reactivate them
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
    await update(playerRef, {
      isActive: true
    });
    return true;  // Rejoined successfully
  }

  // New player joining - only allowed for waiting games
  if (game.status !== "waiting") {
    throw new Error("Cannot join a game in progress");
  }

  // Add new player
  const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
  await set(playerRef, {
    name: playerName,
    joinedAt: Date.now(),
    isActive: true
  });

  return true;
}

/**
 * Start a game
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export async function startGame(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    status: "playing",
    startedAt: Date.now()
  });
}

/**
 * Leave a game
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export async function leaveGame(gameId, playerId) {
  const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
  await update(playerRef, {
    isActive: false,
    leftAt: Date.now()
  });
}

/**
 * Update game state
 * @param {string} gameId - Game ID
 * @param {object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export async function updateGameState(gameId, updates) {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, updates);
}

/**
 * Listen to game updates
 * @param {string} gameId - Game ID
 * @param {function} callback - Callback function (receives game data)
 * @returns {function} Unsubscribe function
 */
export function listenToGame(gameId, callback) {
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
}

/**
 * Listen to all games (for lobby)
 * @param {function} callback - Callback function (receives all games)
 * @returns {function} Unsubscribe function
 */
export function listenToAllGames(callback) {
  const gamesRef = ref(database, 'games');
  return onValue(gamesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
}
