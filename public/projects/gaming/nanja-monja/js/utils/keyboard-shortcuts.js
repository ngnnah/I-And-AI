/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts for the application
 */

import { getCurrentScreen } from '../game/game-state.js';

/**
 * Initialize keyboard shortcuts
 */
export function initKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard shortcuts initialized');
}

/**
 * Handle global key presses
 */
function handleKeyPress(event) {
    // Ignore if typing in an input field (except Enter)
    const isInputField = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
    if (isInputField && event.key !== 'Enter') {
        return;
    }

    const currentScreen = getCurrentScreen();
    const key = event.key.toLowerCase();

    // Player Setup Screen
    if (currentScreen === 'player-setup') {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('continue-btn')?.click();
        }
    }

    // Lobby Screen
    else if (currentScreen === 'lobby') {
        // Keyboard shortcuts disabled for lobby
        // Users should click buttons directly
    }

    // Game Room Screen
    else if (currentScreen === 'game-room') {
        // Space to flip card
        if (event.key === ' ') {
            const flipBtn = document.getElementById('flip-card-btn');
            if (flipBtn && !flipBtn.classList.contains('hidden') && !flipBtn.disabled) {
                event.preventDefault();
                flipBtn.click();
            }
        }
        // Enter to submit name or acknowledge
        else if (event.key === 'Enter') {
            const namingSection = document.getElementById('naming-section');
            const submitNameBtn = document.getElementById('submit-name-btn');
            const acknowledgeBtn = document.getElementById('acknowledge-btn');

            if (namingSection && !namingSection.classList.contains('hidden')) {
                event.preventDefault();
                submitNameBtn?.click();
            } else if (acknowledgeBtn && !acknowledgeBtn.disabled && !acknowledgeBtn.parentElement.classList.contains('hidden')) {
                event.preventDefault();
                acknowledgeBtn.click();
            }
        }
        // Other keyboard shortcuts disabled
        // Only Space (flip) and Enter (submit/acknowledge) are active
    }

    // Game Over Screen
    else if (currentScreen === 'game-over') {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('back-to-lobby-btn')?.click();
        }
    }
}
