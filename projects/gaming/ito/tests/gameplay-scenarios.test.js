import { describe, it, expect } from 'vitest';
import { pickThemes, dealNumbers, checkOrder, getDifficultyPreset } from '../js/game/game-logic.js';
import { THEME_PACKS } from '../js/data/themes.js';

describe('Gameplay Scenarios', () => {
  describe('Kids mode (1-10)', () => {
    it('should handle full kids game with 3 players', () => {
      const preset = getDifficultyPreset('kids');
      const playerIds = ['kid1', 'kid2', 'kid3'];
      
      // Deal numbers for kids mode
      const hands = dealNumbers(playerIds, preset.rangeMax);
      
      expect(Object.keys(hands)).toHaveLength(3);
      Object.values(hands).forEach(num => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      });
    });

    it('should complete 8 rounds with theme variety', () => {
      const preset = getDifficultyPreset('kids');
      const usedThemeIds = [];
      
      // Play 8 rounds
      for (let i = 0; i < preset.roundsTotal; i++) {
        const themes = pickThemes(1, usedThemeIds);
        expect(themes).toHaveLength(1);
        usedThemeIds.push(themes[0].id);
      }
      
      // All themes should be unique
      expect(new Set(usedThemeIds).size).toBe(8);
    });

    it('should handle max players in kids mode', () => {
      const playerIds = Array.from({ length: 10 }, (_, i) => `kid${i + 1}`);
      const hands = dealNumbers(playerIds, 10);
      
      // All 10 numbers used
      expect(Object.values(hands).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('Adults mode (1-100)', () => {
    it('should handle full adults game with 5 players', () => {
      const preset = getDifficultyPreset('adults');
      const playerIds = ['adult1', 'adult2', 'adult3', 'adult4', 'adult5'];
      
      const hands = dealNumbers(playerIds, preset.rangeMax);
      
      expect(Object.keys(hands)).toHaveLength(5);
      Object.values(hands).forEach(num => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(100);
      });
    });

    it('should complete 10 rounds with theme variety', () => {
      const preset = getDifficultyPreset('adults');
      const usedThemeIds = [];
      
      for (let i = 0; i < preset.roundsTotal; i++) {
        const themes = pickThemes(1, usedThemeIds);
        usedThemeIds.push(themes[0].id);
      }
      
      expect(new Set(usedThemeIds).size).toBe(10);
    });
  });

  describe('Perfect game (all rounds correct)', () => {
    it('should validate perfect ascending order', () => {
      const hands = {
        p1: 5,
        p2: 20,
        p3: 45,
        p4: 67,
        p5: 89
      };
      
      const placedOrder = ['p1', 'p2', 'p3', 'p4', 'p5'];
      const result = checkOrder(placedOrder, hands);
      
      expect(result.correct).toBe(true);
      expect(result.firstErrorIndex).toBeNull();
    });

    it('should handle ties in perfect game', () => {
      const hands = {
        p1: 5,
        p2: 10,
        p3: 10,
        p4: 15
      };
      
      const placedOrder = ['p1', 'p2', 'p3', 'p4'];
      const result = checkOrder(placedOrder, hands);
      
      expect(result.correct).toBe(true);
    });
  });

  describe('Failed rounds', () => {
    it('should detect immediate swap error', () => {
      const hands = { p1: 10, p2: 5 };
      const result = checkOrder(['p1', 'p2'], hands);
      
      expect(result.correct).toBe(false);
      expect(result.firstErrorIndex).toBe(1);
    });

    it('should detect error in large group', () => {
      const hands = {
        p1: 10,
        p2: 20,
        p3: 30,
        p4: 25, // Out of order
        p5: 35
      };
      
      const result = checkOrder(['p1', 'p2', 'p3', 'p4', 'p5'], hands);
      
      expect(result.correct).toBe(false);
      expect(result.firstErrorIndex).toBe(3);
    });

    it('should detect multiple errors (returns first)', () => {
      const hands = {
        p1: 50,
        p2: 10, // Error 1
        p3: 5,  // Error 2
        p4: 100
      };
      
      const result = checkOrder(['p1', 'p2', 'p3', 'p4'], hands);
      
      expect(result.correct).toBe(false);
      expect(result.firstErrorIndex).toBe(1); // First error
    });
  });

  describe('Edge cases', () => {
    it('should handle 2-player game', () => {
      const playerIds = ['p1', 'p2'];
      const hands = dealNumbers(playerIds, 10);
      
      expect(Object.keys(hands)).toHaveLength(2);
      
      // Order correctly
      const sorted = Object.entries(hands).sort((a, b) => a[1] - b[1]);
      const correctOrder = sorted.map(([id]) => id);
      
      const result = checkOrder(correctOrder, hands);
      expect(result.correct).toBe(true);
    });

    it('should handle single player (always correct)', () => {
      const result = checkOrder(['p1'], { p1: 7 });
      expect(result.correct).toBe(true);
    });

    it('should handle reverse order (worst case)', () => {
      const hands = { p1: 10, p2: 7, p3: 5, p4: 2 };
      const result = checkOrder(['p1', 'p2', 'p3', 'p4'], hands);
      
      expect(result.correct).toBe(false);
      expect(result.firstErrorIndex).toBe(1);
    });

    it('should handle near-perfect with last mistake', () => {
      const hands = {
        p1: 5,
        p2: 10,
        p3: 15,
        p4: 20,
        p5: 12 // Should be before p4
      };
      
      const result = checkOrder(['p1', 'p2', 'p3', 'p4', 'p5'], hands);
      
      expect(result.correct).toBe(false);
      expect(result.firstErrorIndex).toBe(4);
    });
  });

  describe('Multi-round game simulation', () => {
    it('should handle complete 3-player kids game', () => {
      const preset = getDifficultyPreset('kids');
      const playerIds = ['alice', 'bob', 'charlie'];
      const usedThemeIds = [];
      let successCount = 0;
      
      // Play all rounds
      for (let round = 0; round < preset.roundsTotal; round++) {
        // Pick theme
        const [theme] = pickThemes(1, usedThemeIds);
        usedThemeIds.push(theme.id);
        
        // Deal numbers
        const hands = dealNumbers(playerIds, preset.rangeMax);
        
        // Simulate perfect play (sort by numbers)
        const sorted = Object.entries(hands).sort((a, b) => a[1] - b[1]);
        const placedOrder = sorted.map(([id]) => id);
        
        // Check result
        const result = checkOrder(placedOrder, hands);
        if (result.correct) successCount++;
      }
      
      // Perfect game
      expect(successCount).toBe(8);
      expect(usedThemeIds).toHaveLength(8);
    });

    it('should handle game with some mistakes', () => {
      const playerIds = ['p1', 'p2', 'p3'];
      
      // Round 1: Correct
      let hands = dealNumbers(playerIds, 10);
      let sorted = Object.entries(hands).sort((a, b) => a[1] - b[1]);
      let result = checkOrder(sorted.map(([id]) => id), hands);
      expect(result.correct).toBe(true);
      
      // Round 2: Wrong order
      hands = { p1: 5, p2: 8, p3: 3 };
      result = checkOrder(['p1', 'p2', 'p3'], hands);
      expect(result.correct).toBe(false);
    });
  });

  describe('Theme exhaustion and reset', () => {
    it('should handle using all available themes', () => {
      const totalThemes = THEME_PACKS.all.length;
      const usedThemeIds = [];
      
      // Use all themes
      for (let i = 0; i < totalThemes; i++) {
        const [theme] = pickThemes(1, usedThemeIds);
        usedThemeIds.push(theme.id);
      }
      
      expect(usedThemeIds).toHaveLength(totalThemes);
      
      // Request another theme (should reset and reuse)
      const newThemes = pickThemes(1, usedThemeIds);
      expect(newThemes).toHaveLength(1);
      expect(newThemes[0]).toHaveProperty('id');
    });

    it('should handle marathon game (20+ rounds)', () => {
      const usedThemeIds = [];
      
      // Play 20 rounds (more than total available themes)
      for (let i = 0; i < 20; i++) {
        const themes = pickThemes(1, usedThemeIds);
        expect(themes).toHaveLength(1);
        usedThemeIds.push(themes[0].id);
      }
      
      expect(usedThemeIds).toHaveLength(20);
    });
  });

  describe('Statistical properties', () => {
    it('should distribute numbers fairly across multiple games', () => {
      const frequencies = {};
      const numGames = 100;
      const playerIds = ['p1', 'p2', 'p3'];
      
      for (let game = 0; game < numGames; game++) {
        const hands = dealNumbers(playerIds, 10);
        Object.values(hands).forEach(num => {
          frequencies[num] = (frequencies[num] || 0) + 1;
        });
      }
      
      // Each number should appear roughly 30 times (100 games * 3 players / 10 numbers)
      // Allow 50% variance
      Object.values(frequencies).forEach(count => {
        expect(count).toBeGreaterThan(15);
        expect(count).toBeLessThan(45);
      });
    });

    it('should pick themes uniformly across categories', () => {
      const categoryCount = {};
      
      for (let i = 0; i < 100; i++) {
        const [theme] = pickThemes(1, []);
        categoryCount[theme.category] = (categoryCount[theme.category] || 0) + 1;
      }
      
      // All main categories should be represented
      const categories = Object.keys(categoryCount);
      expect(categories.length).toBeGreaterThan(3);
    });
  });
});
