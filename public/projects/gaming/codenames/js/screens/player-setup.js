/**
 * Player Setup Screen — name entry and player creation
 */

import { generatePlayerId } from '../game/firebase-config.js';
import { setLocalPlayer, getLocalPlayer } from '../game/game-state.js';
import { validatePlayerName } from '../game/game-logic.js';
import { navigateTo } from '../main.js';

const nameInput = document.getElementById('player-name-input');
const btnContinue = document.getElementById('btn-continue');
const nameError = document.getElementById('name-error');

function showError(msg) {
  nameError.textContent = msg;
  nameError.classList.remove('hidden');
}

function clearError() {
  nameError.classList.add('hidden');
}

function handleContinue() {
  clearError();
  const name = nameInput.value.trim();
  const { valid, error } = validatePlayerName(name);
  if (!valid) {
    showError(error);
    return;
  }

  const existing = getLocalPlayer();
  const playerId = existing.id || generatePlayerId();
  setLocalPlayer(playerId, name);
  navigateTo('lobby');
}

btnContinue.addEventListener('click', handleContinue);

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleContinue();
});

window.addEventListener('screen-changed', (e) => {
  if (e.detail.screen === 'player-setup') {
    nameInput.value = getLocalPlayer().name || '';
    nameInput.focus();
    clearError();
  }
});
