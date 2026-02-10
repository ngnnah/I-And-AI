/**
 * Main Application Entry Point
 * Handles screen routing and app initialization
 */

import { database } from './game/firebase-config.js';
import { setCurrentScreen, restorePlayer } from './game/game-state.js';
import { initKeyboardShortcuts } from './utils/keyboard-shortcuts.js';

// Screen elements
const screens = {
    'player-setup': document.getElementById('screen-player-setup'),
    'lobby': document.getElementById('screen-lobby'),
    'game-room': document.getElementById('screen-game-room'),
    'game-over': document.getElementById('screen-game-over')
};

/**
 * Navigate to a specific screen
 * @param {string} screenName - Name of the screen to navigate to
 */
export function navigateTo(screenName) {
    if (!screens[screenName]) {
        console.error(`Screen "${screenName}" not found`);
        return;
    }

    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show target screen
    screens[screenName].classList.remove('hidden');

    // Update game state
    setCurrentScreen(screenName);

    // Dispatch screen-changed event for screen lifecycle hooks
    window.dispatchEvent(new CustomEvent('screen-changed', {
        detail: { screen: screenName }
    }));

    console.log(`Navigated to: ${screenName}`);
}

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('Initializing Nanja Monja...');

    // Firebase is auto-initialized when firebase-config.js is imported
    console.log('Firebase initialized:', database ? 'Connected' : 'Not connected');

    // Import all screen modules (they will set up their own event listeners)
    try {
        await Promise.all([
            import('./screens/player-setup.js'),
            import('./screens/lobby.js'),
            import('./screens/game-room.js'),
            import('./screens/game-over.js')
        ]);
        console.log('All screen modules loaded');
    } catch (error) {
        console.error('Failed to load screen modules:', error);
        alert('Failed to load game components. Please refresh the page.');
        return;
    }

    // Restore player from localStorage if available
    const playerRestored = restorePlayer();
    if (playerRestored) {
        console.log('Player restored from localStorage');
        navigateTo('lobby');
    } else {
        console.log('No stored player, showing setup screen');
        navigateTo('player-setup');
    }

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    console.log('App initialization complete');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for use by screen modules
export { screens };
