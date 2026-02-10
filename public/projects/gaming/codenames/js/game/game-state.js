/**
 * Local state management for Codenames
 * Tracks the local player and current game reference
 */

const STORAGE_KEY = 'codenames-player';

let localPlayer = { id: null, name: null };
let currentGame = { id: null, data: null };
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
  if (!currentGame.data || !currentGame.data.players) return null;
  return currentGame.data.players[localPlayer.id] || null;
}

export function isLocalPlayerSpymaster() {
  const p = getLocalPlayerData();
  return p && p.role === 'spymaster';
}

export function getLocalPlayerTeam() {
  const p = getLocalPlayerData();
  return p ? p.team : null;
}

export function isLocalPlayerTurn() {
  if (!currentGame.data || !currentGame.data.gameState) return false;
  const gs = currentGame.data.gameState;
  const team = getLocalPlayerTeam();
  if (gs.currentTurn !== team) return false;
  const role = getLocalPlayerData()?.role;
  if (gs.phase === 'clue') return role === 'spymaster';
  if (gs.phase === 'guess') return role === 'operative';
  return false;
}

// --- Screen ---

export function setCurrentScreen(screen) {
  currentScreen = screen;
}

export function getCurrentScreen() {
  return currentScreen;
}
