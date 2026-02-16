/**
 * Harmonies - Game State Management
 *
 * Local storage for player profile and device identity
 */

const STORAGE_KEY_PLAYER = "harmonies_player";
const STORAGE_KEY_DEVICE = "harmonies_device_id";

/**
 * Save player profile to localStorage
 * @param {Object} player - Player object { username, displayName, deviceId, createdAt }
 */
export function savePlayer(player) {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(player));
  } catch (error) {
    console.error("Error saving player:", error);
  }
}

/**
 * Get player profile from localStorage
 * @returns {Object|null} Player object or null if not found
 */
export function getPlayer() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PLAYER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting player:", error);
    return null;
  }
}

/**
 * Clear player profile (logout)
 */
export function clearPlayer() {
  try {
    localStorage.removeItem(STORAGE_KEY_PLAYER);
  } catch (error) {
    console.error("Error clearing player:", error);
  }
}

/**
 * Generate unique device ID
 * @returns {string} Device ID (UUID v4)
 */
export function generateDeviceId() {
  // Check if device ID already exists
  const existing = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (existing) return existing;

  // Generate new UUID v4
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  localStorage.setItem(STORAGE_KEY_DEVICE, uuid);
  return uuid;
}

/**
 * Get device ID
 * @returns {string} Device ID
 */
export function getDeviceId() {
  const existing = localStorage.getItem(STORAGE_KEY_DEVICE);
  return existing || generateDeviceId();
}

/**
 * Save game ID to player's active games list (for quick rejoin)
 * @param {string} gameId - Game room code
 */
export function addActiveGame(gameId) {
  try {
    const player = getPlayer();
    if (!player) return;

    const activeGames = player.activeGames || [];
    if (!activeGames.includes(gameId)) {
      activeGames.push(gameId);
      player.activeGames = activeGames;
      savePlayer(player);
    }
  } catch (error) {
    console.error("Error adding active game:", error);
  }
}

/**
 * Remove game from player's active games list
 * @param {string} gameId - Game room code
 */
export function removeActiveGame(gameId) {
  try {
    const player = getPlayer();
    if (!player) return;

    const activeGames = player.activeGames || [];
    const index = activeGames.indexOf(gameId);
    if (index !== -1) {
      activeGames.splice(index, 1);
      player.activeGames = activeGames;
      savePlayer(player);
    }
  } catch (error) {
    console.error("Error removing active game:", error);
  }
}

/**
 * Get player's active games list
 * @returns {Array} Array of game IDs
 */
export function getActiveGames() {
  try {
    const player = getPlayer();
    return player?.activeGames || [];
  } catch (error) {
    console.error("Error getting active games:", error);
    return [];
  }
}

/**
 * Update player stats after game completion
 * @param {Object} gameResult - { gameId, won, score, ranking }
 */
export function updatePlayerStats(gameResult) {
  try {
    const player = getPlayer();
    if (!player) return;

    // Initialize stats if not exists
    if (!player.stats) {
      player.stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        highScore: 0,
        totalScore: 0,
      };
    }

    // Update stats
    player.stats.gamesPlayed++;
    if (gameResult.won) {
      player.stats.gamesWon++;
    }
    if (gameResult.score > player.stats.highScore) {
      player.stats.highScore = gameResult.score;
    }
    player.stats.totalScore += gameResult.score;

    // Add to game history
    if (!player.gameHistory) {
      player.gameHistory = [];
    }
    player.gameHistory.unshift({
      gameId: gameResult.gameId,
      completedAt: Date.now(),
      won: gameResult.won,
      score: gameResult.score,
      ranking: gameResult.ranking,
    });

    // Keep only last 50 games
    if (player.gameHistory.length > 50) {
      player.gameHistory = player.gameHistory.slice(0, 50);
    }

    savePlayer(player);
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
}

/**
 * Get player stats
 * @returns {Object} Player stats object
 */
export function getPlayerStats() {
  try {
    const player = getPlayer();
    return (
      player?.stats || {
        gamesPlayed: 0,
        gamesWon: 0,
        highScore: 0,
        totalScore: 0,
      }
    );
  } catch (error) {
    console.error("Error getting player stats:", error);
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      highScore: 0,
      totalScore: 0,
    };
  }
}

/**
 * Get player game history
 * @returns {Array} Array of game result objects
 */
export function getGameHistory() {
  try {
    const player = getPlayer();
    return player?.gameHistory || [];
  } catch (error) {
    console.error("Error getting game history:", error);
    return [];
  }
}
