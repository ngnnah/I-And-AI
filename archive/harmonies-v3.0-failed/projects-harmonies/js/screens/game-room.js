/**
 * Harmonies - Game Room UI (v3.0 Mobile-First)
 *
 * Touch-optimized game interface with BGA-inspired UX
 */

import { ref, onValue } from "../game/firebase-config.js";
import {
  startGame,
  selectCentralSpace,
  placeSingleToken,
  endTurn,
  takeAnimalCard,
  placeAnimalCubes,
} from "../game/firebase-sync.js";
import { calculateTotalScore } from "../game/scoring-engine.js";
import { getValidPlacementHexes } from "../game/token-manager.js";
import { renderHexGrid, highlightValidHexes, clearHighlights, updateScoreDisplay } from "../ui/board-renderer-simple.js";

// ============================================================================
// STATE
// ============================================================================

let currentGame = null;
let currentUsername = null;
let selectedCentralSpace = null;
let currentTokenIndex = 0;
let unsubscribeGame = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize game room
 * @param {string} gameId - Game room code
 * @param {string} username - Current player username
 */
export function initGameRoom(gameId, username) {
  try {
    console.log(`[GameRoom] Initializing game room: ${gameId} for user: ${username}`);
    currentUsername = username;

    // Listen to game updates
    const gameRef = ref(`games/${gameId}`);

    if (!gameRef) {
      throw new Error("Failed to create Firebase reference. Database not initialized.");
    }

    unsubscribeGame = onValue(gameRef, (snapshot) => {
      try {
        currentGame = snapshot.val();
        console.log("[GameRoom] Game state updated:", currentGame ? "Game exists" : "Game not found");

        if (currentGame) {
          renderGameState();
        } else {
          showToast(`Game ${gameId} not found. It may have been deleted.`, "error");
        }
      } catch (err) {
        console.error("[GameRoom] Error handling game state update:", err);
        showToast("Error updating game state", "error");
      }
    });

    // Set up event listeners
    setupEventListeners();

    console.log("[GameRoom] Game room initialized successfully");
  } catch (error) {
    console.error("[GameRoom] Fatal error initializing game room:", error);
    showToast(`Failed to load game: ${error.message}`, "error");

    // Redirect back to lobby after error
    setTimeout(() => {
      window.location.hash = "#lobby";
    }, 3000);
  }
}

/**
 * Clean up when leaving game room
 */
export function cleanupGameRoom() {
  if (unsubscribeGame) {
    unsubscribeGame();
    unsubscribeGame = null;
  }
  currentGame = null;
  selectedCentralSpace = null;
  currentTokenIndex = 0;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  try {
    console.log("[GameRoom] Setting up event listeners");

    // Helper to safely add event listener
    const safeAddListener = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener(event, handler);
        console.log(`[GameRoom] Added ${event} listener to #${id}`);
      } else {
        console.warn(`[GameRoom] Element not found: #${id}`);
      }
    };

    // Central board spaces (tap to select)
    safeAddListener("central-spaces", "click", handleCentralSpaceClick);

    // Hex grid (tap to place token)
    safeAddListener("hex-grid-container", "click", handleHexClick);

    // End turn button
    safeAddListener("end-turn-btn", "click", handleEndTurn);

    // Undo button
    safeAddListener("undo-btn", "click", handleUndo);

    // Score breakdown button
    safeAddListener("score-breakdown-btn", "click", showScoreBreakdown);

    // Menu button
    safeAddListener("menu-btn", "click", showMenu);

    // Animal cards (tap to take or view)
    safeAddListener("animal-cards-row", "click", handleAnimalCardClick);

    // Haptic feedback on touch (iOS/Android)
    if (navigator.vibrate) {
      document.addEventListener("touchstart", (e) => {
        if (e.target.closest(".central-space, .hex, .btn")) {
          navigator.vibrate(10); // Light tap feedback
        }
      });
      console.log("[GameRoom] Haptic feedback enabled");
    }

    console.log("[GameRoom] Event listeners setup complete");
  } catch (error) {
    console.error("[GameRoom] Error setting up event listeners:", error);
  }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

