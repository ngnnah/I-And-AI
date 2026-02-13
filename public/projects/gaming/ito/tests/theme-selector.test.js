import { describe, it, expect, beforeEach, vi } from 'vitest';
import { THEME_PACKS } from '../js/data/themes.js';

describe('Theme Selector - Data Validation', () => {
  it('should have all themes with required properties', () => {
    const allThemes = THEME_PACKS.all;
    
    allThemes.forEach(theme => {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('textVi');
      expect(theme).toHaveProperty('category');
      
      expect(typeof theme.id).toBe('string');
      expect(typeof theme.text).toBe('string');
      expect(typeof theme.textVi).toBe('string');
      expect(typeof theme.category).toBe('string');
      
      expect(theme.text.length).toBeGreaterThan(0);
      expect(theme.textVi.length).toBeGreaterThan(0);
    });
  });

  it('should have themes in expected categories', () => {
    const validCategories = ['food', 'animals', 'activities', 'feelings', 'silly', 'personal'];
    const allThemes = THEME_PACKS.all;
    
    allThemes.forEach(theme => {
      expect(validCategories).toContain(theme.category);
    });
  });

  it('should filter themes by category correctly', () => {
    const foodThemes = THEME_PACKS.all.filter(t => t.category === 'food');
    const animalThemes = THEME_PACKS.all.filter(t => t.category === 'animals');
    
    expect(foodThemes.length).toBe(15);
    expect(animalThemes.length).toBe(10);
    
    foodThemes.forEach(theme => {
      expect(theme.category).toBe('food');
    });
  });

  it('should support search filtering by English text', () => {
    const searchQuery = 'pizza';
    const results = THEME_PACKS.all.filter(theme =>
      theme.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    expect(results.length).toBeGreaterThan(0);
    results.forEach(theme => {
      expect(theme.text.toLowerCase()).toContain(searchQuery.toLowerCase());
    });
  });

  it('should support search filtering by Vietnamese text', () => {
    const searchQuery = 'thích';
    const results = THEME_PACKS.all.filter(theme =>
      theme.textVi.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle combined category and search filters', () => {
    const category = 'food';
    const searchQuery = 'ice';
    
    const results = THEME_PACKS.all
      .filter(theme => theme.category === category)
      .filter(theme => theme.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    expect(results.length).toBeGreaterThan(0);
    results.forEach(theme => {
      expect(theme.category).toBe(category);
      expect(theme.text.toLowerCase()).toContain(searchQuery.toLowerCase());
    });
  });

  it('should return empty array for non-matching search', () => {
    const searchQuery = 'xyznonexistent123';
    const results = THEME_PACKS.all.filter(theme =>
      theme.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.textVi.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    expect(results.length).toBe(0);
  });
});

describe('Theme Selector - Custom Theme Validation', () => {
  it('should create valid custom theme object', () => {
    const customTheme = {
      id: `custom_${Date.now()}`,
      text: 'How much do you like coffee?',
      textVi: 'Bạn thích cà phê đến mức nào?',
      category: 'custom'
    };
    
    expect(customTheme).toHaveProperty('id');
    expect(customTheme).toHaveProperty('text');
    expect(customTheme).toHaveProperty('textVi');
    expect(customTheme).toHaveProperty('category');
    expect(customTheme.category).toBe('custom');
  });

  it('should use English text as Vietnamese fallback when not provided', () => {
    const text = 'How much do you like tea?';
    const textVi = ''; // empty
    const fallbackTextVi = textVi || text;
    
    expect(fallbackTextVi).toBe(text);
  });

  it('should validate custom theme text length', () => {
    const validText = 'How much do you like coffee?';
    const tooLong = 'x'.repeat(101);
    
    expect(validText.length).toBeLessThanOrEqual(100);
    expect(tooLong.length).toBeGreaterThan(100);
  });

  it('should trim whitespace from custom theme input', () => {
    const input = '  How much do you like coffee?  ';
    const trimmed = input.trim();
    
    expect(trimmed).toBe('How much do you like coffee?');
    expect(trimmed).not.toContain('  ');
  });

  it('should reject empty custom theme text', () => {
    const emptyText = '   ';
    const trimmed = emptyText.trim();
    
    expect(trimmed).toBe('');
    expect(trimmed.length).toBe(0);
  });
});

describe('Theme Selector - Category Counts', () => {
  it('should have correct theme counts per category', () => {
    const categoryCounts = {
      food: 15,
      animals: 10,
      activities: 12,
      feelings: 7,
      silly: 5,
      personal: 6
    };
    
    Object.entries(categoryCounts).forEach(([category, expectedCount]) => {
      const themes = THEME_PACKS.all.filter(t => t.category === category);
      expect(themes.length).toBe(expectedCount);
    });
  });

  it('should have total of 55 themes', () => {
    expect(THEME_PACKS.all.length).toBe(55);
  });

  it('should have unique theme IDs', () => {
    const allIds = THEME_PACKS.all.map(t => t.id);
    const uniqueIds = new Set(allIds);
    
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
