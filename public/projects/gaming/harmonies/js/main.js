/**
 * Harmonies v4.0 - Main Entry Point
 *
 * Initializes Phaser game with configuration
 */

import { gameConfig } from './phaser/config.js';

console.log('[Main] Harmonies v4.0 starting...');

// Create Phaser game instance
const game = new Phaser.Game(gameConfig);

// Expose to window for debugging
window.phaserGame = game;

console.log('[Main] ✅ Phaser game initialized!');
console.log('[Main] Scene flow: Preload → Lobby → Game → EndGame');
