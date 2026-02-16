/**
 * Harmonies v4.0 - Game Scene
 *
 * Main gameplay scene with hex grid, tokens, and game logic
 */

import HexGrid from '../objects/HexGrid.js';
import CentralBoard from '../objects/CentralBoard.js';
import { initializePersonalBoard } from '../../game/hex-grid.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hexGrid = null;
    this.centralBoard = null;
    this.gameState = null; // Track full game state
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

    // Setup drag and drop
    this.setupDragAndDrop();

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
    // Harmonies player board: 5 columns, 5-4-5-4-5 = 23 hexes
    this.gameState = initializePersonalBoard();

    console.log('[GameScene] Loading player board:', Object.keys(this.gameState).length, 'hexes');
    this.hexGrid.updateFromState(this.gameState, false);

    console.log('[GameScene] ✅ Initial state loaded:', Object.keys(this.gameState).length, 'hexes');
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

  setupDragAndDrop() {
    // Drag start
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setScale(1.3);
      gameObject.setAlpha(0.8);
      gameObject.setDepth(1000); // Bring to front
      console.log('[GameScene] Drag started:', gameObject.getData('color'));
    });

    // Dragging
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    // Drag over hex (highlight)
    this.input.on('dragenter', (pointer, gameObject, dropZone) => {
      if (dropZone.getData) {
        const coord = dropZone.getData('coord');
        if (coord) {
          this.hexGrid.highlightHex(coord.q, coord.r, 0x27ae60); // Green for valid
          console.log('[GameScene] Drag over hex:', coord.q, coord.r);
        }
      }
    });

    // Drag leave hex (unhighlight)
    this.input.on('dragleave', (pointer, gameObject, dropZone) => {
      this.hexGrid.clearHighlights();
    });

    // Drop on hex
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      const coord = dropZone.getData('coord');
      const tokenColor = gameObject.getData('color');

      if (!coord || !tokenColor) {
        console.warn('[GameScene] Invalid drop - missing coord or color');
        this.returnTokenToOriginal(gameObject);
        return;
      }

      console.log('[GameScene] Token dropped:', tokenColor, 'on hex', coord.q, coord.r);

      // Validate placement using token-manager
      const canPlace = this.validateTokenPlacement(coord.q, coord.r, tokenColor);

      if (canPlace) {
        // Place token on hex
        this.placeTokenOnHex(gameObject, coord.q, coord.r, tokenColor);
        console.log('[GameScene] ✅ Token placed successfully!');
      } else {
        // Invalid placement
        console.log('[GameScene] ❌ Invalid placement - returning token');
        this.returnTokenToOriginal(gameObject);

        // Show error feedback
        this.hexGrid.highlightHex(coord.q, coord.r, 0xe74c3c); // Red for invalid
        this.time.delayedCall(500, () => {
          this.hexGrid.clearHighlights();
        });
      }
    });

    // Drag end (no drop)
    this.input.on('dragend', (pointer, gameObject, dropped) => {
      if (!dropped) {
        console.log('[GameScene] Drag cancelled - returning token');
        this.returnTokenToOriginal(gameObject);
      }

      this.hexGrid.clearHighlights();
      gameObject.setScale(1);
      gameObject.setAlpha(1);
      gameObject.setDepth(0);
    });

    console.log('[GameScene] ✅ Drag and drop system initialized');
  }

  validateTokenPlacement(q, r, tokenColor) {
    // Get current hex state
    const hexKey = `${q}_${r}`;
    const hex = this.hexGrid.getHex(q, r);

    if (!hex) {
      console.warn('[GameScene] Hex not found:', hexKey);
      return false;
    }

    // Get current stack from game state
    const hexState = this.gameState[hexKey];
    if (!hexState) {
      console.warn('[GameScene] Hex state not found:', hexKey);
      return false;
    }

    const stack = hexState.stack || [];

    // Simple validation: max 3 tokens per hex
    // (Phase 4 will add full stacking rules from token-manager)
    if (stack.length >= 3) {
      console.log('[GameScene] Cannot place: hex is full (3 tokens max)');
      return false;
    }

    return true;
  }

  placeTokenOnHex(tokenSprite, q, r, color) {
    // Get hex position
    const pos = this.hexGrid.hexToPixel(q, r);

    // Animate token to hex center
    this.tweens.add({
      targets: tokenSprite,
      x: pos.x,
      y: pos.y,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Remove draggable token sprite
        tokenSprite.destroy();

        const hexKey = `${q}_${r}`;

        // Add token to existing stack (don't replace)
        if (this.gameState[hexKey]) {
          this.gameState[hexKey].stack.push({ color });
        } else {
          // Fallback: create new hex if somehow missing
          this.gameState[hexKey] = {
            q, r,
            stack: [{ color }],
            terrain: 'empty'
          };
        }

        // Rebuild hex grid from full state (no expansion)
        this.hexGrid.updateFromState(this.gameState, false);

        console.log('[GameScene] Token placed on', hexKey, '- stack height:', this.gameState[hexKey].stack.length);
      }
    });
  }

  returnTokenToOriginal(tokenSprite) {
    // Return to original position (stored in data)
    const spaceIndex = tokenSprite.getData('spaceIndex');
    const tokenIndex = tokenSprite.getData('tokenIndex');

    // Calculate original position
    const spaceX = -300 + spaceIndex * 140;
    const spaceY = -400;
    const positions = [
      { x: spaceX - 30, y: spaceY },
      { x: spaceX, y: spaceY },
      { x: spaceX + 30, y: spaceY }
    ];

    const originalPos = positions[tokenIndex];

    this.tweens.add({
      targets: tokenSprite,
      x: originalPos.x,
      y: originalPos.y,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
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
