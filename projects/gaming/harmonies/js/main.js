/**
 * Harmonies - Main Application Entry Point
 *
 * Routing and screen management
 */

import { initializeFirebase } from "./game/firebase-config.js";
import { initPlayerSetup } from "./screens/player-setup.js";
import { initLobby, cleanupLobby } from "./screens/lobby.js";
import { initGameRoom, cleanupGameRoom } from "./screens/game-room.js";
import { enablePinchZoom } from "./ui/board-renderer-simple.js";

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize Firebase
const database = initializeFirebase();

if (!database) {
  console.error("Failed to initialize Firebase. Multiplayer features will not work.");
  alert("Failed to connect to game server. Please refresh the page.");
}

// Enable mobile optimizations
if (isMobileDevice()) {
  document.body.classList.add("mobile");
  enablePinchZoom();
}

// Start routing
initRouter();

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Initialize client-side routing
 */
function initRouter() {
  // Handle hash changes
  window.addEventListener("hashchange", handleRouteChange);

  // Handle initial load
  handleRouteChange();
}

/**
 * Handle route changes
 */
function handleRouteChange() {
  try {
    const hash = window.location.hash.slice(1); // Remove '#'
    const [route, ...params] = hash.split("/");

    console.log(`[Router] Navigating to: ${route || 'setup'}`, params);

    // Hide all screens
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.add("hidden");
    });

    // Clean up previous screen
    try {
      cleanupLobby();
      cleanupGameRoom();
    } catch (err) {
      console.warn("[Router] Cleanup error:", err);
    }

    // Route to appropriate screen
    switch (route) {
      case "":
      case "setup":
        showScreen("screen-player-setup");
        initPlayerSetup();
        break;

      case "lobby":
        showScreen("screen-lobby");
        initLobby();
        break;

      case "game":
        if (params.length > 0) {
          const gameId = params[0];
          showScreen("screen-game-room");
          initGameRoomWithId(gameId);
        } else {
          // No game ID, redirect to lobby
          console.warn("[Router] No game ID provided, redirecting to lobby");
          window.location.hash = "#lobby";
        }
        break;

      default:
        // Unknown route, redirect to setup
        console.warn(`[Router] Unknown route: ${route}, redirecting to setup`);
        window.location.hash = "#setup";
    }
  } catch (error) {
    console.error("[Router] Fatal routing error:", error);
    showToast("Navigation error. Please refresh the page.", "error");
  }
}

/**
 * Show a specific screen
 * @param {string} screenId - Screen element ID
 */
function showScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove("hidden");
  }
}

/**
 * Initialize game room with game ID
 * @param {string} gameId - Game room code
 */
function initGameRoomWithId(gameId) {
  const player = JSON.parse(localStorage.getItem("harmonies_player"));

  if (!player) {
    // Not logged in, redirect to setup
    window.location.hash = "#setup";
    return;
  }

  initGameRoom(gameId, player.username);
}

// ============================================================================
// MOBILE DETECTION
// ============================================================================

/**
 * Detect if device is mobile
 * @returns {boolean} True if mobile device
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ============================================================================
// SERVICE WORKER (Progressive Web App)
// ============================================================================

// Register service worker for offline support (optional, Phase 4)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // navigator.registerServiceWorker('/sw.js') // Uncomment for PWA
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
  showToast("An error occurred. Please refresh the page.", "error");
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  showToast("An error occurred. Please refresh the page.", "error");
});

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - "success", "error", or default
 */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// ============================================================================
// DEBUGGING (Development Only)
// ============================================================================

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("%c🎮 Harmonies v3.0 (Development Mode)", "color: #4CAF50; font-size: 16px; font-weight: bold;");
  console.log("%cMobile-First | BGA-Inspired | Corrected Rules", "color: #999; font-size: 12px;");

  // Expose debug helpers
  window.harmoniesDebug = {
    getPlayer: () => JSON.parse(localStorage.getItem("harmonies_player")),
    clearPlayer: () => localStorage.removeItem("harmonies_player"),
    navigate: (route) => (window.location.hash = `#${route}`),
  };

  console.log("%cDebug helpers available: window.harmoniesDebug", "color: #2196F3; font-size: 12px;");
}
