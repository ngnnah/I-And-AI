/**
 * Firebase configuration and helper functions for High Society.
 * Shares the same Firebase project as Codenames (different game key prefixes).
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
import { generateDisplayName } from '../data/room-names.js';
import { PLAYER_COLORS, MONEY_DENOMINATIONS } from '../data/cards.js';

const app = initializeApp({
  databaseURL: "https://highsociety-game-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const database = getDatabase(app);

export { database, ref, set, get, update, onValue, remove };

/**
 * Generate a random 6-character game ID.
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
 * Generate a unique player ID (UUID v4).
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
 * Assign a unique color to a new player based on join order.
 * @param {object} players - Existing players map
 * @returns {string}
 */
function assignPlayerColor(players) {
  const usedColors = Object.values(players || {}).map(p => p.color);
  return PLAYER_COLORS.find(c => !usedColors.includes(c)) || PLAYER_COLORS[0];
}

/**
 * Create a new High Society game.
 * @param {string} playerName
 * @param {string} playerId
 * @returns {Promise<string>} Game ID
 */
export async function createGame(playerName, playerId) {
  const gameId = generateGameId();
  const displayName = generateDisplayName();
  const gameRef = ref(database, `hs-games/${gameId}`);

  await set(gameRef, {
    createdAt: Date.now(),
    status: 'lobby',
    displayName,
    hostId: playerId,
    players: {
      [playerId]: {
        name: playerName,
        color: PLAYER_COLORS[0],
        moneyCards: [...MONEY_DENOMINATIONS],
        statusCards: [],
        pendingThief: false,
        isActive: true,
        joinedAt: Date.now()
      }
    }
  });

  return gameId;
}

/**
 * Join an existing game.
 * @param {string} gameId
 * @param {string} playerName
 * @param {string} playerId
 * @returns {Promise<void>}
 */
export async function joinGame(gameId, playerName, playerId) {
  const gameRef = ref(database, `hs-games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) throw new Error('Game not found');

  const game = snapshot.val();
  if (game.status === 'finished') throw new Error('Game is already finished');

  // Reactivate if already a player (must come before status checks to allow rejoin)
  if (game.players && game.players[playerId]) {
    await update(ref(database, `hs-games/${gameId}/players/${playerId}`), { isActive: true });
    return;
  }

  if (game.status === 'playing') throw new Error('Game is already in progress');

  const playerCount = Object.values(game.players || {}).filter(p => p.isActive).length;
  if (playerCount >= 5) throw new Error('Game is full (max 5 players)');

  const color = assignPlayerColor(game.players);

  await set(ref(database, `hs-games/${gameId}/players/${playerId}`), {
    name: playerName,
    color,
    moneyCards: [...MONEY_DENOMINATIONS],
    statusCards: [],
    pendingThief: false,
    isActive: true,
    joinedAt: Date.now()
  });
}

/**
 * Leave a game (mark inactive).
 * @param {string} gameId
 * @param {string} playerId
 */
export async function leaveGame(gameId, playerId) {
  await update(ref(database, `hs-games/${gameId}/players/${playerId}`), {
    isActive: false
  });
}

/**
 * Generic scoped update helper.
 * @param {string} gameId
 * @param {object} updates - Nested path updates
 */
export async function updateGame(gameId, updates) {
  await update(ref(database, `hs-games/${gameId}`), updates);
}

/**
 * Listen to a single game in real-time.
 * @param {string} gameId
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function listenToGame(gameId, callback) {
  const gameRef = ref(database, `hs-games/${gameId}`);
  return onValue(gameRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

/**
 * Listen to all active games (for lobby list).
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function listenToAllGames(callback) {
  const gamesRef = ref(database, 'hs-games');
  return onValue(gamesRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

/**
 * Save completed game to history.
 * @param {string} gameId
 * @param {object} gameData
 */
export async function saveGameHistory(gameId, gameData) {
  const historyRef = ref(database, `hs-gameHistory/${gameId}`);
  const scores = gameData.gameState?.scores || {};
  const eliminatedId = gameData.gameState?.eliminatedPlayer || null;

  const historyData = {
    gameId,
    finishedAt: Date.now(),
    duration: Date.now() - gameData.createdAt,
    displayName: gameData.displayName,
    winner: gameData.gameState?.winner || null,
    eliminatedPlayer: eliminatedId,
    players: {}
  };

  for (const [id, player] of Object.entries(gameData.players || {})) {
    historyData.players[id] = {
      name: player.name,
      color: player.color,
      score: scores[id] || 0,
      moneyLeft: (player.moneyCards || []).reduce((s, v) => s + v, 0),
      eliminated: id === eliminatedId
    };
  }

  await set(historyRef, historyData);
}

/**
 * Get recent game history.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getGameHistory(limit = 10) {
  const histRef = ref(database, 'hs-gameHistory');
  const snapshot = await get(histRef);
  if (!snapshot.exists()) return [];

  const history = Object.values(snapshot.val())
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, limit);

  return history;
}
