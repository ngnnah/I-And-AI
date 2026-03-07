/**
 * Local state management for High Society.
 * Tracks the local player and current game reference (from Firebase).
 */

const STORAGE_KEY = 'high-society-player';

let localPlayer = { id: null, name: null };
let currentGame  = { id: null, data: null };
let currentScreen = null;

// --- Local Player ---

export function setLocalPlayer(id, name) {
  localPlayer = { id, name };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localPlayer));
}

export function getLocalPlayer() {
  return localPlayer;
}

export function restorePlayer() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && stored.id && stored.name) {
      localPlayer = stored;
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function clearStoredPlayer() {
  localPlayer = { id: null, name: null };
  localStorage.removeItem(STORAGE_KEY);
}

// --- Current Game ---

export function setCurrentGameId(gameId) {
  currentGame.id = gameId;
}

export function updateCurrentGame(data) {
  currentGame.data = data;
}

export function getCurrentGame() {
  return currentGame;
}

export function clearCurrentGame() {
  currentGame = { id: null, data: null };
}

// --- Helpers ---

export function isLocalPlayerHost() {
  return currentGame.data && currentGame.data.hostId === localPlayer.id;
}

export function getLocalPlayerData() {
  if (!currentGame.data?.players) return null;
  return currentGame.data.players[localPlayer.id] || null;
}

export function isLocalPlayerActiveBidder() {
  if (!currentGame.data?.auction) return false;
  return currentGame.data.auction.activeBidder === localPlayer.id;
}

export function hasLocalPlayerPassed() {
  if (!currentGame.data?.auction) return false;
  const passed = currentGame.data.auction.passed || [];
  return passed.includes(localPlayer.id);
}

// --- Screen ---

export function setCurrentScreen(screen) {
  currentScreen = screen;
}

export function getCurrentScreen() {
  return currentScreen;
}
