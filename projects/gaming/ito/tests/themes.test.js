import { describe, it, expect } from 'vitest';
import { THEME_PACKS } from '../js/data/themes.js';

describe('THEME_PACKS', () => {
  describe('data integrity', () => {
    it('should have an "all" property with array of themes', () => {
      expect(THEME_PACKS).toHaveProperty('all');
      expect(Array.isArray(THEME_PACKS.all)).toBe(true);
    });

    it('should have at least 50 themes', () => {
      // README mentions 55 themes, allow some flexibility
      expect(THEME_PACKS.all.length).toBeGreaterThanOrEqual(50);
    });

    it('should have all themes with required properties', () => {
      THEME_PACKS.all.forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('text');
        expect(theme).toHaveProperty('category');
        
        expect(typeof theme.id).toBe('string');
        expect(typeof theme.text).toBe('string');
        expect(typeof theme.category).toBe('string');
        
        expect(theme.id.length).toBeGreaterThan(0);
        expect(theme.text.length).toBeGreaterThan(0);
        expect(theme.category.length).toBeGreaterThan(0);
      });
    });

    it('should have unique theme IDs', () => {
      const ids = THEME_PACKS.all.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have themes from expected categories', () => {
      const expectedCategories = ['food', 'animals', 'activities', 'feelings', 'silly', 'personal'];
      const categories = new Set(THEME_PACKS.all.map(t => t.category));
      
      expectedCategories.forEach(cat => {
        expect(categories.has(cat)).toBe(true);
      });
    });
  });

  describe('food category', () => {
    it('should have food themes', () => {
      const foodThemes = THEME_PACKS.all.filter(t => t.category === 'food');
      expect(foodThemes.length).toBeGreaterThan(0);
    });

    it('should have expected food themes', () => {
      const foodIds = THEME_PACKS.all
        .filter(t => t.category === 'food')
        .map(t => t.id);
      
      expect(foodIds).toContain('food_01'); // pizza
      expect(foodIds).toContain('food_02'); // ice cream
    });

    it('should have proper question format', () => {
      const foodThemes = THEME_PACKS.all.filter(t => t.category === 'food');
      
      foodThemes.forEach(theme => {
        expect(theme.text).toMatch(/How much do you like .+\?/);
      });
    });
  });

  describe('animals category', () => {
    it('should have animal themes', () => {
      const animalThemes = THEME_PACKS.all.filter(t => t.category === 'animals');
      expect(animalThemes.length).toBeGreaterThan(0);
    });

    it('should have varied question formats', () => {
      const animalThemes = THEME_PACKS.all.filter(t => t.category === 'animals');
      
      const hasScary = animalThemes.some(t => t.text.includes('scary'));
      const hasCute = animalThemes.some(t => t.text.includes('cute'));
      const hasCool = animalThemes.some(t => t.text.includes('cool'));
      
      expect(hasScary).toBe(true);
      expect(hasCute).toBe(true);
      expect(hasCool).toBe(true);
    });
  });

  describe('activities category', () => {
    it('should have activity themes', () => {
      const activityThemes = THEME_PACKS.all.filter(t => t.category === 'activities');
      expect(activityThemes.length).toBeGreaterThan(0);
    });

    it('should have "How fun is" format', () => {
      const activityThemes = THEME_PACKS.all.filter(t => t.category === 'activities');
      
      activityThemes.forEach(theme => {
        expect(theme.text).toMatch(/How fun is .+\?/);
      });
    });
  });

  describe('feelings category', () => {
    it('should have feeling themes', () => {
      const feelingThemes = THEME_PACKS.all.filter(t => t.category === 'feelings');
      expect(feelingThemes.length).toBeGreaterThan(0);
    });

    it('should have happiness-related questions', () => {
      const feelingThemes = THEME_PACKS.all.filter(t => t.category === 'feelings');
      
      feelingThemes.forEach(theme => {
        expect(theme.text).toMatch(/How happy does .+ make you feel\?/);
      });
    });
  });

  describe('silly category', () => {
    it('should have silly themes', () => {
      const sillyThemes = THEME_PACKS.all.filter(t => t.category === 'silly');
      expect(sillyThemes.length).toBeGreaterThan(0);
    });

    it('should have funny or weird questions', () => {
      const sillyThemes = THEME_PACKS.all.filter(t => t.category === 'silly');
      
      sillyThemes.forEach(theme => {
        const hasFunnyOrWeird = 
          theme.text.includes('funny') || 
          theme.text.includes('weird');
        expect(hasFunnyOrWeird).toBe(true);
      });
    });
  });

  describe('personal category', () => {
    it('should have personal themes', () => {
      const personalThemes = THEME_PACKS.all.filter(t => t.category === 'personal');
      expect(personalThemes.length).toBeGreaterThan(0);
    });

    it('should have introspective questions', () => {
      const personalThemes = THEME_PACKS.all.filter(t => t.category === 'personal');
      
      personalThemes.forEach(theme => {
        expect(theme.text).toMatch(/How much do you .+\?/);
      });
    });
  });

  describe('category distribution', () => {
    it('should have balanced distribution across categories', () => {
      const categoryCounts = {};
      
      THEME_PACKS.all.forEach(theme => {
        categoryCounts[theme.category] = (categoryCounts[theme.category] || 0) + 1;
      });
      
      // Each category should have at least 5 themes
      Object.entries(categoryCounts).forEach(([category, count]) => {
        expect(count).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('text quality', () => {
    it('should have no empty text', () => {
      THEME_PACKS.all.forEach(theme => {
        expect(theme.text.trim().length).toBeGreaterThan(0);
      });
    });

    it('should end with question marks', () => {
      THEME_PACKS.all.forEach(theme => {
        expect(theme.text.endsWith('?')).toBe(true);
      });
    });

    it('should be child-friendly (no profanity)', () => {
      const profanity = ['damn', 'hell', 'crap', 'stupid'];
      
      THEME_PACKS.all.forEach(theme => {
        const lowerText = theme.text.toLowerCase();
        profanity.forEach(word => {
          expect(lowerText).not.toContain(word);
        });
      });
    });

    it('should have reasonable length (not too long)', () => {
      THEME_PACKS.all.forEach(theme => {
        // Most questions should be under 80 characters
        expect(theme.text.length).toBeLessThan(100);
      });
    });
  });
});
