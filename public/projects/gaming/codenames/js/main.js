/**
 * Main entry point — screen routing and app initialization
 */

import { database } from './game/firebase-config.js';
import { setCurrentScreen, restorePlayer } from './game/game-state.js';

const screens = {
  'player-setup': document.getElementById('screen-player-setup'),
  'lobby': document.getElementById('screen-lobby'),
  'game-room': document.getElementById('screen-game-room')
};

/**
 * Navigate to a specific screen
 * @param {string} screenName
 */
export function navigateTo(screenName) {
  if (!screens[screenName]) {
    console.error(`Screen "${screenName}" not found`);
    return;
  }

  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenName].classList.remove('hidden');
  setCurrentScreen(screenName);

  window.dispatchEvent(new CustomEvent('screen-changed', {
    detail: { screen: screenName }
  }));
}

async function initializeApp() {
  console.log('Initializing Codenames...');
  console.log('Firebase:', database ? 'Connected' : 'Not connected');

  try {
    await Promise.all([
      import('./screens/player-setup.js'),
      import('./screens/lobby.js'),
      import('./screens/game-room.js')
    ]);
    console.log('All screen modules loaded');
  } catch (error) {
    console.error('Failed to load screen modules:', error);
    alert('Failed to load game. Please refresh.');
    return;
  }

  const playerRestored = restorePlayer();
  navigateTo(playerRestored ? 'lobby' : 'player-setup');
  console.log('App ready');
}

document.addEventListener('DOMContentLoaded', initializeApp);

export { screens };
