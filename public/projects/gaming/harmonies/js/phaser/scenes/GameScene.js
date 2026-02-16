/**
 * Harmonies v4.0 - Game Scene
 *
 * Main gameplay scene with hex grid, tokens, and game logic
 */

import HexGrid from '../objects/HexGrid.js';
import CentralBoard from '../objects/CentralBoard.js';
import { initializePersonalBoard } from '../../game/hex-grid.js';
import { canPlaceToken } from '../../game/token-manager.js';
import {
  scoreTreesModule,
  scoreMountainsModule,
  scoreFieldsModule,
  scoreBuildingsModule,
  scoreWaterModule,
  calculateTotalScore
} from '../../game/scoring-engine.js';
import { ANIMAL_CARDS } from '../../data/animal-cards.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hexGrid = null;
    this.centralBoard = null;
    this.gameState = null; // Track full game state
    this.isSolo = false; // Solo mode flag
    this.animalCards = []; // Available animal cards (3 for solo)
    
    // Turn management
    this.turnPhase = 'SELECT_SPACE'; // SELECT_SPACE | PLACE_TOKEN_1 | PLACE_TOKEN_2 | PLACE_TOKEN_3 | TURN_END
    this.currentTurn = 1;
    this.selectedSpace = null; // Index of selected central board space
    this.tokensToPlace = []; // Array of {color} from selected space
    this.tokensPlaced = 0; // 0, 1, 2, or 3
    this.turnText = null; // UI text showing current phase
  }

  init(data) {
    // Receive data from LobbyScene
    this.gameId = data.gameId || 'TEST';
    this.username = data.username || 'Player';
    this.isSolo = data.isSolo || false;
    console.log('[GameScene] Initialized with gameId:', this.gameId, 'username:', this.username, 'solo:', this.isSolo);
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

    // Create Central Board (token supply) - 3 spaces for solo, 5 for multiplayer
    this.centralBoard = new CentralBoard(this, -300, -400, this.isSolo);
    this.centralBoard.setScrollFactor(0); // Fixed to camera

    // Load initial game state
    this.loadInitialState();

    // UI Layer
    this.createUI();
    
    // Turn management UI
    this.createTurnUI();
    
    // Listen for central board space selection
    this.events.on('centralSpaceSelected', this.onSpaceSelected, this);

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
      this.triggerEndGame();
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
    this.centralBoardState = {
      tokens: []
    };

    const numSpaces = this.isSolo ? 3 : 5;
    for (let i = 0; i < numSpaces; i++) {
      const spaceTokens = [];
      for (let j = 0; j < 3; j++) {
        spaceTokens.push({
          color: tokenColors[Math.floor(Math.random() * tokenColors.length)]
        });
      }
      this.centralBoardState.tokens.push(spaceTokens);
    }

    this.centralBoard.updateFromState(this.centralBoardState);
    console.log('[GameScene] ✅ Central board populated with test tokens (', numSpaces, 'spaces)');
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

    // Score panel (right side)
    this.createScorePanel();
    
    // Animal cards (left side)
    this.createAnimalCards();

    console.log('[GameScene] UI layer created');
  }

  createAnimalCards() {
    // Select 3 random animal cards for solo mode
    const numCards = this.isSolo ? 3 : 5;
    const shuffled = [...ANIMAL_CARDS].sort(() => Math.random() - 0.5);
    this.animalCards = shuffled.slice(0, numCards);
    
    const cardWidth = 140;
    const cardHeight = 100;
    const startX = 50;
    const startY = 100;
    const spacing = 20;
    
    this.animalCards.forEach((card, i) => {
      const x = startX + cardWidth / 2;
      const y = startY + i * (cardHeight + spacing) + cardHeight / 2;
      
      // Card background
      const bg = this.add.rectangle(x, y, cardWidth, cardHeight, 0x8e44ad, 0.9);
      bg.setScrollFactor(0);
      bg.setStrokeStyle(2, 0x6c3483);
      
      // Card name
      const name = this.add.text(x, y - 30, card.name, {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold'
      });
      name.setOrigin(0.5);
      name.setScrollFactor(0);
      
      // Pattern info (simplified)
      const patternInfo = card.pattern.map(p => p.terrain).join(' + ');
      const pattern = this.add.text(x, y, patternInfo, {
        fontSize: '12px',
        fill: '#ecf0f1'
      });
      pattern.setOrigin(0.5);
      pattern.setScrollFactor(0);
      
      // Max points
      const maxPoints = card.pointsPerPlacement[card.pointsPerPlacement.length - 1];
      const points = this.add.text(x, y + 25, `Max: ${maxPoints} pts`, {
        fontSize: '14px',
        fill: '#f39c12',
        fontStyle: 'bold'
      });
      points.setOrigin(0.5);
      points.setScrollFactor(0);
    });
    
    console.log('[GameScene] Animal cards displayed:', this.animalCards.length);
  }

  createScorePanel() {
    const width = this.cameras.main.width;
    
    // Score panel background
    const panelX = width - 200;
    const panelY = 100;
    const panelBg = this.add.rectangle(panelX, panelY, 180, 300, 0x34495e, 0.9);
    panelBg.setScrollFactor(0);
    panelBg.setStrokeStyle(2, 0x2c3e50);
    
    // Score title
    const title = this.add.text(panelX, panelY - 130, 'SCORE', {
      fontSize: '20px',
      fill: '#f39c12',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    
    // Total score
    this.totalScoreText = this.add.text(panelX, panelY - 100, '0', {
      fontSize: '36px',
      fill: '#2ecc71',
      fontStyle: 'bold'
    });
    this.totalScoreText.setOrigin(0.5);
    this.totalScoreText.setScrollFactor(0);
    
    // Category scores
    const categories = [
      { label: 'Trees', key: 'trees' },
      { label: 'Mountains', key: 'mountains' },
      { label: 'Fields', key: 'fields' },
      { label: 'Buildings', key: 'buildings' },
      { label: 'Water', key: 'water' },
      { label: 'Animals', key: 'animals' }
    ];
    
    this.categoryTexts = {};
    
    categories.forEach((cat, i) => {
      const y = panelY - 50 + (i * 35);
      
      const label = this.add.text(panelX - 70, y, cat.label + ':', {
        fontSize: '14px',
        fill: '#bdc3c7'
      });
      label.setOrigin(0, 0.5);
      label.setScrollFactor(0);
      
      const value = this.add.text(panelX + 50, y, '0', {
        fontSize: '16px',
        fill: '#ecf0f1',
        fontStyle: 'bold'
      });
      value.setOrigin(0.5);
      value.setScrollFactor(0);
      
      this.categoryTexts[cat.key] = value;
    });
    
    console.log('[GameScene] Score panel created');
  }

  updateScore() {
    // Calculate all category scores
    const scores = {
      trees: scoreTreesModule(this.gameState),
      mountains: scoreMountainsModule(this.gameState),
      fields: scoreFieldsModule(this.gameState),
      buildings: scoreBuildingsModule(this.gameState),
      water: scoreWaterModule(this.gameState, 'A'), // Board side A (rivers)
      animals: 0 // TODO: Implement animal scoring when cards added
    };
    
    // Update category texts
    for (const key in scores) {
      if (this.categoryTexts[key]) {
        this.categoryTexts[key].setText(scores[key].toString());
      }
    }
    
    // Update total
    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    this.totalScoreText.setText(total.toString());
    
    console.log('[GameScene] Score updated:', total, scores);
  }

  createTurnUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Turn panel background
    const panelBg = this.add.rectangle(width / 2, height - 100, 600, 120, 0x34495e, 0.9);
    panelBg.setScrollFactor(0);
    panelBg.setStrokeStyle(3, 0x2c3e50);

    // Turn number
    this.turnText = this.add.text(width / 2, height - 130, `Turn ${this.currentTurn}`, {
      fontSize: '24px',
      fill: '#f39c12',
      fontStyle: 'bold'
    });
    this.turnText.setOrigin(0.5);
    this.turnText.setScrollFactor(0);

    // Instruction text
    this.instructionText = this.add.text(width / 2, height - 90, 
      'Select a token space from the central board', {
      fontSize: '18px',
      fill: '#ecf0f1',
      align: 'center'
    });
    this.instructionText.setOrigin(0.5);
    this.instructionText.setScrollFactor(0);

    // Token placement counter
    this.tokenCounterText = this.add.text(width / 2, height - 60, 
      'Tokens to place: 3', {
      fontSize: '16px',
      fill: '#95a5a6',
      align: 'center'
    });
    this.tokenCounterText.setOrigin(0.5);
    this.tokenCounterText.setScrollFactor(0);

    // End Turn button (initially hidden)
    this.endTurnButton = this.add.text(width / 2, height - 30, '[ END TURN ]', {
      fontSize: '18px',
      fill: '#27ae60',
      fontStyle: 'bold'
    });
    this.endTurnButton.setOrigin(0.5);
    this.endTurnButton.setScrollFactor(0);
    this.endTurnButton.setInteractive({ useHandCursor: true });
    this.endTurnButton.setVisible(false);

    this.endTurnButton.on('pointerover', () => {
      this.endTurnButton.setStyle({ fill: '#2ecc71' });
    });

    this.endTurnButton.on('pointerout', () => {
      this.endTurnButton.setStyle({ fill: '#27ae60' });
    });

    this.endTurnButton.on('pointerdown', () => {
      this.endTurn();
    });

    console.log('[GameScene] Turn UI created');
  }

  onSpaceSelected(spaceIndex) {
    if (this.turnPhase !== 'SELECT_SPACE') {
      console.log('[GameScene] Cannot select space - already selected');
      return;
    }

    console.log('[GameScene] Space', spaceIndex, 'selected');
    this.selectedSpace = spaceIndex;

    // Get tokens from central board (from current state)
    const numSpaces = this.isSolo ? 3 : 5;
    if (!this.centralBoardState || spaceIndex >= numSpaces) {
      console.error('[GameScene] Invalid space selection');
      return;
    }

    this.tokensToPlace = [...this.centralBoardState.tokens[spaceIndex]];
    this.tokensPlaced = 0;
    this.turnPhase = 'PLACE_TOKEN_1';

    this.updateTurnUI();

    console.log('[GameScene] Tokens to place:', this.tokensToPlace);
  }

  updateTurnUI() {
    const instructions = {
      'SELECT_SPACE': 'Select a token space from the central board',
      'PLACE_TOKEN_1': `Place token 1/3 (${this.tokensToPlace[0]?.color || 'unknown'})`,
      'PLACE_TOKEN_2': `Place token 2/3 (${this.tokensToPlace[1]?.color || 'unknown'})`,
      'PLACE_TOKEN_3': `Place token 3/3 (${this.tokensToPlace[2]?.color || 'unknown'})`,
      'TURN_END': 'All tokens placed! End your turn.'
    };

    this.instructionText.setText(instructions[this.turnPhase] || 'Unknown phase');
    this.tokenCounterText.setText(`Tokens placed: ${this.tokensPlaced}/3`);

    // Show end turn button when all tokens placed
    if (this.turnPhase === 'TURN_END') {
      this.endTurnButton.setVisible(true);
    } else {
      this.endTurnButton.setVisible(false);
    }
  }

  endTurn() {
    console.log('[GameScene] Ending turn', this.currentTurn);

    // Solo mode: Remove all tokens from central board and draw new ones
    if (this.isSolo) {
      this.refreshCentralBoardSolo();
    }

    // Advance turn
    this.currentTurn++;
    this.turnPhase = 'SELECT_SPACE';
    this.selectedSpace = null;
    this.tokensToPlace = [];
    this.tokensPlaced = 0;

    this.turnText.setText(`Turn ${this.currentTurn}`);
    this.updateTurnUI();

    console.log('[GameScene] Turn', this.currentTurn, 'started');
    
    // Check for end game conditions
    this.checkForEndGame();
  }

  checkForEndGame() {
    // Simplified end game: After 15 turns (45 tokens placed)
    // Full implementation would check:
    // - Pouch has < 3 tokens
    // - Board has ≤ 2 empty spaces
    
    if (this.currentTurn > 15) {
      console.log('[GameScene] Game end triggered - turn limit reached');
      this.triggerEndGame();
    }
  }

  triggerEndGame() {
    // Calculate final scores
    const scoreBreakdown = {
      trees: scoreTreesModule(this.gameState),
      mountains: scoreMountainsModule(this.gameState),
      fields: scoreFieldsModule(this.gameState),
      buildings: scoreBuildingsModule(this.gameState),
      water: scoreWaterModule(this.gameState, 'A'),
      animals: 0 // TODO: Implement when animal scoring added
    };
    
    const finalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);
    
    console.log('[GameScene] Final score:', finalScore, scoreBreakdown);
    
    // Transition to EndGameScene
    this.scene.start('EndGameScene', {
      finalScore,
      scoreBreakdown,
      isSolo: this.isSolo
    });
  }

  refreshCentralBoardSolo() {
    // Solo mode: Discard all tokens and draw new ones
    const tokenColors = ['blue', 'yellow', 'brown', 'green', 'red', 'gray'];
    const newState = { tokens: [] };

    for (let i = 0; i < 3; i++) {
      const spaceTokens = [];
      for (let j = 0; j < 3; j++) {
        spaceTokens.push({
          color: tokenColors[Math.floor(Math.random() * tokenColors.length)]
        });
      }
      newState.tokens.push(spaceTokens);
    }

    this.centralBoardState = newState;
    this.centralBoard.updateFromState(newState);

    console.log('[GameScene] Central board refreshed (solo mode)');
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

      // Check turn phase - must be in placement phase
      if (!this.turnPhase.startsWith('PLACE_TOKEN')) {
        console.log('[GameScene] Cannot place token - select a space first');
        this.returnTokenToOriginal(gameObject);
        return;
      }

      // Check if token matches current token to place
      const currentTokenIndex = this.tokensPlaced;
      const expectedToken = this.tokensToPlace[currentTokenIndex];
      
      if (!expectedToken || expectedToken.color !== tokenColor) {
        console.log('[GameScene] Wrong token - expected:', expectedToken?.color, 'got:', tokenColor);
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

    // Use proper stacking rules from token-manager
    const result = canPlaceToken(hexState, tokenColor, []);

    if (!result.valid) {
      console.log('[GameScene] Invalid placement:', result.reason);
      
      // Show error message temporarily
      if (this.errorText) {
        this.errorText.destroy();
      }
      
      const width = this.cameras.main.width;
      this.errorText = this.add.text(width / 2, 120, `❌ ${result.reason}`, {
        fontSize: '18px',
        fill: '#e74c3c',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 12, y: 8 }
      });
      this.errorText.setOrigin(0.5);
      this.errorText.setScrollFactor(0);
      this.errorText.setDepth(10000);
      
      // Remove error after 2 seconds
      this.time.delayedCall(2000, () => {
        if (this.errorText) {
          this.errorText.destroy();
          this.errorText = null;
        }
      });
    }

    return result.valid;
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
        
        // Update score after placement
        this.updateScore();
        
        // Advance turn phase
        this.tokensPlaced++;
        
        if (this.tokensPlaced === 1) {
          this.turnPhase = 'PLACE_TOKEN_2';
        } else if (this.tokensPlaced === 2) {
          this.turnPhase = 'PLACE_TOKEN_3';
        } else if (this.tokensPlaced === 3) {
          this.turnPhase = 'TURN_END';
        }
        
        this.updateTurnUI();
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
