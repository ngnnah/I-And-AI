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
        if (key === 'c') {
            event.preventDefault();
            document.getElementById('create-game-btn')?.click();
        }
        // Join games with number keys (1-9)
        else if (key >= '1' && key <= '9') {
            event.preventDefault();
            const index = parseInt(key) - 1;
            const joinButtons = document.querySelectorAll('.join-btn');
            if (joinButtons[index]) {
                joinButtons[index].click();
            }
        }
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
        // S to shout
        else if (key === 's') {
            const shoutBtn = document.getElementById('shout-btn');
            if (shoutBtn && !shoutBtn.classList.contains('hidden') && !shoutBtn.disabled) {
                event.preventDefault();
                shoutBtn.click();
            }
        }
        // A to acknowledge
        else if (key === 'a') {
            const acknowledgeBtn = document.getElementById('acknowledge-btn');
            if (acknowledgeBtn && !acknowledgeBtn.disabled && !acknowledgeBtn.parentElement.classList.contains('hidden')) {
                event.preventDefault();
                acknowledgeBtn.click();
            }
        }
        // N to toggle named creatures dropdown
        else if (key === 'n') {
            const toggleCreaturesBtn = document.getElementById('toggle-creatures-btn');
            if (toggleCreaturesBtn && !toggleCreaturesBtn.disabled) {
                event.preventDefault();
                toggleCreaturesBtn.click();
            }
        }
        // L to leave game
        else if (key === 'l') {
            const leaveGameBtn = document.getElementById('leave-game-btn');
            if (leaveGameBtn) {
                event.preventDefault();
                leaveGameBtn.click();
            }
        }
    }

    // Game Over Screen
    else if (currentScreen === 'game-over') {
        if (key === 'b' || event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('back-to-lobby-btn')?.click();
        }
    }
}
