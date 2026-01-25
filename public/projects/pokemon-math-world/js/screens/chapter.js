// Chapter selection screen
import { TRAINERS } from '../data/trainers.js';
import { POKEMON, getPokemonSprite } from '../data/pokemon.js';
import { getLevelConfig, gameState, updateState, saveGame, resetGameState } from '../game/state.js';
import { showScreen, $ } from '../game/utils.js';
import { renderSetupScreen } from './setup.js';
import { startBattle } from './battle.js';
import { backToWorld } from './world-select.js';

export function renderChapterScreen() {
  const level = getLevelConfig();
  if (!level) return;

  const chapter = level.chapters[gameState.currentChapter];
  const trainer = TRAINERS[gameState.trainer];

  // Build chapter selection grid with Pokemon sprites
  const chapterGridHTML = level.chapters.map((ch, idx) => {
    const isCompleted = gameState.completedChapters?.includes(idx);
    const isCurrent = idx === gameState.currentChapter;
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';
    const pokemon = POKEMON[ch.enemies[0]];
    const pokemonSprite = pokemon ? getPokemonSprite(ch.pokemon || pokemon.id) : '';

    return `
      <div class="chapter-select-card ${statusClass}" onclick="selectChapter(${idx})">
        <div class="chapter-icon">${ch.icon || '📍'}</div>
        ${pokemonSprite ? `<img src="${pokemonSprite}" class="chapter-pokemon" alt="">` : ''}
        <div class="chapter-num">${idx + 1}</div>
        <div class="chapter-name">${ch.name}</div>
        ${ch.badge ? `<div class="chapter-badge">${isCompleted ? ch.badge : '🔲'}</div>` : ''}
      </div>
    `;
  }).join('');

  // Get chapter Pokemon sprite for banner
  const chapterPokemon = chapter.pokemon ? getPokemonSprite(chapter.pokemon) : '';

  $('chapterScreen').innerHTML = `
    <div class="chapter-screen">
      <div class="game-header">
        <div class="header-left">
          <div class="trainer-avatar"><img src="${trainer.sprite}" alt="${trainer.name}"></div>
          <div class="player-info">
            <div class="player-name">${gameState.playerName}</div>
            <div class="badges">${gameState.badges.join('') || 'No badges'}</div>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">${gameState.stars}</div>
            <div class="stat-label">Stars</div>
          </div>
          <div class="stat">
            <div class="stat-icon">🎒</div>
            <div class="stat-value">${gameState.collection.length}</div>
            <div class="stat-label">Pokemon</div>
          </div>
        </div>
      </div>

      <div class="card">
        <label style="display:block;color:#374151;font-weight:700;margin-bottom:10px;">📍 Select Chapter</label>
        <div class="chapter-grid">${chapterGridHTML}</div>
      </div>

      <div class="chapter-banner ${chapter.env}">
        ${chapterPokemon ? `<img src="${chapterPokemon}" class="chapter-banner-pokemon" alt="">` : ''}
        <div class="chapter-title">${chapter.title}</div>
        <div class="chapter-desc">${chapter.desc}</div>
      </div>

      <div class="card" style="text-align:center;">
        <p style="margin-bottom:15px;color:#6B7280;">Answer ${chapter.questionsToWin} questions to complete!</p>
        <button class="btn btn-success continue-btn" onclick="startBattle()">BEGIN BATTLE!</button>
      </div>

      <div style="display:flex;gap:10px;margin-top:10px;">
        <button class="btn back-btn" style="flex:1;" onclick="backToWorld()">← World Map</button>
        <button class="btn back-btn" style="flex:1;background:#EF4444;box-shadow:0 4px 0 #B91C1C;" onclick="resetGame()">Reset</button>
      </div>
    </div>
  `;
}

export function selectChapter(idx) {
  updateState({ currentChapter: idx });
  saveGame();
  renderChapterScreen();
}

export function resetGame() {
  if (confirm('Reset all progress for this level?')) {
    resetGameState();
    showScreen('setupScreen');
    renderSetupScreen();
  }
}

// Make functions globally available
window.selectChapter = selectChapter;
window.resetGame = resetGame;
window.startBattle = startBattle;
