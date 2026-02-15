/**
 * Harmonies - Game Room UI (v3.0 Mobile-First)
 *
 * Touch-optimized game interface with BGA-inspired UX
 */

import { ref, onValue } from "../game/firebase-config.js";
import {
  selectCentralSpace,
  placeSingleToken,
  endTurn,
  takeAnimalCard,
  placeAnimalCubes,
} from "../game/firebase-sync.js";
import { getValidPlacementHexes } from "../game/token-manager.js";
import { renderHexGrid, highlightValidHexes, clearHighlights } from "../ui/board-renderer.js";

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
  currentUsername = username;

  // Listen to game updates
  const gameRef = ref(`games/${gameId}`);
  unsubscribeGame = onValue(gameRef, (snapshot) => {
    currentGame = snapshot.val();
    if (currentGame) {
      renderGameState();
    }
  });

  // Set up event listeners
  setupEventListeners();

  // Initial render
  if (currentGame) {
    renderGameState();
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
  // Central board spaces (tap to select)
  document.getElementById("central-spaces").addEventListener("click", handleCentralSpaceClick);

  // Hex grid (tap to place token)
  document.getElementById("hex-grid-svg").addEventListener("click", handleHexClick);

  // End turn button
  document.getElementById("end-turn-btn").addEventListener("click", handleEndTurn);

  // Undo button
  document.getElementById("undo-btn").addEventListener("click", handleUndo);

  // Score breakdown button
  document.getElementById("score-breakdown-btn").addEventListener("click", showScoreBreakdown);

  // Menu button
  document.getElementById("menu-btn").addEventListener("click", showMenu);

  // Animal cards (tap to take or view)
  document.getElementById("animal-cards-row").addEventListener("click", handleAnimalCardClick);

  // Haptic feedback on touch (iOS/Android)
  if (navigator.vibrate) {
    document.addEventListener("touchstart", (e) => {
      if (e.target.closest(".central-space, .hex, .btn")) {
        navigator.vibrate(10); // Light tap feedback
      }
    });
  }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

/**
 * Main render function - updates entire UI based on game state
 */
function renderGameState() {
  if (!currentGame) return;

  renderTurnIndicator();
  renderCentralBoard();
  renderAnimalCards();
  renderPlayerBoard();
  renderBottomBar();
  renderProgressIndicator();
}

/**
 * Render turn indicator (sticky header)
 */
function renderTurnIndicator() {
  const indicator = document.getElementById("turn-indicator");
  const playerNameEl = document.getElementById("turn-player-name");
  const phaseEl = document.getElementById("turn-phase");

  const isMyTurn = currentGame.currentTurn === currentUsername;
  const currentPlayer = currentGame.players[currentGame.currentTurn];

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
  container.innerHTML = "";

  const spaces = currentGame.centralBoard.spaces || [];
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
  container.innerHTML = "";

  const availableCards = currentGame.animalCards.available || [];

  availableCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = "animal-card";
    cardEl.dataset.cardId = card.id;

    // Card image (placeholder)
    cardEl.innerHTML = `
      <div class="animal-card-image">
        <img src="data/harmonies/03_CONTENT/_GRAPHICS/${card.animal || "bird"}.png" alt="${card.name}" />
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
  const playerBoard = currentGame.playerBoards[currentUsername];
  if (!playerBoard) return;

  // Update score display
  document.getElementById("current-score").textContent = playerBoard.score?.total || 0;

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

  if (currentGame.turnPhase === "placing" && currentGame.currentTurn === currentUsername) {
    const playerBoard = currentGame.playerBoards[currentUsername];
    const tokensInHand = playerBoard.tokensInHand || [];
    const placed = 3 - tokensInHand.length;

    currentEl.textContent = placed;
    totalEl.textContent = 3;
    indicator.classList.remove("hidden");
  } else {
    indicator.classList.add("hidden");
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

  const playerBoard = currentGame.playerBoards[currentUsername];
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
  const playerBoard = currentGame.playerBoards[currentUsername];
  if (!playerBoard) return;

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

  modal.innerHTML = `
    <h2>${card.name}</h2>
    <div class="animal-card-details">
      <img src="data/harmonies/03_CONTENT/_CARDS/${card.id}.png" alt="${card.name}" style="max-width: 100%;">
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
