import { describe, it, expect, beforeEach } from 'vitest';
import { pickThemes, dealNumbers, checkOrder, getDifficultyPreset } from '../js/game/game-logic.js';
import { THEME_PACKS } from '../js/data/themes.js';

describe('pickThemes', () => {
  it('should return requested number of unique themes', () => {
    const themes = pickThemes(5);
    expect(themes).toHaveLength(5);
    
    // Check uniqueness
    const ids = themes.map(t => t.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('should exclude already used themes', () => {
    const usedIds = ['food_01', 'food_02', 'animal_01'];
    const themes = pickThemes(5, usedIds);
    
    expect(themes).toHaveLength(5);
    themes.forEach(theme => {
      expect(usedIds).not.toContain(theme.id);
    });
  });

  it('should return empty array when count is 0', () => {
    const themes = pickThemes(0);
    expect(themes).toHaveLength(0);
  });

  it('should handle requesting more themes than available', () => {
    const allThemeIds = THEME_PACKS.all.map(t => t.id);
    const themes = pickThemes(200); // more than total available
    
    expect(themes.length).toBeLessThanOrEqual(allThemeIds.length);
  });

  it('should reset when all themes are used', () => {
    const allIds = THEME_PACKS.all.map(t => t.id);
    const themes = pickThemes(3, allIds);
    
    expect(themes).toHaveLength(3);
    themes.forEach(theme => {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('category');
    });
  });

  it('should throw error for negative count', () => {
    expect(() => pickThemes(-1)).toThrow('Count must be non-negative');
  });

  it('should return themes with valid structure', () => {
    const themes = pickThemes(3);
    
    themes.forEach(theme => {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('category');
      expect(typeof theme.id).toBe('string');
      expect(typeof theme.text).toBe('string');
      expect(typeof theme.category).toBe('string');
    });
  });
});

describe('dealNumbers', () => {
  it('should assign unique numbers to all players', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4'];
    const hands = dealNumbers(playerIds, 10);
    
    expect(Object.keys(hands)).toHaveLength(4);
    
    const numbers = Object.values(hands);
    expect(new Set(numbers).size).toBe(4); // all unique
    
    numbers.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });
  });

  it('should work with kids mode (1-10)', () => {
    const playerIds = ['p1', 'p2', 'p3'];
    const hands = dealNumbers(playerIds, 10);
    
    Object.values(hands).forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });
  });

  it('should work with adults mode (1-100)', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const hands = dealNumbers(playerIds, 100);
    
    Object.values(hands).forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(100);
    });
  });

  it('should assign correct player IDs to numbers', () => {
    const playerIds = ['alice', 'bob', 'charlie'];
    const hands = dealNumbers(playerIds, 10);
    
    expect(hands).toHaveProperty('alice');
    expect(hands).toHaveProperty('bob');
    expect(hands).toHaveProperty('charlie');
  });

  it('should handle single player', () => {
    const hands = dealNumbers(['solo'], 10);
    
    expect(Object.keys(hands)).toHaveLength(1);
    expect(hands.solo).toBeGreaterThanOrEqual(1);
    expect(hands.solo).toBeLessThanOrEqual(10);
  });

  it('should throw error for empty player array', () => {
    expect(() => dealNumbers([], 10)).toThrow('playerIds must be a non-empty array');
  });

  it('should throw error for non-array playerIds', () => {
    expect(() => dealNumbers('not-array', 10)).toThrow('playerIds must be a non-empty array');
  });

  it('should throw error when rangeMax is less than player count', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
    expect(() => dealNumbers(playerIds, 3)).toThrow('rangeMax (3) must be >= number of players (5)');
  });

  it('should throw error for invalid rangeMax', () => {
    expect(() => dealNumbers(['p1'], 0)).toThrow('rangeMax must be at least 1');
    expect(() => dealNumbers(['p1'], -5)).toThrow('rangeMax must be at least 1');
  });

  it('should return different results on multiple calls (randomness)', () => {
    const playerIds = ['p1', 'p2', 'p3'];
    const hands1 = dealNumbers(playerIds, 100);
    const hands2 = dealNumbers(playerIds, 100);
    
    // With 100 possible numbers and 3 players, extremely unlikely to get same distribution
    const values1 = JSON.stringify(Object.values(hands1).sort());
    const values2 = JSON.stringify(Object.values(hands2).sort());
    
    // This might occasionally fail due to randomness, but probability is very low
    expect(values1).not.toBe(values2);
  });
});