/**
 * Main render function - updates entire UI based on game state
 */
function renderGameState() {
  if (!currentGame) {
    console.warn("[GameRoom] Cannot render - game state is null");
    return;
  }

  try {
    console.log("[GameRoom] Rendering game state, status:", currentGame.status);

    // GAME STATUS: If waiting, show start button
    if (currentGame.status === "waiting") {
      renderStartGameButton();
      return; // Don't render game UI until started
    }

    // GAME STATUS: If finished, show end game screen
    if (currentGame.status === "finished") {
      renderEndGameScreen();
      return;
    }

    // Normal gameplay rendering
    renderTurnIndicator();
    renderCentralBoard();
    renderAnimalCards();
    renderPlayerBoard();
    renderBottomBar();
    renderProgressIndicator();
    console.log("[GameRoom] Render complete");
  } catch (error) {
    console.error("[GameRoom] Error rendering game state:", error);
    showToast("Error displaying game. Please refresh.", "error");
  }
}

/**
 * Render turn indicator (sticky header)
 */
function renderTurnIndicator() {
  const indicator = document.getElementById("turn-indicator");
  const playerNameEl = document.getElementById("turn-player-name");
  const phaseEl = document.getElementById("turn-phase");

  if (!indicator || !playerNameEl || !phaseEl) return;

  const isMyTurn = currentGame.currentTurn === currentUsername;
  const currentPlayer = currentGame.players && currentGame.players[currentGame.currentTurn];

  if (isMyTurn) {
    indicator.classList.add("your-turn");
    indicator.classList.remove("waiting");
    playerNameEl.textContent = "🟢 Your Turn";
  } else {
    indicator.classList.remove("your-turn");
    indicator.classList.add("waiting");
    playerNameEl.textContent = `⏱️ Waiting for ${currentPlayer?.username || "..."}`;
  }

  // Phase text
  const phaseText = {
    setup: "Setting up...",
    selecting: "Select 3 tokens",
    placing: `Place token ${currentTokenIndex + 1}/3`,
    optional: "Optional actions",
    ending: "Game ending...",
  };
  phaseEl.textContent = phaseText[currentGame.turnPhase] || "";
}

/**
 * Render central board (token supply)
 */
function renderCentralBoard() {
  const container = document.getElementById("central-spaces");
  if (!container) return;

  container.innerHTML = "";

  const spaces = (currentGame.centralBoard && currentGame.centralBoard.spaces) || [];
  const canSelect = currentGame.currentTurn === currentUsername && currentGame.turnPhase === "selecting";

  spaces.forEach((tokens, index) => {
    const spaceEl = document.createElement("div");
    spaceEl.className = "central-space";
    spaceEl.dataset.spaceIndex = index;

    if (canSelect && tokens.length > 0) {
      spaceEl.classList.add("selectable");
    }

    // Render tokens
    tokens.forEach((token) => {
      const tokenEl = document.createElement("div");
      tokenEl.className = `token ${token.color}`;
      tokenEl.style.width = "40px";
      tokenEl.style.height = "40px";
      spaceEl.appendChild(tokenEl);
    });

    // Empty space indicator
    if (tokens.length === 0) {
      spaceEl.innerHTML = '<span class="empty-label">Empty</span>';
      spaceEl.classList.add("empty");
    }

    container.appendChild(spaceEl);
  });
}

/**
 * Render animal cards (horizontal scroll)
 */
function renderAnimalCards() {
  const container = document.getElementById("animal-cards-row");
  if (!container) return;

  container.innerHTML = "";

  const availableCards = (currentGame.animalCards && currentGame.animalCards.available) || [];

  // FIXED: Use emoji instead of missing images
  const animalEmoji = {
    bear: "🐻",
    deer: "🦌",
    rabbit: "🐰",
    duck: "🦆",
    fox: "🦊",
    lynx: "🐈",
    bird: "🐦",
    squirrel: "🐿️",
    hedgehog: "🦔",
    turtle: "🐢",
  };

  availableCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = "animal-card";
    cardEl.dataset.cardId = card.id;

    // Card with emoji icon (FIXED: no missing images)
    cardEl.innerHTML = `
      <div class="animal-card-image">
        <div style="font-size: 48px;">${animalEmoji[card.animal] || "🦊"}</div>
      </div>
      <div class="animal-card-name">${card.name}</div>
    `;

    container.appendChild(cardEl);
  });

  // Add empty cards for visual balance
  for (let i = availableCards.length; i < 5; i++) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "animal-card empty";
    emptyCard.innerHTML = '<div class="empty-label">-</div>';
    container.appendChild(emptyCard);
  }
}

