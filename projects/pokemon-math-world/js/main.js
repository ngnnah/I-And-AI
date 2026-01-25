// Main entry point for Pokemon Math World
import { initViewportFix } from './game/utils.js';
import { updateLevelProgress } from './screens/world-select.js';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Fix iOS viewport height
  initViewportFix();

  // Load progress for world selection screen
  updateLevelProgress();

  console.log('Pokemon Math World loaded!');
});
