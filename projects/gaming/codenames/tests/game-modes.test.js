import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GAME_MODES, getModeConfig, DEFAULT_MODE } from '../js/data/game-modes.js';

describe('GAME_MODES', () => {
  it('has words, pictures, and diy modes', () => {
    assert.ok(GAME_MODES.words);
    assert.ok(GAME_MODES.pictures);
    assert.ok(GAME_MODES.diy);
  });

  it('words mode card counts total 25', () => {
    const c = GAME_MODES.words;
    assert.equal(c.startingCount + c.otherCount + c.neutralCount + c.assassinCount, c.totalCards);
    assert.equal(c.totalCards, 25);
  });

  it('pictures mode card counts total 20', () => {
    const c = GAME_MODES.pictures;
    assert.equal(c.startingCount + c.otherCount + c.neutralCount + c.assassinCount, c.totalCards);
    assert.equal(c.totalCards, 20);
  });

  it('diy mode card counts total 20', () => {
    const c = GAME_MODES.diy;
    assert.equal(c.startingCount + c.otherCount + c.neutralCount + c.assassinCount, c.totalCards);
    assert.equal(c.totalCards, 20);
  });

  it('words mode is text type', () => {
    assert.equal(GAME_MODES.words.cardType, 'text');
  });

  it('pictures and diy modes are image type', () => {
    assert.equal(GAME_MODES.pictures.cardType, 'image');
    assert.equal(GAME_MODES.diy.cardType, 'image');
  });

  it('pictures mode has 280 images', () => {
    assert.equal(GAME_MODES.pictures.totalImages, 280);
  });

  it('diy mode has 128 images from cardList', () => {
    assert.equal(GAME_MODES.diy.totalImages, 128);
    assert.equal(GAME_MODES.diy.cardList.length, 128);
  });

  it('diy cardList has no duplicates', () => {
    assert.equal(new Set(GAME_MODES.diy.cardList).size, GAME_MODES.diy.cardList.length);
  });

  it('pictures and words have no cardList', () => {
    assert.equal(GAME_MODES.pictures.cardList, null);
    assert.equal(GAME_MODES.words.cardList, null);
  });

  it('all modes use 5 grid columns', () => {
    for (const mode of Object.values(GAME_MODES)) {
      assert.equal(mode.gridCols, 5);
    }
  });
});

describe('getModeConfig', () => {
  it('returns correct config for known modes', () => {
    assert.equal(getModeConfig('words').totalCards, 25);
    assert.equal(getModeConfig('pictures').totalCards, 20);
    assert.equal(getModeConfig('diy').totalCards, 20);
  });

  it('falls back to words for unknown mode', () => {
    assert.equal(getModeConfig('unknown').totalCards, 20);
    assert.equal(getModeConfig(null).totalCards, 20);
    assert.equal(getModeConfig(undefined).totalCards, 20);
  });
});

describe('DEFAULT_MODE', () => {
  it('is pictures', () => {
    assert.equal(DEFAULT_MODE, 'pictures');
  });
});
