/**
 * Game Over Screen
 * Handles display of final results and summary
 */

import { currentGame, clearCurrentGame } from '../game/game-state.js';
import { navigateTo } from '../main.js';

// DOM elements
const clearedText = document.getElementById('cleared-text');
const emojiRating = document.getElementById('emoji-rating');
const themeRecapList = document.getElementById('theme-recap-list');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');

/**
 * Get emoji rating based on success rate
 * @param {number} successCount - Number of successful rounds
 * @param {number} roundsTotal - Total rounds played
 * @returns {string} Emoji rating
 */
function getEmojiRating(successCount, roundsTotal) {
    if (roundsTotal === 0) return '💪';
    const ratio = successCount / roundsTotal;

    if (ratio >= 1) return '🌟';
    if (ratio > 0.75) return '🎊';
    if (ratio > 0.5) return '👏';
    return '💪';
}

/**
 * Render final results
 */
function renderResults() {
    if (!currentGame.data) {
        console.error('No game data available');
        navigateTo('lobby');
        return;
    }

    const game = currentGame.data;
    const successCount = game.gameState?.successCount ?? 0;
    const roundsTotal = game.settings?.roundsTotal ?? 1;
    const usedThemeIds = game.gameState?.usedThemeIds || [];

    // Success count
    clearedText.textContent = `${successCount} / ${roundsTotal} rounds cleared`;

    // Emoji rating
    emojiRating.textContent = getEmojiRating(successCount, roundsTotal);

    // Themes played
    themeRecapList.innerHTML = '';
    if (usedThemeIds.length > 0) {
        usedThemeIds.forEach((themeId) => {
            const li = document.createElement('li');
            li.textContent = themeId;
            themeRecapList.appendChild(li);
        });
    }
}

/**
 * Handle back to lobby button click
 */
function handleBackToLobby() {
    clearCurrentGame();
    navigateTo('lobby');
}

/**
 * Initialize screen
 */
function init() {
    // Event listener
    backToLobbyBtn.addEventListener('click', handleBackToLobby);

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'game-over') {
            renderResults();
        }
    });

    console.log('Game over screen initialized');
}

// Initialize on load
init();
