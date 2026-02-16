/**
 * Harmonies v4.0 - Game Scene
 *
 * Main gameplay scene with hex grid, tokens, and game logic
 */

import HexGrid from '../objects/HexGrid.js';
import CentralBoard from '../objects/CentralBoard.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hexGrid = null;
    this.centralBoard = null;
  }

  init(data) {
    // Receive data from LobbyScene
    this.gameId = data.gameId || 'TEST';
    this.username = data.username || 'Player';
    console.log('[GameScene] Initialized with gameId:', this.gameId, 'username:', this.username);
  }

  create() {
    console.log('[GameScene] Game scene created');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0xffffff).setOrigin(0);

    // Camera setup (for pan/zoom)
    this.setupCamera();

    // Create HexGrid (Phase 2: proper hex rendering)
    this.hexGrid = new HexGrid(this, 0, 0);

    // Create Central Board (token supply)
    this.centralBoard = new CentralBoard(this, -300, -400);
    this.centralBoard.setScrollFactor(0); // Fixed to camera

    // Load initial game state
    this.loadInitialState();

    // UI Layer
    this.createUI();

    // Test token supply
    this.testCentralBoard();

    // Back to lobby button (for testing)
    const backButton = this.add.text(20, 20, '← Back to Lobby', {
      fontSize: '18px',
      fill: '#3498db'
    });
    backButton.setInteractive({ useHandCursor: true });
    backButton.setScrollFactor(0);
    backButton.on('pointerdown', () => {
      console.log('[GameScene] Returning to lobby...');
      this.scene.start('LobbyScene');
    });

    // End game button (for testing)
    const endButton = this.add.text(20, 50, '🏆 End Game', {
      fontSize: '18px',
      fill: '#f39c12'
    });
    endButton.setInteractive({ useHandCursor: true });
    endButton.setScrollFactor(0);
    endButton.on('pointerdown', () => {
      console.log('[GameScene] Ending game...');
      this.scene.start('EndGameScene', {
        scores: [
          { player: 'Alice', score: 42 },
          { player: 'Bob', score: 38 }
        ],
        winner: 'Alice'
      });
    });

    // Controls hint
    const controlsHint = this.add.text(20, height - 30, 'Controls: Arrows=Pan | Wheel=Zoom | SPACE=Recenter', {
      fontSize: '14px',
      fill: '#7f8c8d',
      backgroundColor: 'rgba(255,255,255,0.8)',
      padding: { x: 8, y: 4 }
    });
    controlsHint.setScrollFactor(0);

    console.log('[GameScene] ✅ GameScene ready! Camera, hex grid placeholder, and UI initialized.');
  }

  setupCamera() {
    // Set camera bounds (large enough for expanding hex grid)
    this.cameras.main.setBounds(-2000, -2000, 4000, 4000);

    // Center camera on world origin (0, 0) where hexes will be placed
    this.cameras.main.centerOn(0, 0);

    // Enable camera controls (for testing)
    this.cursors = this.input.keyboard.createCursorKeys();

    // Mouse wheel zoom with smooth centering
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const oldZoom = this.cameras.main.zoom;

      if (deltaY > 0) {
        this.cameras.main.zoom *= 0.9; // Zoom out
      } else {
        this.cameras.main.zoom *= 1.1; // Zoom in
      }

      this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.3, 2);

      // Zoom toward mouse pointer position
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const zoomRatio = this.cameras.main.zoom / oldZoom;

      this.cameras.main.scrollX += (worldPoint.x - this.cameras.main.scrollX) * (1 - zoomRatio);
      this.cameras.main.scrollY += (worldPoint.y - this.cameras.main.scrollY) * (1 - zoomRatio);
    });

    // Middle mouse button or Space to recenter camera
    this.input.keyboard.on('keydown-SPACE', () => {
      this.cameras.main.centerOn(0, 0);
      console.log('[GameScene] Camera recentered to (0, 0)');
    });

    console.log('[GameScene] Camera setup complete (pan with arrows, zoom with wheel, recenter with SPACE)');
  }

  loadInitialState() {
    // Create initial game state (1 starting hex with empty terrain)
    const initialState = {
      "0_0": {
        q: 0,
        r: 0,
        stack: [],
        terrain: "empty"
      }
    };

    console.log('[GameScene] Loading initial hex grid state');
    this.hexGrid.updateFromState(initialState);

    // Test: Add some tokens to the center hex
    this.hexGrid.updateTokens(0, 0, [
      { color: 'brown' },
      { color: 'brown' },
      { color: 'green' }
    ]);

    console.log('[GameScene] ✅ Initial state loaded: 1 hex + 6 expansion hexes, 3-token tree');
  }

  testCentralBoard() {
    // Test: populate central board with random tokens
    const tokenColors = ['blue', 'yellow', 'brown', 'green', 'red', 'gray'];
    const centralBoardState = {
      tokens: []
    };

    for (let i = 0; i < 5; i++) {
      const spaceTokens = [];
      for (let j = 0; j < 3; j++) {
        spaceTokens.push({
          color: tokenColors[Math.floor(Math.random() * tokenColors.length)]
        });
      }
      centralBoardState.tokens.push(spaceTokens);
    }

    this.centralBoard.updateFromState(centralBoardState);
    console.log('[GameScene] ✅ Central board populated with test tokens');
  }

  createUI() {
    const width = this.cameras.main.width;

    // Top UI bar
    const uiBar = this.add.rectangle(0, 0, width, 80, 0x2c3e50, 0.95).setOrigin(0, 0);
    uiBar.setScrollFactor(0); // Fixed to camera

    // Game info
    const gameInfo = this.add.text(width / 2, 40, `Game: ${this.gameId} | Player: ${this.username}`, {
      fontSize: '24px',
      fill: '#ecf0f1'
    });
    gameInfo.setOrigin(0.5);
    gameInfo.setScrollFactor(0);

    // Score (placeholder)
    const score = this.add.text(width - 150, 40, 'Score: 0', {
      fontSize: '20px',
      fill: '#f39c12'
    });
    score.setOrigin(0.5);
    score.setScrollFactor(0);

    console.log('[GameScene] UI layer created');
  }

  update() {
    // Camera pan with arrow keys
    const speed = 5 / this.cameras.main.zoom;
    if (this.cursors.left.isDown) {
      this.cameras.main.scrollX -= speed;
    }
    if (this.cursors.right.isDown) {
      this.cameras.main.scrollX += speed;
    }
    if (this.cursors.up.isDown) {
      this.cameras.main.scrollY -= speed;
    }
    if (this.cursors.down.isDown) {
      this.cameras.main.scrollY += speed;
    }
  }
}
