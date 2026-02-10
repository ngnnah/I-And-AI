import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WORD_LIST, getRandomWords } from '../js/data/word-lists.js';

describe('WORD_LIST', () => {
  it('has at least 200 words', () => {
    assert.ok(WORD_LIST.length >= 200, `Expected >= 200 words, got ${WORD_LIST.length}`);
  });

  it('all words are non-empty uppercase strings', () => {
    for (const word of WORD_LIST) {
      assert.equal(typeof word, 'string');
      assert.ok(word.length > 0, 'Word should not be empty');
      assert.equal(word, word.toUpperCase(), `Word "${word}" should be uppercase`);
    }
  });

  it('has no duplicate words', () => {
    const unique = new Set(WORD_LIST);
    assert.equal(unique.size, WORD_LIST.length, 'Word list contains duplicates');
  });
});

describe('getRandomWords', () => {
  it('returns 25 words by default', () => {
    const words = getRandomWords();
    assert.equal(words.length, 25);
  });

  it('returns requested number of words', () => {
    const words = getRandomWords(10);
    assert.equal(words.length, 10);
  });

  it('returns no duplicates', () => {
    const words = getRandomWords(25);
    const unique = new Set(words);
    assert.equal(unique.size, 25);
  });

  it('returns words from WORD_LIST', () => {
    const wordSet = new Set(WORD_LIST);
    const words = getRandomWords(25);
    for (const word of words) {
      assert.ok(wordSet.has(word), `"${word}" not found in WORD_LIST`);
    }
  });

  it('returns different results on multiple calls (shuffled)', () => {
    const results = new Set();
    for (let i = 0; i < 5; i++) {
      results.add(getRandomWords(25).join(','));
    }
    assert.ok(results.size > 1, 'Expected different shuffled results');
  });
});
