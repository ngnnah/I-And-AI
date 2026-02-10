// Local game state management (not persisted to Firebase)

/**
 * Local player state
 */
export const localPlayer = {
  id: null,
  name: null,
};

/**
 * Current game state
 */
export const currentGame = {
  id: null,
  data: null,
};

/**
 * Current screen
 */
export let currentScreen = "player-setup"; // player-setup | lobby | game-room | voting | game-over

/**
 * Set local player information
 * @param {string} id - Player ID
 * @param {string} name - Player name
 */
export function setLocalPlayer(id, name) {
  localPlayer.id = id;
  localPlayer.name = name;

  // Persist both ID and name to localStorage as JSON
  localStorage.setItem("nanja-player", JSON.stringify({ id, name }));
}

/**
 * Get stored player from localStorage
 * @returns {object|null} {id, name} or null
 */
export function getStoredPlayer() {
  const stored = localStorage.getItem("nanja-player");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

/**
 * Get player name from localStorage (legacy compatibility)
 * @returns {string|null} Player name or null
 */
export function getStoredPlayerName() {
  const player = getStoredPlayer();
  return player ? player.name : null;
}

/**
 * Restore player from localStorage
 * @returns {boolean} True if player was restored
 */
export function restorePlayer() {
  const stored = getStoredPlayer();
  if (stored && stored.id && stored.name) {
    localPlayer.id = stored.id;
    localPlayer.name = stored.name;
    return true;
  }
  return false;
}

/**
 * Clear stored player data
 */
export function clearStoredPlayerName() {
  localStorage.removeItem("nanja-player");
  // Also remove old key for backwards compatibility
  localStorage.removeItem("nanja-player-name");
}

/**
 * Update current game data
 * @param {object} gameData - Game data from Firebase
 */
export function updateCurrentGame(gameData) {
  currentGame.data = gameData;
}

/**
 * Set current game ID
 * @param {string} gameId - Game ID
 */
export function setCurrentGameId(gameId) {
  currentGame.id = gameId;
}

/**
 * Clear current game
 */
export function clearCurrentGame() {
  currentGame.id = null;
  currentGame.data = null;
}

/**
 * Get current player name
 * @returns {string|null}
 */
export function getPlayerName() {
  return localPlayer.name;
}

/**
 * Get current player ID
 * @returns {string|null}
 */
export function getPlayerId() {
  return localPlayer.id;
}

/**
 * Set current screen
 * @param {string} screen - Screen name
 */
export function setCurrentScreen(screen) {
  currentScreen = screen;
}

/**
 * Get current screen
 * @returns {string}
 */
export function getCurrentScreen() {
  return currentScreen;
}

/**
 * Check if local player is in current game
 * @returns {boolean}
 */
export function isLocalPlayerInGame() {
  if (!currentGame.data || !currentGame.data.players || !localPlayer.id) {
    return false;
  }
  return currentGame.data.players.hasOwnProperty(localPlayer.id);
}

/**
 * Check if local player is game host
 * @returns {boolean}
 */
export function isLocalPlayerHost() {
  if (!currentGame.data || !localPlayer.id) {
    return false;
  }
  return currentGame.data.hostId === localPlayer.id;
}

/**
 * Get local player's score
 * @returns {number}
 */
export function getLocalPlayerScore() {
  if (!isLocalPlayerInGame()) {
    return 0;
  }
  return currentGame.data.players[localPlayer.id].cardsWon || 0;
}
