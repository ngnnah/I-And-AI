/**
 * Harmonies v4.0 - Phaser Game Configuration
 *
 * Main game config including dimensions, scenes, and scale settings
 */

import PreloadScene from './scenes/PreloadScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import GameScene from './scenes/GameScene.js';
import EndGameScene from './scenes/EndGameScene.js';

export const gameConfig = {
  type: Phaser.AUTO, // Use WebGL if available, fallback to Canvas
  width: 1920,
  height: 1080,
  backgroundColor: '#f5f5f5',
  parent: 'game-container',

  // Scene order
  scene: [
    PreloadScene,
    LobbyScene,
    GameScene,
    EndGameScene
  ],

  // Responsive scaling
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  },

  // Physics (not needed for board game, but available)
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },

  // Render settings
  render: {
    pixelArt: false,
    antialias: true
  }
};
