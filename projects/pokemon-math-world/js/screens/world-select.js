// World selection screen
import { LEVELS, LEVEL_KEYS } from '../data/levels.js';
import { loadGame, setCurrentLevel, gameState } from '../game/state.js';
import { showScreen, $ } from '../game/utils.js';
import { renderSetupScreen } from './setup.js';
import { renderChapterScreen } from './chapter.js';

export function updateLevelProgress() {
  // Trainer School
  const ts = localStorage.getItem(LEVELS['trainer-school'].storageKey);
  const tsDiv = $('trainerSchoolProgress');
  if (tsDiv) {
    if (ts) {
      const data = JSON.parse(ts);
      tsDiv.innerHTML = `<span class="stars">${'⭐'.repeat(data.badges?.length || 0)}</span> ${data.collection?.length || 0} Pokemon caught`;
    } else {
      tsDiv.innerHTML = 'New Adventure!';
    }
  }

  // Pokemon League
  const pl = localStorage.getItem(LEVELS['pokemon-league'].storageKey);
  const plDiv = $('pokemonLeagueProgress');
  if (plDiv) {
    if (pl) {
      const data = JSON.parse(pl);
      plDiv.innerHTML = `<span class="stars">${data.badges?.join('') || ''}</span> ${data.collection?.length || 0} Pokemon`;
    } else {
      plDiv.innerHTML = 'New Adventure!';
    }
  }

  // Champion's Road
  const cr = localStorage.getItem(LEVELS['champions-road'].storageKey);
  const crDiv = $('championsRoadProgress');
  if (crDiv) {
    if (cr) {
      const data = JSON.parse(cr);
      crDiv.innerHTML = `<span class="stars">${data.badges?.join('') || ''}</span> ${data.collection?.length || 0} Pokemon`;
    } else {
      crDiv.innerHTML = 'New Challenge!';
    }
  }
}

export function selectLevel(level) {
  setCurrentLevel(level);

  if (loadGame(level)) {
    if (gameState.playerName) {
      showScreen('chapterScreen');
      renderChapterScreen();
      return;
    }
  }

  showScreen('setupScreen');
  renderSetupScreen();
}

export function backToWorld() {
  setCurrentLevel(null);
  showScreen('worldSelectScreen');
  updateLevelProgress();
}

// Make functions globally available for onclick handlers
window.selectLevel = selectLevel;
window.backToWorld = backToWorld;
