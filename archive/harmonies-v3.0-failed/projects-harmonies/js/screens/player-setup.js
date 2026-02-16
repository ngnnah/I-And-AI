/**
 * Harmonies - Player Setup Screen
 *
 * Username login and profile creation
 */

import { savePlayer, getPlayer, generateDeviceId } from "../game/game-state.js";

/**
 * Initialize player setup screen
 */
export function initPlayerSetup() {
  const form = document.getElementById("username-form");
  const input = document.getElementById("username-input");

  // Check if player already logged in
  const existingPlayer = getPlayer();
  if (existingPlayer) {
    // Auto-navigate to lobby
    window.location.hash = "#lobby";
    return;
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = input.value.trim().toLowerCase();

    // Validation
    if (!username) {
      showError("Username is required");
      return;
    }

    if (username.length < 3) {
      showError("Username must be at least 3 characters");
      return;
    }

    if (username.length > 20) {
      showError("Username must be at most 20 characters");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      showError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // Save player profile
    const player = {
      username,
      displayName: input.value.trim(), // Keep original case
      deviceId: generateDeviceId(),
      createdAt: Date.now(),
    };

    savePlayer(player);

    // Navigate to lobby
    window.location.hash = "#lobby";
  });

  // Auto-focus input
  input.focus();
}

/**
 * Show error message below input
 * @param {string} message - Error message
 */
function showError(message) {
  const input = document.getElementById("username-input");
  const existingError = document.querySelector(".input-error");

  if (existingError) {
    existingError.remove();
  }

  const errorEl = document.createElement("div");
  errorEl.className = "input-error";
  errorEl.textContent = message;
  errorEl.style.color = "#F44336";
  errorEl.style.fontSize = "14px";
  errorEl.style.marginTop = "8px";

  input.parentElement.appendChild(errorEl);

  // Shake animation
  input.style.animation = "shake 0.3s";
  setTimeout(() => {
    input.style.animation = "";
  }, 300);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    errorEl.remove();
  }, 3000);
}