/**
 * Render player's hex grid board
 */
function renderPlayerBoard() {
  const playerBoard = currentGame.playerBoards && currentGame.playerBoards[currentUsername];
  if (!playerBoard) {
    console.warn("[GameRoom] Player board not found for:", currentUsername);
    return;
  }

  // Update score display
  const scoreEl = document.getElementById("current-score");
  if (scoreEl) {
    scoreEl.textContent = playerBoard.score?.total || 0;
  }

  // Render hex grid (delegated to board-renderer.js)
  renderHexGrid(playerBoard.hexGrid, playerBoard.placedAnimals);

  // Highlight valid hexes if placing tokens
  if (currentGame.turnPhase === "placing" && currentGame.currentTurn === currentUsername) {
    const tokensInHand = playerBoard.tokensInHand || [];
    if (tokensInHand.length > 0) {
      const currentToken = tokensInHand[currentTokenIndex];
      const validHexes = getValidPlacementHexes(
        playerBoard.hexGrid,
        currentToken.color,
        playerBoard.placedAnimals
      );
      highlightValidHexes(validHexes);
    }
  } else {
    clearHighlights();
  }
}

/**
 * Render bottom bar (action buttons)
 */
function renderBottomBar() {
  const endTurnBtn = document.getElementById("end-turn-btn");
  if (!endTurnBtn) return;

  const isMyTurn = currentGame.currentTurn === currentUsername;
  const canEndTurn = isMyTurn && currentGame.turnPhase === "optional";

  endTurnBtn.disabled = !canEndTurn;
  endTurnBtn.textContent = canEndTurn ? "End Turn" : "Waiting...";
}

/**
 * Render progress indicator (token placement)
 */
function renderProgressIndicator() {
  const indicator = document.getElementById("progress-indicator");
  const currentEl = document.getElementById("progress-current");
  const totalEl = document.getElementById("progress-total");
  if (!indicator || !currentEl || !totalEl) return;  // FIXED: Added null check

  if (currentGame.turnPhase === "placing" && currentGame.currentTurn === currentUsername) {
    // FIXED: Added null check for playerBoards
    const playerBoard = currentGame.playerBoards && currentGame.playerBoards[currentUsername];
    if (!playerBoard) {
      console.warn("[GameRoom] Player board not found for progress indicator:", currentUsername);
      indicator.classList.add("hidden");
      return;
    }

    const tokensInHand = playerBoard.tokensInHand || [];
    const placed = 3 - tokensInHand.length;

    currentEl.textContent = placed;
    totalEl.textContent = 3;
    indicator.classList.remove("hidden");
  } else {
    indicator.classList.add("hidden");
  }
}

/**
 * Render start game button (when status is "waiting")
 */
