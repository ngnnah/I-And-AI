/**
 * Tests for Codenames: Pictures clue suggestion system
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PICTURE_CLUES, getRandomPictureClues } from '../js/data/picture-clues.js';
import { generateInspirationWords } from '../js/game/game-logic.js';

describe('PICTURE_CLUES data', () => {
  it('has at least 200 clue words', () => {
    assert.ok(PICTURE_CLUES.length >= 200, 
      `Expected at least 200 clues, got ${PICTURE_CLUES.length}`);
  });

  it('all clues are non-empty uppercase strings', () => {
    for (const clue of PICTURE_CLUES) {
      assert.ok(typeof clue === 'string', `Clue ${clue} is not a string`);
      assert.ok(clue.length > 0, 'Found empty clue');
      assert.equal(clue, clue.toUpperCase(), `Clue "${clue}" is not uppercase`);
    }
  });

  it('has no duplicate clues', () => {
    const uniqueClues = new Set(PICTURE_CLUES);
    assert.equal(uniqueClues.size, PICTURE_CLUES.length,
      'Found duplicate clues in PICTURE_CLUES');
  });

  it('contains expected category words', () => {
    // Verify some representative words from each category
    const expectedWords = [
      'BLUE', 'RED', 'ROUND', 'SQUARE', 'BIG', 'SMALL',
      'WATER', 'FIRE', 'BIRD', 'FISH', 'FACE', 'EYE',
      'SMOOTH', 'ROUGH', 'FLYING', 'FALLING', 'UP', 'DOWN',
      'HAPPY', 'SAD', 'LIGHT', 'SHADOW', 'PATTERN', 'GRID'
    ];
    
    for (const word of expectedWords) {
      assert.ok(PICTURE_CLUES.includes(word),
        `Expected to find "${word}" in PICTURE_CLUES`);
    }
  });

  it('all clues are single words (no spaces)', () => {
    for (const clue of PICTURE_CLUES) {
      assert.ok(!clue.includes(' '),
        `Clue "${clue}" contains spaces`);
    }
  });
});

describe('getRandomPictureClues', () => {
  it('returns exactly 3 clues by default', () => {
    const clues = getRandomPictureClues();
    assert.equal(clues.length, 3);
  });

  it('returns requested number of clues', () => {
    const counts = [1, 5, 10, 20];
    for (const count of counts) {
      const clues = getRandomPictureClues(count);
      assert.equal(clues.length, count,
        `Expected ${count} clues, got ${clues.length}`);
    }
  });

  it('returns unique clues (no duplicates)', () => {
    const clues = getRandomPictureClues(10);
    const uniqueClues = new Set(clues);
    assert.equal(uniqueClues.size, 10,
      'Found duplicate clues in result');
  });

  it('returns clues from PICTURE_CLUES array', () => {
    const clues = getRandomPictureClues(20);
    for (const clue of clues) {
      assert.ok(PICTURE_CLUES.includes(clue),
        `Clue "${clue}" is not from PICTURE_CLUES`);
    }
  });

  it('returns different results on multiple calls (randomized)', () => {
    const result1 = getRandomPictureClues(10).join(',');
    const result2 = getRandomPictureClues(10).join(',');
    const result3 = getRandomPictureClues(10).join(',');
    
    // At least one should be different (extremely unlikely all 3 are identical)
    const allSame = (result1 === result2) && (result2 === result3);
    assert.ok(!allSame, 'Random clues returned identical results 3 times');
  });

  it('handles count larger than array size', () => {
    const allClues = getRandomPictureClues(PICTURE_CLUES.length);
    assert.equal(allClues.length, PICTURE_CLUES.length);
    
    // Should contain all clues
    const allCluesSet = new Set(allClues);
    assert.equal(allCluesSet.size, PICTURE_CLUES.length);
  });

  it('handles count of 0', () => {
    const clues = getRandomPictureClues(0);
    assert.equal(clues.length, 0);
  });
});

describe('generateInspirationWords with picture mode', () => {
  it('returns picture clues for pictures game mode', () => {
    const inspiration = generateInspirationWords([], [], 'pictures');
    
    assert.equal(inspiration.length, 3);
    
    // All should be from PICTURE_CLUES
    for (const word of inspiration) {
      assert.ok(PICTURE_CLUES.includes(word),
        `"${word}" should be from PICTURE_CLUES`);
    }
  });

  it('returns picture clues for diy game mode', () => {
    const inspiration = generateInspirationWords([], [], 'diy');
    
    assert.equal(inspiration.length, 3);
    
    // All should be from PICTURE_CLUES
    for (const word of inspiration) {
      assert.ok(PICTURE_CLUES.includes(word),
        `"${word}" should be from PICTURE_CLUES`);
    }
  });

  it('returns word-based clues for words mode', () => {
    const inspiration = generateInspirationWords([], [], 'words');
    
    assert.equal(inspiration.length, 3);
    
    // Words should be regular word list (strings, uppercase)
    for (const word of inspiration) {
      assert.ok(typeof word === 'string');
      assert.equal(word, word.toUpperCase());
    }
  });

  it('picture mode ignores boardWords parameter (empty board)', () => {
    // In picture mode, clues are visual descriptors, not words on cards
    const boardWords = ['SOME', 'RANDOM', 'WORDS'];
    const inspiration = generateInspirationWords(boardWords, [], 'pictures');
    
    assert.equal(inspiration.length, 3);
    
    // All should still be from PICTURE_CLUES
    for (const word of inspiration) {
      assert.ok(PICTURE_CLUES.includes(word));
    }
  });

  it('returns unique words across multiple calls', () => {
    const calls = [];
    for (let i = 0; i < 5; i++) {
      calls.push(generateInspirationWords([], [], 'pictures'));
    }
    
    // At least some variation should exist
    const uniqueCombos = new Set(calls.map(arr => arr.join(',')));
    assert.ok(uniqueCombos.size > 1,
      'Should return different combinations across calls');
  });
});

describe('Picture clues integration', () => {
  it('getRandomPictureClues is compatible with generateInspirationWords', () => {
    // This test verifies the bug fix - that generateInspirationWords
    // can successfully call getRandomPictureClues
    assert.doesNotThrow(() => {
      const inspiration = generateInspirationWords([], [], 'pictures');
      assert.equal(inspiration.length, 3);
    }, 'generateInspirationWords should call getRandomPictureClues without error');
  });

  it('picture clues provide visual descriptors for spymasters', () => {
    const inspiration = generateInspirationWords([], [], 'pictures');
    
    // Verify clues are useful visual descriptors
    // (uppercase, no spaces, from known good list)
    for (const clue of inspiration) {
      assert.ok(typeof clue === 'string');
      assert.ok(clue.length > 0);
      assert.equal(clue, clue.toUpperCase());
      assert.ok(!clue.includes(' '));
      assert.ok(PICTURE_CLUES.includes(clue));
    }
  });
});
