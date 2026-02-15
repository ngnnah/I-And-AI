// Main app router

import { initializeFirebase } from './game/firebase-config.js';
import * as PlayerSetup from './screens/player-setup.js';
import * as Lobby from './screens/lobby.js';
import * as GameRoom from './screens/game-room.js';

const screens = {
  'player-setup': { module: PlayerSetup, elementId: 'player-setup-screen' },
  'lobby': { module: Lobby, elementId: 'lobby-screen' },
  'game-room': { module: GameRoom, elementId: 'game-room-screen' }
};

let currentScreen = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
  navigateTo('player-setup');
});

// Navigate to screen
export function navigateTo(screenName, params = {}) {
  // Cleanup current screen
  if (currentScreen && screens[currentScreen].module.cleanup) {
    screens[currentScreen].module.cleanup();
  }

  // Hide all screens
  for (const screen of Object.values(screens)) {
    const el = document.getElementById(screen.elementId);
    if (el) el.style.display = 'none';
  }

  // Show new screen
  const newScreen = screens[screenName];
  if (!newScreen) {
    console.error(`Screen ${screenName} not found`);
    return;
  }

  const el = document.getElementById(newScreen.elementId);
  if (el) el.style.display = 'block';

  // Initialize new screen
  if (newScreen.module.init) {
    newScreen.module.init(params);
  }

  currentScreen = screenName;
}

// Make navigateTo globally accessible
window.navigateTo = navigateTo;
