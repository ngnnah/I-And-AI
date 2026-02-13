/**
 * Firebase configuration and helper functions for Codenames
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp({
  databaseURL: "https://codenames-game-f4ff8-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const database = getDatabase(app);

export { database, ref, set, get, update, onValue, remove };

/**
 * Generate a random 6-character game ID
 * @returns {string}
 */
export function generateGameId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Generate a random display name for a game
 * @returns {string}
 */
export function generateDisplayName() {
  const words = [
    "PHOENIX", "DRAGON", "EAGLE", "LION", "WOLF", "HAWK", "SHARK", "TIGER",
    "COBRA", "FALCON", "PANTHER", "VIPER", "RAVEN", "STORM", "BLAZE", "FROST",
    "SHADOW", "THUNDER", "COMET", "AURORA", "GALAXY", "NEBULA", "TITAN", "ATLAS"
  ];
  return words[Math.floor(Math.random() * words.length)];
}

/**
 * Generate a unique player ID (UUID v4)
 * @returns {string}
 */
export function generatePlayerId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new game
 * @param {string} playerName
 * @param {string} playerId
 * @param {string} [gameMode="words"] - "words", "pictures", or "diy"
 * @returns {Promise<string>} Game ID
 */
export async function createGame(playerName, playerId, gameMode = 'words') {
  const gameId = generateGameId();
  const displayName = generateDisplayName();
  const gameRef = ref(database, `games/${gameId}`);

  await set(gameRef, {
    createdAt: Date.now(),
    status: "setup",
    displayName,
    gameMode,
    createdBy: playerName,
    hostId: playerId,
    players: {
      [playerId]: {
        name: playerName,
        joinedAt: Date.now(),
        isActive: true,
        team: null,
        role: null
      }
    }
  });

  return gameId;
}

/**
 * Join an existing game
 * @param {string} gameId
 * @param {string} playerName
 * @param {string} playerId
 * @returns {Promise<boolean>}
 */
export async function joinGame(gameId, playerName, playerId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) throw new Error("Game not found");

  const game = snapshot.val();

  if (game.status === "finished") throw new Error("Game is finished");

  // Reactivate existing player
  if (game.players && game.players[playerId]) {
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      isActive: true
    });
    return true;
  }

  // New player — allowed during setup or playing (mid-game join as operative)
  if (game.status !== "setup" && game.status !== "playing") {
    throw new Error("Cannot join a finished game");
  }

  await set(ref(database, `games/${gameId}/players/${playerId}`), {
    name: playerName,
    joinedAt: Date.now(),
    isActive: true,
    team: null,
    role: null
  });

  return true;
}

/**
 * Leave a game (mark inactive)
 * @param {string} gameId
 * @param {string} playerId
 */
export async function leaveGame(gameId, playerId) {
  await update(ref(database, `games/${gameId}/players/${playerId}`), {
    isActive: false
  });
}

/**
 * Update game state (generic)
 * @param {string} gameId
 * @param {object} updates
 */
export async function updateGameState(gameId, updates) {
  await update(ref(database, `games/${gameId}`), updates);
}

/**
 * Listen to a single game
 * @param {string} gameId
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function listenToGame(gameId, callback) {
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(gameRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

/**
 * Listen to all games (for lobby)
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function listenToAllGames(callback) {
  const gamesRef = ref(database, 'games');
  return onValue(gamesRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

/**
 * Save game to history
 * @param {string} gameId - Game ID
 * @param {object} gameData - Final game data
 * @returns {Promise<void>}
 */
export async function saveGameHistory(gameId, gameData) {
  const historyRef = ref(database, `gameHistory/${gameId}`);

  const historyData = {
    gameId,
    finishedAt: gameData.finishedAt || Date.now(),
    duration: (gameData.finishedAt || Date.now()) - gameData.createdAt,
    displayName: gameData.displayName,
    gameMode: gameData.gameMode || 'words',
    winner: gameData.gameState?.winner || null,
    winReason: gameData.gameState?.winReason || null,
    createdBy: gameData.createdBy,
    players: {}
  };

  // Copy player data
  for (const [playerId, player] of Object.entries(gameData.players || {})) {
    historyData.players[playerId] = {
      name: player.name,
      team: player.team,
      role: player.role
    };
  }

  await set(historyRef, historyData);
}

/**
 * Get game history
 * @param {number} limit - Number of games to fetch
 * @returns {Promise<object>} Game history
 */
export async function getGameHistory(limit = 10) {
  const historyRef = ref(database, 'gameHistory');
  const snapshot = await get(historyRef);

  if (!snapshot.exists()) {
    return {};
  }

  const history = snapshot.val();

  // Convert to array and sort by finishedAt
  const historyArray = Object.entries(history).map(([id, data]) => ({
    id,
    ...data
  }));

  historyArray.sort((a, b) => b.finishedAt - a.finishedAt);

  // Return limited results as object
  const limitedHistory = {};
  historyArray.slice(0, limit).forEach(game => {
    limitedHistory[game.id] = game;
  });

  return limitedHistory;
}
