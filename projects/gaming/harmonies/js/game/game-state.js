// Local game state management with localStorage persistence

const STORAGE_KEY = 'harmonies-player';

let localPlayer = null;
let currentGame = {
  id: null,
  data: null
};

// Player management

export function setLocalPlayer(username, displayName, deviceId) {
  localPlayer = {
    username, // lowercase (ID)
    displayName, // original case
    deviceId
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localPlayer));
}

export function getLocalPlayer() {
  if (localPlayer) return localPlayer;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      localPlayer = JSON.parse(stored);
      return localPlayer;
    } catch (e) {
      console.error('Failed to parse stored player:', e);
    }
  }

  return null;
}

export function clearLocalPlayer() {
  localPlayer = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function getOrCreateDeviceId() {
  const DEVICE_KEY = 'harmonies-device-id';
  let deviceId = localStorage.getItem(DEVICE_KEY);

  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return deviceId;
}

// Game state management

export function setCurrentGameId(gameId) {
  currentGame.id = gameId;
}

export function getCurrentGameId() {
  return currentGame.id;
}

export function updateCurrentGame(data) {
  currentGame.data = data;
}

export function getCurrentGame() {
  return currentGame.data;
}

export function clearCurrentGame() {
  currentGame = {
    id: null,
    data: null
  };
}

// Helper: Check if local player is host
export function isLocalPlayerHost() {
  if (!localPlayer || !currentGame.data) return false;
  return currentGame.data.hostId === localPlayer.username;
}

// Helper: Get local player's data from game
export function getLocalPlayerData() {
  if (!localPlayer || !currentGame.data) return null;
  return currentGame.data.players?.[localPlayer.username];
}

// Helper: Check if it's local player's turn
export function isLocalPlayerTurn() {
  if (!localPlayer || !currentGame.data) return false;
  return currentGame.data.currentPlayerTurn === localPlayer.username;
}

// Helper: Get local player's board
export function getLocalPlayerBoard() {
  if (!localPlayer || !currentGame.data) return null;
  return currentGame.data.playerBoards?.[localPlayer.username];
}

// Helper: Get all players as array (sorted by join order)
export function getPlayersArray() {
  if (!currentGame.data || !currentGame.data.players) return [];

  return Object.entries(currentGame.data.players)
    .map(([username, playerData]) => ({
      username,
      ...playerData
    }))
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

// Helper: Get current turn player
export function getCurrentTurnPlayer() {
  if (!currentGame.data) return null;
  const username = currentGame.data.currentPlayerTurn;
  return currentGame.data.players?.[username];
}