function renderStartGameButton() {
  const container = document.getElementById("hex-grid-container");
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px;">
      <h2>Waiting for Players</h2>
      <p style="margin: 16px 0; color: #666;">
        Room Code: <strong>${currentGame.id}</strong>
      </p>
      <p style="margin-bottom: 24px;">
        ${Object.keys(currentGame.players || {}).length} player(s) joined
      </p>
      <button id="start-game-btn" class="btn btn-primary" style="font-size: 18px; padding: 16px 32px;">
        🎮 Start Game
      </button>
    </div>
  `;

  // Add click handler
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      try {
        startBtn.disabled = true;
        startBtn.textContent = "Starting...";
        await startGame(currentGame.id);
        showToast("Game started!", "success");
      } catch (error) {
        console.error("Error starting game:", error);
        showToast(error.message, "error");
        startBtn.disabled = false;
        startBtn.textContent = "🎮 Start Game";
      }
    });
  }
}

/**
 * Render end game screen (when status is "finished")
 */
function renderEndGameScreen() {
  const container = document.getElementById("hex-grid-container");
  if (!container) return;

  // Calculate final scores
  const players = Object.values(currentGame.players || {});
  const scores = players.map((p) => ({
    username: p.username,
    score: currentGame.playerBoards?.[p.username]?.score?.total || 0,
  }));
  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];
  const isWinner = winner.username === currentUsername;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
      <h1 style="font-size: 48px; margin-bottom: 16px;">${isWinner ? "🏆" : "🎮"}</h1>
      <h2>${isWinner ? "You Won!" : "Game Over"}</h2>
      <h3 style="margin: 24px 0;">Final Scores</h3>
      <div style="background: #fff; padding: 24px; border-radius: 12px; margin-bottom: 24px; min-width: 300px;">
        ${scores
          .map(
            (s, i) => `
          <div style="display: flex; justify-content: space-between; padding: 12px; ${i === 0 ? "font-weight: bold; border-bottom: 2px solid #4CAF50;" : ""}">
            <span>${i + 1}. ${s.username}</span>
            <span>${s.score} pts</span>
          </div>
        `
          )
          .join("")}
      </div>
      <button id="back-to-lobby-btn" class="btn btn-primary">Back to Lobby</button>
    </div>
  `;

  // Add click handler
  const backBtn = document.getElementById("back-to-lobby-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.hash = "#lobby";
    });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle central space click (select 3 tokens)
 */
async function handleCentralSpaceClick(e) {
  const spaceEl = e.target.closest(".central-space");
  if (!spaceEl) return;

  const spaceIndex = parseInt(spaceEl.dataset.spaceIndex);
  const canSelect = currentGame.currentTurn === currentUsername && currentGame.turnPhase === "selecting";

  if (!canSelect) {
    showToast("Not your turn to select tokens", "error");
    return;
  }

  // FIXED: Added null check for centralBoard
  if (!currentGame.centralBoard || !currentGame.centralBoard.spaces) {
    console.warn("[GameRoom] Central board not loaded");
    showToast("Board not ready. Please wait...", "error");
    return;
  }

  const tokens = currentGame.centralBoard.spaces[spaceIndex];
  if (!tokens || tokens.length === 0) {
    showToast("Selected space is empty", "error");
    return;
  }

  // Visual feedback
  spaceEl.classList.add("selected");
  if (navigator.vibrate) {
    navigator.vibrate(20); // Medium haptic
  }

  try {
    await selectCentralSpace(currentGame.id, currentUsername, spaceIndex);
    selectedCentralSpace = spaceIndex;
    currentTokenIndex = 0;
    showToast(`Selected 3 tokens. Tap hexes to place them.`, "success");
  } catch (error) {
    console.error("Error selecting central space:", error);
    showToast(error.message, "error");
    spaceEl.classList.remove("selected");
  }
}

/**
 * Handle hex click (place token)
 */
