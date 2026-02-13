import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('UI Smoke Tests', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Load the HTML file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../index.html'),
      'utf8'
    );
    
    dom = new JSDOM(html, {
      runScripts: 'outside-only',
      resources: 'usable'
    });
    
    document = dom.window.document;
  });

  it('should have theme selector modal in HTML', () => {
    const modal = document.getElementById('theme-selector-modal');
    expect(modal).toBeTruthy();
    expect(modal.classList.contains('modal')).toBe(true);
    expect(modal.classList.contains('hidden')).toBe(true);
  });

  it('should have all required modal elements', () => {
    const closeBtn = document.getElementById('close-modal-btn');
    const searchInput = document.getElementById('theme-search-input');
    const themeList = document.getElementById('theme-list');
    const customInput = document.getElementById('custom-theme-input');
    const customInputVi = document.getElementById('custom-theme-input-vi');
    const useCustomBtn = document.getElementById('use-custom-theme-btn');
    
    expect(closeBtn).toBeTruthy();
    expect(searchInput).toBeTruthy();
    expect(themeList).toBeTruthy();
    expect(customInput).toBeTruthy();
    expect(customInputVi).toBeTruthy();
    expect(useCustomBtn).toBeTruthy();
  });

  it('should have category filter buttons', () => {
    const categoryBtns = document.querySelectorAll('.category-btn');
    expect(categoryBtns.length).toBe(7); // all, food, animals, activities, feelings, silly, personal
    
    const categories = Array.from(categoryBtns).map(btn => btn.dataset.category);
    expect(categories).toContain('all');
    expect(categories).toContain('food');
    expect(categories).toContain('animals');
    expect(categories).toContain('activities');
    expect(categories).toContain('feelings');
    expect(categories).toContain('silly');
    expect(categories).toContain('personal');
  });

  it('should have theme control buttons in discuss phase', () => {
    const changeThemeBtn = document.getElementById('change-theme-btn');
    const chooseThemeBtn = document.getElementById('choose-theme-btn');
    
    expect(changeThemeBtn).toBeTruthy();
    expect(chooseThemeBtn).toBeTruthy();
  });

  it('should have modal overlay for click-to-close', () => {
    const modal = document.getElementById('theme-selector-modal');
    const overlay = modal.querySelector('.modal-overlay');
    
    expect(overlay).toBeTruthy();
  });

  it('should have all game screens', () => {
    const playerSetup = document.getElementById('screen-player-setup');
    const lobby = document.getElementById('screen-lobby');
    const gameRoom = document.getElementById('screen-game-room');
    const gameOver = document.getElementById('screen-game-over');
    
    expect(playerSetup).toBeTruthy();
    expect(lobby).toBeTruthy();
    expect(gameRoom).toBeTruthy();
    expect(gameOver).toBeTruthy();
  });

  it('should have theme display elements in discuss phase', () => {
    const themeText = document.getElementById('theme-text');
    const themeTextVi = document.getElementById('theme-text-vi');
    
    expect(themeText).toBeTruthy();
    expect(themeTextVi).toBeTruthy();
  });

  it('should have proper input validation attributes', () => {
    const searchInput = document.getElementById('theme-search-input');
    const customInput = document.getElementById('custom-theme-input');
    const customInputVi = document.getElementById('custom-theme-input-vi');
    
    expect(customInput.getAttribute('maxlength')).toBe('100');
    expect(customInputVi.getAttribute('maxlength')).toBe('100');
    expect(searchInput.getAttribute('autocomplete')).toBe('off');
  });
});