describe('checkOrder', () => {
  it('should return correct=true for ascending order', () => {
    const placedOrder = ['p1', 'p2', 'p3'];
    const hands = { p1: 5, p2: 8, p3: 10 };
    
    const result = checkOrder(placedOrder, hands);
    expect(result.correct).toBe(true);
    expect(result.firstErrorIndex).toBeNull();
  });

  it('should return correct=false and error index for wrong order', () => {
    const placedOrder = ['p1', 'p2', 'p3'];
    const hands = { p1: 5, p2: 10, p3: 8 }; // p3 should be before p2
    
    const result = checkOrder(placedOrder, hands);
    expect(result.correct).toBe(false);
    expect(result.firstErrorIndex).toBe(2); // index where error occurs
  });

  it('should handle single player as correct', () => {
    const result = checkOrder(['p1'], { p1: 7 });
    expect(result.correct).toBe(true);
    expect(result.firstErrorIndex).toBeNull();
  });

  it('should handle empty array as correct', () => {
    const result = checkOrder([], {});
    expect(result.correct).toBe(true);
    expect(result.firstErrorIndex).toBeNull();
  });

  it('should detect error at first position', () => {
    const placedOrder = ['p1', 'p2', 'p3', 'p4'];
    const hands = { p1: 10, p2: 5, p3: 15, p4: 20 };
    
    const result = checkOrder(placedOrder, hands);
    expect(result.correct).toBe(false);
    expect(result.firstErrorIndex).toBe(1);
  });

  it('should detect error in middle', () => {
    const placedOrder = ['p1', 'p2', 'p3', 'p4'];
    const hands = { p1: 5, p2: 10, p3: 8, p4: 20 };
    
    const result = checkOrder(placedOrder, hands);
    expect(result.correct).toBe(false);
    expect(result.firstErrorIndex).toBe(2);
  });

  it('should allow equal numbers (ties)', () => {
    const placedOrder = ['p1', 'p2', 'p3'];
    const hands = { p1: 5, p2: 5, p3: 10 };
    
    const result = checkOrder(placedOrder, hands);
    // Equal numbers should be considered correct (not ascending but not wrong)
    expect(result.correct).toBe(true);
  });

  it('should throw error for non-array placedOrder', () => {
    expect(() => checkOrder('not-array', {})).toThrow('placedOrder must be an array');
  });

  it('should throw error for invalid hands object', () => {
    expect(() => checkOrder(['p1'], null)).toThrow('hands must be an object');
    expect(() => checkOrder(['p1'], undefined)).toThrow('hands must be an object');
  });

  it('should throw error when player missing from hands', () => {
    const placedOrder = ['p1', 'p2'];
    const hands = { p1: 5 }; // p2 missing
    
    expect(() => checkOrder(placedOrder, hands)).toThrow('Missing number for player in hands');
  });
});

describe('getDifficultyPreset', () => {
  it('should return kids preset', () => {
    const preset = getDifficultyPreset('kids');
    
    expect(preset).toEqual({
      rangeMax: 10,
      roundsTotal: 8,
      label: 'Kids (1-10)'
    });
  });

  it('should return adults preset', () => {
    const preset = getDifficultyPreset('adults');
    
    expect(preset).toEqual({
      rangeMax: 100,
      roundsTotal: 10,
      label: 'Adults (1-100)'
    });
  });

  it('should default to kids for unknown difficulty', () => {
    const preset = getDifficultyPreset('unknown');
    
    expect(preset).toEqual({
      rangeMax: 10,
      roundsTotal: 8,
      label: 'Kids (1-10)'
    });
  });

  it('should default to kids for null/undefined', () => {
    expect(getDifficultyPreset(null)).toEqual(getDifficultyPreset('kids'));
    expect(getDifficultyPreset(undefined)).toEqual(getDifficultyPreset('kids'));
  });
});