async function handleHexClick(e) {
  const hexEl = e.target.closest("[data-hex-key]");
  if (!hexEl) return;

  const hexKey = hexEl.dataset.hexKey;
  const [q, r] = hexKey.split("_").map(Number);

  const canPlace = currentGame.currentTurn === currentUsername && currentGame.turnPhase === "placing";

  if (!canPlace) {
    return; // Silently ignore if not placing phase
  }

  // FIXED: Added null check for playerBoards
  const playerBoard = currentGame.playerBoards && currentGame.playerBoards[currentUsername];
  if (!playerBoard) {
    console.warn("[GameRoom] Player board not found for hex click:", currentUsername);
    showToast("Unable to place token - board not loaded", "error");
    return;
  }

  const tokensInHand = playerBoard.tokensInHand || [];

  if (tokensInHand.length === 0) {
    showToast("No tokens to place", "error");
    return;
  }

  // Check if hex is valid
  const currentToken = tokensInHand[currentTokenIndex];
  const validHexes = getValidPlacementHexes(
    playerBoard.hexGrid,
    currentToken.color,
    playerBoard.placedAnimals
  );

  if (!validHexes.includes(hexKey)) {
    showToast("Cannot place token here", "error");
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); // Error pattern
    }
    // Shake animation
    hexEl.style.animation = "shake 0.3s";
    setTimeout(() => {
      hexEl.style.animation = "";
    }, 300);
    return;
  }

  // Visual feedback
  hexEl.classList.add("placing");
  if (navigator.vibrate) {
    navigator.vibrate(15); // Success haptic
  }

  try {
    await placeSingleToken(currentGame.id, currentUsername, currentTokenIndex, { q, r });
    currentTokenIndex = 0; // Reset for next token
    showToast(`Token placed! ${tokensInHand.length - 1} remaining.`, "success");
  } catch (error) {
    console.error("Error placing token:", error);
    showToast(error.message, "error");
    hexEl.classList.remove("placing");
  }
}

/**
 * Handle end turn button click
 */
async function handleEndTurn() {
  if (currentGame.currentTurn !== currentUsername) return;
  if (currentGame.turnPhase !== "optional") return;

  // Confirmation modal
  const confirmed = await showConfirmModal(
    "End Turn",
    "Are you sure you want to end your turn?"
  );

  if (!confirmed) return;

  try {
    await endTurn(currentGame.id, currentUsername);
    showToast("Turn ended", "success");
  } catch (error) {
    console.error("Error ending turn:", error);
    showToast(error.message, "error");
  }
}

/**
 * Handle undo button click
 */
function handleUndo() {
  // TODO: Implement undo functionality (Phase 3)
  showToast("Undo not yet implemented", "error");
}

/**
 * Handle animal card click (take card or view details)
 */
async function handleAnimalCardClick(e) {
  const cardEl = e.target.closest(".animal-card");
  if (!cardEl) return;

  const cardId = cardEl.dataset.cardId;
  if (!cardId) return;

  const canTake = currentGame.currentTurn === currentUsername && currentGame.turnPhase === "optional";

  if (canTake) {
    // Show options: Take card or View details
    const action = await showAnimalCardModal(cardId);

    if (action === "take") {
      try {
        await takeAnimalCard(currentGame.id, currentUsername, cardId);
        showToast("Animal card taken", "success");
      } catch (error) {
        console.error("Error taking card:", error);
        showToast(error.message, "error");
      }
    }
  } else {
    // Just show details
    showAnimalCardDetails(cardId);
  }
}

// ============================================================================
// UI HELPERS
// ============================================================================

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

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @returns {Promise<boolean>} True if confirmed
 */
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-overlay");
    const modal = document.getElementById("modal-content");

    modal.innerHTML = `
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Confirm</button>
      </div>
    `;

    overlay.classList.remove("hidden");

    document.getElementById("modal-cancel").addEventListener("click", () => {
      overlay.classList.add("hidden");
      resolve(false);
    });

    document.getElementById("modal-confirm").addEventListener("click", () => {
      overlay.classList.add("hidden");
      resolve(true);
    });

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
        resolve(false);
      }
    });
  });
}

/**
 * Show score breakdown modal
 */
