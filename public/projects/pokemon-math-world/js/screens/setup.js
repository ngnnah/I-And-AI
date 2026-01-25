// Setup/character selection screen
import { TRAINERS, TRAINER_KEYS } from '../data/trainers.js';
import { POKEMON, TYPE_COLORS, STARTERS, getPokemonSprite } from '../data/pokemon.js';
import { getLevelConfig, gameState, updateState, saveGame } from '../game/state.js';
import { showScreen, $ } from '../game/utils.js';
import { renderChapterScreen } from './chapter.js';

export function renderSetupScreen() {
  const level = getLevelConfig();
  if (!level) return;

  const trainerHTML = Object.entries(TRAINERS).map(([key, t]) => `
    <div class="trainer-card ${gameState.trainer === key ? 'selected' : ''}" onclick="selectTrainer('${key}')">
      <img src="${t.sprite}" alt="${t.name}">
      <div class="name">${t.name}</div>
    </div>
  `).join('');

  const starterHTML = STARTERS.map(key => {
    const p = POKEMON[key];
    return `
      <div class="starter-card ${gameState.starter === key ? 'selected' : ''}" onclick="selectStarter('${key}')">
        <img src="${getPokemonSprite(p.id)}" alt="${p.name}">
        <div class="name">${p.name}</div>
        <span class="type-badge" style="background: ${TYPE_COLORS[p.type]}">${p.type}</span>
      </div>
    `;
  }).join('');

  $('setupScreen').innerHTML = `
    <div class="start-screen">
      <div class="logo">${level.name}</div>
      <div class="subtitle">Set up your trainer!</div>

      <div class="card">
        <div class="name-input-section">
          <label>Your Name</label>
          <input type="text" class="name-input" id="playerNameInput" placeholder="Enter your name" value="${gameState.playerName}" maxlength="12">
        </div>
      </div>

      <div class="card">
        <label style="display:block;color:#374151;font-weight:700;margin-bottom:10px;">Choose Your Trainer</label>
        <div class="trainer-grid">${trainerHTML}</div>
      </div>

      <div class="card">
        <label style="display:block;color:#374151;font-weight:700;margin-bottom:10px;">Choose Your Starter</label>
        <div class="starter-grid">${starterHTML}</div>
      </div>

      <button class="btn btn-warning start-btn" onclick="startGame()">START ADVENTURE!</button>
      <button class="btn back-btn" onclick="backToWorld()">← Back</button>
    </div>
  `;
}

export function selectTrainer(key) {
  updateState({ trainer: key });
  renderSetupScreen();
}

export function selectStarter(key) {
  updateState({ starter: key });
  renderSetupScreen();
}

export function startGame() {
  const nameInput = $('playerNameInput');
  const playerName = nameInput?.value.trim() || 'Trainer';

  updateState({ playerName });

  if (!gameState.collection.includes(gameState.starter)) {
    gameState.collection.push(gameState.starter);
  }

  saveGame();
  showScreen('chapterScreen');
  renderChapterScreen();
}

// Make functions globally available
window.selectTrainer = selectTrainer;
window.selectStarter = selectStarter;
window.startGame = startGame;
