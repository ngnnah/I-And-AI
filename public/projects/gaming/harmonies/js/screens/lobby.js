/**
 * Harmonies - Lobby Screen
 *
 * Create and join games, view active games list
 */

import { ref, get, onValue } from "../game/firebase-config.js";
import { createGame, joinGame, startGame } from "../game/firebase-sync.js";
import { getPlayer, clearPlayer, addActiveGame, getActiveGames } from "../game/game-state.js";

let unsubscribeGames = null;

/**
 * Initialize lobby screen
 */
export function initLobby() {
  const player = getPlayer();
  if (!player) {
    // Redirect to player setup
    window.location.hash = "#setup";
    return;
  }

  // Display player info
  document.getElementById("lobby-player-name").textContent = player.displayName;

  // Set up event listeners
  setupEventListeners();

  // Listen to public games list
  listenToPublicGames();

  // Load active games
  loadActiveGames();
}

/**
 * Clean up when leaving lobby
 */
export function cleanupLobby() {
  if (unsubscribeGames) {
    unsubscribeGames();
    unsubscribeGames = null;
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Create game form
  document.getElementById("create-game-form").addEventListener("submit", handleCreateGame);

  // Join game form
  document.getElementById("join-game-form").addEventListener("submit", handleJoinGame);

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

/**
 * Handle create game form submission
 */
async function handleCreateGame(e) {
  e.preventDefault();

  const player = getPlayer();
  if (!player) return;

  const roomCodeInput = document.getElementById("room-code-input");
  const roomCode = roomCodeInput.value.trim().toUpperCase() || generateRoomCode();

  try {
    // Create game in Firebase
    await createGame(roomCode, player.username, {
      solo: false,
      boardSide: "A",
    });

    // Add to active games
    addActiveGame(roomCode);

    // Start game immediately if solo, otherwise wait for players
    // (For now, auto-start all games)
    await startGame(roomCode);

    // Navigate to game room
    window.location.hash = `#game/${roomCode}`;

    showToast(`Game created: ${roomCode}`, "success");
  } catch (error) {
    console.error("Error creating game:", error);
    showToast(error.message, "error");
  }
}

/**
 * Handle join game form submission
 */
async function handleJoinGame(e) {
  e.preventDefault();

  const player = getPlayer();
  if (!player) return;

  const joinCodeInput = document.getElementById("join-code-input");
  const roomCode = joinCodeInput.value.trim().toUpperCase();

  if (!roomCode) {
    showToast("Please enter a room code", "error");
    return;
  }

  try {
    // Join game in Firebase
    await joinGame(roomCode, player.username);

    // Add to active games
    addActiveGame(roomCode);

    // Navigate to game room
    window.location.hash = `#game/${roomCode}`;

    showToast(`Joined game: ${roomCode}`, "success");
  } catch (error) {
    console.error("Error joining game:", error);
    showToast(error.message, "error");
  }
}

/**
 * Handle logout button click
 */
function handleLogout() {
  const confirmed = confirm("Are you sure you want to logout?");
  if (confirmed) {
    clearPlayer();
    window.location.hash = "#setup";
  }
}

/**
 * Load player's active games
 */
async function loadActiveGames() {
  const activeGameIds = getActiveGames();
  const container = document.getElementById("active-games-list");

  if (activeGameIds.length === 0) {
    container.innerHTML = '<p class="empty-state">No active games</p>';
    return;
  }

  container.innerHTML = "";

  for (const gameId of activeGameIds) {
    try {
      const gameRef = ref(`games/${gameId}`);
      const snapshot = await get(gameRef);
      const game = snapshot.val();

      if (game) {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
      }
    } catch (error) {
      console.error(`Error loading game ${gameId}:`, error);
    }
  }
}

/**
 * Listen to public games list
 */
function listenToPublicGames() {
  const gamesRef = ref("games");

  unsubscribeGames = onValue(gamesRef, (snapshot) => {
    const games = snapshot.val();
    const container = document.getElementById("public-games-list");

    if (!games) {
      container.innerHTML = '<p class="empty-state">No public games available</p>';
      return;
    }

    // Filter for waiting games
    const waitingGames = Object.values(games).filter((g) => g.status === "waiting");

    if (waitingGames.length === 0) {
      container.innerHTML = '<p class="empty-state">No public games available</p>';
      return;
    }

    container.innerHTML = "";

    waitingGames.forEach((game) => {
      const gameCard = createGameCard(game);
      container.appendChild(gameCard);
    });
  });
}

/**
 * Create game card element
 * @param {Object} game - Game object
 * @returns {HTMLElement} Game card element
 */
function createGameCard(game) {
  const card = document.createElement("div");
  card.className = "game-card";

  const playerCount = Object.keys(game.players).length;
  const maxPlayers = game.settings.maxPlayers;

  const statusBadge = {
    waiting: "🟡 Waiting",
    playing: "🟢 In Progress",
    finished: "⚫ Finished",
  }[game.status];

  card.innerHTML = `
    <div class="game-card-header">
      <h3>${game.id}</h3>
      <span class="status-badge">${statusBadge}</span>
    </div>
    <div class="game-card-body">
      <p>Players: ${playerCount}/${maxPlayers}</p>
      <p>Created by: ${game.createdBy}</p>
      <p>Turn: ${game.turnNumber || 0}</p>
    </div>
    <div class="game-card-actions">
      <button class="btn btn-primary btn-sm" data-game-id="${game.id}">
        ${game.status === "playing" ? "Resume" : "Join"}
      </button>
    </div>
  `;

  // Add click handler
  const button = card.querySelector("button");
  button.addEventListener("click", async () => {
    const player = getPlayer();
    if (!player) return;

    // Check if already in game
    if (game.players[player.username]) {
      // Resume game
      addActiveGame(game.id);
      window.location.hash = `#game/${game.id}`;
    } else {
      // Join game
      try {
        await joinGame(game.id, player.username);
        addActiveGame(game.id);
        window.location.hash = `#game/${game.id}`;
        showToast(`Joined game: ${game.id}`, "success");
      } catch (error) {
        console.error("Error joining game:", error);
        showToast(error.message, "error");
      }
    }
  });

  return card;
}

/**
 * Generate random room code
 * @returns {string} 6-character room code
 */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - "success", "error", or default
 */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}
