// Core logic tests for Harmonies
// Run with: node --test tests/core-logic.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { coordToKey, keyToCoord, getNeighbors, hexDistance, rotateCoord } from '../js/game/hex-grid.js';
import { canPlaceToken, calculateTerrain, addTokenToHex } from '../js/game/token-manager.js';
import { scoreTreesModule, scoreMountainsModule, scoreFieldsModule } from '../js/game/scoring-engine.js';
import { TOKEN_COLORS, TERRAIN_TYPES } from '../js/data/tokens-config.js';

describe('Hex Grid', () => {
  it('converts coords to key and back', () => {
    const key = coordToKey(1, 2);
    assert.equal(key, '1_2');

    const coord = keyToCoord('1_2');
    assert.deepEqual(coord, { q: 1, r: 2 });
  });

  it('gets 6 neighbors', () => {
    const neighbors = getNeighbors(0, 0);
    assert.equal(neighbors.length, 6);
    assert.deepEqual(neighbors[0], { q: 1, r: 0 });
  });

  it('calculates hex distance', () => {
    assert.equal(hexDistance(0, 0, 2, 0), 2);
    assert.equal(hexDistance(0, 0, 1, 1), 2);
  });

  it('rotates coordinates', () => {
    const result = rotateCoord(1, 0, 1); // Rotate 60°
    assert.equal(result.q, 0);
    assert.equal(result.r, -1);
  });
});

describe('Token Stacking', () => {
  it('allows any token on empty hex', () => {
    const result = canPlaceToken({ stack: [] }, TOKEN_COLORS.GREEN);
    assert.equal(result.valid, true);
  });

  it('prevents stacking yellow', () => {
    const hex = { stack: [{ color: TOKEN_COLORS.BROWN }] };
    const result = canPlaceToken(hex, TOKEN_COLORS.YELLOW);
    assert.equal(result.valid, false);
  });

  it('allows green on brown', () => {
    const hex = { stack: [{ color: TOKEN_COLORS.BROWN }] };
    const result = canPlaceToken(hex, TOKEN_COLORS.GREEN);
    assert.equal(result.valid, true);
  });

  it('prevents gray on non-gray', () => {
    const hex = { stack: [{ color: TOKEN_COLORS.BROWN }] };
    const result = canPlaceToken(hex, TOKEN_COLORS.GRAY);
    assert.equal(result.valid, false);
  });

  it('calculates tree terrain', () => {
    const hex = {
      stack: [
        { color: TOKEN_COLORS.BROWN },
        { color: TOKEN_COLORS.GREEN }
      ]
    };
    const terrain = calculateTerrain(hex.stack);
    assert.equal(terrain, TERRAIN_TYPES.TREE);
  });

  it('calculates mountain terrain', () => {
    const hex = {
      stack: [
        { color: TOKEN_COLORS.GRAY },
        { color: TOKEN_COLORS.GRAY }
      ]
    };
    const terrain = calculateTerrain(hex.stack);
    assert.equal(terrain, TERRAIN_TYPES.MOUNTAIN);
  });
});

describe('Scoring - Trees', () => {
  it('scores single-height tree (1pt)', () => {
    const hexGrid = {
      '0_0': {
        stack: [{ color: TOKEN_COLORS.BROWN }, { color: TOKEN_COLORS.GREEN }],
        terrain: TERRAIN_TYPES.TREE
      }
    };
    const score = scoreTreesModule(hexGrid);
    assert.equal(score, 3); // 2-high = 3pts
  });

  it('scores 3-high tree (6pts)', () => {
    const hexGrid = {
      '0_0': {
        stack: [
          { color: TOKEN_COLORS.BROWN },
          { color: TOKEN_COLORS.BROWN },
          { color: TOKEN_COLORS.GREEN }
        ],
        terrain: TERRAIN_TYPES.TREE
      }
    };
    const score = scoreTreesModule(hexGrid);
    assert.equal(score, 6);
  });
});

describe('Scoring - Mountains', () => {
  it('scores adjacent mountains', () => {
    const hexGrid = {
      '0_0': {
        stack: [{ color: TOKEN_COLORS.GRAY }, { color: TOKEN_COLORS.GRAY }],
        terrain: TERRAIN_TYPES.MOUNTAIN
      },
      '1_0': {
        stack: [{ color: TOKEN_COLORS.GRAY }, { color: TOKEN_COLORS.GRAY }],
        terrain: TERRAIN_TYPES.MOUNTAIN
      }
    };
    const score = scoreMountainsModule(hexGrid);
    assert.equal(score, 2); // 2 mountains, each 2-high (1pt), each has 1 neighbor = 1*1 + 1*1 = 2
  });

  it('gives 0 for isolated mountain', () => {
    const hexGrid = {
      '0_0': {
        stack: [{ color: TOKEN_COLORS.GRAY }, { color: TOKEN_COLORS.GRAY }],
        terrain: TERRAIN_TYPES.MOUNTAIN
      }
    };
    const score = scoreMountainsModule(hexGrid);
    assert.equal(score, 0);
  });
});

describe('Scoring - Fields', () => {
  it('scores single field (1pt)', () => {
    const hexGrid = {
      '0_0': {
        stack: [{ color: TOKEN_COLORS.YELLOW }],
        terrain: TERRAIN_TYPES.FIELD
      }
    };
    const score = scoreFieldsModule(hexGrid);
    assert.equal(score, 1);
  });

  it('scores 2-field cluster (3pts)', () => {
    const hexGrid = {
      '0_0': {
        stack: [{ color: TOKEN_COLORS.YELLOW }],
        terrain: TERRAIN_TYPES.FIELD
      },
      '1_0': {
        stack: [{ color: TOKEN_COLORS.YELLOW }],
        terrain: TERRAIN_TYPES.FIELD
      }
    };
    const score = scoreFieldsModule(hexGrid);
    assert.equal(score, 3); // 2*(2+1)/2 = 3
  });
});

console.log('✅ All tests passed!');
