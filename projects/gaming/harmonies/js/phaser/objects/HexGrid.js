/**
 * Harmonies v4.0 - HexGrid Class
 *
 * Manages hex grid rendering and positioning using proper axial coordinates
 * No external library needed - uses math from v3.0 hex-grid.js
 */

import { getNeighbors, coordToKey, keyToCoord } from '../../game/hex-grid.js';

export default class HexGrid extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.hexSize = 40; // Radius in pixels
    this.hexSprites = new Map(); // Map of "q_r" -> hex GameObject
    this.tokenSprites = new Map(); // Map of "q_r" -> array of token sprites

    // Add to scene
    scene.add.existing(this);

    console.log('[HexGrid] Created at', x, y, 'with hex size', this.hexSize);
  }

  /**
   * Convert axial (q, r) coordinates to pixel position
   * Flat-topped hexagons
   */
  hexToPixel(q, r) {
    const x = this.hexSize * (3/2 * q);
    const y = this.hexSize * (Math.sqrt(3) * (r + q/2));
    return { x, y };
  }

  /**
   * Add a hex at axial coordinates (q, r)
   * @param {number} q - Axial q coordinate
   * @param {number} r - Axial r coordinate
   * @param {string} terrain - Terrain type (water, field, tree, etc.)
   * @param {boolean} isExpansion - If true, render as dashed (expansion hex)
   */
  addHex(q, r, terrain = 'empty', isExpansion = false) {
    const key = coordToKey(q, r);

    // Don't add duplicate hexes
    if (this.hexSprites.has(key)) {
      return this.hexSprites.get(key);
    }

    const pos = this.hexToPixel(q, r);

    // Create hex graphic
    const hex = this.scene.add.graphics();
    hex.setData('coord', { q, r });
    hex.setData('terrain', terrain);
    hex.setData('isExpansion', isExpansion);

    // Draw hexagon
    this.drawHex(hex, pos.x, pos.y, terrain, isExpansion);

    // Make interactive
    const hitArea = new Phaser.Geom.Circle(pos.x, pos.y, this.hexSize);
    hex.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    // Add to container
    this.add(hex);
    this.hexSprites.set(key, hex);

    // Add coordinate label (for debugging)
    if (this.scene.game.config.physics.arcade.debug) {
      const label = this.scene.add.text(pos.x, pos.y, `${q},${r}`, {
        fontSize: '10px',
        fill: '#666',
        align: 'center'
      });
      label.setOrigin(0.5);
      this.add(label);
    }

    return hex;
  }

  /**
   * Draw a single hexagon
   */
  drawHex(graphics, x, y, terrain, isExpansion) {
    graphics.clear();

    // Colors by terrain
    const colors = {
      empty: 0xEEEEEE,
      water: 0x4A90E2,
      field: 0xF5A623,
      tree: 0x7ED321,
      trunk: 0x8B4513,
      rock: 0x9B9B9B,
      mountain: 0x9B9B9B,
      building: 0xD0021B
    };

    const fillColor = colors[terrain] || colors.empty;

    // Style
    if (isExpansion) {
      graphics.lineStyle(2, 0xCCCCCC, 0.6);
      graphics.fillStyle(fillColor, 0.1);
    } else {
      graphics.lineStyle(3, 0x666666, 1);
      graphics.fillStyle(fillColor, 0.8);
    }

    // Draw flat-topped hexagon
    const angle = Math.PI / 3; // 60 degrees
    graphics.beginPath();
    graphics.moveTo(x + this.hexSize * Math.cos(0), y + this.hexSize * Math.sin(0));

    for (let i = 1; i <= 6; i++) {
      const theta = angle * i;
      graphics.lineTo(
        x + this.hexSize * Math.cos(theta),
        y + this.hexSize * Math.sin(theta)
      );
    }

    graphics.closePath();
    graphics.fillPath();

    // Dashed stroke for expansion hexes
    if (isExpansion) {
      graphics.lineStyle(2, 0xCCCCCC, 1);
      for (let i = 0; i <= 6; i++) {
        const theta1 = (angle * i) + 0.1;
        const theta2 = (angle * i) + 0.4;
        graphics.beginPath();
        graphics.moveTo(x + this.hexSize * Math.cos(theta1), y + this.hexSize * Math.sin(theta1));
        graphics.lineTo(x + this.hexSize * Math.cos(theta2), y + this.hexSize * Math.sin(theta2));
        graphics.strokePath();
      }
    } else {
      graphics.strokePath();
    }
  }

  /**
   * Update hex grid from game state
   * @param {Object} hexGrid - { "q_r": { q, r, stack: [...], terrain: "..." }, ... }
   */
  updateFromState(hexGrid) {
    console.log('[HexGrid] Updating from state:', Object.keys(hexGrid).length, 'hexes');

    // Clear existing hexes and tokens
    this.hexSprites.clear();
    this.tokenSprites.clear();
    this.removeAll(true);

    // Add existing hexes
    for (const key in hexGrid) {
      const hex = hexGrid[key];
      this.addHex(hex.q, hex.r, hex.terrain, false);

      // Add tokens if stack exists
      if (hex.stack && hex.stack.length > 0) {
        this.updateTokens(hex.q, hex.r, hex.stack);
      }
    }

    // Add expansion hexes (neighbors of existing hexes)
    const expansionHexes = new Set();
    for (const key in hexGrid) {
      const [q, r] = key.split('_').map(Number);
      const neighbors = getNeighbors(q, r);

      neighbors.forEach(n => {
        const nKey = coordToKey(n.q, n.r);
        if (!hexGrid[nKey] && !expansionHexes.has(nKey)) {
          this.addHex(n.q, n.r, 'empty', true);
          expansionHexes.add(nKey);
        }
      });
    }

    console.log('[HexGrid] Updated:', this.hexSprites.size, 'total hexes (including', expansionHexes.size, 'expansion)');
  }

  /**
   * Update tokens on a hex
   * @param {number} q - Hex q coordinate
   * @param {number} r - Hex r coordinate
   * @param {Array} stack - Array of token objects { color: "blue", ... }
   */
  updateTokens(q, r, stack) {
    const key = coordToKey(q, r);
    const pos = this.hexToPixel(q, r);

    // Remove existing tokens
    if (this.tokenSprites.has(key)) {
      this.tokenSprites.get(key).forEach(sprite => sprite.destroy());
    }

    // Create new tokens
    const tokenSprites = [];
    stack.forEach((token, index) => {
      const tokenSprite = this.scene.add.circle(
        pos.x,
        pos.y - (index * 8), // Stack vertically with offset
        12, // Radius
        this.getTokenColor(token.color),
        0.9
      );

      tokenSprite.setStrokeStyle(2, 0x333333);
      tokenSprite.setDepth(index + 1); // Stack depth

      this.add(tokenSprite);
      tokenSprites.push(tokenSprite);
    });

    this.tokenSprites.set(key, tokenSprites);
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

  /**
   * Highlight a hex (for valid placement)
   */
  highlightHex(q, r, color = 0x27ae60) {
    const key = coordToKey(q, r);
    const hex = this.hexSprites.get(key);

    if (!hex) return;

    const pos = this.hexToPixel(q, r);
    const isExpansion = hex.getData('isExpansion');

    // Redraw with highlight
    this.drawHex(hex, pos.x, pos.y, hex.getData('terrain'), isExpansion);

    // Add green glow
    hex.lineStyle(4, color, 1);
    const angle = Math.PI / 3;
    hex.beginPath();
    hex.moveTo(pos.x + this.hexSize * Math.cos(0), pos.y + this.hexSize * Math.sin(0));
    for (let i = 1; i <= 6; i++) {
      const theta = angle * i;
      hex.lineTo(
        pos.x + this.hexSize * Math.cos(theta),
        pos.y + this.hexSize * Math.sin(theta)
      );
    }
    hex.closePath();
    hex.strokePath();
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.hexSprites.forEach((hex, key) => {
      const [q, r] = key.split('_').map(Number);
      const pos = this.hexToPixel(q, r);
      this.drawHex(hex, pos.x, pos.y, hex.getData('terrain'), hex.getData('isExpansion'));
    });
  }

  /**
   * Get hex at coordinates
   */
  getHex(q, r) {
    return this.hexSprites.get(coordToKey(q, r));
  }

  /**
   * Get bounding box of all hexes (for camera centering)
   */
  getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.hexSprites.forEach((hex, key) => {
      const [q, r] = key.split('_').map(Number);
      const pos = this.hexToPixel(q, r);

      minX = Math.min(minX, pos.x - this.hexSize);
      minY = Math.min(minY, pos.y - this.hexSize);
      maxX = Math.max(maxX, pos.x + this.hexSize);
      maxY = Math.max(maxY, pos.y + this.hexSize);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
}
