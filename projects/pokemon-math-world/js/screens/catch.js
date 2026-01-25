// Catch screen after defeating a Pokemon
import { TYPE_COLORS } from '../data/pokemon.js';
import {
  getLevelConfig,
  gameState,
  battleState,
  addToCollection,
  completeChapter,
  clearChapterProgress,
  saveGame
} from '../game/state.js';
import { showScreen, $, createConfetti } from '../game/utils.js';
import { playVictory } from '../game/audio.js';
import { renderChapterScreen } from './chapter.js';
import { showVictoryScreen } from './victory.js';

export function showCatchScreen() {
  const enemy = battleState.currentEnemy;
  const alreadyHave = gameState.collection.includes(enemy.key);

  $('catchScreen').innerHTML = `
    <div class="catch-screen">
      <div class="catch-animation" id="catchAnim">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" class="pokeball">
      </div>
      <div class="caught-pokemon" id="caughtPokemon">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy.id}.png" alt="${enemy.name}">
      </div>
      <div class="catch-message" id="catchMsg">Catching...</div>
      <div class="card" style="margin-top:20px;">
        <div class="stat-row"><span>Pokemon</span><span>${enemy.name}</span></div>
        <div class="stat-row"><span>Type</span><span style="color:${TYPE_COLORS[enemy.type]}">${enemy.type}</span></div>
        <div class="stat-row"><span>Streak</span><span>🔥 ${gameState.streak}</span></div>
      </div>
      <button class="btn btn-success continue-btn hidden" id="continueBtn" onclick="afterCatch()">Continue →</button>
    </div>
  `;

  showScreen('catchScreen');

  setTimeout(() => {
    $('catchAnim').classList.add('hidden');
    $('caughtPokemon').classList.add('show');
    $('catchMsg').textContent = alreadyHave ? `${enemy.name} stayed with you!` : `Caught ${enemy.name}!`;
    $('continueBtn').classList.remove('hidden');

    if (!alreadyHave) {
      addToCollection(enemy.key);
      createConfetti();
    }
    playVictory();
  }, 2000);
}

export function afterCatch() {
  const level = getLevelConfig();
  const chapter = level.chapters[gameState.currentChapter];

  // Mark chapter as completed with badge
  completeChapter(gameState.currentChapter, chapter.badge);

  // Move to next chapter or show victory
  const nextChapter = gameState.currentChapter + 1;
  if (nextChapter >= level.chapters.length) {
    showVictoryScreen();
  } else {
    gameState.currentChapter = nextChapter;
    saveGame();
    showScreen('chapterScreen');
    renderChapterScreen();
  }
}

// Make functions globally available
window.afterCatch = afterCatch;
