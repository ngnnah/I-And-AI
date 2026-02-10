/**
 * Player Setup Screen
 * Handles player name entry and validation
 */

import { generatePlayerId } from '../game/firebase-config.js';
import { setLocalPlayer, getStoredPlayerName } from '../game/game-state.js';
import { validatePlayerName } from '../game/game-logic.js';
import { navigateTo } from '../main.js';

// DOM elements
const nameInput = document.getElementById('player-name-input');
const continueBtn = document.getElementById('continue-btn');
const errorDiv = document.getElementById('name-error');

/**
 * Show error message
 */
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorDiv.classList.add('hidden');
}

/**
 * Handle continue button click
 */
function handleContinue() {
    hideError();

    const playerName = nameInput.value.trim();

    // Validate player name
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }

    // Generate unique player ID
    const playerId = generatePlayerId();

    // Store player info locally
    setLocalPlayer(playerId, playerName);

    console.log(`Player setup complete: ${playerName} (${playerId})`);

    // Navigate to lobby
    navigateTo('lobby');
}

/**
 * Handle Enter key press in input
 */
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        handleContinue();
    }
}

/**
 * Initialize screen
 */
function init() {
    // Pre-fill input from localStorage if available
    const storedName = getStoredPlayerName();
    if (storedName) {
        nameInput.value = storedName;
    }

    // Event listeners
    continueBtn.addEventListener('click', handleContinue);
    nameInput.addEventListener('keypress', handleKeyPress);

    // Focus input when screen loads
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'player-setup') {
            setTimeout(() => nameInput.focus(), 100);
        }
    });

    console.log('Player setup screen initialized');
}

// Initialize on load
init();
