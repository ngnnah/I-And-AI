/**
 * Harmonies v4.0 - Central Board
 *
 * Displays 5 token supply spaces (3 tokens each)
 */

export default class CentralBoard extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.spaces = []; // Array of 5 spaces
    this.spaceSize = 120; // Size of each space
    this.spacing = 20; // Gap between spaces

    // Add to scene
    scene.add.existing(this);

    this.createSpaces();

    console.log('[CentralBoard] Created with 5 token supply spaces');
  }

  createSpaces() {
    // Create 5 horizontal spaces
    for (let i = 0; i < 5; i++) {
      const spaceX = i * (this.spaceSize + this.spacing);
      const space = this.createSpace(spaceX, 0, i);
      this.spaces.push(space);
    }
  }

  createSpace(x, y, index) {
    // Space background
    const bg = this.scene.add.rectangle(x, y, this.spaceSize, this.spaceSize, 0xECF0F1, 0.9);
    bg.setStrokeStyle(3, 0x2c3e50);
    bg.setInteractive({ useHandCursor: true });
    this.add(bg);

    // Space label
    const label = this.scene.add.text(x, y - this.spaceSize/2 - 20, `Space ${index + 1}`, {
      fontSize: '14px',
      fill: '#2c3e50',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);
    this.add(label);

    // Token containers (3 tokens per space)
    const tokens = [];
    const tokenPositions = [
      { x: x - 30, y: y },
      { x: x, y: y },
      { x: x + 30, y: y }
    ];

    tokenPositions.forEach(pos => {
      const token = this.scene.add.circle(pos.x, pos.y, 15, 0xCCCCCC, 0.8);
      token.setStrokeStyle(2, 0x333333);
      this.add(token);
      tokens.push(token);
    });

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(0xBDC3C7, 1);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0xECF0F1, 0.9);
    });

    bg.on('pointerdown', () => {
      console.log('[CentralBoard] Space', index, 'selected');
      this.scene.events.emit('centralSpaceSelected', index);
    });

    return { bg, tokens, index };
  }

  /**
   * Update tokens in a space
   * @param {number} spaceIndex - 0-4
   * @param {Array} tokens - Array of {color: "blue", ...}
   */
  updateSpace(spaceIndex, tokens) {
    if (spaceIndex < 0 || spaceIndex >= 5) return;

    const space = this.spaces[spaceIndex];

    // Update token colors
    tokens.forEach((token, i) => {
      if (i < 3 && space.tokens[i]) {
        space.tokens[i].setFillStyle(this.getTokenColor(token.color), 0.9);
      }
    });

    // Hide tokens if empty
    if (tokens.length === 0) {
      space.tokens.forEach(t => t.setAlpha(0.3));
    } else {
      space.tokens.forEach(t => t.setAlpha(1));
    }
  }

  /**
   * Update all spaces from game state
   */
  updateFromState(centralBoardState) {
    if (!centralBoardState || !centralBoardState.tokens) {
      console.warn('[CentralBoard] Invalid state');
      return;
    }

    centralBoardState.tokens.forEach((tokens, index) => {
      this.updateSpace(index, tokens);
    });
  }

  /**
   * Get Phaser color for token
   */
  getTokenColor(colorName) {
    const colors = {
      blue: 0x4A90E2,
      yellow: 0xF5A623,
      brown: 0x8B4513,
      green: 0x7ED321,
      red: 0xD0021B,
      gray: 0x9B9B9B
    };
    return colors[colorName] || 0xCCCCCC;
  }
}