function showScoreBreakdown() {
  // FIXED: Added null check for playerBoards
  const playerBoard = currentGame.playerBoards && currentGame.playerBoards[currentUsername];
  if (!playerBoard) {
    console.warn("[GameRoom] Player board not found for score breakdown:", currentUsername);
    showToast("Score data not available", "error");
    return;
  }

  const breakdown = playerBoard.score?.breakdown || {};
  const total = playerBoard.score?.total || 0;

  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal-content");

  modal.innerHTML = `
    <h2>Score Breakdown</h2>
    <div class="score-breakdown">
      <div class="score-row">
        <span>🌲 Trees</span>
        <span>${breakdown.trees || 0}</span>
      </div>
      <div class="score-row">
        <span>⛰️ Mountains</span>
        <span>${breakdown.mountains || 0}</span>
      </div>
      <div class="score-row">
        <span>🌾 Fields</span>
        <span>${breakdown.fields || 0}</span>
      </div>
      <div class="score-row">
        <span>🏘️ Buildings</span>
        <span>${breakdown.buildings || 0}</span>
      </div>
      <div class="score-row">
        <span>💧 Water</span>
        <span>${breakdown.water || 0}</span>
      </div>
      <div class="score-row">
        <span>🦊 Animals</span>
        <span>${breakdown.animals || 0}</span>
      </div>
      <div class="score-row total">
        <span><strong>Total</strong></span>
        <span><strong>${total}</strong></span>
      </div>
    </div>
    <button class="btn btn-primary" id="modal-close">Close</button>
  `;

  overlay.classList.remove("hidden");

  document.getElementById("modal-close").addEventListener("click", () => {
    overlay.classList.add("hidden");
  });
}

/**
 * Show menu modal
 */
function showMenu() {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal-content");

  modal.innerHTML = `
    <h2>Game Menu</h2>
    <div class="menu-options">
      <button class="btn btn-secondary btn-block" id="menu-rules">View Rules</button>
      <button class="btn btn-secondary btn-block" id="menu-leave">Leave Game</button>
      <button class="btn btn-primary btn-block" id="menu-close">Resume Game</button>
    </div>
  `;

  overlay.classList.remove("hidden");

  document.getElementById("menu-close").addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  document.getElementById("menu-rules").addEventListener("click", () => {
    window.open("game-rules.md", "_blank");
  });

  document.getElementById("menu-leave").addEventListener("click", async () => {
    const confirmed = await showConfirmModal(
      "Leave Game",
      "Are you sure you want to leave this game?"
    );
    if (confirmed) {
      cleanupGameRoom();
      // Navigate to lobby (handled by main.js)
      window.location.hash = "#lobby";
    }
  });
}

/**
 * Show animal card modal (take or view details)
 * @param {string} cardId - Animal card ID
 * @returns {Promise<string>} "take" or "view"
 */
function showAnimalCardModal(cardId) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-overlay");
    const modal = document.getElementById("modal-content");

    const card = currentGame.animalCards.available.find((c) => c.id === cardId);

    modal.innerHTML = `
      <h2>${card.name}</h2>
      <div class="animal-card-details">
        <p>Pattern: ${card.pattern?.length || 0} hexes</p>
        <p>Points: ${card.pointsPerPlacement?.join(", ") || "N/A"}</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-view">View Only</button>
        <button class="btn btn-primary" id="modal-take">Take Card</button>
      </div>
    `;

    overlay.classList.remove("hidden");

    document.getElementById("modal-view").addEventListener("click", () => {
      overlay.classList.add("hidden");
      resolve("view");
    });

    document.getElementById("modal-take").addEventListener("click", () => {
      overlay.classList.add("hidden");
      resolve("take");
    });
  });
}

/**
 * Show animal card details (view only)
 * @param {string} cardId - Animal card ID
 */
function showAnimalCardDetails(cardId) {
  const card = currentGame.animalCards.available.find((c) => c.id === cardId);
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal-content");

  // FIXED: Use emoji instead of missing image
  const animalEmoji = {
    bear: "🐻", deer: "🦌", rabbit: "🐰", duck: "🦆", fox: "🦊",
    lynx: "🐈", bird: "🐦", squirrel: "🐿️", hedgehog: "🦔", turtle: "🐢",
  };

  modal.innerHTML = `
    <h2>${card.name}</h2>
    <div class="animal-card-details">
      <div style="font-size: 64px; text-align: center;">${animalEmoji[card.animal] || "🦊"}</div>
      <p>Pattern: ${card.pattern?.length || 0} hexes</p>
      <p>Points: ${card.pointsPerPlacement?.join(", ") || "N/A"}</p>
    </div>
    <button class="btn btn-primary" id="modal-close">Close</button>
  `;

  overlay.classList.remove("hidden");

  document.getElementById("modal-close").addEventListener("click", () => {
    overlay.classList.add("hidden");
  });
}
